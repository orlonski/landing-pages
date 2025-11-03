require('dotenv').config();
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
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

// Cache em memória (simples)
const cache = new Map();
const CACHE_DURATION = parseInt(process.env.CACHE_DURATION) || 300; // 5 minutos padrão

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

// Rota dinâmica para landing pages
app.get('/lp/:slug', async (req, res) => {
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
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 Landing Pages Server</h1>
        <p>Servidor rodando com sucesso!</p>
        <p>Para acessar uma landing page, use:</p>
        <div class="code">/lp/seu-slug-aqui</div>
        <p class="info">Exemplo: <a href="/lp/exemplo">/lp/exemplo</a></p>
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
