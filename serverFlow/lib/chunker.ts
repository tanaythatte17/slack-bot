export function chunkText(
  text: string,
  chunkSize = 400,   // words per chunk — smaller than OpenAI since Gemini context is generous
  overlap = 40       // words of overlap between chunks
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk.trim().length > 50) {  // skip tiny fragments
      chunks.push(chunk);
    }
    if (i + chunkSize >= words.length) break;
  }

  return chunks;
}