/**
 * Web Content Extraction Route
 * Handles enhanced extraction from web URLs using readability algorithms
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

const webRouter = new Hono();

const webSchema = z.object({
  url: z.string().url(),
});

webRouter.post("/extract", zValidator("json", webSchema), async (c) => {
  const { url } = c.req.valid("json");

  try {
    // Fetch the webpage content
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VibecodeApp/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Parse with JSDOM and extract article content
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error("Could not parse article content from the webpage");
    }

    // Strip HTML tags from content and clean up whitespace
    const textContent = (article.textContent || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return c.json({
      data: {
        text: textContent,
        title: article.title || "Untitled",
        excerpt: article.excerpt || "",
        author: article.byline || null,
      },
    });
  } catch (error) {
    console.error("Web extraction error:", error);
    return c.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Failed to extract content from URL",
          code: "WEB_EXTRACTION_FAILED",
        },
      },
      500
    );
  }
});

export { webRouter };
