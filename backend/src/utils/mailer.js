const nodemailer = require('nodemailer');
const { email } = require('../config');

const isEmailConfigured = () => Boolean(email.smtpHost && email.smtpUser && email.smtpPass);

let transporter = null;

function getTransporter() {
  if (!isEmailConfigured()) {
    throw new Error('Servico de email nao configurado (SMTP_HOST/SMTP_USER/SMTP_PASS)');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: email.smtpHost,
      port: email.smtpPort,
      secure: email.smtpSecure,
      auth: {
        user: email.smtpUser,
        pass: email.smtpPass
      }
    });
  }

  return transporter;
}

async function sendSignupCodeEmail(toEmail, code) {
  const transport = getTransporter();
  const expiresMinutes = email.signupCodeExpiresMinutes;

  await transport.sendMail({
    from: email.fromEmail,
    to: toEmail,
    subject: 'Codigo de verificacao - MR Racoes',
    text: `Seu codigo de verificacao e: ${code}. Ele expira em ${expiresMinutes} minutos.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #222;">
        <h2>MR Racoes - Verificacao de e-mail</h2>
        <p>Use o codigo abaixo para validar seu cadastro:</p>
        <p style="font-size: 28px; letter-spacing: 4px; font-weight: 700;">${code}</p>
        <p>Esse codigo expira em <strong>${expiresMinutes} minutos</strong>.</p>
      </div>
    `
  });
}

module.exports = {
  isEmailConfigured,
  sendSignupCodeEmail
};
