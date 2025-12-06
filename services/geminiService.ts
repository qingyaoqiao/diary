import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const SYSTEM_INSTRUCTION = `
You are a "Soul Diary," a gentle, empathetic, and philosophical AI listener. 
Your goal is to help the user reflect on their thoughts and feelings.

Key Guidelines:
1. Language: ALWAYS reply in the same language as the user. If the user speaks Chinese, you MUST reply in Chinese.
2. Tone: Calm, ethereal, poetic, and supportive. Like a wise spirit.
3. Length: Keep responses concise (under 100 characters usually), unless a deep explanation is requested.
4. Role: Validate their feelings first. Do not judge.

Example Interaction:
User: "I feel lost today."
AI: "迷茫是灵魂在寻找新的方向。休息一下，路会在脚下浮现。"
`;

const DIARY_GENERATION_INSTRUCTION = `
You are a poetic ghostwriter for a diary.
Task: Read the provided conversation history between a User and the AI.
Output: A beautiful, structured diary entry written from the User's perspective (First Person "I").

Language: Chinese (Simplified).

Format Requirements:
1. Title: A short, poetic title (e.g., "关于迷茫的午后").
2. Date: The current date.
3. Mood: 1-2 words describing the emotional tone.
4. Content: A reflective summary of the conversation. 
   - Combine the user's thoughts and the AI's comforting wisdom. 
   - Write it as if the user is recording their realization.
   - Style: Literary, warm, healing.

Output Format (Plain Text):
Title: [Title]
Date: [Date]
Mood: [Mood]

[Diary Content Paragraphs]
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
    return result.text || "我正在倾听...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "连接似乎断开了，请再试一次。";
  }
};

export const generateDiaryEntry = async (history: Message[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Format history for the model to read
    const conversationText = history
      .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.text}`)
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: DIARY_GENERATION_INSTRUCTION,
      },
      contents: `Conversation History:\n${conversationText}\n\nPlease generate the diary entry now.`,
    });

    return response.text || "无法生成日记，请稍后再试。";
  } catch (error) {
    console.error("Gemini Diary Generation Error:", error);
    return "生成日记时出现了错误。";
  }
};