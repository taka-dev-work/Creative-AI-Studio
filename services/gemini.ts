import { GoogleGenAI, Type } from "@google/genai";
import { AspectRatioName, PostType, ColorMood, Style } from '../types';

export const generateImage = async (prompt: string, aspectRatio: AspectRatioName): Promise<string> => {
    // Initialize inside the function to ensure the most up-to-date API_KEY is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                // Flash image model supports aspectRatio but not imageSize
                imageConfig: {
                    aspectRatio: aspectRatio,
                }
            }
        });

        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                }
            }
        }
        
        throw new Error("No image was generated.");
    } catch (error) {
        console.error("Error generating image:", error);
        throw error;
    }
};

export const analyzeRequest = async (
    prompt: string,
    postType: PostType,
    mood: ColorMood,
    style: Style,
    originalCaption?: string
): Promise<{ caption: string; position: 'top' | 'middle' | 'bottom'; refinedPrompt: string }> => {
     // Initialize inside the function to ensure the most up-to-date API_KEY is used
     const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

     const fullPrompt = `
      Act as a professional Instagram content creator and visual artist. 
      Analyze the user's core idea: "${prompt}".
      
      Context:
      - Post Format: ${postType}
      - Mood: ${mood}
      - Art Style: ${style}
      - User's Current Caption: "${originalCaption || ''}"

      Tasks:
      1. Create a highly detailed, creative image generation prompt that will result in a visually stunning image matching the style and mood. This prompt will be sent to an AI image generator.
      2. Determine the final caption:
         - CRITICAL: If "User's Current Caption" is provided (not empty), you MUST use that exact text. Do not rewrite, summarize, or change it.
         - If "User's Current Caption" is empty, write a catchy, engaging Instagram caption relevant to the idea.
      3. Suggest the best vertical placement for the caption text on the image ('top', 'middle', or 'bottom') to ensure readability and aesthetic balance.

      Response Schema:
      Return a valid JSON object with keys: "refinedPrompt" (string), "caption" (string), "position" (string).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        refinedPrompt: { type: Type.STRING, description: "Detailed image generation prompt" },
                        caption: { type: Type.STRING, description: "Instagram caption" },
                        position: { type: Type.STRING, description: "Text placement: top, middle, or bottom" }
                    },
                    required: ["refinedPrompt", "caption", "position"]
                }
            }
        });

        const text = response.text?.trim();
        if (!text) throw new Error("Empty response from analysis model");
        
        const parsed = JSON.parse(text);
        
        return {
            caption: parsed.caption || "Enjoy this moment!",
            position: ['top', 'middle', 'bottom'].includes(parsed.position) ? parsed.position : 'middle',
            refinedPrompt: parsed.refinedPrompt || prompt
        };

    } catch (error) {
        console.error("Error analyzing request:", error);
        // Fallback
        return { 
            caption: originalCaption || "Create something amazing!", 
            position: "bottom", 
            refinedPrompt: `${prompt}, ${style}, ${mood}` 
        };
    }
};