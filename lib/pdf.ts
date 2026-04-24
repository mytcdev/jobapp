export async function extractPdfText(buffer: Buffer): Promise<string> {
  // pdf-parse uses CommonJS exports
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer);
  return (data.text as string).trim();
}
