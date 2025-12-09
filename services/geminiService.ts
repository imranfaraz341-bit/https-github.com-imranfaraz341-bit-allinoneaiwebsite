import { GoogleGenAI } from "@google/genai";

// Helper to get a fresh client instance with the latest key
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Chat ---
export const generateChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string
): Promise<string> => {
  try {
    const ai = getClient();
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

// --- Website Builder ---
export const generateCodeFromPrompt = async (prompt: string): Promise<string> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert World-Class Frontend Web Developer.
      
      Task: Create a Single-File HTML website based on this request: "${prompt}".
      
      Requirements:
      1. MUST use Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>) for styling.
      2. Design must be MODERN, BEAUTIFUL, and RESPONSIVE. Use gradients, shadows, and rounded corners.
      3. Include functional JavaScript if needed (e.g., for mobile menus, buttons, interactions).
      4. The code must be complete (<html>...</html>).
      5. Do not use placeholders like "Image here", use unsplash source URLs (e.g., https://source.unsplash.com/random/800x600) for images.
      
      Return ONLY the raw HTML code. Do not use markdown blocks.`,
    });
    
    let cleanText = response.text || "";
    cleanText = cleanText.replace(/```html/g, '').replace(/```/g, '');
    return cleanText;
  } catch (error) {
    console.error("Gemini Code Error:", error);
    throw error;
  }
};

// --- Image Generation ---
export const generateImage = async (prompt: string, referenceImageBase64?: string): Promise<string> => {
  const ai = getClient();

  const extractImage = (response: any) => {
     for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  };

  const parts: any[] = [{ text: prompt }];
  if (referenceImageBase64) {
    const base64Data = referenceImageBase64.split(',')[1];
    parts.unshift({
      inlineData: {
        data: base64Data,
        mimeType: 'image/png'
      }
    });
  }

  // 1. Try Nano Banana (gemini-2.5-flash-image)
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
    });

    const img = extractImage(response);
    if (img) return img;

  } catch (error: any) {
    console.warn("Nano Banana (Flash Image) failed, trying fallback...", error);
  }

  // 2. Fallback to Pro Model
  try {
    // Note: Pro model handles image inputs differently or might need strictly defined tools, 
    // but we attempt basic content generation here.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });
    
    const img = extractImage(response);
    if (img) return img;
    
    throw new Error("No image data returned from generation models");

  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

// --- Video Generation (Veo) ---
export const generateVeoVideo = async (
  prompt: string, 
  imageBase64?: string
): Promise<string> => {
  try {
    const freshAi = getClient();
    let operation;
    
    if (imageBase64) {
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      operation = await freshAi.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt, 
        image: {
          imageBytes: base64Data,
          mimeType: 'image/png', 
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });
    } else {
      operation = await freshAi.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });
    }

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await freshAi.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation failed or returned no URI");

    const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);

  } catch (error) {
    console.error("Veo Error:", error);
    throw error;
  }
};

// --- Live API (Real-time Voice) ---
export class LiveSession {
  private ai: GoogleGenAI;
  private session: any;
  private connected: boolean = false;

  constructor() {
    this.ai = getClient();
  }

  async connect(onAudioData: (base64: string) => void, onTranscript: (text: string, isUser: boolean) => void) {
    try {
      this.session = await this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("Live Session Open");
            this.connected = true;
          },
          onmessage: (msg: any) => {
            // Audio
            const audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) onAudioData(audio);

            // Transcripts
            if (msg.serverContent?.modelTurn?.parts?.[0]?.text) {
               onTranscript(msg.serverContent.modelTurn.parts[0].text, false);
            }
          },
          onclose: () => {
            console.log("Live Session Closed");
            this.connected = false;
          },
          onerror: (err: any) => {
            console.error("Live Session Error:", err);
            this.connected = false;
          }
        },
        config: {
          // Explicitly use string 'AUDIO' which maps to Modality.AUDIO
          responseModalities: ['AUDIO'], 
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          // Pass string directly for systemInstruction to avoid handshake errors
          systemInstruction: "You are a helpful assistant. You can speak any language. Be concise."
        }
      });
      return this.session;
    } catch (error) {
      console.error("Failed to connect to Live API:", error);
      throw error;
    }
  }

  async sendAudio(base64Pcm: string) {
    if (this.session) {
       await this.session.sendRealtimeInput({
        media: {
          mimeType: 'audio/pcm;rate=16000',
          data: base64Pcm
        }
      });
    }
  }

  async disconnect() {
    if (this.session) {
      // The SDK handles cleanup, we just ensure local state is reset
      this.connected = false;
    }
  }
}