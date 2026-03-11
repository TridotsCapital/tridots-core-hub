// Templates de e-mail com branding Tridots Capital
// Cores institucionais: azul #1a1a2e, accent #4A90A4
// Imagens embebidas via CID para máxima compatibilidade (Gmail, Outlook, Apple Mail)

const TRIDOTS_BLUE = '#1a1a2e';
const TRIDOTS_ACCENT = '#4A90A4';

// Logo Tridots Capital em base64 (PNG transparente branco)
// Este é o logo oficial da empresa convertido para base64
export const LOGO_BASE64 = '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';

// URLs das imagens hero (ainda usamos Unsplash por enquanto, mas podemos converter para CID também)
const IMAGES = {
  keys: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=200&fit=crop&crop=center',
  family: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=200&fit=crop&crop=center',
  handshake: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=200&fit=crop&crop=center',
  celebration: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=600&h=200&fit=crop&crop=center',
  office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=200&fit=crop&crop=center',
};

interface EmailTemplateData {
  recipientName?: string;
  [key: string]: unknown;
}

// Interface para attachments inline
interface InlineAttachment {
  filename: string;
  content: string; // base64
  content_type: string;
  disposition?: 'inline';
  content_id?: string;
}

export function generateEmailWrapper(content: string, preheader?: string, heroImage?: string): string {
  const heroSection = heroImage ? `
          <!-- Hero Image -->
          <tr>
            <td style="padding:0;">
              <img src="${heroImage}" alt="Tridots Capital" style="width:100%;max-width:600px;height:180px;object-fit:cover;object-position:center;display:block;" />
            </td>
          </tr>
  ` : '';

  // Logo via CID (Content-ID) para máxima compatibilidade
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tridots Capital</title>
  ${preheader ? `<span style="display:none !important;visibility:hidden;mso-hide:all;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:${TRIDOTS_BLUE};padding:30px 40px;text-align:center;">
              <img src="cid:tridots-logo" alt="Tridots Capital" style="height:40px;width:auto;max-width:200px;" />
              <!--[if mso]>
              <span style="font-family:Arial,sans-serif;font-size:24px;font-weight:bold;color:#ffffff;">TRIDOTS CAPITAL</span>
              <![endif]-->
            </td>
          </tr>
          ${heroSection}
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:30px 40px;border-top:1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align:center;color:#6b7280;font-size:13px;line-height:1.6;">
                    <p style="margin:0 0 10px 0;">
                      <strong>Tridots Capital</strong><br>
                      A garantia locatícia mais segura e completa do Brasil
                    </p>
                    <p style="margin:0;color:#9ca3af;font-size:12px;">
                      Este é um e-mail automático, não responda diretamente.<br>
                      Em caso de dúvidas, entre em contato pelo portal.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Template: Aceite Digital (Inquilino)
export function acceptanceDigitalTemplate(data: {
  tenantName: string;
  propertyAddress: string;
  agencyName: string;
  acceptanceUrl: string;
  expiresAt: string;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 20px 0;font-size:24px;color:${TRIDOTS_BLUE};font-weight:600;">
      Seu aceite digital está disponível! 📝
    </h1>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Olá, <strong>${data.tenantName}</strong>!
    </p>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Sua análise de garantia locatícia foi aprovada pela <strong>Tridots Capital</strong>! 
      Agora você precisa concluir o processo de aceite digital para ativar sua garantia.
    </p>
    
    <div style="background-color:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 15px 0;font-size:16px;color:#1e40af;">Dados da Garantia</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Imóvel:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.propertyAddress}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Imobiliária:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.agencyName}</td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin:30px 0;">
      <a href="${data.acceptanceUrl}" style="display:inline-block;background-color:${TRIDOTS_ACCENT};color:#ffffff;font-size:16px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">
        Acessar Aceite Digital
      </a>
    </div>

    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:15px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#92400e;">
        ⏰ <strong>Atenção:</strong> Este link é válido até <strong>${data.expiresAt}</strong>. 
        Após esse prazo, será necessário solicitar um novo link.
      </p>
    </div>
    
    <p style="margin:20px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      Ao concluir o aceite digital, você confirma a contratação da garantia locatícia e 
      autoriza a cobrança conforme os termos apresentados.
    </p>
  `;

  return {
    subject: `${data.tenantName}, seu aceite digital está disponível - Tridots Capital`,
    html: generateEmailWrapper(content, 'Complete o aceite digital para ativar sua garantia locatícia', IMAGES.keys)
  };
}

// Template: Lembrete de Renovação (Inquilino)
export function renewalReminderTemplate(data: {
  tenantName: string;
  propertyAddress: string;
  agencyName: string;
  contractEndDate: string;
  daysRemaining: number;
}): { subject: string; html: string } {
  const urgencyColor = data.daysRemaining <= 5 ? '#dc2626' : data.daysRemaining <= 15 ? '#f59e0b' : '#2563eb';
  
  const content = `
    <h1 style="margin:0 0 20px 0;font-size:24px;color:${TRIDOTS_BLUE};font-weight:600;">
      Seu contrato expira em breve! ⏰
    </h1>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Olá, <strong>${data.tenantName}</strong>!
    </p>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Gostaríamos de informar que seu contrato de garantia locatícia está próximo do vencimento. 
      Para continuar protegido, entre em contato com sua imobiliária para discutir a renovação.
    </p>
    
    <div style="background-color:#fef2f2;border:2px solid ${urgencyColor};border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
      <p style="margin:0 0 10px 0;font-size:14px;color:#6b7280;">Tempo restante</p>
      <p style="margin:0;font-size:36px;font-weight:700;color:${urgencyColor};">${data.daysRemaining} dias</p>
      <p style="margin:10px 0 0 0;font-size:14px;color:#6b7280;">até ${data.contractEndDate}</p>
    </div>

    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 15px 0;font-size:16px;color:#374151;">Detalhes do Contrato</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Imóvel:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.propertyAddress}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Imobiliária:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.agencyName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Vencimento:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.contractEndDate}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin:20px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      Entre em contato com a <strong>${data.agencyName}</strong> para renovar sua garantia 
      e continuar protegido pela Tridots Capital.
    </p>
  `;

  return {
    subject: `${data.tenantName}, seu contrato expira em ${data.daysRemaining} dias - Tridots Capital`,
    html: generateEmailWrapper(content, `Seu contrato de garantia expira em ${data.daysRemaining} dias`, IMAGES.family)
  };
}

// Template: Confirmação de Pagamento (Inquilino)
export function paymentConfirmationTemplate(data: {
  tenantName: string;
  propertyAddress: string;
  agencyName: string;
  planName: string;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 20px 0;font-size:24px;color:${TRIDOTS_BLUE};font-weight:600;">
      Pagamento Confirmado! ✓
    </h1>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Olá, <strong>${data.tenantName}</strong>!
    </p>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Seu pagamento foi validado com sucesso. Sua garantia locatícia está ativa e você está protegido!
    </p>
    
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 15px 0;font-size:16px;color:#166534;">Detalhes da Garantia</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Imóvel:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.propertyAddress}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Imobiliária:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.agencyName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Plano:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.planName}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin:20px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      Aguarde a ativação do contrato pela sua imobiliária. Você receberá um e-mail quando estiver tudo pronto!
    </p>
  `;

  return {
    subject: `${data.tenantName}, seu pagamento foi confirmado - Tridots Capital`,
    html: generateEmailWrapper(content, 'Seu pagamento foi validado com sucesso!', IMAGES.celebration)
  };
}

// Template: Contrato Ativado (Inquilino)
export function contractActivatedTenantTemplate(data: {
  tenantName: string;
  propertyAddress: string;
  agencyName: string;
  agencyPhone?: string;
  contractEndDate: string;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 20px 0;font-size:24px;color:${TRIDOTS_BLUE};font-weight:600;">
      Bem-vindo à Tridots Capital! 🏠
    </h1>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Olá, <strong>${data.tenantName}</strong>!
    </p>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Seu contrato de garantia locatícia foi ativado com sucesso! Você está protegido pela Tridots Capital.
    </p>
    
    <div style="background-color:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 15px 0;font-size:16px;color:#1e40af;">Seu Contrato</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Imóvel:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.propertyAddress}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Imobiliária:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.agencyName}</td>
        </tr>
        ${data.agencyPhone ? `
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Contato:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.agencyPhone}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Vigência até:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.contractEndDate}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin:20px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      Mantenha seus pagamentos em dia para continuar protegido. Em caso de dúvidas, entre em contato com sua imobiliária.
    </p>
  `;

  return {
    subject: `${data.tenantName}, seu contrato está ativo - Tridots Capital`,
    html: generateEmailWrapper(content, 'Seu contrato de garantia está ativo!', IMAGES.family)
  };
}

// Template: Contrato Ativado (Imobiliária)
export function contractActivatedAgencyTemplate(data: {
  tenantName: string;
  propertyAddress: string;
  rentValue: string;
  contractEndDate: string;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 20px 0;font-size:24px;color:${TRIDOTS_BLUE};font-weight:600;">
      Contrato Ativado! ✓
    </h1>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      O contrato abaixo foi ativado com sucesso e está sob cobertura da Tridots Capital.
    </p>
    
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 15px 0;font-size:16px;color:#166534;">Detalhes do Contrato</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Inquilino:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.tenantName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Imóvel:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.propertyAddress}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Aluguel:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.rentValue}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Vigência:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">Até ${data.contractEndDate}</td>
        </tr>
      </table>
    </div>
  `;

  return {
    subject: `${data.tenantName} - Contrato Ativado - Tridots Capital`,
    html: generateEmailWrapper(content, `Contrato de ${data.tenantName} ativado com sucesso`)
  };
}

