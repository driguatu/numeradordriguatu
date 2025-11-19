require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); // Usamos a versão promise para código mais limpo
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Configuração da conexão com o Banco de Dados
// NOTA: Em produção, é recomendado usar variáveis de ambiente (.env) para isso.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware para servir arquivos estáticos e JSON
app.use(express.static(__dirname));
app.use(express.json());

// --- Inicialização do Banco de Dados ---
// Cria a tabela se não existir e insere o valor inicial 0
async function initDB() {
  try {
    // 1. Cria a tabela
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS tabela_contador (
        id INT PRIMARY KEY,
        valor INT DEFAULT 0
      )
    `;
    await pool.query(createTableQuery);

    // 2. Verifica se já existe um contador
    const [rows] = await pool.query('SELECT * FROM tabela_contador WHERE id = 1');
    
    // 3. Se não existir, cria o registro inicial
    if (rows.length === 0) {
      await pool.query('INSERT INTO tabela_contador (id, valor) VALUES (1, 0)');
      console.log('Contador inicializado com valor 0 no banco de dados.');
    } else {
      console.log('Banco de dados conectado. Valor atual: ' + rows[0].valor);
    }
  } catch (err) {
    console.error('Erro ao inicializar banco de dados:', err);
  }
}

// Chama a inicialização
initDB();

// --- Rotas da API ---

// Endpoint para obter o valor atual
app.get('/api/counter', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT valor FROM tabela_contador WHERE id = 1');
    // Retorna no mesmo formato que o frontend espera { counter: X }
    if (rows.length > 0) {
      res.json({ counter: rows[0].valor });
    } else {
      res.json({ counter: 0 });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar contador' });
  }
});

// Endpoint para aumentar
app.post('/api/counter/increase', async (req, res) => {
  try {
    // Atualiza o valor
    await pool.query('UPDATE tabela_contador SET valor = valor + 1 WHERE id = 1');
    
    // Busca o valor atualizado para retornar
    const [rows] = await pool.query('SELECT valor FROM tabela_contador WHERE id = 1');
    res.json({ counter: rows[0].valor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao aumentar contador' });
  }
});

// Endpoint para diminuir
app.post('/api/counter/decrease', async (req, res) => {
  try {
    await pool.query('UPDATE tabela_contador SET valor = valor - 1 WHERE id = 1');
    
    const [rows] = await pool.query('SELECT valor FROM tabela_contador WHERE id = 1');
    res.json({ counter: rows[0].valor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao diminuir contador' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});