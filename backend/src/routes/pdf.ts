/**
 * PDF Extraction Route
 * Handles text extraction from PDF documents
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const pdfRouter = new Hono();

const pdfSchema = z.object({
  pdf: z.string(), // base64 encoded PDF
});

pdfRouter.post("/extract", zValidator("json", pdfSchema), async (c) => {
  const { pdf } = c.req.valid("json");

  try {
    // TODO: Implement PDF text extraction
    // This requires installing a PDF library like:
    // - pdf-parse for Node.js
    // - pdfjs-dist (PDF.js)

    // For now, return a helpful error message
    return c.json(
      {
        error: {
          message:
            "PDF extraction service not yet configured. To enable PDF extraction:\n\n" +
            "1. Install a PDF library (e.g., bun add pdf-parse)\n" +
            "2. Implement the extraction logic in backend/src/routes/pdf.ts\n\n" +
            "For now, you can copy text from your PDF manually or convert it to TXT.",
          code: "PDF_NOT_CONFIGURED",
        },
      },
      503
    );

    // Example implementation with pdf-parse:
    /*
    import pdfParse from 'pdf-parse';

    const buffer = Buffer.from(pdf, 'base64');
    const data = await pdfParse(buffer);

    return c.json({
      data: {
        text: data.text,
        title: data.info?.Title,
        pageCount: data.numpages,
      },
    });
    */
  } catch (error) {
    console.error("PDF extraction error:", error);
    return c.json(
      {
        error: {
          message: "Failed to extract text from PDF",
          code: "PDF_EXTRACTION_FAILED",
        },
      },
      500
    );
  }
});

export { pdfRouter };
