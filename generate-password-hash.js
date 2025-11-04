// Script para gerar hash de senha com bcrypt
// Uso: node generate-password-hash.js sua-senha-aqui

const bcrypt = require('bcrypt');

const senha = process.argv[2];

if (!senha) {
  console.error('\n❌ Por favor, forneça uma senha como argumento\n');
  console.log('Uso: node generate-password-hash.js sua-senha\n');
  console.log('Exemplo: node generate-password-hash.js minhaSenha123\n');
  process.exit(1);
}

console.log('\n🔐 Gerando hash bcrypt...\n');

bcrypt.hash(senha, 10, (err, hash) => {
  if (err) {
    console.error('❌ Erro ao gerar hash:', err);
    process.exit(1);
  }

  console.log('✅ Hash gerado com sucesso!\n');
  console.log('─'.repeat(70));
  console.log('Senha:', senha);
  console.log('─'.repeat(70));
  console.log('Hash para usar no SQL:\n');
  console.log(hash);
  console.log('─'.repeat(70));
  console.log('\nUse este hash no INSERT_FIRST_USER.sql:\n');
  console.log(`INSERT INTO users (email, password_hash, nome, ativo)`);
  console.log(`VALUES (`);
  console.log(`  'seu-email@exemplo.com',`);
  console.log(`  '${hash}',`);
  console.log(`  'Seu Nome',`);
  console.log(`  true`);
  console.log(`);\n`);
});
