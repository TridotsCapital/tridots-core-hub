import { AlertTriangle, ArrowRight } from 'lucide-react';
import { LEGACY_MODE, LEGACY_MODE_ENABLED } from '@/config/legacyMode';
import { cn } from '@/lib/utils';

interface LegacyModeBannerProps {
  /** "app" = dentro do layout autenticado, "auth" = tela de login */
  variant?: 'app' | 'auth';
  className?: string;
}

/**
 * Aviso reutilizável da transição para o GarantFácil 2026.
 * Renderiza nada quando o modo legado está desligado (rollback).
 */
export function LegacyModeBanner({ variant = 'app', className }: LegacyModeBannerProps) {
  if (!LEGACY_MODE_ENABLED) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-legacy-allow="true"
      className={cn(
        'w-full max-w-full min-w-0 border border-amber-300 bg-amber-50 text-amber-900 rounded-lg',
        'px-3 py-3 sm:px-4',
        variant === 'app' && 'rounded-none border-x-0 border-t-0 sm:rounded-none',
        className
      )}
    >
      <div className="flex flex-col gap-3 min-w-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 min-w-0 sm:items-center">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5 sm:mt-0" aria-hidden="true" />
          <p className="text-sm font-medium leading-snug break-words">{LEGACY_MODE.notice}</p>
        </div>

        <a
          href={LEGACY_MODE.ctaUrl}
          data-legacy-allow="true"
          className={cn(
            'inline-flex items-center justify-center gap-2 shrink-0',
            'rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-amber-50',
            'hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2',
            'min-h-[44px] w-full sm:w-auto'
          )}
        >
          {LEGACY_MODE.ctaLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
