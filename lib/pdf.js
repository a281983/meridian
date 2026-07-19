// Import the library file directly, not the package index. pdf-parse's index.js
// runs a debug block at load that reads a bundled test PDF — which throws ENOENT
// on Vercel's serverless filesystem and crashes the route. The inner module has
// no such block.
import pdf from "pdf-parse/lib/pdf-parse.js";

export async function extractDeckText(buffer) {
  const data = await pdf(buffer);
  return data.text;
}
