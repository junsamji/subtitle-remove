
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

const fileToBase64 = (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const [mimeTypePart, base64Data] = result.split(',');
      if (!mimeTypePart || !base64Data) {
        return reject(new Error("Invalid file format for base64 conversion."));
      }
      const mimeType = mimeTypePart.split(':')[1]?.split(';')[0];
       if (!mimeType) {
        return reject(new Error("Could not determine MIME type from file."));
      }
      resolve({ mimeType, data: base64Data });
    };
    reader.onerror = error => reject(error);
  });
};

export const removeSubtitlesFromImage = async (imageFile: File): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("The API_KEY environment variable is not set.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const { mimeType, data: base64ImageData } = await fileToBase64(imageFile);

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: '이미지에서 모든 자막과 텍스트를 제거해주세요. 원본 이미지의 스타일과 품질을 최대한 유지하고, 자막이 있던 부분을 주변 배경과 어울리게 자연스럽게 복원해주세요. Please remove all subtitles and text from the image. Maintain the original image\'s style and quality as much as possible, and naturally restore the area where the subtitles were to blend with the background.',
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);

    if (imagePart && imagePart.inlineData) {
      return imagePart.inlineData.data;
    }

    const textResponse = response.text;
    throw new Error(`AI did not return an image. It may have provided a text response instead: "${textResponse}"`);

  } catch (error) {
    console.error("Error processing image with Gemini API:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to process image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while processing the image.");
  }
};