// Template: Ativação de Cadastro (Imobiliária)
export function agencyActivationTemplate(data: {
  responsibleName: string;
  agencyName: string;
  loginUrl: string;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 20px 0;font-size:24px;color:${TRIDOTS_BLUE};font-weight:600;">
      Cadastro Aprovado! 🎉
    </h1>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Olá, <strong>${data.responsibleName}</strong>!
    </p>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Temos o prazer de informar que o cadastro da <strong>${data.agencyName}</strong> foi aprovado! Você já pode acessar o portal e começar a enviar análises.
    </p>
    
    <div style="text-align:center;margin:30px 0;">
      <a href="${data.loginUrl}" style="display:inline-block;background-color:${TRIDOTS_ACCENT};color:#ffffff;font-size:16px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">
        Acessar o Portal
      </a>
    </div>
    
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 10px 0;font-size:14px;color:#92400e;">Próximos Passos</h3>
      <ol style="margin:0;padding-left:20px;color:#78350f;font-size:14px;line-height:1.8;">
        <li>Acesse o portal com seu e-mail e senha</li>
        <li>Adicione colaboradores (se necessário)</li>
        <li>Envie sua primeira análise de inquilino</li>
      </ol>
    </div>
    
    <p style="margin:20px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      Em caso de dúvidas, abra um chamado no portal ou entre em contato conosco.
    </p>
  `;

  return {
    subject: `${data.responsibleName}, seu cadastro foi aprovado - Tridots Capital`,
    html: generateEmailWrapper(content, 'Seu cadastro foi aprovado! Acesse o portal.', IMAGES.handshake)
  };
}

// Template: Nova Imobiliária Pendente (Tridots Capital)
export function newAgencyPendingTemplate(data: {
  agencyName: string;
  cnpj: string;
  responsibleName: string;
  responsibleEmail: string;
  city?: string;
  state?: string;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 20px 0;font-size:24px;color:${TRIDOTS_BLUE};font-weight:600;">
      Nova Imobiliária Cadastrada
    </h1>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Uma nova imobiliária se cadastrou e aguarda aprovação.
    </p>
    
    <div style="background-color:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 15px 0;font-size:16px;color:#92400e;">Dados do Cadastro</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Razão Social:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.agencyName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">CNPJ:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.cnpj}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Responsável:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.responsibleName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">E-mail:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.responsibleEmail}</td>
        </tr>
        ${data.city && data.state ? `
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Cidade:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.city}/${data.state}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <p style="margin:20px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      Acesse o painel administrativo para revisar os documentos e aprovar o cadastro.
    </p>
  `;

  return {
    subject: `Nova Imobiliária: ${data.agencyName} - Tridots Capital`,
    html: generateEmailWrapper(content, `Nova imobiliária cadastrada: ${data.agencyName}`, IMAGES.office)
  };
}

// Template: Relatório Semanal de Comissões
export function weeklyCommissionReportTemplate(data: {
  agencyName: string;
  weekStart: string;
  weekEnd: string;
  commissions: Array<{
    tenantName: string;
    propertyAddress: string;
    value: string;
    paidAt: string;
    type: string;
  }>;
  totalValue: string;
}): { subject: string; html: string } {
  const commissionsRows = data.commissions.map(c => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">${c.tenantName}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">${c.type}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;text-align:right;">${c.value}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280;text-align:right;">${c.paidAt}</td>
    </tr>
  `).join('');

  const content = `
    <h1 style="margin:0 0 20px 0;font-size:24px;color:${TRIDOTS_BLUE};font-weight:600;">
      Relatório de Comissões 💰
    </h1>
    <p style="margin:0 0 10px 0;font-size:16px;color:#374151;line-height:1.6;">
      <strong>${data.agencyName}</strong>
    </p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#6b7280;line-height:1.6;">
      Período: ${data.weekStart} a ${data.weekEnd}
    </p>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background-color:#f9fafb;">
          <th style="padding:12px 8px;text-align:left;font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;">Inquilino</th>
          <th style="padding:12px 8px;text-align:left;font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;">Tipo</th>
          <th style="padding:12px 8px;text-align:right;font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;">Valor</th>
          <th style="padding:12px 8px;text-align:right;font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;">Data Pgto</th>
        </tr>
      </thead>
      <tbody>
        ${commissionsRows}
      </tbody>
      <tfoot>
        <tr style="background-color:#f0fdf4;">
          <td colspan="2" style="padding:14px 8px;font-size:14px;font-weight:600;color:#166534;">Total</td>
          <td colspan="2" style="padding:14px 8px;font-size:16px;font-weight:700;color:#166534;text-align:right;">${data.totalValue}</td>
        </tr>
      </tfoot>
    </table>
    
    <p style="margin:20px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      O pagamento será processado conforme acordado. Em caso de dúvidas, entre em contato através do portal.
    </p>
  `;

  return {
    subject: `${data.agencyName} - Comissões Pagas: ${data.weekStart} a ${data.weekEnd} - Tridots Capital`,
    html: generateEmailWrapper(content, `Relatório de comissões: ${data.commissions.length} pagamento(s) no valor de ${data.totalValue}`)
  };
}

