// Shared logging utilities for structured error and performance tracking
// Enables consistent logging across all edge functions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  context: string;
  message: string;
  duration_ms?: number;
  error_details?: unknown;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Structured logger for edge functions.
 * Logs to console (Deno logs) and optionally to database.
 */
export class StructuredLogger {
  private context: string;
  private supabase: ReturnType<typeof createClient> | null;

  constructor(context: string, supabase?: ReturnType<typeof createClient>) {
    this.context = context;
    this.supabase = supabase || null;
  }

  private async persistLog(entry: LogEntry) {
    if (!this.supabase) return;

    try {
      // Insert to function_logs table for persistence
      await this.supabase.from('function_logs').insert({
        function_name: this.context,
        level: entry.level,
        message: entry.message,
        duration_ms: entry.duration_ms,
        error_details: entry.error_details,
        metadata: entry.metadata,
        created_at: entry.timestamp,
      });
    } catch (err) {
      // Log persistence failures to console but don't crash
      console.error(`Failed to persist log for ${this.context}:`, err);
    }
  }

  info(message: string, metadata?: Record<string, unknown>) {
    const entry: LogEntry = {
      level: 'info',
      context: this.context,
      message,
      metadata,
      timestamp: new Date().toISOString(),
    };
    console.log(JSON.stringify(entry));
    this.persistLog(entry);
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    const entry: LogEntry = {
      level: 'warn',
      context: this.context,
      message,
      metadata,
      timestamp: new Date().toISOString(),
    };
    console.warn(JSON.stringify(entry));
    this.persistLog(entry);
  }

  error(message: string, error: unknown, metadata?: Record<string, unknown>) {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;

    const entry: LogEntry = {
      level: 'error',
      context: this.context,
      message,
      error_details: errorDetails,
      metadata,
      timestamp: new Date().toISOString(),
    };
    console.error(JSON.stringify(entry));
    this.persistLog(entry);
  }

  /**
   * Measure execution time of an async function.
   * Automatically logs timing information.
   */
  async measureAsync<T>(
    operationName: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.info(`${operationName} completed`, {
        duration_ms: Math.round(duration),
        ...metadata,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.error(`${operationName} failed`, error, {
        duration_ms: Math.round(duration),
        ...metadata,
      });
      throw error;
    }
  }
}

/**
 * Initialize logger with optional database persistence.
 */
export function initLogger(context: string, supabaseUrl?: string, serviceKey?: string) {
  let supabase: ReturnType<typeof createClient> | undefined;

  if (supabaseUrl && serviceKey) {
    supabase = createClient(supabaseUrl, serviceKey);
  }

  return new StructuredLogger(context, supabase);
}
