// src/controllers/panierController.js — RG2 : panier actif par session
const db = require('../config/db');

// Récupère ou crée un panier actif pour le client
async function getOrCreatePanier(clientId, conn) {
  const [rows] = await conn.execute(
    'SELECT id FROM panier WHERE client_id = ? AND actif = TRUE LIMIT 1',
    [clientId]
  );
  if (rows.length > 0) return rows[0].id;

  const [result] = await conn.execute(
    'INSERT INTO panier (client_id, actif) VALUES (?, TRUE)',
    [clientId]
  );
  return result.insertId;
}

// GET /api/panier
async function getPanier(req, res, next) {
  try {
    const [paniers] = await db.execute(
      'SELECT id FROM panier WHERE client_id = ? AND actif = TRUE LIMIT 1',
      [req.user.id]
    );
    if (paniers.length === 0) return res.json({ items: [], total: 0 });

    const panierId = paniers[0].id;
    const [items] = await db.execute(
      `SELECT pi.id, pi.quantite, pi.prix_unitaire, o.titre, o.auteur, o.stock
       FROM panier_items pi JOIN ouvrages o ON o.id = pi.ouvrage_id
       WHERE pi.panier_id = ?`,
      [panierId]
    );

    const total = items.reduce((s, i) => s + i.quantite * i.prix_unitaire, 0);
    res.json({ panierId, items, total: total.toFixed(2) });
  } catch (err) { next(err); }
}

// POST /api/panier/items
async function addItem(req, res, next) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { ouvrage_id, quantite = 1 } = req.body;

    // Vérifier stock (RG1)
    const [ouvrages] = await conn.execute(
      'SELECT id, prix, stock FROM ouvrages WHERE id = ? AND stock > 0',
      [ouvrage_id]
    );
    if (ouvrages.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Ouvrage indisponible ou hors stock.' });
    }

    const ouvrage   = ouvrages[0];
    const panierId  = await getOrCreatePanier(req.user.id, conn);

    // Upsert item
    await conn.execute(
      `INSERT INTO panier_items (panier_id, ouvrage_id, quantite, prix_unitaire)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE quantite = quantite + VALUES(quantite)`,
      [panierId, ouvrage_id, quantite, ouvrage.prix]
    );

    await conn.commit();
    res.status(201).json({ message: 'Article ajouté au panier.' });
  } catch (err) { await conn.rollback(); next(err); }
  finally { conn.release(); }
}

// PUT /api/panier/items/:id
async function updateItem(req, res, next) {
  try {
    const { id } = req.params;
    const { quantite } = req.body;
    if (quantite <= 0) {
      await db.execute('DELETE FROM panier_items WHERE id = ?', [id]);
      return res.json({ message: 'Article retiré.' });
    }
    await db.execute('UPDATE panier_items SET quantite = ? WHERE id = ?', [quantite, id]);
    res.json({ message: 'Quantité mise à jour.' });
  } catch (err) { next(err); }
}

// DELETE /api/panier/items/:id
async function removeItem(req, res, next) {
  try {
    await db.execute('DELETE FROM panier_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Article retiré du panier.' });
  } catch (err) { next(err); }
}

module.exports = { getPanier, addItem, updateItem, removeItem };