// Template: Notificação de Chamado para Imobiliária
export function ticketNotificationTemplate(data: {
  agencyName: string;
  recipientName: string;
  ticketProtocol: string;
  ticketSubject: string;
  eventType: 'new_ticket' | 'new_reply';
  messagePreview?: string;
  portalUrl: string;
}): { subject: string; html: string } {
  const isNewTicket = data.eventType === 'new_ticket';
  const title = isNewTicket 
    ? 'Novo chamado recebido! 📩' 
    : 'Nova resposta no chamado! 💬';
  const description = isNewTicket
    ? 'A Tridots Capital abriu um novo chamado para sua imobiliária.'
    : 'A Tridots Capital respondeu a um chamado da sua imobiliária.';

  const content = `
    <h1 style="margin:0 0 20px 0;font-size:24px;color:${TRIDOTS_BLUE};font-weight:600;">
      ${title}
    </h1>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Olá, <strong>${data.recipientName}</strong>!
    </p>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      ${description}
    </p>
    
    <div style="background-color:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 15px 0;font-size:16px;color:#1e40af;">Detalhes do Chamado</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Protocolo:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">#${data.ticketProtocol}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Assunto:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.ticketSubject}</td>
        </tr>
      </table>
    </div>

    ${data.messagePreview ? `
    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:15px;margin:20px 0;">
      <p style="margin:0 0 8px 0;font-size:12px;color:#6b7280;text-transform:uppercase;">Prévia da mensagem:</p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;font-style:italic;">"${data.messagePreview.substring(0, 200)}${data.messagePreview.length > 200 ? '...' : ''}"</p>
    </div>
    ` : ''}

    <div style="text-align:center;margin:30px 0;">
      <a href="${data.portalUrl}" style="display:inline-block;background-color:${TRIDOTS_ACCENT};color:#ffffff;font-size:16px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">
        Acessar Portal
      </a>
    </div>
    
    <p style="margin:20px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      Acesse o portal da imobiliária para visualizar os detalhes completos e responder ao chamado.
    </p>
  `;

  const subjectText = isNewTicket 
    ? `Novo chamado #${data.ticketProtocol}: ${data.ticketSubject}`
    : `Nova resposta no chamado #${data.ticketProtocol}`;

  return {
    subject: `${subjectText} - Tridots Capital`,
    html: generateEmailWrapper(content, isNewTicket ? 'A Tridots abriu um novo chamado' : 'Você recebeu uma resposta no chamado', IMAGES.office)
  };
}

