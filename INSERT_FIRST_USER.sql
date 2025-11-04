-- Script para inserir primeiro usuário
-- Execute este SQL no Supabase SQL Editor após criar a tabela

-- ATENÇÃO: Altere o email e a senha conforme necessário
-- A senha abaixo é: "senha123" (hash bcrypt)
-- Para gerar um novo hash bcrypt, use: https://bcrypt-generator.com/

INSERT INTO users (email, password_hash, nome, ativo)
VALUES (
  'seu-email@exemplo.com',  -- ALTERE AQUI
  '$2b$10$rBV2JDeWW3.vKyeFwQvDiOfV.zNiKSLsVwSPELp5vCXSHwJqV6tDa',  -- senha: senha123
  'Administrador',           -- ALTERE AQUI
  true
)
ON CONFLICT (email) DO NOTHING;

-- Para consultar os usuários cadastrados:
-- SELECT id, email, nome, ativo, created_at FROM users;
