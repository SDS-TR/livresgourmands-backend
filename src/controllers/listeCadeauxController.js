const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const {
  escapeHtml,
  formatPrice,
  pageTemplate,
  wantsHtml,
} = require('../utils/htmlView');

function renderListePage(liste) {
  const items = (liste.items || []).map((item) => `
    <li class="list-item">
      <strong>${escapeHtml(item.titre)}</strong>
      <div class="meta">Par ${escapeHtml(item.auteur || 'Auteur inconnu')}</div>
      <div class="meta">Souhaite: ${escapeHtml(item.quantite_souhaitee)} | Reserve: ${escapeHtml(item.quantite_reservee || 0)} | Stock: ${escapeHtml(item.stock)}</div>
      <div class="meta">Prix: ${escapeHtml(formatPrice(item.prix))}</div>
    </li>
  `).join('');

  return pageTemplate({
    title: `${liste.nom} | livresgourmands`,
    eyebrow: 'Liste cadeaux',
    heading: liste.nom,
    intro: `Liste partagee par ${liste.proprietaire_nom}.`,
    content: `
      <section class="stack">
        <article class="card">
          <div class="badge">Code ${escapeHtml(liste.code_partage)}</div>
          <p class="meta">Consultez cette selection pour preparer un achat cadeau.</p>
        </article>
        <section class="card">
          <h2 class="section-title">Ouvrages souhaites</h2>
          ${liste.items.length ? `<ul class="list">${items}</ul>` : '<div class="empty">Aucun ouvrage dans cette liste pour le moment.</div>'}
        </section>
      </section>
    `,
  });
}

async function createListe(req, res, next) {
  try {
    const { nom } = req.body;
    const code_partage = uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();

    const [result] = await db.execute(
      'INSERT INTO listes_cadeaux (nom, proprietaire_id, code_partage) VALUES (?, ?, ?)',
      [nom, req.user.id, code_partage]
    );

    res.status(201).json({ message: 'Liste creee.', id: result.insertId, code_partage });
  } catch (err) { next(err); }
}

async function getMesListes(req, res, next) {
  try {
    const [listes] = await db.execute(
      'SELECT * FROM listes_cadeaux WHERE proprietaire_id = ? ORDER BY date_creation DESC',
      [req.user.id]
    );

    for (const liste of listes) {
      const [items] = await db.execute(
        `SELECT li.*, o.titre, o.auteur, o.prix FROM liste_items li
         JOIN ouvrages o ON o.id = li.ouvrage_id WHERE li.liste_id = ?`,
        [liste.id]
      );
      liste.items = items;
    }

    res.json(listes);
  } catch (err) { next(err); }
}

async function getListeByCode(req, res, next) {
  try {
    const { code } = req.params;
    const [listes] = await db.execute(
      `SELECT l.*, u.nom AS proprietaire_nom FROM listes_cadeaux l
       JOIN users u ON u.id = l.proprietaire_id
       WHERE l.code_partage = ?`,
      [code]
    );
    if (listes.length === 0) return res.status(404).json({ error: 'Liste introuvable.' });

    const liste = listes[0];
    const [items] = await db.execute(
      `SELECT li.*, o.titre, o.auteur, o.prix, o.stock FROM liste_items li
       JOIN ouvrages o ON o.id = li.ouvrage_id WHERE li.liste_id = ?`,
      [liste.id]
    );

    const payload = { ...liste, items };

    if (wantsHtml(req)) {
      return res.type('html').send(renderListePage(payload));
    }

    res.json(payload);
  } catch (err) { next(err); }
}

async function addItemToListe(req, res, next) {
  try {
    const { id } = req.params;
    const { ouvrage_id, quantite_souhaitee = 1 } = req.body;

    const [listes] = await db.execute(
      'SELECT id FROM listes_cadeaux WHERE id = ? AND proprietaire_id = ?',
      [id, req.user.id]
    );
    if (listes.length === 0) return res.status(403).json({ error: 'Acces refuse.' });

    await db.execute(
      `INSERT INTO liste_items (liste_id, ouvrage_id, quantite_souhaitee)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantite_souhaitee = VALUES(quantite_souhaitee)`,
      [id, ouvrage_id, quantite_souhaitee]
    );

    res.status(201).json({ message: 'Ouvrage ajoute a la liste.' });
  } catch (err) { next(err); }
}

async function acheterDepuisListe(req, res, next) {
  try {
    const { id } = req.params;
    const [listes] = await db.execute('SELECT * FROM listes_cadeaux WHERE id = ?', [id]);
    if (listes.length === 0) return res.status(404).json({ error: 'Liste introuvable.' });

    const [items] = await db.execute(
      `SELECT li.ouvrage_id, li.quantite_souhaitee, o.titre, o.prix, o.stock
       FROM liste_items li JOIN ouvrages o ON o.id = li.ouvrage_id
       WHERE li.liste_id = ? AND o.stock > 0`,
      [id]
    );

    res.json({
      message: 'Voici les ouvrages disponibles a commander depuis cette liste.',
      items,
    });
  } catch (err) { next(err); }
}

module.exports = { createListe, getMesListes, getListeByCode, addItemToListe, acheterDepuisListe };
