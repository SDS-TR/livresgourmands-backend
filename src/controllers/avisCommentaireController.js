// src/controllers/avisCommentaireController.js
// RG3 : avis seulement si achat confirmé
// RG4 : commentaires valide=false par défaut, validation par éditeur
const db = require('../config/db');

// POST /api/ouvrages/:id/avis — RG3
async function addAvis(req, res, next) {
  try {
    const ouvrageId = req.params.id;
    const clientId  = req.user.id;
    const { note }  = req.body;

    // RG3 : vérifier que le client a acheté l'ouvrage
    const [achats] = await db.execute(
      `SELECT ci.id FROM commande_items ci
       JOIN commandes c ON c.id = ci.commande_id
       WHERE c.client_id = ? AND ci.ouvrage_id = ? AND c.statut IN ('payee','expediee')
       LIMIT 1`,
      [clientId, ouvrageId]
    );

    if (achats.length === 0) {
      return res.status(403).json({
        error: 'Vous devez avoir acheté cet ouvrage pour laisser un avis. (RG3)'
      });
    }

    // Insérer l'avis (UNIQUE KEY empêche le doublon)
    await db.execute(
      'INSERT INTO avis (client_id, ouvrage_id, note) VALUES (?, ?, ?)',
      [clientId, ouvrageId, note]
    );

    res.status(201).json({ message: 'Avis soumis.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Vous avez déjà laissé un avis pour cet ouvrage.' });
    }
    next(err);
  }
}

// POST /api/ouvrages/:id/commentaires — RG4 : valide=false par défaut
async function addCommentaire(req, res, next) {
  try {
    const ouvrageId = req.params.id;
    const clientId  = req.user.id;
    const { contenu } = req.body;

    await db.execute(
      `INSERT INTO commentaires (client_id, ouvrage_id, contenu, valide)
       VALUES (?, ?, ?, FALSE)`,
      [clientId, ouvrageId, contenu]
    );

    res.status(201).json({
      message: 'Commentaire soumis. Il sera publié après validation par un éditeur. (RG4)'
    });
  } catch (err) { next(err); }
}

// GET /api/commentaires/pending — liste des commentaires en attente (éditeur)
async function getPendingCommentaires(req, res, next) {
  try {
    const [rows] = await db.execute(
      `SELECT c.*, u.nom, u.prenom, o.titre AS ouvrage_titre
       FROM commentaires c
       JOIN users u    ON u.id = c.client_id
       JOIN ouvrages o ON o.id = c.ouvrage_id
       WHERE c.valide = FALSE
       ORDER BY c.date_soumission ASC`
    );
    res.json(rows);
  } catch (err) { next(err); }
}

// PUT /api/commentaires/:id/valider — RG4 : valider ou rejeter
async function validerCommentaire(req, res, next) {
  try {
    const { id }     = req.params;
    const { action } = req.body; // 'valider' ou 'rejeter'

    if (action === 'valider') {
      await db.execute(
        `UPDATE commentaires
         SET valide = TRUE, valide_par = ?, date_validation = NOW()
         WHERE id = ?`,
        [req.user.id, id]
      );
      return res.json({ message: 'Commentaire validé.' });
    }

    if (action === 'rejeter') {
      await db.execute('DELETE FROM commentaires WHERE id = ?', [id]);
      return res.json({ message: 'Commentaire rejeté et supprimé.' });
    }

    res.status(400).json({ error: 'Action invalide. Utilisez "valider" ou "rejeter".' });
  } catch (err) { next(err); }
}

module.exports = { addAvis, addCommentaire, getPendingCommentaires, validerCommentaire };
