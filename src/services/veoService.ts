import { GoogleGenAI } from "@google/genai";

export interface VideoGenerationConfig {
  prompt: string;
  resolution?: '720p' | '1080p';
  aspectRatio?: '16:9' | '9:16';
  image?: {
    data: string;
    mimeType: string;
  };
}

export const veoService = {
  async generateVideo(config: VideoGenerationConfig) {
    const apiKey = process.env.GEMINI_API_KEY || (process.env as any).API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is required for video generation.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    try {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: config.prompt,
        image: config.image ? {
          imageBytes: config.image.data,
          mimeType: config.image.mimeType
        } : undefined,
        config: {
          numberOfVideos: 1,
          resolution: config.resolution || '720p',
          aspectRatio: config.aspectRatio || '16:9'
        }
      });

      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      if (operation.error) {
        console.error("Veo Operation Error:", operation.error);
        throw new Error(`Video generation failed: ${operation.error.message || JSON.stringify(operation.error)}`);
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
        console.error("Veo Unexpected Response Structure:", operation.response);
        throw new Error("Video generation failed: No download link returned in response.");
      }

      return downloadLink;
    } catch (error: any) {
      console.error("Veo generation error:", error);
      if (error.message?.includes("Requested entity was not found")) {
        throw new Error("API_KEY_RESET_REQUIRED");
      }
      throw error;
    }
  },

  async fetchVideoBlob(uri: string) {
    const apiKey = process.env.GEMINI_API_KEY || (process.env as any).API_KEY;
    const response = await fetch(uri, {
      method: 'GET',
      headers: {
        'x-goog-api-key': apiKey || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    return await response.blob();
  }
};
