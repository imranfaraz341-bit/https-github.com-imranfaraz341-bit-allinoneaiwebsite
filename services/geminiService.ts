import { GoogleGenAI } from "@google/genai";

// Initialize the client
// process.env.API_KEY is assumed to be injected by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string
): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "You are Ahmar Tech Assistant, a helpful and friendly AI bot. You are concise and professional.",
      },
      history: history,
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Sorry, I encountered an error connecting to the AI service.";
  }
};

export const generateCodeFromPrompt = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Using Flash for speed in code generation
      contents: `Generate a single HTML file containing CSS and JS for the following request. 
      Return ONLY the raw HTML code, no markdown backticks, no explanations. 
      Request: ${prompt}`,
    });
    
    // Cleanup if model returns markdown
    let cleanText = response.text || "";
    cleanText = cleanText.replace(/```html/g, '').replace(/```/g, '');
    return cleanText;
  } catch (error) {
    console.error("Gemini Code Error:", error);
    throw error;
  }
};