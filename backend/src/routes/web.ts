/**
 * Web Content Extraction Route
 * Handles enhanced extraction from web URLs using readability algorithms
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const webRouter = new Hono();

const webSchema = z.object({
  url: z.string().url(),
});

webRouter.post("/extract", zValidator("json", webSchema), async (c) => {
  const { url } = c.req.valid("json");

  try {
    // TODO: Implement enhanced web content extraction
    // This requires installing libraries like:
    // - @mozilla/readability for article extraction
    // - jsdom for DOM manipulation
    // - cheerio as a lightweight alternative

    // For now, return a helpful error message
    return c.json(
      {
        error: {
          message:
            "Enhanced web extraction service not yet configured. To enable web extraction:\n\n" +
            "1. Install required libraries (e.g., bun add @mozilla/readability jsdom)\n" +
            "2. Implement the extraction logic in backend/src/routes/web.ts\n\n" +
            "The mobile app will fall back to client-side extraction.",
          code: "WEB_EXTRACTION_NOT_CONFIGURED",
        },
      },
      503
    );

    // Example implementation with Readability:
    /*
    import { Readability } from '@mozilla/readability';
    import { JSDOM } from 'jsdom';

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NarratorApp/1.0)',
      },
    });

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('Could not parse article content');
    }

    // Strip HTML from content
    const textContent = article.textContent
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return c.json({
      data: {
        text: textContent,
        title: article.title,
        excerpt: article.excerpt,
        author: article.byline,
      },
    });
    */
  } catch (error) {
    console.error("Web extraction error:", error);
    return c.json(
      {
        error: {
          message: "Failed to extract content from URL",
          code: "WEB_EXTRACTION_FAILED",
        },
      },
      500
    );
  }
});

export { webRouter };
