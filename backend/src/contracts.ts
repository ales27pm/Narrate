/**
 * Shared API Contracts
 * Type-safe contracts for all API endpoints using Zod schemas
 */

import { z } from "zod";

// ============================================
// Scan/History Contracts
// ============================================

export const scanTypeSchema = z.enum(["ocr", "pdf", "web", "manual"]);

export const scanMetadataSchema = z.object({
  title: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  author: z.string().optional(),
  excerpt: z.string().optional(),
});

export const scanSchema = z.object({
  id: z.number(),
  type: scanTypeSchema,
  content: z.string(),
  originalUrl: z.string().nullable(),
  metadata: scanMetadataSchema.nullable(),
  createdAt: z.string().datetime(),
});

export const createScanSchema = z.object({
  type: scanTypeSchema,
  content: z.string().min(1, "Content is required"),
  originalUrl: z.string().url().optional().nullable(),
  metadata: scanMetadataSchema.optional().nullable(),
});

// ============================================
// OCR Contracts
// ============================================

export const ocrExtractRequestSchema = z.object({
  image: z.string().min(1, "Image data is required"), // base64 encoded
});

export const ocrExtractResponseSchema = z.object({
  text: z.string(),
  confidence: z.number().optional(),
});

// ============================================
// PDF Contracts
// ============================================

export const pdfExtractRequestSchema = z.object({
  url: z.string().url("Must be a valid URL"),
});

export const pdfExtractResponseSchema = z.object({
  text: z.string(),
  title: z.string().optional(),
  pageCount: z.number().optional(),
});

// ============================================
// Web Contracts
// ============================================

export const webExtractRequestSchema = z.object({
  url: z.string().url("Must be a valid URL"),
});

export const webExtractResponseSchema = z.object({
  text: z.string(),
  title: z.string(),
  excerpt: z.string(),
  author: z.string().nullable(),
});

// ============================================
// API Response Wrapper
// ============================================

export const apiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
  });

export const apiErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string(),
  }),
});

// ============================================
// Type Exports
// ============================================

export type ScanType = z.infer<typeof scanTypeSchema>;
export type ScanMetadata = z.infer<typeof scanMetadataSchema>;
export type Scan = z.infer<typeof scanSchema>;
export type CreateScanInput = z.infer<typeof createScanSchema>;

export type OcrExtractRequest = z.infer<typeof ocrExtractRequestSchema>;
export type OcrExtractResponse = z.infer<typeof ocrExtractResponseSchema>;

export type PdfExtractRequest = z.infer<typeof pdfExtractRequestSchema>;
export type PdfExtractResponse = z.infer<typeof pdfExtractResponseSchema>;

export type WebExtractRequest = z.infer<typeof webExtractRequestSchema>;
export type WebExtractResponse = z.infer<typeof webExtractResponseSchema>;

// ============================================
// API Contract Map
// ============================================

export const apiContracts = {
  scans: {
    list: {
      method: "GET" as const,
      path: "/api/scans",
      response: apiSuccessSchema(z.array(scanSchema)),
    },
    get: {
      method: "GET" as const,
      path: "/api/scans/:id",
      response: apiSuccessSchema(scanSchema),
    },
    create: {
      method: "POST" as const,
      path: "/api/scans",
      request: createScanSchema,
      response: apiSuccessSchema(scanSchema),
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/scans/:id",
      response: apiSuccessSchema(z.object({ success: z.boolean() })),
    },
  },
  ocr: {
    extract: {
      method: "POST" as const,
      path: "/api/ocr/extract",
      request: ocrExtractRequestSchema,
      response: apiSuccessSchema(ocrExtractResponseSchema),
    },
  },
  pdf: {
    extract: {
      method: "POST" as const,
      path: "/api/pdf/extract",
      request: pdfExtractRequestSchema,
      response: apiSuccessSchema(pdfExtractResponseSchema),
    },
  },
  web: {
    extract: {
      method: "POST" as const,
      path: "/api/web/extract",
      request: webExtractRequestSchema,
      response: apiSuccessSchema(webExtractResponseSchema),
    },
  },
} as const;
