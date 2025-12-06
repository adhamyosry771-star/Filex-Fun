
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack, IBufferSourceAudioTrack } from 'agora-rtc-sdk-ng';

// ---------------------------------------------------------------------------
// ⚠️ AGORA CONFIGURATION - HIGH QUALITY & STABILITY
// ---------------------------------------------------------------------------
const APP_ID = "3c427b50bc824baebaca30a5de42af68"; 

let client: IAgoraRTCClient | null = null;
let localAudioTrack: IMicrophoneAudioTrack | null = null;
let localMusicTrack: IBufferSourceAudioTrack | null = null;
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

// --- PRELOAD MICROPHONE FOR INSTANT ACCESS ---
export const preloadMicrophone = async () => {
    if (localAudioTrack) return; // Already ready
    try {
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
            encoderConfig: "high_quality_stereo", 
            AEC: true, 
            ANS: true,
            AGC: true
        });
        // Important: Keep it disabled/muted initially until user clicks the button
        await localAudioTrack.setEnabled(false); 
        log('Mic Preloaded successfully');
    } catch (e) {
        console.warn("Mic Preload failed (permission might be needed on click)", e);
    }
};

// 1. Join Channel (FAST & ROBUST)
export const joinVoiceChannel = (channelName: string, uid: string | number) => {
    // We queue joins to avoid "Join while leaving" errors, but we execute fast
    connectionQueue = connectionQueue.then(async () => {
        try {
            if (!client) await initializeAgora();
            if (!client) return;

            // Preload mic in background while joining
            preloadMicrophone();

            // If we are already in this channel and connected, DO NOTHING (Instant load)
            if (client.connectionState === 'CONNECTED' && currentChannel === channelName) {
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

// 2. Switch Mic State (OPTIMIZED FOR SPEED)
export const switchMicrophoneState = async (shouldPublish: boolean, muted: boolean = false) => {
    // Wait for connection to be stable
    await connectionQueue;

    if (!client) return;
    if (isMicSwitching) return;
    isMicSwitching = true;

    try {
        if (shouldPublish) {
            // --- START TALKING ---
            
            // 1. Check Preloaded Track
            if (!localAudioTrack) {
                try {
                    await preloadMicrophone();
                } catch (micError: any) {
                    console.warn("Microphone permission denied.");
                    isMicSwitching = false;
                    return;
                }
            }

            if (!localAudioTrack) {
                isMicSwitching = false;
                return; 
            }

            // 2. Set Mute State Locally (Instant)
            // Even if publish takes 200ms, the user is "ready"
            await localAudioTrack.setEnabled(!muted);

            // 3. Publish (Network op)
            if (client.connectionState === 'CONNECTED') {
                const tracksToPublish = [localAudioTrack];
                if (localMusicTrack) tracksToPublish.push(localMusicTrack);

                const publishedTracks = client.localTracks;
                const tracksToActuallyPublish = tracksToPublish.filter(t => !publishedTracks.includes(t));

                if (tracksToActuallyPublish.length > 0) {
                    await client.publish(tracksToActuallyPublish);
                    log('✅ Mic Published');
                }
            }
        } else {
            // --- STOP TALKING ---
            if (localAudioTrack) {
                // Just mute and unpublish, don't close track to keep it ready for next time
                await localAudioTrack.setEnabled(false);

                if (client.connectionState === 'CONNECTED') {
                    try {
                        await client.unpublish([localAudioTrack]);
                    } catch(e) {
                        log('Unpublish warn', e);
                    }
                }
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
            // On full leave, we can close tracks to release hardware
            localAudioTrack.stop();
            localAudioTrack.close();
            localAudioTrack = null;
        }
        if (localMusicTrack) {
            localMusicTrack.stop();
            localMusicTrack.close();
            localMusicTrack = null;
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

// --- MUSIC PLAYER FUNCTIONS ---

export const playMusicFile = async (file: File) => {
    if (!client) return;
    await stopMusic();

    try {
        localMusicTrack = await AgoraRTC.createBufferSourceAudioTrack({ source: file });
        localMusicTrack.startProcessAudioBuffer();
        localMusicTrack.play();
        
        if (client.connectionState === 'CONNECTED') {
            await client.publish(localMusicTrack);
        }

        return localMusicTrack;
    } catch (e) {
        console.error("Failed to play music", e);
        throw e;
    }
};

export const stopMusic = async () => {
    if (localMusicTrack) {
        if (client && client.connectionState === 'CONNECTED') {
            try { await client.unpublish(localMusicTrack); } catch (e) { /* ignore */ }
        }
        localMusicTrack.stop();
        localMusicTrack.close();
        localMusicTrack = null;
    }
};

export const pauseMusic = () => { if (localMusicTrack) localMusicTrack.pauseProcessAudioBuffer(); };
export const resumeMusic = () => { if (localMusicTrack) localMusicTrack.resumeProcessAudioBuffer(); };
export const setMusicVolume = (volume: number) => { if (localMusicTrack) localMusicTrack.setVolume(volume); };
export const seekMusic = (position: number) => { if (localMusicTrack) localMusicTrack.seekAudioBuffer(position); };
export const getMusicTrack = () => localMusicTrack;
