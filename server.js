require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Configuração da conexão
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.use(express.static(__dirname));
app.use(express.json());

// --- Inicialização e Migração do Banco ---
async function initDB() {
  try {
    // 1. Garante que a tabela do contador principal existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tabela_contador (
        id INT PRIMARY KEY,
        valor INT DEFAULT 0
      )
    `);

    // 2. Tenta adicionar as colunas novas (ano e contagem de msg) se não existirem
    try {
      await pool.query("ALTER TABLE tabela_contador ADD COLUMN ano INT DEFAULT 2024");
      await pool.query("ALTER TABLE tabela_contador ADD COLUMN acessos_msg INT DEFAULT 5");
    } catch (e) {
      // Ignora erro de "Duplicate column name"
    }

    // 3. Garante que existe o registro inicial (ID 1)
    const [rows] = await pool.query('SELECT * FROM tabela_contador WHERE id = 1');
    if (rows.length === 0) {
      const anoAtual = new Date().getFullYear();
      await pool.query('INSERT INTO tabela_contador (id, valor, ano, acessos_msg) VALUES (1, 0, ?, 5)', [anoAtual]);
      console.log('Registro inicial criado.');
    }

    // ── SEINT: Cria tabela de contadores da SEINT ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tabela_seint (
        tipo VARCHAR(50) PRIMARY KEY,
        valor INT DEFAULT 0,
        ano INT DEFAULT 2024,
        acessos_msg INT DEFAULT 5
      )
    `);

    // Garante que os 4 registros existam
    const tiposSeint = [
      'oficios',
      'relatorio_inteligencia',
      'relatorio_tecnico',
      'relatorio_interno'
    ];

    const anoAtual = new Date().getFullYear();
    for (const tipo of tiposSeint) {
      const [existe] = await pool.query('SELECT * FROM tabela_seint WHERE tipo = ?', [tipo]);
      if (existe.length === 0) {
        await pool.query(
          'INSERT INTO tabela_seint (tipo, valor, ano, acessos_msg) VALUES (?, 0, ?, 5)',
          [tipo, anoAtual]
        );
      }
    }
    console.log('Tabela SEINT pronta.');
    // ── FIM SEINT INIT ──

    console.log('Banco de dados pronto.');
  } catch (err) {
    console.error('Erro ao inicializar banco:', err);
  }
}

initDB();

// --- Lógica de Ano Novo (contador principal) ---
async function verificarAnoNovo() {
  const anoAtual = new Date().getFullYear();
  
  const [rows] = await pool.query('SELECT ano FROM tabela_contador WHERE id = 1');
  if (rows.length === 0) return;

  const anoSalvo = rows[0].ano;

  if (anoAtual > anoSalvo) {
    console.log(`Ano Novo detectado! Resetando contador de ${anoSalvo} para ${anoAtual}.`);
    await pool.query(`
      UPDATE tabela_contador 
      SET valor = 0, ano = ?, acessos_msg = 0 
      WHERE id = 1
    `, [anoAtual]);
  }
}

// --- Lógica de Ano Novo (contadores SEINT) ---
async function verificarAnoNovoSeint() {
  const anoAtual = new Date().getFullYear();

  const [rows] = await pool.query('SELECT tipo, ano FROM tabela_seint');
  for (const row of rows) {
    if (anoAtual > row.ano) {
      console.log(`SEINT Ano Novo: Resetando "${row.tipo}" de ${row.ano} para ${anoAtual}.`);
      await pool.query(
        'UPDATE tabela_seint SET valor = 0, ano = ?, acessos_msg = 0 WHERE tipo = ?',
        [anoAtual, row.tipo]
      );
    }
  }
}

// ═══════════════════════════════════════════════
//  ROTAS DO CONTADOR PRINCIPAL (existentes)
// ═══════════════════════════════════════════════

