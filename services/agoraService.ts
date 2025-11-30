
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';

// ---------------------------------------------------------------------------
// ⚠️ AGORA CONFIGURATION
// ---------------------------------------------------------------------------
const APP_ID = "3c427b50bc824baebaca30a5de42af68"; 

let client: IAgoraRTCClient | null = null;
let localAudioTrack: IMicrophoneAudioTrack | null = null;
let isRoomAudioMuted = false; // Track global mute state for this client

// Promise chain to serialize async operations (Join -> Leave -> Join)
let operationQueue: Promise<void> = Promise.resolve();

export const initializeAgora = async () => {
    if (client) return;

    client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    
    // Add listener for connection state change to debug and manage recovery
    client.on("connection-state-change", (curState, prevState, reason) => {
        console.log(`[Agora] State: ${prevState} -> ${curState} (Reason: ${reason})`);
        if (curState === 'DISCONNECTED' && reason === 'UID_BANNED') {
            console.error("User banned from channel");
        }
    });

    client.on("user-published", async (user, mediaType) => {
        try {
            await client!.subscribe(user, mediaType);
            if (mediaType === "audio") {
                const remoteAudioTrack = user.audioTrack;
                if (remoteAudioTrack) {
                    remoteAudioTrack.play();
                    // Apply current mute state to new user
                    remoteAudioTrack.setVolume(isRoomAudioMuted ? 0 : 100);
                }
            }
        } catch (e) {
            console.warn("[Agora] Subscribe failed", e);
        }
    });

    client.on("user-unpublished", (user) => {
        // Automatically handled by SDK
    });
};

// Internal helper to stop tracks safely
const stopLocalTrack = async () => {
    if (localAudioTrack) {
        try {
            if (client && client.localTracks.includes(localAudioTrack)) {
                await client.unpublish([localAudioTrack]);
            }
        } catch (e) {
            console.warn("[Agora] Unpublish error", e);
        }
        localAudioTrack.stop();
        localAudioTrack.close();
        localAudioTrack = null;
        console.log("✅ Local track stopped");
    }
};

// Internal helper to reset client on critical errors
const resetClient = async () => {
    console.log("♻️ Hard Resetting Agora Client...");
    await stopLocalTrack();
    
    if (client) {
        const tempClient = client;
        client = null; // Detach immediately to prevent race conditions
        
        tempClient.removeAllListeners();
        try {
            if (tempClient.connectionState === 'CONNECTED' || tempClient.connectionState === 'CONNECTING') {
                await tempClient.leave();
            }
        } catch (e) {
            console.warn("Error leaving during reset (ignored)", e);
        }
    }
};

// Function to join the channel (Queued with Retry)
export const joinVoiceChannel = (channelName: string, uid: string | number) => {
    operationQueue = operationQueue.then(async () => {
        const attemptJoin = async (isRetry: boolean = false): Promise<void> => {
            try {
                if (!client) await initializeAgora();

                // Safety check
                if (!client) {
                    if (!isRetry) {
                        await resetClient();
                        return attemptJoin(true);
                    }
                    return;
                }

                // 1. Check if already connected
                if (client.connectionState === 'CONNECTED') {
                    if (client.channelName === channelName) {
                        console.log(`[Agora] Already connected to ${channelName}`);
                        return;
                    } else {
                        await client.leave();
                    }
                }

                // 2. Handle busy states
                if (client.connectionState === 'CONNECTING' || client.connectionState === 'DISCONNECTING') {
                    if (!isRetry) {
                        await resetClient(); // Force clean
                        return attemptJoin(true);
                    }
                }

                // 3. Join
                await client.join(APP_ID, channelName, null, uid);
                console.log("✅ Joined voice channel successfully");

            } catch (error: any) {
                console.error(`❌ Agora Join Error (Retry: ${isRetry}):`, error);
                
                const msg = error.message || '';
                const code = error.code || '';
                const isFatal = code === 'WS_ABORT' || 
                                code === 'CAN_NOT_GET_GATEWAY_SERVER' ||
                                msg.includes('websocket') ||
                                msg.includes('network') || 
                                msg.includes('not ready');
                
                if (isFatal && !isRetry) {
                    console.log("⚠️ Fatal WebSocket error detected. Resetting and retrying...");
                    await resetClient();
                    // Wait a moment for network/socket to clear
                    await new Promise(r => setTimeout(r, 500));
                    return attemptJoin(true);
                }
            }
        };

        await attemptJoin();
    });
    return operationQueue;
};

// Function to start broadcasting (Queued)
export const publishMicrophone = (muted: boolean = false) => {
    operationQueue = operationQueue.then(async () => {
        try {
            if (!client || client.connectionState !== 'CONNECTED') {
                console.warn("[Agora] Cannot publish: Client not connected");
                return;
            }

            if (!localAudioTrack) {
                localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            }
            
            await localAudioTrack.setEnabled(!muted);
            
            // Only publish if not already published
            if (!client.localTracks.includes(localAudioTrack)) {
                 await client.publish([localAudioTrack]);
                 console.log("✅ Published Microphone");
            }
        } catch (e) {
            console.error("[Agora] Error publishing mic:", e);
        }
    });
    return operationQueue;
};

// Function to stop broadcasting (Queued)
export const unpublishMicrophone = () => {
    operationQueue = operationQueue.then(async () => {
        await stopLocalTrack();
    });
    return operationQueue;
};

// Function to leave channel (Queued)
export const leaveVoiceChannel = () => {
    operationQueue = operationQueue.then(async () => {
        try {
            await stopLocalTrack();
            
            if (client) {
                // Only leave if connected to avoid errors
                if (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
                    await client.leave();
                    console.log("✅ Left voice channel");
                }
            }
        } catch (error: any) {
            console.error("❌ Agora Leave Error:", error);
            await resetClient();
        }
    });
    return operationQueue;
};

// Toggle Local Mic Mute (Instant action)
export const toggleMicMute = async (muted: boolean) => {
    if (localAudioTrack) {
        try {
            await localAudioTrack.setEnabled(!muted);
        } catch (e) {
            console.warn("Failed to toggle mic", e);
        }
    }
};

// Toggle All Remote Audio (Speaker Mute)
export const toggleAllRemoteAudio = (muted: boolean) => {
    isRoomAudioMuted = muted;
    if (client) {
        client.remoteUsers.forEach(user => {
            if (user.audioTrack) {
                user.audioTrack.setVolume(muted ? 0 : 100);
            }
        });
    }
    console.log(`Speaker ${muted ? 'Muted' : 'Unmuted'}`);
};
