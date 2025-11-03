# 🚀 Landing Pages Dinâmicas com Supabase

Sistema completo para criar e servir landing pages dinâmicas armazenando o HTML completo no Supabase.

## 📋 Características

- ✅ HTML completo armazenado no Supabase
- ✅ Roteamento dinâmico (`/lp/seu-slug`)
- ✅ Cache inteligente em memória
- ✅ Sem necessidade de deploy para cada nova página
- ✅ Compressão gzip automática
- ✅ Headers de segurança (Helmet)
- ✅ Health check endpoint
- ✅ Páginas 404 customizadas

## 🛠️ Instalação

### 1. Clone ou copie os arquivos para seu servidor

```bash
# Crie o diretório
mkdir landing-pages
cd landing-pages

# Copie todos os arquivos do projeto para este diretório
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Supabase

#### 3.1. Execute o SQL no Supabase

1. Acesse seu projeto no [Supabase](https://supabase.com)
2. Vá em **SQL Editor**
3. Cole e execute o conteúdo do arquivo `schema.sql`

#### 3.2. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com seus dados
nano .env
```

Preencha com suas credenciais do Supabase:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-publica-aqui
PORT=3000
NODE_ENV=production
CACHE_DURATION=300
```

**Onde encontrar suas credenciais:**
- Supabase Dashboard → Settings → API
- `URL` = Project URL
- `anon/public` = anon key

## 🚀 Como usar

### Iniciando o servidor

```bash
# Modo produção
npm start

# Modo desenvolvimento (com auto-reload)
npm run dev
```

O servidor estará disponível em `http://localhost:3000`

### Criando uma Landing Page

#### 1. Via Supabase Dashboard (mais fácil)

1. Acesse seu projeto no Supabase
2. Vá em **Table Editor** → `landing_pages`
3. Clique em **Insert** → **Insert row**
4. Preencha os campos:
   - `url_slug`: nome-da-sua-landing (sem espaços, use hífens)
   - `html_content`: Cole todo o HTML da sua página
   - `meta_title`: Título da página (opcional)
   - `meta_description`: Descrição (opcional)
   - `ativo`: true

#### 2. Via SQL

```sql
INSERT INTO landing_pages (url_slug, html_content, meta_title, meta_description) 
VALUES (
  'promocao-black-friday',
  '<!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Black Friday - 70% OFF</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        background: #000;
        color: #fff;
        text-align: center;
        padding: 50px 20px;
      }
      h1 { font-size: 4em; color: #ff6b00; }
      .cta { 
        background: #ff6b00; 
        color: white; 
        padding: 20px 40px; 
        font-size: 1.5em;
        border: none;
        border-radius: 50px;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
        margin-top: 30px;
      }
    </style>
  </head>
  <body>
    <h1>🔥 BLACK FRIDAY 🔥</h1>
    <h2>70% de desconto em TUDO!</h2>
    <a href="#" class="cta">COMPRAR AGORA</a>
  </body>
  </html>',
  'Black Friday - 70% OFF',
  'Aproveite nossa mega promoção de Black Friday com até 70% de desconto!'
);
```

#### 3. Via API (POST request)

Se você habilitar as políticas de insert no Supabase, pode usar a API:

```javascript
// Exemplo com JavaScript
const { data, error } = await supabase
  .from('landing_pages')
  .insert({
    url_slug: 'minha-landing',
    html_content: '<html>...</html>',
    meta_title: 'Minha Landing Page',
    ativo: true
  });
```

### Acessando sua Landing Page

```
http://seuservidor.com/lp/seu-slug
```

Exemplos:
- `http://localhost:3000/lp/exemplo`
- `http://localhost:3000/lp/promocao-black-friday`

## 📡 Endpoints disponíveis

| Endpoint | Descrição |
|----------|-----------|
| `GET /` | Página inicial |
| `GET /lp/:slug` | Acessa uma landing page pelo slug |
| `GET /health` | Status do servidor + tamanho do cache |
| `GET /admin/clear-cache` | Limpa todo o cache |
| `GET /admin/clear-cache/:slug` | Limpa cache de uma página específica |