// Retorna o logo como attachment inline para uso no sendEmail
export function getLogoAttachment(): InlineAttachment {
  return {
    filename: 'tridots-logo.png',
    content: LOGO_BASE64,
    content_type: 'image/png',
    disposition: 'inline',
    content_id: 'tridots-logo'
  };
}

// Função auxiliar para enviar e-mail via Resend COM suporte a attachments inline (CID)
export async function sendEmail(
  resendApiKey: string,
  to: string,
  subject: string,
  html: string,
  testMode: boolean = false,
  testEmail: string = 'testes@tridotscapital.com',
  attachments?: InlineAttachment[]
): Promise<{ success: boolean; messageId?: string; error?: string; originalRecipient?: string }> {
  const recipientEmail = testMode ? testEmail : to;
  
  // Sempre incluir o logo como attachment inline
  const logoAttachment = getLogoAttachment();
  const allAttachments = attachments ? [logoAttachment, ...attachments] : [logoAttachment];
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Tridots Capital <naoresponder@tridotscapital.com>',
        to: recipientEmail,
        subject: testMode ? `[TESTE] ${subject}` : subject,
        html,
        attachments: allAttachments.map(att => ({
          filename: att.filename,
          content: att.content,
          content_type: att.content_type,
          disposition: att.disposition || 'inline',
          content_id: att.content_id
        }))
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.message || 'Erro ao enviar e-mail',
        originalRecipient: testMode ? to : undefined
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      messageId: data.id,
      originalRecipient: testMode ? to : undefined
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      originalRecipient: testMode ? to : undefined
    };
  }
}

