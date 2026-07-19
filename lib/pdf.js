import pdf from "pdf-parse";

export async function extractDeckText(buffer) {
  const data = await pdf(buffer);
  return data.text;
}
