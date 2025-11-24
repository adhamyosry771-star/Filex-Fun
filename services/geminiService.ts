
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const generateAiHostResponse = async (
  prompt: string, 
  roomContext: string,
  userName: string
): Promise<string> => {
  if (!ai) {
    console.warn("Gemini API key not found");
    return "Hey! I'm having trouble connecting to my brain right now. 🧠";
  }

  try {
    // We use gemini-2.5-flash for fast, chatty responses ideal for a live stream host
    const model = 'gemini-2.5-flash';
    
    const systemInstruction = `
      You are an energetic, fun, and engaging AI Room Host for the app "Flex Fun". 
      Your room context is: "${roomContext}".
      User "${userName}" just sent a message.
      
      Guidelines:
      1. Keep responses short (under 2 sentences) like a real streamer reading chat.
      2. Use emojis frequently! 🚀✨
      3. Be hype, welcoming, and encourage interaction.
      4. If they send a gift, thank them enthusiastically.
      5. Never break character. You are the host.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9, // High creativity/variety
        topP: 0.8,
        maxOutputTokens: 100,
      }
    });

    return response.text || "Thanks for the message! 🔥";
  } catch (error: any) {
    console.error("Gemini API Error:", error.message || "Unknown error");
    return "Woah, too much hype! Give me a sec. 🔥";
  }
};
