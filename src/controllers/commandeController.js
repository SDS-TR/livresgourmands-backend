// src/controllers/commandeController.js
// Décrémentation transactionnelle du stock (RG1 + contrainte de gestion)
const db = require('../config/db');

// POST /api/commandes — créer commande depuis le panier actif
async function createCommande(req, res, next) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const clientId = req.user.id;
    const { adresse_livraison, mode_livraison, mode_paiement } = req.body;

    // Récupérer le panier actif
    const [paniers] = await conn.execute(
      'SELECT id FROM panier WHERE client_id = ? AND actif = TRUE LIMIT 1',
      [clientId]
    );
    if (paniers.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Aucun panier actif.' });
    }

    const panierId = paniers[0].id;

    // Récupérer les items du panier avec verrou
    const [items] = await conn.execute(
      `SELECT pi.ouvrage_id, pi.quantite, pi.prix_unitaire, o.stock, o.titre
       FROM panier_items pi
       JOIN ouvrages o ON o.id = pi.ouvrage_id
       WHERE pi.panier_id = ?
       FOR UPDATE`,
      [panierId]
    );

    if (items.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Le panier est vide.' });
    }

    // Vérifier le stock pour chaque item
    for (const item of items) {
      if (item.stock < item.quantite) {
        await conn.rollback();
        return res.status(400).json({
          error: `Stock insuffisant pour "${item.titre}" (dispo : ${item.stock}).`
        });
      }
    }

    // Calculer le total
    const total = items.reduce((s, i) => s + i.quantite * i.prix_unitaire, 0);

    // Créer la commande
    const [commande] = await conn.execute(
      `INSERT INTO commandes (client_id, total, statut, adresse_livraison, mode_livraison, mode_paiement)
       VALUES (?, ?, 'en_cours', ?, ?, ?)`,
      [clientId, total.toFixed(2), adresse_livraison || null, mode_livraison || null, mode_paiement || null]
    );
    const commandeId = commande.insertId;

    // Insérer les items de commande + décrémenter le stock
    for (const item of items) {
      await conn.execute(
        'INSERT INTO commande_items (commande_id, ouvrage_id, quantite, prix_unitaire) VALUES (?,?,?,?)',
        [commandeId, item.ouvrage_id, item.quantite, item.prix_unitaire]
      );
      await conn.execute(
        'UPDATE ouvrages SET stock = stock - ? WHERE id = ?',
        [item.quantite, item.ouvrage_id]
      );
    }

    // Désactiver le panier (RG2)
    await conn.execute('UPDATE panier SET actif = FALSE WHERE id = ?', [panierId]);

    await conn.commit();

    res.status(201).json({
      message: 'Commande créée avec succès.',
      commandeId,
      total: total.toFixed(2),
      // En production : retourner ici l'URL de paiement Stripe/PayPal
      paiement_url: `https://paiement.example.com/pay/${commandeId}`,
    });
  } catch (err) { await conn.rollback(); next(err); }
  finally { conn.release(); }
}

// GET /api/commandes — historique du client
async function getCommandes(req, res, next) {
  try {
    const isAdmin = ['administrateur', 'gestionnaire'].includes(req.user.role);
    const sql = isAdmin
      ? 'SELECT * FROM commandes ORDER BY created_at DESC'
      : 'SELECT * FROM commandes WHERE client_id = ? ORDER BY created_at DESC';
    const params = isAdmin ? [] : [req.user.id];
    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
}

// GET /api/commandes/:id
async function getCommandeById(req, res, next) {
  try {
    const { id } = req.params;
    const [commandes] = await db.execute('SELECT * FROM commandes WHERE id = ?', [id]);
    if (commandes.length === 0) return res.status(404).json({ error: 'Commande introuvable.' });

    const commande = commandes[0];
    // Seul le client propriétaire ou un admin peut voir
    if (req.user.role === 'client' && commande.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const [items] = await db.execute(
      `SELECT ci.*, o.titre, o.auteur FROM commande_items ci
       JOIN ouvrages o ON o.id = ci.ouvrage_id WHERE ci.commande_id = ?`,
      [id]
    );
    res.json({ ...commande, items });
  } catch (err) { next(err); }
}

// PUT /api/commandes/:id/status  (admin / gestionnaire)
async function updateStatut(req, res, next) {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    await db.execute('UPDATE commandes SET statut = ? WHERE id = ?', [statut, id]);
    res.json({ message: 'Statut mis à jour.' });
  } catch (err) { next(err); }
}

module.exports = { createCommande, getCommandes, getCommandeById, updateStatut };
