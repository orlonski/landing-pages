require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testando conexão com Supabase...\n');

// Verifica se as variáveis de ambiente estão carregadas
console.log('📋 Variáveis de ambiente:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Definida' : '❌ NÃO definida');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Definida' : '❌ NÃO definida');
console.log('');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.log('❌ ERRO: Variáveis de ambiente não configuradas!');
  console.log('');
  console.log('Por favor:');
  console.log('1. Crie um arquivo .env na raiz do projeto');
  console.log('2. Copie o conteúdo de .env.example');
  console.log('3. Preencha com suas credenciais do Supabase');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testConnection() {
  try {
    console.log('🔄 Testando query no banco de dados...\n');

    // Testa listagem de todas as páginas
    const { data: allPages, error: allError } = await supabase
      .from('landing_pages')
      .select('*');

    if (allError) {
      console.log('❌ ERRO ao buscar páginas:');
      console.log('Código:', allError.code);
      console.log('Mensagem:', allError.message);
      console.log('Detalhes:', allError.details);
      console.log('Hint:', allError.hint);
      console.log('');

      if (allError.code === '42P01') {
        console.log('💡 A tabela "landing_pages" não existe!');
        console.log('Execute o script schema.sql no Supabase SQL Editor');
      } else if (allError.code === 'PGRST116') {
        console.log('💡 Problema com Row Level Security (RLS)');
        console.log('Verifique as políticas de segurança no Supabase');
      }

      return;
    }

    console.log(`✅ Conectado! Total de páginas: ${allPages.length}\n`);

    if (allPages.length === 0) {
      console.log('⚠️  Nenhuma página encontrada no banco!');
      console.log('Execute o INSERT de exemplo no schema.sql');
      return;
    }

    console.log('📄 Páginas encontradas:');
    allPages.forEach(page => {
      console.log(`  • ${page.url_slug} (${page.ativo ? '✅ ativa' : '❌ inativa'})`);
      console.log(`    ID: ${page.id}`);
      console.log(`    Título: ${page.meta_title || 'sem título'}`);
      console.log('');
    });

    // Testa busca específica pela página "exemplo"
    console.log('🔍 Testando busca específica: /lp/exemplo\n');

    const { data: exemploPage, error: exemploError } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('url_slug', 'exemplo')
      .eq('ativo', true)
      .single();

    if (exemploError) {
      console.log('❌ ERRO ao buscar página "exemplo":');
      console.log('Código:', exemploError.code);
      console.log('Mensagem:', exemploError.message);
      console.log('');

      if (exemploError.code === 'PGRST116') {
        console.log('💡 A página existe mas não foi encontrada devido ao RLS');
        console.log('Verifique se a política de segurança permite leitura pública');
      }
    } else if (!exemploPage) {
      console.log('❌ Página "exemplo" não encontrada ou está inativa');
      console.log('');
      console.log('Verifique se:');
      console.log('1. O INSERT foi executado corretamente');
      console.log('2. O campo "ativo" está como true');
      console.log('3. O "url_slug" está como "exemplo" (sem /lp/)');
    } else {
      console.log('✅ Página "exemplo" encontrada!');
      console.log('ID:', exemploPage.id);
      console.log('Slug:', exemploPage.url_slug);
      console.log('Ativa:', exemploPage.ativo);
      console.log('Título:', exemploPage.meta_title);
      console.log('Tamanho do HTML:', exemploPage.html_content.length, 'caracteres');
      console.log('');
      console.log('🎉 Tudo certo! A rota /lp/exemplo deveria funcionar.');
    }

  } catch (error) {
    console.log('❌ ERRO inesperado:');
    console.log(error);
  }
}

testConnection();
