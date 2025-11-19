const express = require('express');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const app = express();
const port = process.env.PORT || 3000;

// Configurando o lowdb para usar o arquivo db.json
const adapter = new FileSync('db.json');
const db = low(adapter);

// Define o valor padrão do contador, caso não exista
db.defaults({ counter: 0 }).write();

// Middleware para servir arquivos estáticos da pasta "public"
app.use(express.static(__dirname));
app.use(express.json());

// Endpoint para obter o valor atual do contador
app.get('/api/counter', (req, res) => {
  const counter = db.get('counter').value();
  res.json({ counter });
});

// Endpoint para aumentar o contador
app.post('/api/counter/increase', (req, res) => {
  db.update('counter', n => n + 1).write();
  const counter = db.get('counter').value();
  res.json({ counter });
});

// Endpoint para diminuir o contador
app.post('/api/counter/decrease', (req, res) => {
  db.update('counter', n => n - 1).write();
  const counter = db.get('counter').value();
  res.json({ counter });
});
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
