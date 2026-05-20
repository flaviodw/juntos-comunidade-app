import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_PASS;

    if (!user || !pass) {
      throw new Error('Configuração de e-mail ausente. Certifique-se de configurar GMAIL_USER e GMAIL_PASS no menu Settings.');
    }

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass,
      },
    });
  }
  return transporter;
}

export async function POST(req: Request) {
  try {
    const { to, subject, data } = await req.json();

    // Sanitização básica para prevenir XSS
    const sanitize = (str: string) => str?.replace(/<[^>]*>?/gm, '') || '';
    const cleanSolicitacao = sanitize(data.solicitacao);
    const cleanEmail = sanitize(data.email);
    const cleanTelefone = sanitize(data.telefone);
    const cleanWhatsapp = sanitize(data.whatsapp);
    const cleanEndereco = sanitize(data.endereco);

    const user = process.env.GMAIL_USER;
    if (!user || !process.env.GMAIL_PASS) {
      return NextResponse.json(
        { error: 'Configuração incompleta: Defina GMAIL_USER e GMAIL_PASS nas configurações do projeto.' },
        { status: 500 }
      );
    }

    const mailData: any = {
      from: `"Comunidade" <${user}>`,
      to: to,
      subject: subject || 'Nova Solicitação de Contato',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #334155;">
          <h2 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Nova Mensagem da Comunidade</h2>
          
          <div style="margin-top: 20px; background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p><strong>Solicitação:</strong></p>
            <p style="font-style: italic; color: #475569;">"${cleanSolicitacao}"</p>
          </div>

          <div style="margin-top: 20px;">
            <p><strong>Dados do Solicitante:</strong></p>
            <ul style="list-style: none; padding: 0;">
              <li><strong>E-mail:</strong> ${cleanEmail || 'Não informado'}</li>
              <li><strong>Telefone:</strong> ${cleanTelefone || 'Não informado'}</li>
              <li><strong>WhatsApp:</strong> ${cleanWhatsapp || 'Não informado'}</li>
              <li><strong>Endereço:</strong> ${cleanEndereco || 'Não informado'}</li>
            </ul>
          </div>
          
          ${data.photo ? `
          <div style="margin-top: 20px; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; text-align: center;">
            <p style="font-size: 11px; color: #64748b; margin-bottom: 10px;">Uma imagem foi anexada a esta solicitação.</p>
            <img src="${data.photo}" style="max-width: 100%; border-radius: 4px;" alt="Anexo do solicitante" />
          </div>
          ` : ''}

          <p style="margin-top: 30px; font-size: 12px; color: #94a3b8;">
            Esta é uma mensagem automática enviada pelo sistema da comunidade via Gmail.
          </p>
        </div>
      `,
      attachments: data.photo ? [
        {
          filename: 'anexo-solicitacao.jpg',
          path: data.photo
        }
      ] : []
    };

    const mailer = getTransporter();
    
    // Verificar conexão antes de enviar
    try {
        await mailer.verify();
    } catch (verifyError) {
        console.error("Falha na autenticação do Gmail:", verifyError);
        return NextResponse.json(
            { error: 'O servidor de e-mail está temporariamente indisponível. Por favor, verifique as credenciais GMAIL_USER e GMAIL_PASS.' },
            { status: 503 }
        );
    }

    await mailer.sendMail(mailData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao enviar e-mail via Gmail:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
