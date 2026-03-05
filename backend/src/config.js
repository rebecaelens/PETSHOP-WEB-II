const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const toAbsPath = (p) => {
  if (path.isAbsolute(p)) return p;
  return path.join(process.cwd(), p);
};

module.exports = {
  port: Number(process.env.PORT || 3333),
  nodeEnv: process.env.NODE_ENV || 'development',
  dbFile: toAbsPath(process.env.DB_FILE || './data/petshop.sqlite'),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  email: {
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: Number(process.env.SMTP_PORT || 587),
    smtpSecure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    fromEmail: process.env.SMTP_FROM || 'no-reply@petshop.local',
    signupCodeExpiresMinutes: Number(process.env.SIGNUP_CODE_EXPIRES_MINUTES || 10)
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d'
  }
};