app.get('/api/counter', async (req, res) => {
  try {
    await verificarAnoNovo();

    const [rows] = await pool.query('SELECT valor, acessos_msg FROM tabela_contador WHERE id = 1');
    
    if (rows.length > 0) {
      let dados = rows[0];
      let mensagem = null;

      if (dados.acessos_msg < 5) {
        mensagem = "🎉 Feliz Ano Novo! O contador foi reiniciado. 🎉";
        await pool.query('UPDATE tabela_contador SET acessos_msg = acessos_msg + 1 WHERE id = 1');
      }

      res.json({ counter: dados.valor, message: mensagem });
    } else {
      res.json({ counter: 0, message: null });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar contador' });
  }
});

app.post('/api/counter/increase', async (req, res) => {
  try {
    await verificarAnoNovo();
    await pool.query('UPDATE tabela_contador SET valor = valor + 1 WHERE id = 1');
    const [rows] = await pool.query('SELECT valor FROM tabela_contador WHERE id = 1');
    res.json({ counter: rows[0].valor });
  } catch (err) {
    res.status(500).json({ error: 'Erro' });
  }
});

app.post('/api/counter/decrease', async (req, res) => {
  try {
    await verificarAnoNovo();
    await pool.query('UPDATE tabela_contador SET valor = valor - 1 WHERE id = 1');
    const [rows] = await pool.query('SELECT valor FROM tabela_contador WHERE id = 1');
    res.json({ counter: rows[0].valor });
  } catch (err) {
    res.status(500).json({ error: 'Erro' });
  }
});

// ═══════════════════════════════════════════════
//  ROTAS DA SEINT (novas)
// ═══════════════════════════════════════════════

const TIPOS_SEINT = [
  'oficios',
  'relatorio_inteligencia',
  'relatorio_tecnico',
  'relatorio_interno'
];

// GET /seint → Serve a página HTML
app.get('/seint', (req, res) => {
  res.sendFile(path.join(__dirname, 'seint.html'));
});

// GET /api/seint → Retorna todos os contadores + mensagem de ano novo
app.get('/api/seint', async (req, res) => {
  try {
    await verificarAnoNovoSeint();

    const [rows] = await pool.query('SELECT tipo, valor, acessos_msg FROM tabela_seint');
    
    const resultado = {};
    let mensagem = null;

    for (const row of rows) {
      resultado[row.tipo] = row.valor;

      // Mensagem de ano novo (mostra se qualquer um dos contadores ainda tem acessos < 5)
      if (row.acessos_msg < 5 && !mensagem) {
        mensagem = "🎉 Feliz Ano Novo! Os contadores foram reiniciados. 🎉";
      }
    }

    // Incrementa acessos_msg de todos que ainda estão < 5
    await pool.query('UPDATE tabela_seint SET acessos_msg = acessos_msg + 1 WHERE acessos_msg < 5');

    res.json({ contadores: resultado, message: mensagem });
  } catch (err) {
    console.error('Erro ao buscar contadores SEINT:', err);
    res.status(500).json({ error: 'Erro ao buscar contadores' });
  }
});

// POST /api/seint/increase → Incrementa um contador específico
//   Body: { tipo: "oficios" }
app.post('/api/seint/increase', async (req, res) => {
  try {
    const { tipo } = req.body;

    if (!TIPOS_SEINT.includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido.' });
    }

    await verificarAnoNovoSeint();
    await pool.query('UPDATE tabela_seint SET valor = valor + 1 WHERE tipo = ?', [tipo]);

    const [rows] = await pool.query('SELECT tipo, valor FROM tabela_seint');
    const resultado = {};
    for (const row of rows) resultado[row.tipo] = row.valor;

    res.json(resultado);
  } catch (err) {
    console.error('Erro ao incrementar SEINT:', err);
    res.status(500).json({ error: 'Erro ao atualizar contador' });
  }
});

// POST /api/seint/decrease → Decrementa um contador específico
//   Body: { tipo: "oficios" }
app.post('/api/seint/decrease', async (req, res) => {
  try {
    const { tipo } = req.body;

    if (!TIPOS_SEINT.includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido.' });
    }

    await verificarAnoNovoSeint();

    // Não permite negativo
    const [check] = await pool.query('SELECT valor FROM tabela_seint WHERE tipo = ?', [tipo]);
    if (check.length > 0 && check[0].valor <= 0) {
      const [rows] = await pool.query('SELECT tipo, valor FROM tabela_seint');
      const resultado = {};
      for (const row of rows) resultado[row.tipo] = row.valor;
      return res.json(resultado);
    }

    await pool.query('UPDATE tabela_seint SET valor = valor - 1 WHERE tipo = ?', [tipo]);

    const [rows] = await pool.query('SELECT tipo, valor FROM tabela_seint');
    const resultado = {};
    for (const row of rows) resultado[row.tipo] = row.valor;

    res.json(resultado);
  } catch (err) {
    console.error('Erro ao decrementar SEINT:', err);
    res.status(500).json({ error: 'Erro ao atualizar contador' });
  }
});

// ═══════════════════════════════════════════════

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
