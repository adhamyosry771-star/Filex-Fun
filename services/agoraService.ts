
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack, IBufferSourceAudioTrack } from 'agora-rtc-sdk-ng';

// ---------------------------------------------------------------------------
// ⚠️ AGORA CONFIGURATION - HIGH QUALITY & LOW LATENCY
// ---------------------------------------------------------------------------
const APP_ID = "3c427b50bc824baebaca30a5de42af68"; 

let client: IAgoraRTCClient | null = null;
let localAudioTrack: IMicrophoneAudioTrack | null = null;
let localMusicTrack: IBufferSourceAudioTrack | null = null;
let isRoomAudioMuted = false;
let currentChannel = '';

// Volume Callback
let volumeCallback: ((volumes: { uid: string | number, level: number }[]) => void) | null = null;

// Queue is ONLY for channel connection stability, NOT for mic operations
let connectionQueue: Promise<void> = Promise.resolve();

// Helper Logger
const log = (msg: string, err?: any) => {
    // console.log(`[Agora] ${msg}`, err || '');
};

export const initializeAgora = async () => {
    if (client) return;

    try {
        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        
        // Enable Volume Indicator (Interval: 200ms, Smoothness: 3)
        client.enableAudioVolumeIndicator();
        
        client.on("volume-indicator", (volumes) => {
            if (volumeCallback) volumeCallback(volumes);
        });
        
        client.on("user-published", async (user, mediaType) => {
            try {
                if (!client) return;
                await client.subscribe(user, mediaType);
                if (mediaType === "audio") {
                    const audioTrack = user.audioTrack;
                    if (audioTrack) {
                        audioTrack.play();
                        audioTrack.setVolume(isRoomAudioMuted ? 0 : 100);
                    }
                }
            } catch (e) {
                log("Auto-Subscribe failed", e);
            }
        });
    } catch (e) {
        console.error("Failed to initialize Agora Client", e);
    }
};

export const listenToVolume = (cb: (volumes: { uid: string | number, level: number }[]) => void) => {
    volumeCallback = cb;
};

// --- SMART FEATURE: AGGRESSIVE MIC PRELOADING ---
// This initializes the hardware BEFORE the user clicks the seat.
export const preloadMicrophone = async () => {
    if (localAudioTrack) return; // Already ready
    
    try {
        // Create track but keep it disabled/muted
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
            encoderConfig: "high_quality_stereo", 
            AEC: true, // Echo Cancellation
            ANS: true, // Noise Suppression
            AGC: true  // Gain Control
        });
        
        // Mute immediately so no audio leaks
        await localAudioTrack.setEnabled(false);
        log('Mic Preloaded & Ready 🚀');
    } catch (e) {
        // console.warn("Mic Preload failed (Permission might be required on click)", e);
        // Suppress error log here as it's expected if user hasn't interacted yet
    }
};

// 1. Join Channel (Non-blocking UI)
export const joinVoiceChannel = (channelName: string, uid: string | number) => {
    connectionQueue = connectionQueue.then(async () => {
        try {
            if (!client) await initializeAgora();
            if (!client) return;

            // REMOVED: preloadMicrophone() call here to avoid "Permission denied" on load.
            // We will only load mic when user takes a seat.

            if (client.connectionState === 'CONNECTED' && currentChannel === channelName) {
                return;
            }
            
            if (client.connectionState === 'CONNECTED') {
                await client.leave();
            }

            await client.join(APP_ID, channelName, null, uid);
            currentChannel = channelName;
            
        } catch (error: any) {
            log('Join Error', error);
        }
    });
    return connectionQueue;
};

// 2. Switch Mic State (INSTANT)
export const switchMicrophoneState = async (shouldPublish: boolean, muted: boolean = false) => {
    if (!client) return;

    try {
        if (shouldPublish) {
            // --- START TALKING ---
            
            // 1. Get Track (Create if not exists)
            if (!localAudioTrack) {
                // This is where permission dialog appears
                await preloadMicrophone();
            }

            if (!localAudioTrack) {
                throw new Error("Microphone initialization failed");
            }

            // 2. Set State Locally (Instant feedback)
            await localAudioTrack.setEnabled(!muted);

            // 3. Publish to Channel (Network Operation)
            if (client.connectionState === 'CONNECTED') {
                const tracksToPublish = [localAudioTrack];
                if (localMusicTrack) tracksToPublish.push(localMusicTrack);

                // Filter out already published tracks to avoid errors
                const currentPublished = client.localTracks;
                const newTracks = tracksToPublish.filter(t => !currentPublished.includes(t));

                if (newTracks.length > 0) {
                    await client.publish(newTracks);
                    log('Mic Published to Server');
                }
            }
        } else {
            // --- STOP TALKING ---
            if (localAudioTrack) {
                // Just mute and unpublish. DO NOT CLOSE the track.
                // Keeping it open makes taking the seat again instant.
                await localAudioTrack.setEnabled(false);

                if (client.connectionState === 'CONNECTED') {
                    // We try-catch unpublish because sometimes race conditions occur, but it's safe to ignore
                    try {
                        await client.unpublish([localAudioTrack]);
                    } catch(e) { /* ignore */ }
                }
            }
        }
    } catch (e) {
        console.error("Mic Switch Error", e);
    }
};

// Wrappers
export const publishMicrophone = (muted: boolean) => switchMicrophoneState(true, muted);
export const unpublishMicrophone = () => switchMicrophoneState(false);

// 3. Leave Channel
export const leaveVoiceChannel = async () => {
    try {
        // Only close tracks on full room exit
        if (localAudioTrack) {
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

// 5. Toggle Speaker
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

// --- MUSIC PLAYER ---
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
        console.error("Music Error", e);
        throw e;
    }
};

export const stopMusic = async () => {
    if (localMusicTrack) {
        if (client) try { await client.unpublish(localMusicTrack); } catch(e){}
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
