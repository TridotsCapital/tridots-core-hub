import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string safely for BR timezone.
 * Uses parseISO to avoid the UTC midnight issue with new Date("YYYY-MM-DD")
 * which causes -1 day offset in UTC-3 (Brazil).
 */
export function formatDateBR(dateStr: string | null | undefined, pattern: string = "dd/MM/yyyy"): string {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), pattern, { locale: ptBR });
  } catch {
    return dateStr;
  }
}

/**
 * Sanitizes a file name for storage upload.
 * Removes accents, replaces spaces/special chars with underscores.
 */
export function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Extracts a human-readable file name from a storage URL.
 * Supports new format (uuid__OriginalName.ext) and old format (uuid.ext).
 */
export function getFileNameFromUrl(url: string): string {
  const filename = decodeURIComponent(url.split('/').pop() || 'arquivo');
  if (filename.includes('__')) {
    return filename.split('__').slice(1).join('__');
  }
  return filename;
}

/**
 * Builds a storage path preserving the original file name.
 * Format: uuid__SanitizedOriginalName.ext
 */
export function buildStoragePath(originalName: string): string {
  const uuid = crypto.randomUUID();
  const sanitized = sanitizeFileName(originalName);
  return `${uuid}__${sanitized}`;
}

/**
 * Opens a file in a new tab using fetch+Blob to bypass ad-blockers.
 */
export async function viewFileViaBlob(url: string): Promise<void> {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
}

/**
 * Downloads a file programmatically using fetch+Blob.
 */
export async function downloadFileViaBlob(url: string, fileName?: string): Promise<void> {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName || getFileNameFromUrl(url);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