## 🎯 Fluxo de trabalho recomendado

1. **Crie o HTML da landing page** (pode usar qualquer editor, AI, templates, etc)
2. **Insira no Supabase** (via Dashboard ou SQL)
3. **Acesse via URL** (`/lp/seu-slug`)
4. **Se fizer alterações**, limpe o cache: `GET /admin/clear-cache/seu-slug`

## 💾 Cache

O sistema usa cache em memória para melhorar performance:
- Duração padrão: **5 minutos** (300s)
- Configurável via variável `CACHE_DURATION` no `.env`
- Cache é limpo automaticamente após o tempo definido
- Pode limpar manualmente via endpoints `/admin/clear-cache`

### Como funciona o cache:

```
1ª requisição → Busca no Supabase → Armazena em cache → Retorna HTML
2ª requisição → Busca no cache → Retorna HTML (muito mais rápido!)
Após 5 min → Cache expira → Próxima requisição busca do Supabase novamente
```

## 🔒 Segurança

- ✅ Helmet habilitado (headers de segurança)
- ✅ Compressão gzip
- ✅ CORS habilitado
- ✅ Row Level Security (RLS) no Supabase
- ⚠️ **IMPORTANTE**: Como você está salvando HTML completo, **nunca** permita que usuários não confiáveis insiram HTML diretamente (risco de XSS). Apenas admins devem criar landing pages.

## 🌐 Deploy em Produção

### Opção 1: VPS/Servidor próprio

```bash
# Instale PM2 (gerenciador de processos)
npm install -g pm2

# Inicie o servidor
pm2 start server.js --name landing-pages

# Configure para iniciar automaticamente
pm2 startup
pm2 save
```

### Opção 2: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Configure um reverse proxy (Nginx)

```nginx
server {
    listen 80;
    server_name seudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoramento

### Health Check

```bash
curl http://localhost:3000/health
```

Resposta:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "cache_size": 5
}
```

### Logs

```bash
# Se usando PM2
pm2 logs landing-pages

# Logs em tempo real
pm2 logs landing-pages --lines 100
```

## 🛠️ Troubleshooting

### Erro: "Landing page não encontrada"

- ✅ Verifique se o slug está correto
- ✅ Verifique se a página está marcada como `ativo: true` no Supabase
- ✅ Tente limpar o cache: `/admin/clear-cache`

### Erro de conexão com Supabase

- ✅ Verifique se as credenciais no `.env` estão corretas
- ✅ Verifique se as políticas RLS estão configuradas corretamente
- ✅ Teste a conexão manualmente no Supabase Dashboard

### Página não atualiza após edição

- ✅ Limpe o cache: `/admin/clear-cache/seu-slug`
- ✅ Ou aguarde o tempo de expiração do cache (padrão 5 min)

## 📝 Estrutura do Projeto

```
landing-pages/
├── server.js              # Servidor Express principal
├── package.json           # Dependências do projeto
├── .env                   # Configurações (não commitar!)
├── .env.example           # Exemplo de configurações
├── schema.sql             # Schema do banco Supabase
└── README.md              # Este arquivo
```

## 🎨 Exemplos de Templates HTML

### Template Minimalista

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Minha Landing Page</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      padding: 60px 40px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 600px;
      text-align: center;
    }
    h1 { color: #667eea; font-size: 2.5em; margin-bottom: 20px; }
    p { color: #555; font-size: 1.2em; margin-bottom: 30px; }
    .btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 40px;
      border: none;
      border-radius: 50px;
      font-size: 1.1em;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: transform 0.3s;
    }
    .btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Título Chamativo</h1>
    <p>Subtítulo explicativo que convence o usuário a agir agora!</p>
    <a href="#" class="btn">Comece Agora</a>
  </div>
</body>
</html>
```

## 🤝 Suporte

Se tiver problemas:
1. Verifique os logs: `pm2 logs` ou `npm run dev`
2. Teste o health check: `curl http://localhost:3000/health`
3. Verifique as credenciais do Supabase no `.env`

## 📄 Licença

MIT License - Use como quiser! 🎉
