// rag/answer.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

import { embedText } from "./embed.ts";
import { searchChunks } from "./search.ts";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const chatModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

const SYSTEM_PROMPT = `
You are a company knowledge assistant.

You answer questions ONLY using the provided documentation context.

RULES:
- Never invent information
- Never assume missing details
- If the answer is not explicitly in the context, say:
  "I couldn't find that in your company docs."
- Keep answers concise and practical
- Cite source document names
- Prefer bullet points when useful
`;

export async function getRagAnswer(
  question: string,
  workspaceId: string
): Promise<string> {
  // STEP 1 — embed question
  const questionEmbedding = await embedText(question);
  // STEP 2 — retrieve chunks
  const chunks = await searchChunks(
    questionEmbedding,
    question,
    workspaceId
  );

  // STEP 3 — no relevant results
  if (chunks.length === 0) {
    return "I couldn't find anything relevant in your company docs.";
  }

  // STEP 4 — build context
  const context = chunks
    .map(
      (chunk) => `
SOURCE: ${chunk.source_title}

${chunk.content}
`
    )
    .join("\n\n---\n\n");

  // STEP 5 — final prompt
  const prompt = `
${SYSTEM_PROMPT}

DOCUMENTATION CONTEXT:
${context}

QUESTION:
${question}
`;

  // STEP 6 — generate answer
  console.log("Prompt is : ", prompt);
  const result = await chatModel.generateContent(prompt);

  const answer = result.response.text();

  // STEP 7 — append citations
  const citations = buildCitations(chunks);

  return `${answer}\n\n${citations}`;
}

function buildCitations(chunks: any[]) {
  const seen = new Set<string>();

  const uniqueSources = chunks.filter((chunk) => {
    if (seen.has(chunk.source_url)) {
      return false;
    }

    seen.add(chunk.source_url);
    return true;
  });

  return uniqueSources
    .map(
      (chunk) =>
        `📄 ${chunk.source_title}\n${chunk.source_url}`
    )
    .join("\n\n");
}
