-- Criar tabela de usuários para autenticação
-- Execute este SQL no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nome VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca por email (performance)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Comentários para documentação
COMMENT ON TABLE users IS 'Tabela de usuários para autenticação no sistema de landing pages';
COMMENT ON COLUMN users.email IS 'Email do usuário (único)';
COMMENT ON COLUMN users.password_hash IS 'Hash bcrypt da senha';
COMMENT ON COLUMN users.nome IS 'Nome completo do usuário';
COMMENT ON COLUMN users.ativo IS 'Se o usuário está ativo no sistema';

-- Row Level Security (RLS) - Desabilitar para permitir acesso via service role
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
