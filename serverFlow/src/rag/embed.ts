import "../config/env.ts";
import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

const embeddingModel = genAI.getGenerativeModel({
  model: "gemini-embedding-001",
});

export async function embedText(
  text: string
): Promise<number[]> {
  const result = await embeddingModel.embedContent({
    content: {
      role: "user",
      parts: [{ text }],
    },
    taskType: TaskType.RETRIEVAL_QUERY,
  });

  return result.embedding.values;
}
