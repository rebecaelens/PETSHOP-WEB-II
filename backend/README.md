# PETSHOP Web II Backend

Backend completo em Node.js + Express + SQLite para autenticao, produtos, favoritos, carrinho e pedidos.

## 1. Instalar dependencias

```bash
cd backend
npm install
```

## 2. Configurar ambiente

```bash
cp .env.example .env
```

Preencha as variaveis SMTP no `.env` para envio real de codigo por e-mail:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## 3. Rodar

```bash
npm run dev
```

A API sobe em `http://localhost:3333`.

## Endpoints principais

- `POST /api/auth/request-signup-code`
- `POST /api/auth/verify-signup-code`
- `POST /api/auth/register-with-code`
- `POST /api/auth/register` (fluxo direto, sem codigo)
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/users/me`
- `PATCH /api/users/me/avatar`
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/favorites`
- `POST /api/favorites`
- `DELETE /api/favorites/:productId`
- `GET /api/cart`
- `POST /api/cart`
- `PATCH /api/cart/:itemId`
- `DELETE /api/cart/:itemId`
- `DELETE /api/cart`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:orderId`

## Header de autenticacao

Use no formato:

```text
Authorization: Bearer <accessToken>
```
