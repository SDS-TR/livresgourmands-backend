// seed.js — Insertion des données de test avec bcrypt
// Usage : node seed.js
const bcrypt = require('bcrypt');
const mysql  = require('mysql2/promise');
require('dotenv').config();

const SALT_ROUNDS = 10;

async function seed() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'livresgourmands',
  });

  const users = [
    { nom: 'Admin',   prenom: 'Sys',    email: 'admin@livresgourmands.net', password: 'Admin123!',   role: 'administrateur' },
    { nom: 'Dupont',  prenom: 'Marie',  email: 'marie@example.com',          password: 'Client123!',  role: 'client' },
    { nom: 'Bernard', prenom: 'Paul',   email: 'paul@example.com',           password: 'Client123!',  role: 'client' },
    { nom: 'Leroy',   prenom: 'Sophie', email: 'sophie@example.com',         password: 'Editeur123!', role: 'editeur' },
    { nom: 'Martin',  prenom: 'Jean',   email: 'jean@example.com',           password: 'Gest123!',    role: 'gestionnaire' },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
    await conn.execute(
      'INSERT IGNORE INTO users (nom, prenom, email, password_hash, role) VALUES (?,?,?,?,?)',
      [u.nom, u.prenom, u.email, hash, u.role]
    );
  }

  console.log('Seed terminé — utilisateurs insérés avec mots de passe hashés.');
  await conn.end();
}

seed().catch(console.error);
