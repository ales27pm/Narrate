/**
 * OCR Extraction Route
 * Handles optical character recognition from images
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const ocrRouter = new Hono();

const ocrSchema = z.object({
  image: z.string(), // base64 encoded image
  isScreenshot: z.boolean().optional(),
});

ocrRouter.post("/extract", zValidator("json", ocrSchema), async (c) => {
  const { image, isScreenshot } = c.req.valid("json");

  try {
    // TODO: Implement OCR extraction
    // This requires installing an OCR library like:
    // - tesseract.js for JavaScript OCR
    // - Google Cloud Vision API
    // - AWS Textract
    // - Azure Computer Vision

    // For now, return a helpful error message
    return c.json(
      {
        error: {
          message:
            "OCR service not yet configured. To enable OCR:\n\n" +
            "1. Install an OCR library (e.g., bun add tesseract.js)\n" +
            "2. Implement the extraction logic in backend/src/routes/ocr.ts\n" +
            "3. Or use a cloud service like Google Vision API\n\n" +
            "For now, you can copy and paste text manually.",
          code: "OCR_NOT_CONFIGURED",
        },
      },
      503
    );

    // Example implementation with tesseract.js:
    /*
    import Tesseract from 'tesseract.js';

    const buffer = Buffer.from(image, 'base64');
    const { data: { text, confidence } } = await Tesseract.recognize(buffer, 'eng');

    return c.json({
      data: {
        text,
        confidence: confidence / 100,
      },
    });
    */
  } catch (error) {
    console.error("OCR extraction error:", error);
    return c.json(
      {
        error: {
          message: "Failed to extract text from image",
          code: "OCR_EXTRACTION_FAILED",
        },
      },
      500
    );
  }
});

export { ocrRouter };
