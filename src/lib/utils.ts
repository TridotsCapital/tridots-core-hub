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
