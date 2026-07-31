import { useEffect } from 'react';
import { toast } from 'sonner';
import {
  LEGACY_MODE,
  LEGACY_MODE_ENABLED,
  LEGACY_MUTATION_KEYWORDS,
  LEGACY_SAFE_KEYWORDS,
  normalizeLegacyText,
} from '@/config/legacyMode';
import { supabase } from '@/integrations/supabase/client';

/* ------------------------------------------------------------------ *
 * 1. Bloqueio de escrita na camada de dados (rede de segurança)
 * ------------------------------------------------------------------ */

let dataLayerPatched = false;

function blocked(): never {
  toast.error(LEGACY_MODE.blockedMessage);
  throw new Error('[legacy-mode] operação de escrita bloqueada (somente consulta)');
}

function patchDataLayer() {
  if (dataLayerPatched || !LEGACY_MODE_ENABLED) return;
  dataLayerPatched = true;

  const client = supabase as unknown as {
    from: (table: string) => Record<string, unknown>;
    storage: { from: (bucket: string) => Record<string, unknown> };
  };

  const originalFrom = client.from.bind(client);
  client.from = (table: string) => {
    const builder = originalFrom(table);
    for (const op of ['insert', 'update', 'upsert', 'delete'] as const) {
      if (typeof builder[op] === 'function') builder[op] = blocked;
    }
    return builder;
  };

  const originalStorageFrom = client.storage.from.bind(client.storage);
  client.storage.from = (bucket: string) => {
    const api = originalStorageFrom(bucket);
    for (const op of ['upload', 'uploadToSignedUrl', 'update', 'move', 'copy', 'remove'] as const) {
      if (typeof api[op] === 'function') api[op] = blocked;
    }
    return api;
  };
}

/* ------------------------------------------------------------------ *
 * 2. Desabilitar controles mutantes na interface
 * ------------------------------------------------------------------ */

const CONTROL_SELECTOR =
  'button, [role="button"], input[type="file"], input[type="submit"], a[href]';

/** Rotas de criação/edição — links que levam a operações mutantes. */
const MUTATING_HREF = /(^|\/)(new|nova|novo|create|criar|edit|editar)(\/|$|\?)/i;

function isAllowed(el: Element): boolean {
  return !!el.closest('[data-legacy-allow="true"]');
}

function controlLabel(el: Element): string {
  const aria = el.getAttribute('aria-label') || '';
  const title = el.getAttribute('title') || '';
  return normalizeLegacyText(`${el.textContent || ''} ${aria} ${title}`);
}

function isMutatingControl(el: Element): boolean {
  if (isAllowed(el)) return false;
  if (el.getAttribute('data-legacy-blocked') === 'true') return true;

  // Navegação, abas, sidebar, diálogos: nunca bloquear
  const role = el.getAttribute('role');
  if (role === 'tab' || role === 'menuitem' || role === 'combobox' || role === 'radio') return false;
  if (el.hasAttribute('data-sidebar') || el.hasAttribute('data-state')) {
    if (el.getAttribute('data-sidebar') === 'trigger') return false;
  }

  if (el instanceof HTMLInputElement && el.type === 'file') return true;

  if (el instanceof HTMLAnchorElement) {
    const href = el.getAttribute('href') || '';
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    if (MUTATING_HREF.test(href)) return true;
  }

  const label = controlLabel(el);
  if (!label) return false;
  if (LEGACY_SAFE_KEYWORDS.some((kw) => label.includes(kw))) return false;

  return LEGACY_MUTATION_KEYWORDS.some((kw) => label.includes(kw));
}

function disableControl(el: Element) {
  el.setAttribute('data-legacy-blocked', 'true');
  el.setAttribute('aria-disabled', 'true');
  el.setAttribute('title', LEGACY_MODE.disabledLabel);
  if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) {
    el.disabled = true;
  } else {
    (el as HTMLElement).style.pointerEvents = 'none';
    (el as HTMLElement).style.opacity = '0.5';
  }
}

function scan(root: ParentNode) {
  const elements: Element[] = [];
  if (root instanceof Element && root.matches(CONTROL_SELECTOR)) elements.push(root);
  elements.push(...Array.from(root.querySelectorAll(CONTROL_SELECTOR)));
  for (const el of elements) {
    if (el.getAttribute('data-legacy-blocked') === 'true') continue;
    if (isMutatingControl(el)) disableControl(el);
  }
}

/**
 * Guard central do modo legado: desabilita controles mutantes (com a indicação
 * "Disponível no GarantFácil 2026"), bloqueia submits de formulários mutantes e
 * intercepta qualquer escrita no backend. Login, recuperação de senha, logout,
 * navegação e consultas continuam funcionando.
 */
export function LegacyModeGuard() {
  useEffect(() => {
    if (!LEGACY_MODE_ENABLED) return;

    patchDataLayer();
    scan(document.body);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) scan(node as Element);
        });
        if (record.type === 'attributes' && record.target.nodeType === Node.ELEMENT_NODE) {
          const el = record.target as Element;
          if (el.getAttribute('data-legacy-blocked') === 'true') continue;
          if (el.matches(CONTROL_SELECTOR) && isMutatingControl(el)) disableControl(el);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'aria-label', 'href'],
    });

    const onCapture = (event: Event) => {
      const target = event.target as Element | null;
      if (!target || typeof target.closest !== 'function') return;
      const control = target.closest('[data-legacy-blocked="true"]');
      if (control) {
        event.preventDefault();
        event.stopPropagation();
        toast.info(LEGACY_MODE.disabledLabel);
      }
    };

    const onSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement | null;
      if (!form || isAllowed(form)) return;
      if (form.querySelector('[data-legacy-blocked="true"]')) {
        event.preventDefault();
        event.stopPropagation();
        toast.info(LEGACY_MODE.disabledLabel);
      }
    };

    document.addEventListener('click', onCapture, true);
    document.addEventListener('change', onCapture, true);
    document.addEventListener('submit', onSubmit, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', onCapture, true);
      document.removeEventListener('change', onCapture, true);
      document.removeEventListener('submit', onSubmit, true);
    };
  }, []);

  return null;
}
