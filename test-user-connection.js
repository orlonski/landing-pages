// Script para testar se consegue conectar no Supabase e buscar usuários
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

console.log('\n🔍 Testando conexão com Supabase...\n');

async function testConnection() {
  try {
    // Tenta buscar todos os usuários
    const { data, error, count } = await supabase
      .from('users')
      .select('id, email, nome, ativo, created_at', { count: 'exact' });

    if (error) {
      console.error('❌ Erro ao buscar usuários:', error.message);
      console.log('\n📋 Possíveis soluções:\n');
      console.log('1. Execute o arquivo CREATE_USERS_TABLE.sql no Supabase SQL Editor');
      console.log('2. Verifique se as credenciais do .env estão corretas');
      console.log('3. Verifique se a tabela "users" existe no Supabase\n');
      return;
    }

    console.log('✅ Conexão com Supabase funcionando!\n');
    console.log('─'.repeat(70));
    console.log(`Total de usuários cadastrados: ${data.length}\n`);

    if (data.length === 0) {
      console.log('⚠️  Nenhum usuário encontrado na tabela "users"\n');
      console.log('📋 Para cadastrar o primeiro usuário:\n');
      console.log('1. Gere um hash de senha:');
      console.log('   node generate-password-hash.js senha123\n');
      console.log('2. Execute o INSERT_FIRST_USER.sql no Supabase SQL Editor');
      console.log('   (não esqueça de alterar email, hash e nome)\n');
    } else {
      console.log('Usuários cadastrados:\n');
      data.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Nome: ${user.nome || '(não informado)'}`);
        console.log(`   Ativo: ${user.ativo ? '✓ Sim' : '✗ Não'}`);
        console.log(`   Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    }
    console.log('─'.repeat(70));
    console.log('\n✅ Teste concluído!\n');

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
}

testConnection();