// ========== TEMPLATES DE FATURA (FASE 4.1) ==========

// Template 1: Fatura Disponível (Imobiliária)
export function invoiceAvailableTemplate(data: {
  agencyName: string;
  invoiceMonth: string;
  invoiceYear: number;
  totalValue: number;
  dueDate: string;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 20px 0;font-size:24px;color:${TRIDOTS_BLUE};font-weight:600;">
      Fatura disponível! 📄
    </h1>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Olá, <strong>${data.agencyName}</strong>!
    </p>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Sua fatura consolidada de garantias do mês está disponível para visualização e download.
    </p>
    
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 15px 0;font-size:16px;color:#166534;">Dados da Fatura</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Período:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.invoiceMonth}/${data.invoiceYear}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Valor Total:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;font-size:18px;">R$ ${(data.totalValue / 100).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Vencimento:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.dueDate}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin:20px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      Acesse o portal para visualizar, baixar ou gerar o boleto da fatura.
    </p>
  `;

  return {
    subject: `${data.agencyName}, fatura disponível - ${data.invoiceMonth}/${data.invoiceYear} - Tridots Capital`,
    html: generateEmailWrapper(content, `Fatura do mês ${data.invoiceMonth}/${data.invoiceYear} disponível`, IMAGES.office)
  };
}

// Template 2: Lembrete de Vencimento (3 dias antes)
export function invoiceDueReminderTemplate(data: {
  agencyName: string;
  invoiceMonth: string;
  invoiceYear: number;
  totalValue: number;
  dueDate: string;
  daysUntilDue: number;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 20px 0;font-size:24px;color:${TRIDOTS_BLUE};font-weight:600;">
      Lembrete: Fatura próxima do vencimento ⏰
    </h1>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Olá, <strong>${data.agencyName}</strong>!
    </p>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Sua fatura está próxima do vencimento. Para evitar inadimplência, providencie o pagamento em breve.
    </p>
    
    <div style="background-color:#fef3c7;border:2px solid #f59e0b;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 15px 0;font-size:16px;color:#92400e;">Dados da Fatura</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Período:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.invoiceMonth}/${data.invoiceYear}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Valor Total:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;font-size:18px;">R$ ${(data.totalValue / 100).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Vencimento:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;color:#dc2626;">${data.dueDate}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Dias restantes:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;font-size:18px;color:#f59e0b;">${data.daysUntilDue} dias</td>
        </tr>
      </table>
    </div>
    
    <p style="margin:20px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      Visite o portal para gerar o boleto ou configurar a forma de pagamento preferida.
    </p>
  `;

  return {
    subject: `${data.agencyName}, fatura vence em ${data.daysUntilDue} dias - Tridots Capital`,
    html: generateEmailWrapper(content, `Fatura ${data.invoiceMonth}/${data.invoiceYear} vence em ${data.daysUntilDue} dias`, IMAGES.family)
  };
}

// Template 3: Aviso de Atraso (1 dia após vencimento)
export function invoiceOverdueTemplate(data: {
  agencyName: string;
  invoiceMonth: string;
  invoiceYear: number;
  totalValue: number;
  dueDate: string;
  daysOverdue: number;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 20px 0;font-size:24px;color:${TRIDOTS_BLUE};font-weight:600;">
      Atenção: Fatura em atraso! ⚠️
    </h1>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Olá, <strong>${data.agencyName}</strong>!
    </p>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Sua fatura encontra-se em atraso. Para evitar bloqueios na plataforma, regularize o pagamento imediatamente.
    </p>
    
    <div style="background-color:#fee2e2;border:2px solid #dc2626;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 15px 0;font-size:16px;color:#991b1b;">Dados da Fatura</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Período:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.invoiceMonth}/${data.invoiceYear}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Valor Total:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;font-size:18px;color:#dc2626;">R$ ${(data.totalValue / 100).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Data de Vencimento:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.dueDate}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Dias em atraso:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;font-size:18px;color:#dc2626;">${data.daysOverdue} dias</td>
        </tr>
      </table>
    </div>
    
    <p style="margin:20px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      <strong>⚠️ Aviso importante:</strong> Se o pagamento não for realizado em breve, sua conta pode ser bloqueada, 
      impedindo a criação de novas análises e solicitações de garantia.
    </p>
  `;

  return {
    subject: `⚠️ ${data.agencyName}, fatura em atraso - ação necessária - Tridots Capital`,
    html: generateEmailWrapper(content, `Fatura em atraso - ação necessária`, IMAGES.keys)
  };
}

// Template 4: Alerta Pré-Bloqueio (48 horas antes do bloqueio)
export function preBlockingAlertTemplate(data: {
  agencyName: string;
  hoursUntilBlock: number;
  totalOverdueValue: number;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 20px 0;font-size:24px;color:${TRIDOTS_BLUE};font-weight:600;">
      Urgente: Seu acesso será bloqueado em breve! 🔒
    </h1>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Olá, <strong>${data.agencyName}</strong>!
    </p>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Sua conta será bloqueada em <strong>${data.hoursUntilBlock} horas</strong> por falta de pagamento. 
      Este é seu último aviso antes do bloqueio automático!
    </p>
    
    <div style="background-color:#fecaca;border:3px solid #dc2626;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 15px 0;font-size:16px;color:#7f1d1d;">Situação Crítica</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Valor em atraso:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;font-size:18px;color:#dc2626;">R$ ${(data.totalOverdueValue / 100).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Tempo para bloqueio:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;font-size:18px;color:#dc2626;">${data.hoursUntilBlock}h</td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin:30px 0;">
      <p style="margin:0 0 15px 0;font-weight:600;color:#374151;">Regularize o pagamento agora mesmo!</p>
      <p style="margin:0;color:#6b7280;font-size:14px;">Após o bloqueio, você não poderá criar novas análises ou solicitações.</p>
    </div>
    
    <p style="margin:20px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      Acesse o portal imediatamente para efetuar o pagamento e evitar interrupção dos serviços.
    </p>
  `;

  return {
    subject: `🔒 ${data.agencyName}, bloqueio iminente - regularize a situação agora - Tridots Capital`,
    html: generateEmailWrapper(content, `Bloqueio iminente - ação imediata necessária`, IMAGES.keys)
  };
}

// Template 5: Confirmação de Bloqueio
export function blockingConfirmationTemplate(data: {
  agencyName: string;
  blockedDate: string;
  totalOverdueValue: number;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 20px 0;font-size:24px;color:${TRIDOTS_BLUE};font-weight:600;">
      Conta Bloqueada 🔒
    </h1>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Olá, <strong>${data.agencyName}</strong>!
    </p>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Sua conta foi bloqueada por falta de pagamento. Você não conseguirá criar novas análises ou solicitações de garantia 
      até que a situação seja regularizada.
    </p>
    
    <div style="background-color:#fee2e2;border:2px solid #dc2626;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 15px 0;font-size:16px;color:#991b1b;">Informações do Bloqueio</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Data do bloqueio:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.blockedDate}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Valor em atraso:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;font-size:18px;color:#dc2626;">R$ ${(data.totalOverdueValue / 100).toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <div style="background-color:#f3f4f6;border-left:4px solid #6b7280;padding:20px;margin:20px 0;">
      <h4 style="margin:0 0 10px 0;color:#374151;">Como desbloquear sua conta:</h4>
      <ol style="margin:0;padding-left:20px;color:#6b7280;font-size:14px;">
        <li style="margin:5px 0;">Acesse o portal de faturas</li>
        <li style="margin:5px 0;">Regularize todo o valor em atraso</li>
        <li style="margin:5px 0;">A conta será desbloqueada automaticamente dentro de 1 hora</li>
      </ol>
    </div>
    
    <p style="margin:20px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      Para dúvidas ou assistência, entre em contato conosco pelo portal de suporte.
    </p>
  `;

  return {
    subject: `🔒 ${data.agencyName}, conta bloqueada - Tridots Capital`,
    html: generateEmailWrapper(content, `Sua conta foi bloqueada por falta de pagamento`, IMAGES.keys)
  };
}

// Template 6: Boleto Disponível (Imobiliária)
export function boletoUploadedTemplate(data: {
  agencyName: string;
  invoiceMonth: string;
  invoiceYear: number;
  totalValue: number;
  dueDate: string;
  boletoUrl: string;
  observations?: string;
}): { subject: string; html: string } {
  const observationsSection = data.observations ? `
    <div style="background-color:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:#0c4a6e;">📋 Observações</p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap;">${data.observations}</p>
    </div>
  ` : '';

  const content = `
    <h1 style="margin:0 0 20px 0;font-size:24px;color:${TRIDOTS_BLUE};font-weight:600;">
      Boleto disponível! 📄
    </h1>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Olá, <strong>${data.agencyName}</strong>!
    </p>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      O boleto da sua fatura de garantias está disponível para download.
    </p>
    
    <div style="background-color:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 15px 0;font-size:16px;color:#166534;">Dados da Fatura</h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Período:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.invoiceMonth}/${data.invoiceYear}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Valor Total:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;font-size:18px;">R$ ${data.totalValue.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-size:14px;">Vencimento:</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-weight:500;">${data.dueDate}</td>
        </tr>
      </table>
    </div>

    ${observationsSection}

    <div style="text-align:center;margin:30px 0;">
      <a href="${data.boletoUrl}" style="display:inline-block;background-color:${TRIDOTS_ACCENT};color:#ffffff;font-size:16px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">
        Baixar Boleto
      </a>
    </div>
    
    <p style="margin:20px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      Você também pode acessar o boleto pelo portal da imobiliária, na tela de detalhes da fatura.
    </p>
    <p style="margin:10px 0 0 0;font-size:12px;color:#9ca3af;">
      ⏰ O link de download é válido por 24 horas.
    </p>
  `;

  return {
    subject: `Boleto disponível - Fatura ${data.invoiceMonth}/${data.invoiceYear} - Tridots Capital`,
    html: generateEmailWrapper(content, `Boleto da fatura ${data.invoiceMonth}/${data.invoiceYear} disponível para download`, IMAGES.office)
  };
}
