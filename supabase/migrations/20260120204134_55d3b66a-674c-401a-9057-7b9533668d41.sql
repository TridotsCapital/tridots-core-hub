
-- Seed help_chapters
INSERT INTO public.help_chapters (order_index, slug, title, icon, is_new) VALUES
(1, 'introducao', 'Introdução e Primeiro Acesso', 'Home', false),
(2, 'onboarding', 'Onboarding - Ativação da Conta', 'UserCheck', true),
(3, 'dashboard', 'Dashboard - Central de Controle', 'LayoutDashboard', false),
(4, 'nova-analise', 'Nova Análise de Crédito', 'FileSearch', false),
(5, 'minhas-analises', 'Minhas Análises - Acompanhamento', 'ClipboardList', false),
(6, 'aceite-pagamento', 'Aceite e Pagamento do Inquilino', 'CreditCard', false),
(7, 'meus-contratos', 'Meus Contratos', 'FileText', false),
(8, 'renovacao', 'Renovação de Contratos', 'RefreshCw', false),
(9, 'garantias', 'Garantias Solicitadas (Sinistros)', 'Shield', false),
(10, 'comissoes', 'Minhas Comissões', 'DollarSign', false),
(11, 'chamados', 'Chamados - Suporte Tridots', 'MessageSquare', false),
(12, 'drive-colaboradores', 'Drive de Documentos e Colaboradores', 'FolderOpen', false);

-- Seed help_glossary
INSERT INTO public.help_glossary (term, definition) VALUES
('Análise de Crédito', 'Processo de avaliação da capacidade financeira do inquilino para assumir o compromisso de aluguel.'),
('Sinistro', 'Acionamento da garantia quando o inquilino descumpre suas obrigações contratuais, como falta de pagamento.'),
('Setup', 'Taxa única cobrada no momento da contratação da garantia locatícia.'),
('Comissão Recorrente', 'Percentual pago mensalmente à imobiliária durante a vigência do contrato de garantia.'),
('KPI', 'Key Performance Indicator - Indicador-chave de desempenho usado para medir resultados.'),
('Kanban', 'Metodologia visual de organização de tarefas em colunas que representam diferentes status.'),
('RLS', 'Row Level Security - Política de segurança que controla o acesso a dados no banco de dados.'),
('PIX', 'Sistema de pagamento instantâneo brasileiro operado pelo Banco Central.'),
('CRECI', 'Conselho Regional de Corretores de Imóveis - Órgão que regulamenta a profissão de corretor.'),
('IPTU', 'Imposto Predial e Territorial Urbano - Tributo municipal sobre propriedades urbanas.'),
('Aceite Digital', 'Processo de concordância eletrônica com os termos do contrato de garantia.'),
('Termo de Adesão', 'Contrato que formaliza a parceria entre a imobiliária e a Tridots Capital.'),
('Inadimplência', 'Situação de não pagamento de obrigações financeiras no prazo estabelecido.'),
('Cobertura', 'Valor máximo que a garantia pode ressarcir em caso de sinistro.'),
('Vigência', 'Período durante o qual o contrato de garantia está ativo e válido.');
