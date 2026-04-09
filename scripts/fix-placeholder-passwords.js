const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

const SALT_ROUNDS = 10;

const defaultPasswordsByEmail = {
  'admin@livresgourmands.net': 'Admin123!',
  'marie@example.com': 'Client123!',
  'paul@example.com': 'Client123!',
  'sophie@example.com': 'Editeur123!',
  'jean@example.com': 'Gest123!',
};

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'livresgourmand',
  });

  const [users] = await conn.execute(
    "SELECT id, email, password_hash FROM users WHERE password_hash LIKE '$PLACEHOLDER_%'"
  );

  if (users.length === 0) {
    console.log('Aucun utilisateur avec un password_hash placeholder.');
    await conn.end();
    return;
  }

  for (const user of users) {
    const password = defaultPasswordsByEmail[user.email];

    if (!password) {
      console.warn(`Mot de passe par defaut introuvable pour ${user.email}, utilisateur ignore.`);
      continue;
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    await conn.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);
    console.log(`Hash mis a jour pour ${user.email}`);
  }

  await conn.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
