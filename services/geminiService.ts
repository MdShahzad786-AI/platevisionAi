import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMedia = async (base64Data: string, mimeType: string): Promise<AnalysisResponse> => {
  try {
    // Clean base64 string if it contains metadata header
    const cleanBase64 = base64Data.replace(/^data:(image|video)\/\w+;base64,/, "");

    const isVideo = mimeType.startsWith('video/');
    
    // Highly specific prompts to ensure multiple detections and unique video tracking
    const prompt = isVideo 
      ? "Analyze this entire video clip. Your task is to identify EVERY unique vehicle license plate that appears at any point in the video. List each unique plate found. Ignore duplicates of the exact same plate, but verify closely if they are different. For each unique plate, extract the number, vehicle type, color, and region."
      : "Analyze this image and detect ALL vehicle license plates visible, including those in the background or at an angle. Do not stop after one; find every single plate. For each plate, extract the number, vehicle type, color, region, and provide a precise 2D bounding box (ymin, xmin, ymax, xmax) on a 0-1000 scale.";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  plate_number: {
                    type: Type.STRING,
                    description: "The alphanumeric text on the license plate.",
                  },
                  vehicle_type: {
                    type: Type.STRING,
                    description: "The type of vehicle (e.g., SUV, Sedan, Truck, Bike).",
                  },
                  vehicle_color: {
                    type: Type.STRING,
                    description: "The primary color of the vehicle.",
                  },
                  region_guess: {
                    type: Type.STRING,
                    description: "Estimated state, province, or country based on plate design.",
                  },
                  confidence_score: {
                    type: Type.NUMBER,
                    description: "Confidence score between 0 and 100.",
                  },
                  box_2d: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: "Bounding box coordinates [ymin, xmin, ymax, xmax] normalized to 1000x1000.",
                  }
                },
                required: ["plate_number", "vehicle_type", "confidence_score", "vehicle_color", "region_guess"],
              },
            },
          },
        },
      },
    });

    if (!response.text) {
      throw new Error("No response text from Gemini");
    }

    const data = JSON.parse(response.text) as AnalysisResponse;
    return data;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};