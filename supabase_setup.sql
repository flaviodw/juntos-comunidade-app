-- Script para configuração do banco de dados no Supabase

-- Tabela de Avisos/Comunicados
CREATE TABLE IF NOT EXISTS avisos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  "desc" TEXT,
  date TEXT,
  "startTime" TEXT,
  "endTime" TEXT,
  address TEXT,
  "isNew" BOOLEAN DEFAULT TRUE,
  icon TEXT DEFAULT 'Bell'
);

-- Tabela de Configurações (Stats, Contatos, Conteúdo)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso: Leitura pública para todos
CREATE POLICY "Leitura pública de avisos" ON avisos FOR SELECT USING (true);
CREATE POLICY "Leitura pública de settings" ON settings FOR SELECT USING (true);

-- Políticas de Acesso: Escrita apenas para usuários autenticados (Admin)
CREATE POLICY "Admin pode inserir avisos" ON avisos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin pode atualizar avisos" ON avisos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admin pode deletar avisos" ON avisos FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admin pode gerenciar settings" ON settings FOR ALL USING (auth.role() = 'authenticated');
