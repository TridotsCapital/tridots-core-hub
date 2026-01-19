// Templates de e-mail com branding Tridots
// Cores institucionais: azul #1a1a2e, accent #4A90A4

const LOGO_URL = 'https://tridots-core-hub.lovable.app/logo-tridots-white.webp';
const TRIDOTS_BLUE = '#1a1a2e';
const TRIDOTS_ACCENT = '#4A90A4';

interface EmailTemplateData {
  recipientName?: string;
  [key: string]: unknown;
}

export function generateEmailWrapper(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tridots Garantias</title>
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
              <img src="${LOGO_URL}" alt="Tridots" style="height:40px;width:auto;" />
            </td>
          </tr>
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
                      <strong>Tridots Garantias</strong><br>
                      Sua locação protegida
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
    subject: 'Pagamento Confirmado - Tridots Garantias',
    html: generateEmailWrapper(content, 'Seu pagamento foi validado com sucesso!')
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
      Bem-vindo à Tridots! 🏠
    </h1>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Olá, <strong>${data.tenantName}</strong>!
    </p>
    <p style="margin:0 0 20px 0;font-size:16px;color:#374151;line-height:1.6;">
      Seu contrato de garantia locatícia foi ativado com sucesso! Você está protegido pela Tridots Garantias.
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
    subject: 'Contrato Ativado - Tridots Garantias',
    html: generateEmailWrapper(content, 'Seu contrato de garantia está ativo!')
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
      O contrato abaixo foi ativado com sucesso e está sob cobertura da Tridots Garantias.
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
    subject: `Contrato Ativado: ${data.tenantName}`,
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
    subject: 'Cadastro Aprovado - Tridots Garantias',
    html: generateEmailWrapper(content, 'Seu cadastro foi aprovado! Acesse o portal.')
  };
}

// Template: Nova Imobiliária Pendente (Tridots)
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
    subject: `Nova Imobiliária: ${data.agencyName}`,
    html: generateEmailWrapper(content, `Nova imobiliária cadastrada: ${data.agencyName}`)
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
    subject: `Comissões Pagas: ${data.weekStart} a ${data.weekEnd}`,
    html: generateEmailWrapper(content, `Relatório de comissões: ${data.commissions.length} pagamento(s) no valor de ${data.totalValue}`)
  };
}

// Função auxiliar para enviar e-mail via Resend
export async function sendEmail(
  resendApiKey: string,
  to: string,
  subject: string,
  html: string,
  testMode: boolean = false,
  testEmail: string = 'testes@tridots.com.br'
): Promise<{ success: boolean; messageId?: string; error?: string; originalRecipient?: string }> {
  const recipientEmail = testMode ? testEmail : to;
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Tridots Garantias <noreply@tridots.com.br>',
        to: recipientEmail,
        subject: testMode ? `[TESTE] ${subject}` : subject,
        html
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
