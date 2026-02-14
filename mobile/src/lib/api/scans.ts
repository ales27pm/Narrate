import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Scan, CreateScanInput, ScanType, ScanMetadata } from "./contracts";

// Re-export types for convenience
export type { Scan, CreateScanInput, ScanType, ScanMetadata };

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Fetch all scans (with offline support)
async function fetchScans(): Promise<Scan[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/scans`, {
      credentials: "include",
      // Add timeout for offline detection
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error("Failed to fetch history");
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    // If offline or network error, return empty array (library will show local stories only)
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'TypeError')) {
      console.log('Offline mode: Backend unavailable, showing local stories only');
      return [];
    }
    throw error;
  }
}

// Create a new scan (with offline support)
async function createScan(input: CreateScanInput): Promise<Scan> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/scans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(10000), // 10 second timeout for POST
    });

    if (!response.ok) {
      throw new Error("Failed to save to history");
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    // If offline or timeout, throw error so the UI can handle it gracefully
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'TypeError')) {
      throw new Error('OFFLINE');
    }
    throw error;
  }
}

// Delete a scan (with offline support)
async function deleteScan(id: number): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/scans/${id}`, {
      method: "DELETE",
      credentials: "include",
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error("Failed to delete scan");
    }
  } catch (error) {
    // If offline, throw specific error
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'TypeError')) {
      throw new Error('OFFLINE');
    }
    throw error;
  }
}

// React Query Hooks

export const SCANS_QUERY_KEY = ["scans"] as const;

export function useScans() {
  return useQuery({
    queryKey: SCANS_QUERY_KEY,
    queryFn: fetchScans,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry if offline
    // Return empty array instead of showing error state when offline
    placeholderData: [],
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
