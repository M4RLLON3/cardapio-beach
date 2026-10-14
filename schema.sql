CREATE TABLE IF NOT EXISTS cardapio_lojas (
  arena_id INTEGER PRIMARY KEY,
  store_config TEXT,
  produtos TEXT,
  pedidos TEXT,
  categorias_excluidas TEXT,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cardapio_pedidos (
  id TEXT PRIMARY KEY,
  arena_id INTEGER NOT NULL DEFAULT 2,
  cliente_nome TEXT,
  cliente_telefone TEXT,
  tipo_entrega TEXT,
  total REAL,
  status TEXT DEFAULT 'pendente',
  dados_json TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cardapio_pedidos_arena_criado ON cardapio_pedidos (arena_id, criado_em DESC);
