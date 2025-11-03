-- Schema para Landing Pages com HTML completo
-- Execute isso no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_slug TEXT UNIQUE NOT NULL,
  
  -- HTML completo da página
  html_content TEXT NOT NULL,
  
  -- Metadados (opcional, para SEO)
  meta_title TEXT,
  meta_description TEXT,
  meta_image TEXT,
  
  -- Controle
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por slug
CREATE INDEX idx_landing_pages_slug ON landing_pages(url_slug);

-- Índice para páginas ativas
CREATE INDEX idx_landing_pages_ativo ON landing_pages(ativo);

-- Políticas de segurança (RLS)
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

-- Permite leitura pública apenas de páginas ativas
CREATE POLICY "Permitir leitura pública de páginas ativas"
ON landing_pages FOR SELECT
USING (ativo = true);

-- Se você quiser permitir inserção/edição via API (autenticado)
-- Descomente as linhas abaixo e ajuste conforme necessário:
-- CREATE POLICY "Permitir insert para usuários autenticados"
-- ON landing_pages FOR INSERT
-- WITH CHECK (auth.role() = 'authenticated');

-- CREATE POLICY "Permitir update para usuários autenticados"
-- ON landing_pages FOR UPDATE
-- USING (auth.role() = 'authenticated');

-- Exemplo de insert para testar
INSERT INTO landing_pages (url_slug, html_content, meta_title, meta_description) 
VALUES (
  'exemplo',
  '<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Página de Exemplo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
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
      font-size: 1.2em;
      margin-bottom: 30px;
    }
    .cta-button {
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
    .cta-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Sua Landing Page</h1>
    <p>Este é um exemplo de landing page armazenada no Supabase. Edite o HTML diretamente no banco de dados!</p>
    <a href="#" class="cta-button">Clique Aqui</a>
  </div>
</body>
</html>',
  'Página de Exemplo - Landing Page',
  'Exemplo de landing page dinâmica com Supabase'
);
