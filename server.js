require('dotenv').config();
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(compression()); // Compressão gzip
app.use(cors()); // CORS
app.use(helmet({
  contentSecurityPolicy: false, // Desabilita CSP para permitir HTML customizado
  crossOriginEmbedderPolicy: false
}));
app.use(express.json()); // Parse JSON
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(cookieParser());

// Configuração de session
app.use(session({
  secret: process.env.SESSION_SECRET || 'seu-secret-super-seguro-aqui-mude-isso',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Cache em memória (simples)
const cache = new Map();
const CACHE_DURATION = parseInt(process.env.CACHE_DURATION) || 300; // 5 minutos padrão

// Middleware de autenticação
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }

  // Redireciona para login
  res.redirect('/login');
}

// Função para buscar landing page do Supabase
async function getLandingPage(slug) {
  // Verifica cache primeiro
  const cached = cache.get(slug);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION * 1000) {
    console.log(`[CACHE HIT] ${slug}`);
    return cached.data;
  }

  // Busca do Supabase
  console.log(`[SUPABASE] Buscando ${slug}...`);
  const { data, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('url_slug', slug)
    .eq('ativo', true)
    .single();

  if (error) {
    console.error('[SUPABASE ERROR]', error);
    return null;
  }

  // Armazena no cache
  cache.set(slug, {
    data,
    timestamp: Date.now()
  });

  return data;
}

// ============================================
// ROTAS DE AUTENTICAÇÃO
// ============================================

// Rota GET /login - Página de login
app.get('/login', (req, res) => {
  // Se já está logado, redireciona para home
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login - Landing Pages</title>
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
        .login-container {
          background: white;
          padding: 50px 40px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 400px;
          width: 100%;
        }
        h1 {
          color: #667eea;
          font-size: 2em;
          margin-bottom: 10px;
          text-align: center;
        }
        .subtitle {
          color: #999;
          text-align: center;
          margin-bottom: 30px;
          font-size: 0.9em;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          color: #555;
          margin-bottom: 8px;
          font-weight: 500;
        }
        input {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1em;
          transition: border-color 0.3s;
        }
        input:focus {
          outline: none;
          border-color: #667eea;
        }
        button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1em;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }
        button:active {
          transform: translateY(0);
        }
        .error {
          background: #fee;
          color: #c33;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
          font-size: 0.9em;
          display: none;
        }
        .error.show {
          display: block;
        }
      </style>
    </head>
    <body>
      <div class="login-container">
        <h1>🔐 Login</h1>
        <p class="subtitle">Landing Pages Server</p>

        <div class="error" id="error-message"></div>

        <form id="login-form" method="POST" action="/login">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required autofocus>
          </div>

          <div class="form-group">
            <label for="password">Senha</label>
            <input type="password" id="password" name="password" required>
          </div>

          <button type="submit">Entrar</button>
        </form>
      </div>

      <script>
        const form = document.getElementById('login-form');
        const errorDiv = document.getElementById('error-message');

        form.addEventListener('submit', async (e) => {
          e.preventDefault();

          const formData = new FormData(form);
          const data = {
            email: formData.get('email'),
            password: formData.get('password')
          };

          try {
            const response = await fetch('/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
              window.location.href = '/';
            } else {
              errorDiv.textContent = result.message || 'Erro ao fazer login';
              errorDiv.classList.add('show');
            }
          } catch (error) {
            errorDiv.textContent = 'Erro ao conectar com o servidor';
            errorDiv.classList.add('show');
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Rota POST /login - Validar credenciais
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email e senha são obrigatórios'
    });
  }

  try {
    // Busca usuário no Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('ativo', true)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    // Valida senha com bcrypt
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    // Cria session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = user.nome;

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        email: user.email,
        nome: user.nome
      }
    });

  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer login'
    });
  }
});

// Rota /logout - Deslogar usuário
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('[LOGOUT ERROR]', err);
    }
    res.redirect('/login');
  });
});

// ============================================
// ROTAS DO SISTEMA
// ============================================

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cache_size: cache.size
  });
});

// Rota para limpar cache (útil para desenvolvimento)
app.get('/admin/clear-cache', (req, res) => {
  cache.clear();
  res.json({ 
    message: 'Cache limpo com sucesso',
    timestamp: new Date().toISOString()
  });
});

// Rota para limpar cache de uma página específica
app.get('/admin/clear-cache/:slug', (req, res) => {
  const { slug } = req.params;
  const deleted = cache.delete(slug);
  res.json({ 
    message: deleted ? `Cache de "${slug}" limpo` : `"${slug}" não estava em cache`,
    timestamp: new Date().toISOString()
  });
});

