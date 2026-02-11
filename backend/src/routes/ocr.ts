/**
 * OCR Extraction Route
 * Handles optical character recognition from images
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createWorker } from "tesseract.js";

const ocrRouter = new Hono();

const ocrSchema = z.object({
  image: z.string(), // base64 encoded image
  isScreenshot: z.boolean().optional(),
});

ocrRouter.post("/extract", zValidator("json", ocrSchema), async (c) => {
  const { image, isScreenshot } = c.req.valid("json");

  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(image, "base64");

    // Create Tesseract worker
    const worker = await createWorker("eng");

    try {
      // Perform OCR
      const { data: { text, confidence } } = await worker.recognize(buffer);

      // Clean up extracted text
      const cleanText = text
        .replace(/\s+/g, " ")
        .trim();

      return c.json({
        data: {
          text: cleanText,
          confidence: confidence / 100,
          isScreenshot: isScreenshot || false,
        },
      });
    } finally {
      // Always terminate worker to free resources
      await worker.terminate();
    }
  } catch (error) {
    console.error("OCR extraction error:", error);
    return c.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Failed to extract text from image",
          code: "OCR_EXTRACTION_FAILED",
        },
      },
      500
    );
  }
});

export { ocrRouter };
