import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Gemini has a dedicated embedding model — separate from the chat model
const embeddingModel = genAI.getGenerativeModel({
  model: "gemini-embedding-001",  // Google's best embedding model, free tier available
});

export async function embedText(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;  // returns number[] of length 768
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];

  const batchSize = 5; // 👈 tune this (5–10 is safe)

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(t => embedText(t))
    );

    results.push(...batchResults);
  }

  return results;
}