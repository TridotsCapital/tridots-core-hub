/**
 * Legacy Mode (transição Tridots Hub -> GarantFácil 2026)
 *
 * Ponto único de configuração. Para rollback, basta definir
 * LEGACY_MODE_ENABLED = false — todo o comportamento (aviso, CTA e bloqueio
 * de operações mutantes) é desativado sem tocar em nenhuma outra tela.
 */

export const LEGACY_MODE_ENABLED = true;

export const LEGACY_MODE = {
  /** Texto obrigatório do aviso (login + telas autenticadas) */
  notice:
    'O Tridots agora está no GarantFácil 2026. Este sistema antigo permanece disponível somente para consulta.',
  /** CTA visível — abre na mesma aba */
  ctaLabel: 'Acessar GarantFácil 2026',
  ctaUrl: 'https://sistema.garantfacil.com.br/auth',
  /** Indicação usada em qualquer controle mutante desabilitado */
  disabledLabel: 'Disponível no GarantFácil 2026',
  /** Mensagem exibida caso uma operação de escrita seja tentada */
  blockedMessage:
    'Somente consulta neste sistema antigo. Esta operação está disponível no GarantFácil 2026.',
} as const;

/**
 * Palavras-chave (minúsculas, sem acento) que identificam controles mutantes:
 * criar, editar, excluir, enviar, aprovar, rejeitar, mudar status, upload.
 */
export const LEGACY_MUTATION_KEYWORDS: string[] = [
  'salvar',
  'criar',
  'cadastrar',
  'nova analise',
  'nova',
  'novo',
  'adicionar',
  'incluir',
  'enviar',
  'reenviar',
  'submeter',
  'aprovar',
  'reprovar',
  'rejeitar',
  'recusar',
  'excluir',
  'deletar',
  'remover',
  'apagar',
  'upload',
  'anexar',
  'importar',
  'confirmar',
  'atualizar',
  'editar',
  'alterar',
  'gerar',
  'regenerar',
  'solicitar',
  'marcar como',
  'validar',
  'iniciar analise',
  'finalizar',
  'faturar',
  'pagar',
  'registrar',
  'responder',
  'abrir chamado',
  'convidar',
  'redefinir',
  'vincular',
  'desvincular',
  'aceitar',
  'assinar',
  'processar',
  'sincronizar',
  'renovar',
  'ativar',
  'inativar',
  'bloquear',
  'desbloquear',
  'duplicar',
  'publicar',
  'confirmo',
];

/**
 * Termos que NUNCA devem ser bloqueados (consulta, navegação, autenticação).
 */
export const LEGACY_SAFE_KEYWORDS: string[] = [
  'entrar',
  'login',
  'sair',
  'logout',
  'esqueci',
  'recuperar senha',
  'voltar',
  'fechar',
  'cancelar',
  'buscar',
  'pesquisar',
  'filtrar',
  'limpar filtros',
  'exportar',
  'baixar',
  'download',
  'visualizar',
  'ver ',
  'detalhes',
  'imprimir',
  'copiar',
  'proximo',
  'anterior',
  'continuar',
  'ajuda',
  'acessar garantfacil',
];

export function normalizeLegacyText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
