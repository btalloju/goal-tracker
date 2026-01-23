import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// Singleton instance of the Google Generative AI client
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_AI_API_KEY environment variable is not set");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// Get Gemini Flash model for fast operations (milestone generation, task prioritization)
export function getFlashModel(): GenerativeModel {
  return getGenAI().getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
}

// Get Gemini Pro model for complex operations (insights, weekly reports)
export function getProModel(): GenerativeModel {
  return getGenAI().getGenerativeModel({
    model: "gemini-1.5-pro-latest",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
}

// Check if AI is available (API key is set)
export function isAIAvailable(): boolean {
  return !!process.env.GOOGLE_AI_API_KEY;
}
