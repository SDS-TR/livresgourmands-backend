// src/controllers/userController.js
const db = require('../config/db');

// GET /api/users/me
async function getMe(req, res, next) {
  try {
    const [rows] = await db.execute(
      'SELECT id, nom, prenom, email, telephone, adresse, role, actif, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// GET /api/users  (admin seulement)
async function getAllUsers(req, res, next) {
  try {
    const [rows] = await db.execute(
      'SELECT id, nom, prenom, email, role, actif, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) { next(err); }
}

// PUT /api/users/:id  (admin ou propriétaire)
async function updateUser(req, res, next) {
  try {
    const { id } = req.params;

    // Seul l'admin peut modifier un autre user ou changer le rôle
    if (req.user.role !== 'administrateur' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const { nom, prenom, telephone, adresse, actif, role } = req.body;

    // Seul l'admin peut changer le rôle et le statut actif
    const fields = ['nom = ?', 'prenom = ?', 'telephone = ?', 'adresse = ?'];
    const values = [nom, prenom, telephone, adresse];

    if (req.user.role === 'administrateur') {
      if (actif !== undefined)  { fields.push('actif = ?'); values.push(actif); }
      if (role  !== undefined)  { fields.push('role = ?');  values.push(role);  }
    }

    values.push(id);
    await db.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    res.json({ message: 'Utilisateur mis à jour.' });
  } catch (err) { next(err); }
}

module.exports = { getMe, getAllUsers, updateUser };
