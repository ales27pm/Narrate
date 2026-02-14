import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Scan, CreateScanInput, ScanType, ScanMetadata } from "./contracts";

// Re-export types for convenience
export type { Scan, CreateScanInput, ScanType, ScanMetadata };

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Fetch all scans
async function fetchScans(): Promise<Scan[]> {
  const response = await fetch(`${BACKEND_URL}/api/scans`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch history");
  }

  const result = await response.json();
  return result.data;
}

// Create a new scan
async function createScan(input: CreateScanInput): Promise<Scan> {
  const response = await fetch(`${BACKEND_URL}/api/scans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to save to history");
  }

  const result = await response.json();
  return result.data;
}

// Delete a scan
async function deleteScan(id: number): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/scans/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to delete scan");
  }
}

// React Query Hooks

export const SCANS_QUERY_KEY = ["scans"] as const;

export function useScans() {
  return useQuery({
    queryKey: SCANS_QUERY_KEY,
    queryFn: fetchScans,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createScan,
    onSuccess: () => {
      // Invalidate and refetch scans list
      queryClient.invalidateQueries({ queryKey: SCANS_QUERY_KEY });
    },
  });
}

export function useDeleteScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteScan,
    onSuccess: () => {
      // Invalidate and refetch scans list
      queryClient.invalidateQueries({ queryKey: SCANS_QUERY_KEY });
    },
  });
}
