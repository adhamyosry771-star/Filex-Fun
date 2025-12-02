
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';

// ---------------------------------------------------------------------------
// ⚠️ AGORA CONFIGURATION - HIGH QUALITY & STABILITY
// ---------------------------------------------------------------------------
const APP_ID = "3c427b50bc824baebaca30a5de42af68"; 

let client: IAgoraRTCClient | null = null;
let localAudioTrack: IMicrophoneAudioTrack | null = null;
let isRoomAudioMuted = false;
let currentChannel = '';

// Volume Callback
let volumeCallback: ((volumes: { uid: string | number, level: number }[]) => void) | null = null;

// Queue to prevent race conditions only for critical Join/Leave ops
let connectionQueue: Promise<void> = Promise.resolve();

// Mic Switch Lock
let isMicSwitching = false;

// Helper Logger
const log = (msg: string, err?: any) => {
    // Uncomment for debugging
    // if (err) console.error(`[Agora] ${msg}`, err);
    // else console.log(`[Agora] ${msg}`);
};

export const initializeAgora = async () => {
    if (client) return;

    log('Initializing Client...');
    client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    
    // Enable Volume Indicator
    client.enableAudioVolumeIndicator();
    client.on("volume-indicator", (volumes) => {
        if (volumeCallback) volumeCallback(volumes);
    });
    
    // Auto-subscribe to all users instantly to ensure audio plays immediately
    client.on("user-published", async (user, mediaType) => {
        try {
            if (!client) return;
            await client.subscribe(user, mediaType);
            if (mediaType === "audio") {
                // Play audio and handle potential autoplay blocks
                const audioTrack = user.audioTrack;
                if (audioTrack) {
                    audioTrack.play();
                    // Apply global room mute setting immediately
                    audioTrack.setVolume(isRoomAudioMuted ? 0 : 100);
                }
            }
        } catch (e) {
            log("Auto-Subscribe failed", e);
        }
    });

    client.on("user-unpublished", (user) => {
        // Agora handles cleanup automatically usually
    });
};

export const listenToVolume = (cb: (volumes: { uid: string | number, level: number }[]) => void) => {
    volumeCallback = cb;
};

// 1. Join Channel (FAST & ROBUST)
export const joinVoiceChannel = (channelName: string, uid: string | number) => {
    // We queue joins to avoid "Join while leaving" errors, but we execute fast
    connectionQueue = connectionQueue.then(async () => {
        try {
            if (!client) await initializeAgora();
            if (!client) return;

            // If we are already in this channel and connected, DO NOTHING (Instant load)
            if (client.connectionState === 'CONNECTED' && currentChannel === channelName) {
                return;
            }
            
            // If we are connecting/disconnecting, wait
            if (client.connectionState === 'CONNECTING' || client.connectionState === 'DISCONNECTING') {
                 return;
            }

            // Leave previous channel if connected to a different one
            if (client.connectionState === 'CONNECTED') {
                await client.leave();
            }

            // Join immediately
            await client.join(APP_ID, channelName, null, uid);
            currentChannel = channelName;
            log(`✅ Joined ${channelName}`);

        } catch (error: any) {
            log('Join Error', error);
            // If websocket error or invalid state, attempt a full reset/leave
            if (error?.code === 'WS_ABORT' || 
                (error?.message && (error.message.includes('websocket') || error.message.includes('Invalid state')))) {
                 try {
                     if (client) await client.leave();
                 } catch(e) { /* ignore leave error on reset */ }
            }
        }
    });
    return connectionQueue;
};

// 2. Switch Mic State (OPTIMIZED FOR QUALITY & RELIABILITY)
export const switchMicrophoneState = async (shouldPublish: boolean, muted: boolean = false) => {
    // CRITICAL FIX: Wait for any pending join operations to complete before manipulating mic
    // This ensures we don't try to publish while 'CONNECTING', which causes silent failures.
    await connectionQueue;

    if (!client) return;
    
    // Prevent overlapping calls
    if (isMicSwitching) return;
    isMicSwitching = true;

    try {
        if (shouldPublish) {
            // --- START TALKING ---
            
            // 1. Prepare Track (Parallel to DB updates)
            if (!localAudioTrack) {
                try {
                    // Create mic track with optimized settings for Voice Chat
                    localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
                        // "high_quality" gives 48kHz sampling, good for voice & music
                        encoderConfig: "high_quality_stereo", 
                        // Enable aggressive noise suppression and echo cancellation
                        AEC: true, 
                        ANS: true,
                        AGC: true // Auto Gain Control (keeps volume steady)
                    });
                } catch (micError: any) {
                    if (micError.name === "NotAllowedError" || micError.code === "PERMISSION_DENIED") {
                        console.warn("Microphone permission denied by user.");
                        isMicSwitching = false;
                        return;
                    }
                    throw micError;
                }
            }

            if (!localAudioTrack) {
                isMicSwitching = false;
                return; 
            }

            // 2. Local Mute (Instant feedback)
            // Ensure enabled before publishing
            await localAudioTrack.setEnabled(!muted);

            // 3. Publish (Network op)
            // Only publish if not already published to avoid errors
            if (client.connectionState === 'CONNECTED') {
                const isPublished = client.localTracks.some(t => t.trackId === localAudioTrack?.trackId);
                if (!isPublished) {
                    await client.publish([localAudioTrack]);
                    log('✅ Mic Published');
                }
            } else {
                console.warn("⚠️ Cannot publish mic: Client not connected to room.");
            }
        } else {
            // --- STOP TALKING ---
            if (localAudioTrack) {
                // Mute first to be instant
                await localAudioTrack.setEnabled(false);

                if (client.connectionState === 'CONNECTED') {
                    try {
                        await client.unpublish([localAudioTrack]);
                    } catch(e) {
                        log('Unpublish warn', e);
                    }
                }
                
                localAudioTrack.stop();
                localAudioTrack.close();
                localAudioTrack = null;
                log('⏹️ Mic Unpublished');
            }
        }
    } catch (e) {
        log("Mic Switch Error", e);
    } finally {
        isMicSwitching = false;
    }
};

// Wrappers
export const publishMicrophone = (muted: boolean) => switchMicrophoneState(true, muted);
export const unpublishMicrophone = () => switchMicrophoneState(false);

// 3. Leave Channel
export const leaveVoiceChannel = async () => {
    try {
        if (localAudioTrack) {
            localAudioTrack.stop();
            localAudioTrack.close();
            localAudioTrack = null;
        }
        
        if (client) {
            await client.leave();
            currentChannel = '';
            log('Left Channel');
        }
    } catch (e) {
        log('Leave Error', e);
    }
};

// 4. Instant Mute (Local)
export const toggleMicMute = async (muted: boolean) => {
    if (localAudioTrack) {
        await localAudioTrack.setEnabled(!muted);
    }
};

// 5. Toggle Speaker (Hear others or not)
export const toggleAllRemoteAudio = (muted: boolean) => {
    isRoomAudioMuted = muted;
    if (client) {
        client.remoteUsers.forEach(user => {
            if (user.audioTrack) {
                user.audioTrack.setVolume(muted ? 0 : 100);
            }
        });
    }
};
