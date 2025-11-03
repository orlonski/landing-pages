# 🚀 GUIA RÁPIDO - 5 Minutos para começar

## Passo 1: Configure o Supabase (2 minutos)

1. Acesse [supabase.com](https://supabase.com)
2. Vá em **SQL Editor**
3. Cole e execute o conteúdo de `schema.sql`
4. Vá em **Settings → API** e copie:
   - Project URL
   - anon/public key

## Passo 2: Configure o projeto (1 minuto)

```bash
# No seu servidor
cd landing-pages
npm install
cp .env.example .env
nano .env
```

Cole suas credenciais no `.env`:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3000
```

## Passo 3: Inicie o servidor (30 segundos)

```bash
npm start
```

Pronto! Acesse: `http://localhost:3000`

## Passo 4: Crie sua primeira Landing Page (1 minuto)

No Supabase:
1. **Table Editor** → `landing_pages`
2. **Insert row**
3. Preencha:
   - `url_slug`: minha-promo
   - `html_content`: Cole o HTML de `exemplo-avancado.html`
   - `ativo`: true
4. Salve

## Passo 5: Acesse!

Abra: `http://localhost:3000/lp/minha-promo` 🎉

---

## Comandos úteis

```bash
# Limpar cache
curl http://localhost:3000/admin/clear-cache

# Ver status
curl http://localhost:3000/health

# Modo desenvolvimento (auto-reload)
npm run dev
```

## Próximos passos

- Configure PM2 para produção (ver README.md)
- Configure Nginx como reverse proxy
- Adicione seu domínio
- Configure SSL/HTTPS

**Dúvidas?** Leia o `README.md` completo!