// Rota dinâmica para landing pages (protegida com autenticação)
app.get('/lp/:slug', requireAuth, async (req, res) => {
  const { slug } = req.params;
  
  try {
    const landingPage = await getLandingPage(slug);
    
    if (!landingPage) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Página não encontrada</title>
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
              color: white;
              text-align: center;
            }
            h1 { font-size: 3em; margin-bottom: 20px; }
            p { font-size: 1.2em; opacity: 0.9; }
            .code { 
              background: rgba(255,255,255,0.1); 
              padding: 10px 20px; 
              border-radius: 8px; 
              display: inline-block;
              margin-top: 20px;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div>
            <h1>404</h1>
            <p>Landing page não encontrada</p>
            <div class="code">/lp/${slug}</div>
          </div>
        </body>
        </html>
      `);
    }

    // Define meta tags se disponíveis
    if (landingPage.meta_title) {
      res.setHeader('X-Meta-Title', landingPage.meta_title);
    }

    // Retorna o HTML da landing page
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(landingPage.html_content);
    
  } catch (error) {
    console.error('[ERROR]', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Erro no servidor</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f44336;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: white;
            text-align: center;
          }
          h1 { font-size: 3em; margin-bottom: 20px; }
          p { font-size: 1.2em; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div>
          <h1>⚠️ Erro no servidor</h1>
          <p>Ocorreu um erro ao carregar a landing page</p>
        </div>
      </body>
      </html>
    `);
  }
});

// Rota raiz (opcional)
app.get('/', (req, res) => {
  const isLoggedIn = req.session && req.session.userId;
  const userName = req.session?.userName || 'Usuário';

  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Landing Pages Server</title>
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
          position: relative;
        }
        .user-info {
          position: absolute;
          top: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.9em;
          color: #666;
        }
        .logout-btn {
          background: #f44336;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 0.85em;
          transition: background 0.3s;
        }
        .logout-btn:hover {
          background: #d32f2f;
        }
        h1 {
          color: #667eea;
          font-size: 2.5em;
          margin-bottom: 20px;
        }
        p {
          color: #555;
          font-size: 1.1em;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        .code {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          color: #667eea;
          margin: 20px 0;
        }
        .info {
          color: #999;
          font-size: 0.9em;
          margin-top: 30px;
        }
        .status {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85em;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .status.logged-in {
          background: #e8f5e9;
          color: #2e7d32;
        }
        .status.logged-out {
          background: #ffebee;
          color: #c62828;
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${isLoggedIn ? `
          <div class="user-info">
            <span>👤 ${userName}</span>
            <a href="/logout" class="logout-btn">Sair</a>
          </div>
          <div class="status logged-in">✓ Autenticado</div>
        ` : `
          <div class="status logged-out">✗ Não autenticado</div>
        `}

        <h1>🚀 Landing Pages Server</h1>
        <p>Servidor rodando com sucesso!</p>

        ${isLoggedIn ? `
          <p>Para acessar uma landing page, use:</p>
          <div class="code">/lp/seu-slug-aqui</div>
          <p class="info">Exemplo: <a href="/lp/exemplo">/lp/exemplo</a></p>
        ` : `
          <p>Faça login para acessar as landing pages</p>
          <p><a href="/login">Ir para login</a></p>
        `}
      </div>
    </body>
    </html>
  `);
});

// Tratamento de rotas não encontradas
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Rota não encontrada</title>
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
          color: white;
          text-align: center;
        }
        h1 { font-size: 3em; margin-bottom: 20px; }
        p { font-size: 1.2em; opacity: 0.9; }
      </style>
    </head>
    <body>
      <div>
        <h1>404</h1>
        <p>Rota não encontrada</p>
        <p style="margin-top: 20px; font-size: 0.9em;">Use /lp/seu-slug para acessar landing pages</p>
      </div>
    </body>
    </html>
  `);
});

// Inicializa o servidor
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║  🚀 Landing Pages Server                 ║
║                                          ║
║  Servidor rodando em:                    ║
║  http://localhost:${PORT}                   ║
║                                          ║
║  Rotas disponíveis:                      ║
║  • /lp/:slug - Landing pages dinâmicas   ║
║  • /health - Status do servidor          ║
║  • /admin/clear-cache - Limpar cache     ║
║                                          ║
║  Cache: ${CACHE_DURATION}s                           ║
╚══════════════════════════════════════════╝
  `);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
