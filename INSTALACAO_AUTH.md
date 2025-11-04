# Instalação e Configuração da Autenticação

Sistema de autenticação com session/cookies para proteger as landing pages.

## 🔧 O que foi implementado

- Sistema de login com email/senha
- Proteção de todas as rotas `/lp/*` com autenticação
- Sessions com cookies (httpOnly e secure em produção)
- Página de login responsiva
- Logout funcional
- Usuários armazenados no Supabase com senha hash (bcrypt)

---

## 📋 Passos para configurar

### 1. Criar tabela de usuários no Supabase

Acesse o **SQL Editor** do Supabase e execute o arquivo:

```bash
CREATE_USERS_TABLE.sql
```

Este comando cria a tabela `users` com os seguintes campos:
- `id` (UUID)
- `email` (único)
- `password_hash` (bcrypt)
- `nome`
- `ativo` (boolean)
- `created_at`, `updated_at`

### 2. Inserir seu primeiro usuário

Execute o arquivo SQL:

```bash
INSERT_FIRST_USER.sql
```

**IMPORTANTE:** Antes de executar, edite o arquivo e altere:
- Email (linha 10)
- Nome (linha 12)

A senha padrão é: `senha123`

Se quiser usar outra senha, gere um hash bcrypt em: https://bcrypt-generator.com/

### 3. Adicionar SESSION_SECRET ao .env

Edite seu arquivo `.env` e adicione:

```env
SESSION_SECRET=seu-secret-aqui-gere-um-aleatorio
```

Gere um secret seguro em: https://randomkeygen.com/

### 4. Verificar que as dependências foram instaladas

As seguintes dependências já foram instaladas:
- `express-session` - gerenciamento de sessions
- `cookie-parser` - parser de cookies
- `bcrypt` - hash de senhas

Se precisar reinstalar:

```bash
npm install
```

---

## 🚀 Como usar

### Iniciar o servidor

```bash
npm start
# ou
npm run dev
```

### Testar o login

1. Acesse: `http://localhost:3000`
2. Clique em "Ir para login"
3. Entre com:
   - **Email:** o que você configurou no SQL
   - **Senha:** `senha123` (ou a que você gerou)

### Acessar landing pages

Após o login, acesse: `http://localhost:3000/lp/seu-slug`

Se não estiver logado, será redirecionado para `/login`

### Fazer logout

Clique no botão "Sair" no canto superior direito da home ou acesse: `http://localhost:3000/logout`

---

## 🔐 Como funciona a autenticação

### Flow do Cookie/Session:

1. **Login:** Usuário envia email/senha → Servidor valida no Supabase
2. **Session criada:** Servidor cria session na memória com `userId`
3. **Cookie enviado:** Navegador recebe cookie com ID da session (`sid`)
4. **Requisições protegidas:** Toda chamada a `/lp/*` verifica se tem session válida
5. **Logout:** Destroi a session do servidor e redireciona para login

### Middleware de autenticação:

```javascript
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next(); // Logado, pode prosseguir
  }
  res.redirect('/login'); // Não logado, vai pro login
}
```

Aplicado em: `app.get('/lp/:slug', requireAuth, async (req, res) => { ... })`

---

## 👥 Como adicionar novos usuários

### Opção 1: Via SQL no Supabase (recomendado)

Gere um hash da senha em: https://bcrypt-generator.com/

Execute no SQL Editor:

```sql
INSERT INTO users (email, password_hash, nome, ativo)
VALUES (
  'novo-usuario@exemplo.com',
  '$2b$10$hash-gerado-aqui',
  'Nome do Usuário',
  true
);
```

### Opção 2: Via TableEditor do Supabase

1. Acesse a tabela `users`
2. Clique em "Insert row"
3. Preencha:
   - Email
   - Password_hash (cole o hash bcrypt)
   - Nome
   - Ativo (marque true)

---

## 🔒 Segurança

- ✅ Senhas nunca são armazenadas em texto plano (bcrypt)
- ✅ Cookies são `httpOnly` (não acessíveis via JavaScript)
- ✅ Cookies são `secure` em produção (apenas HTTPS)
- ✅ Session expira em 24 horas
- ✅ Middleware protege todas as rotas de landing pages

---

## ⚙️ Configurações avançadas

### Alterar tempo de expiração da session

Edite [server.js:39](server.js#L39):

```javascript
maxAge: 24 * 60 * 60 * 1000 // 24 horas (em millisegundos)
```

### Desabilitar proteção (temporariamente)

Remova o middleware `requireAuth` da rota:

```javascript
// Antes:
app.get('/lp/:slug', requireAuth, async (req, res) => { ... })

// Depois:
app.get('/lp/:slug', async (req, res) => { ... })
```

---

## ❓ Troubleshooting

### "Email ou senha inválidos"

- Verifique se o usuário está na tabela `users` no Supabase
- Confirme que o campo `ativo` está como `true`
- Teste o hash da senha em: https://bcrypt-generator.com/ (compare)

### Cookie não persiste após reload

- Verifique se `SESSION_SECRET` está configurado no `.env`
- Em produção, use HTTPS (ou configure `secure: false` temporariamente)

### Redirecionamento infinito para /login

- Verifique se a session está sendo criada corretamente
- Confira os logs do servidor para erros

---

## 📝 Estrutura do código

- **[server.js:47-55](server.js#L47-L55)** - Middleware de autenticação `requireAuth`
- **[server.js:93-252](server.js#L93-L252)** - Rota GET `/login` (página)
- **[server.js:254-312](server.js#L254-L312)** - Rota POST `/login` (validação)
- **[server.js:314-322](server.js#L314-L322)** - Rota `/logout`
- **[server.js:357](server.js#L357)** - Proteção da rota `/lp/:slug`

---

## 🎉 Pronto!

Seu sistema agora tem autenticação funcionando. Todas as landing pages estão protegidas por login.
