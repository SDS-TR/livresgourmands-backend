require('dotenv').config();
const express = require('express');
const cors = require('cors');

const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.type('html').send(`
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>livresgourmands API</title>
        <style>
          body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: #f7f1e8;
            color: #2f241d;
          }
          main {
            max-width: 720px;
            margin: 64px auto;
            padding: 32px;
            background: #fffaf3;
            border: 1px solid #e8d9c5;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(47, 36, 29, 0.08);
          }
          h1 {
            margin-top: 0;
          }
          a {
            color: #8b4513;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>Bienvenue sur l API livresgourmands</h1>
          <p>Le serveur fonctionne correctement.</p>
        </main>
      </body>
    </html>
  `);
});

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', version: '1.0.0' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable.' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`livresgourmands API demarree sur http://localhost:${PORT}`);
});

module.exports = app;
