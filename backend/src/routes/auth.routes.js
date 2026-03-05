const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { getDb } = require('../db');
const { email } = require('../config');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { isEmailConfigured, sendSignupCodeEmail } = require('../utils/mailer');

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const emailSchema = z.object({
  email: z.string().email()
});

const verifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{5}$/)
});

const registerWithCodeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  code: z.string().regex(/^\d{5}$/),
  avatarUrl: z.string().min(1).optional()
});

const generateFiveDigitCode = () => String(Math.floor(10000 + Math.random() * 90000));

async function getActiveSignupCodeRows(db, emailValue) {
  return db.all(
    `SELECT *
     FROM signup_codes
     WHERE email = ? AND used_at IS NULL
     ORDER BY id DESC
     LIMIT 20`,
    emailValue.toLowerCase()
  );
}

function isExpired(expiresAt) {
  return Date.now() > new Date(expiresAt).getTime();
}

router.post('/request-signup-code', async (req, res, next) => {
  try {
    const { email: rawEmail } = emailSchema.parse(req.body);
    const emailValue = rawEmail.toLowerCase();
    const db = await getDb();

    const existing = await db.get('SELECT id FROM users WHERE email = ?', emailValue);
    if (existing) {
      return res.status(409).json({ message: 'Email ja cadastrado' });
    }

    if (!isEmailConfigured()) {
      return res.status(503).json({ message: 'Servico de email nao configurado no servidor' });
    }

    const code = generateFiveDigitCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + email.signupCodeExpiresMinutes * 60 * 1000).toISOString();

    await db.run(
      'INSERT INTO signup_codes (email, code_hash, expires_at) VALUES (?, ?, ?)',
      emailValue,
      codeHash,
      expiresAt
    );

    await sendSignupCodeEmail(emailValue, code);

    return res.status(201).json({
      message: 'Codigo enviado para seu email'
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/verify-signup-code', async (req, res, next) => {
  try {
    const payload = verifyCodeSchema.parse(req.body);
    const emailValue = payload.email.toLowerCase();
    const db = await getDb();

    const rows = await getActiveSignupCodeRows(db, emailValue);
    if (!rows.length) {
      return res.status(400).json({ message: 'Nenhum codigo ativo para este email' });
    }

    let matchedRow = null;
    let hasNonExpiredRow = false;

    for (const row of rows) {
      if (!isExpired(row.expires_at)) {
        hasNonExpiredRow = true;
        const ok = await bcrypt.compare(payload.code, row.code_hash);
        if (ok) {
          matchedRow = row;
          break;
        }
      }
    }

    if (!matchedRow) {
      return res
        .status(400)
        .json({ message: hasNonExpiredRow ? 'Codigo invalido' : 'Codigo expirado. Solicite um novo.' });
    }

    await db.run('UPDATE signup_codes SET verified_at = datetime(\'now\') WHERE id = ?', matchedRow.id);
    return res.json({ message: 'Codigo validado' });
  } catch (err) {
    return next(err);
  }
});

router.post('/register-with-code', async (req, res, next) => {
  try {
    const payload = registerWithCodeSchema.parse(req.body);
    const emailValue = payload.email.toLowerCase();
    const db = await getDb();

    const existing = await db.get('SELECT id FROM users WHERE email = ?', emailValue);
    if (existing) {
      return res.status(409).json({ message: 'Email ja cadastrado' });
    }

    const rows = await db.all(
      `SELECT *
       FROM signup_codes
       WHERE email = ? AND used_at IS NULL AND verified_at IS NOT NULL
       ORDER BY id DESC
       LIMIT 20`,
      emailValue
    );

    if (!rows.length) {
      return res.status(400).json({ message: 'Nenhum codigo ativo para este email' });
    }

    let matchedRow = null;
    let hasNonExpiredRow = false;

    for (const row of rows) {
      if (!isExpired(row.expires_at)) {
        hasNonExpiredRow = true;
        const ok = await bcrypt.compare(payload.code, row.code_hash);
        if (ok) {
          matchedRow = row;
          break;
        }
      }
    }

    if (!matchedRow) {
      return res
        .status(400)
        .json({ message: hasNonExpiredRow ? 'Codigo invalido' : 'Codigo expirado. Solicite um novo.' });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const result = await db.run(
      'INSERT INTO users (name, email, password_hash, avatar_url) VALUES (?, ?, ?, ?)',
      payload.name,
      emailValue,
      passwordHash,
      payload.avatarUrl || null
    );

    await db.run('UPDATE signup_codes SET used_at = datetime(\'now\') WHERE id = ?', matchedRow.id);

    const user = {
      id: result.lastID,
      name: payload.name,
      email: emailValue,
      avatarUrl: payload.avatarUrl || null
    };
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    return next(err);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const db = await getDb();

    const existing = await db.get('SELECT id FROM users WHERE email = ?', payload.email.toLowerCase());
    if (existing) {
      return res.status(409).json({ message: 'Email ja cadastrado' });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const result = await db.run(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      payload.name,
      payload.email.toLowerCase(),
      passwordHash
    );

    const user = { id: result.lastID, name: payload.name, email: payload.email.toLowerCase() };
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    return next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const db = await getDb();

    const user = await db.get('SELECT * FROM users WHERE email = ?', payload.email.toLowerCase());
    if (!user) {
      return res.status(401).json({ message: 'Credenciais invalidas' });
    }

    const ok = await bcrypt.compare(payload.password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'Credenciais invalidas' });
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatar_url || null };
    const accessToken = signAccessToken(safeUser);
    const refreshToken = signRefreshToken(safeUser);

    return res.json({ user: safeUser, accessToken, refreshToken });
  } catch (err) {
    return next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const schema = z.object({ refreshToken: z.string().min(1) });
    const { refreshToken } = schema.parse(req.body);

    const payload = verifyRefreshToken(refreshToken);
    const db = await getDb();
    const user = await db.get('SELECT id, name, email, avatar_url FROM users WHERE id = ?', Number(payload.sub));

    if (!user) {
      return res.status(401).json({ message: 'Usuario nao encontrado' });
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatar_url || null };
    const accessToken = signAccessToken(safeUser);
    const nextRefreshToken = signRefreshToken(safeUser);

    return res.json({ accessToken, refreshToken: nextRefreshToken, user: safeUser });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
