/**
 * PDF Extraction Route
 * Handles text extraction from PDF documents
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { PDFParse } from "pdf-parse";

const pdfRouter = new Hono();

const pdfSchema = z.object({
  pdf: z.string(), // base64 encoded PDF
});

pdfRouter.post("/extract", zValidator("json", pdfSchema), async (c) => {
  const { pdf } = c.req.valid("json");

  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(pdf, "base64");

    // Create parser and extract text
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const info = await parser.getInfo();

    // Clean up extracted text - remove excessive whitespace
    const cleanText = result.text
      .replace(/\s+/g, " ")
      .trim();

    // Clean up resources
    await parser.destroy();

    return c.json({
      data: {
        text: cleanText,
        title: info.info?.Title || "Untitled PDF",
        pageCount: result.pages.length,
        metadata: {
          author: info.info?.Author || null,
          subject: info.info?.Subject || null,
          creationDate: info.info?.CreationDate || null,
        },
      },
    });
  } catch (error) {
    console.error("PDF extraction error:", error);
    return c.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Failed to extract text from PDF",
          code: "PDF_EXTRACTION_FAILED",
        },
      },
      500
    );
  }
});

export { pdfRouter };
