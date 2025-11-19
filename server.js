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
    // 1. Garante que a tabela existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tabela_contador (
        id INT PRIMARY KEY,
        valor INT DEFAULT 0
      )
    `);

    // 2. Tenta adicionar as colunas novas (ano e contagem de msg) se não existirem
    // Usamos um try/catch silencioso para ignorar erro se a coluna já existir
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
    
    console.log('Banco de dados pronto.');
  } catch (err) {
    console.error('Erro ao inicializar banco:', err);
  }
}

initDB();

// --- Lógica de Ano Novo ---
async function verificarAnoNovo() {
  const anoAtual = new Date().getFullYear();
  
  // Busca o ano salvo no banco
  const [rows] = await pool.query('SELECT ano FROM tabela_contador WHERE id = 1');
  if (rows.length === 0) return; // Segurança

  const anoSalvo = rows[0].ano;

  // Se o ano virou (Ano atual é maior que o salvo)
  if (anoAtual > anoSalvo) {
    console.log(`Ano Novo detectado! Resetando contador de ${anoSalvo} para ${anoAtual}.`);
    // Reseta o valor para 0, atualiza o ano e reseta a contagem de mensagens para 0 (para começar a contar os 5 primeiros)
    await pool.query(`
      UPDATE tabela_contador 
      SET valor = 0, ano = ?, acessos_msg = 0 
      WHERE id = 1
    `, [anoAtual]);
  }
}

// --- Rotas ---

app.get('/api/counter', async (req, res) => {
  try {
    // Antes de buscar, verifica se é ano novo
    await verificarAnoNovo();

    // Busca dados
    const [rows] = await pool.query('SELECT valor, acessos_msg FROM tabela_contador WHERE id = 1');
    
    if (rows.length > 0) {
      let dados = rows[0];
      let mensagem = null;

      // Lógica da Mensagem de Ano Novo (apenas para os 5 primeiros acessos)
      // Se acessos_msg for menor que 5, exibimos a mensagem e incrementamos
      if (dados.acessos_msg < 5) {
        mensagem = "🎉 Feliz Ano Novo! O contador foi reiniciado. 🎉";
        // Incrementa o contador de visualização da mensagem
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
    await verificarAnoNovo(); // Garante que não aumenta o contador do ano passado
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

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});