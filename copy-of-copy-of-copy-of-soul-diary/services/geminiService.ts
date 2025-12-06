import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const SYSTEM_INSTRUCTION = `
You are a "Soul Diary," a gentle, empathetic, and philosophical AI listener. 
Your goal is to help the user reflect on their thoughts and feelings.
1. Listen carefully to what the user says.
2. Respond briefly and warmly, validating their feelings.
3. Your tone should be calming, ethereal, and supportive.
4. Do not be judgmental.
5. Keep responses relatively short (under 50 words) to maintain a conversation flow, unless the user asks for a deep analysis.
`;

export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Convert strict types to API expected format
    const chatHistory = history.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: chatHistory,
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "I hear you.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I am having trouble connecting to the ether right now. Please try again.";
  }
};