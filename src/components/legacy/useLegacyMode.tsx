import { Button, ButtonProps } from '@/components/ui/button';
import { LEGACY_MODE, LEGACY_MODE_ENABLED } from '@/config/legacyMode';

/** Estado do modo legado para uso opcional em qualquer componente. */
export function useLegacyMode() {
  return {
    isLegacyMode: LEGACY_MODE_ENABLED,
    readOnly: LEGACY_MODE_ENABLED,
    disabledLabel: LEGACY_MODE.disabledLabel,
    ctaUrl: LEGACY_MODE.ctaUrl,
    ctaLabel: LEGACY_MODE.ctaLabel,
    notice: LEGACY_MODE.notice,
  };
}

/**
 * Botão que se desabilita automaticamente no modo legado, com a indicação
 * "Disponível no GarantFácil 2026". Uso opcional — o guard global já cobre
 * os controles mutantes existentes.
 */
export function LegacyDisabledButton({ children, ...props }: ButtonProps) {
  if (!LEGACY_MODE_ENABLED) return <Button {...props}>{children}</Button>;

  return (
    <Button {...props} disabled aria-disabled="true" title={LEGACY_MODE.disabledLabel}>
      {children}
    </Button>
  );
}
