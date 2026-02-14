/**
 * Scans/History Route
 * Handles storage and retrieval of narrator history (OCR, PDF, web, manual text)
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "../prisma";
import { createScanSchema } from "../contracts";

const scansRouter = new Hono();

// Get all scans (history)
scansRouter.get("/", async (c) => {
  try {
    const scans = await prisma.scan.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Parse metadata JSON strings back to objects
    const scansWithParsedMetadata = scans.map((scan) => ({
      ...scan,
      metadata: scan.metadata ? JSON.parse(scan.metadata) : null,
    }));

    return c.json({ data: scansWithParsedMetadata });
  } catch (error) {
    console.error("Failed to fetch scans:", error);
    return c.json(
      {
        error: {
          message: "Failed to fetch history",
          code: "FETCH_FAILED",
        },
      },
      500
    );
  }
});

// Get a single scan by ID
scansRouter.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));

  if (isNaN(id)) {
    return c.json(
      {
        error: {
          message: "Invalid scan ID",
          code: "INVALID_ID",
        },
      },
      400
    );
  }

  try {
    const scan = await prisma.scan.findUnique({
      where: { id },
    });

    if (!scan) {
      return c.json(
        {
          error: {
            message: "Scan not found",
            code: "NOT_FOUND",
          },
        },
        404
      );
    }

    return c.json({
      data: {
        ...scan,
        metadata: scan.metadata ? JSON.parse(scan.metadata) : null,
      },
    });
  } catch (error) {
    console.error("Failed to fetch scan:", error);
    return c.json(
      {
        error: {
          message: "Failed to fetch scan",
          code: "FETCH_FAILED",
        },
      },
      500
    );
  }
});

// Create a new scan
scansRouter.post("/", zValidator("json", createScanSchema), async (c) => {
  const data = c.req.valid("json");

  try {
    const scan = await prisma.scan.create({
      data: {
        type: data.type,
        content: data.content,
        originalUrl: data.originalUrl || null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    return c.json(
      {
        data: {
          ...scan,
          metadata: scan.metadata ? JSON.parse(scan.metadata) : null,
        },
      },
      201
    );
  } catch (error) {
    console.error("Failed to create scan:", error);
    return c.json(
      {
        error: {
          message: "Failed to save to history",
          code: "CREATE_FAILED",
        },
      },
      500
    );
  }
});

// Delete a scan
scansRouter.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));

  if (isNaN(id)) {
    return c.json(
      {
        error: {
          message: "Invalid scan ID",
          code: "INVALID_ID",
        },
      },
      400
    );
  }

  try {
    await prisma.scan.delete({
      where: { id },
    });

    return c.json({ data: { success: true } });
  } catch (error) {
    console.error("Failed to delete scan:", error);
    return c.json(
      {
        error: {
          message: "Failed to delete scan",
          code: "DELETE_FAILED",
        },
      },
      500
    );
  }
});

export { scansRouter };
