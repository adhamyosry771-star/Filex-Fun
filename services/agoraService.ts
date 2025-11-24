
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';

const APP_ID = "b5eec8cef8114ff8a1ae66a338ac9e42"; 

let client: IAgoraRTCClient | null = null;
let localAudioTrack: IMicrophoneAudioTrack | null = null;

export const initializeAgora = async () => {
    if (!client) {
        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    }
    
    client.on("user-published", async (user, mediaType) => {
        await client!.subscribe(user, mediaType);
        if (mediaType === "audio") {
            const remoteAudioTrack = user.audioTrack;
            remoteAudioTrack?.play();
        }
    });

    client.on("user-unpublished", (user) => {
        // Automatically handled by SDK
    });
};

export const joinVoiceChannel = async (channelName: string, uid: string | number) => {
    try {
        if (!client) await initializeAgora();
        
        // Prevent duplicate joining
        if (client?.connectionState === 'CONNECTED' || client?.connectionState === 'CONNECTING') {
            console.log("Already connected/connecting to Agora");
            return;
        }

        // Join the channel
        // Token is set to null for Testing Mode. 
        // If your project is in Secure Mode, this will throw "dynamic use static key".
        await client!.join(APP_ID, channelName, null, uid);

        // Create and publish local audio track if not exists
        if (!localAudioTrack) {
            localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        }
        
        // Publish
        await client!.publish([localAudioTrack]);
        
        console.log("✅ Joined voice channel successfully");
    } catch (error: any) {
        console.error("❌ Error joining voice channel:", error);
        
        // Handle specific Security/Certificate error
        if (error.code === 'CAN_NOT_GET_GATEWAY_SERVER' || (error.message && error.message.includes('dynamic use static key'))) {
            alert("⚠️ Audio Error: Your Agora Project is in 'Secure Mode'.\n\nPlease create a new project on Agora Console selecting 'Testing Mode' (App ID Only), or disable the App Certificate.");
        }
    }
};

export const leaveVoiceChannel = async () => {
    try {
        if (localAudioTrack) {
            localAudioTrack.stop();
            localAudioTrack.close();
            localAudioTrack = null;
        }
        if (client && client.connectionState !== 'DISCONNECTED') {
            await client.leave();
        }
        console.log("✅ Left voice channel");
    } catch (error) {
        console.error("❌ Error leaving voice channel:", error);
    }
};

export const toggleMicMute = async (muted: boolean) => {
    if (localAudioTrack) {
        await localAudioTrack.setEnabled(!muted);
    }
};
