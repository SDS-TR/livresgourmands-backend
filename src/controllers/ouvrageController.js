const db = require('../config/db');
const {
  escapeHtml,
  formatDate,
  formatPrice,
  pageTemplate,
  wantsHtml,
} = require('../utils/htmlView');

function renderOuvragesPage(rows) {
  const cards = rows.map((ouvrage) => `
    <a class="card" href="/api/ouvrages/${ouvrage.id}">
      <div class="badge">${escapeHtml(ouvrage.categorie_nom || 'Sans categorie')}</div>
      <h2>${escapeHtml(ouvrage.titre)}</h2>
      <p class="meta">Par ${escapeHtml(ouvrage.auteur || 'Auteur inconnu')}</p>
      <p class="meta">${escapeHtml(ouvrage.description || 'Aucune description disponible.')}</p>
      <p><strong>${escapeHtml(formatPrice(ouvrage.prix))}</strong></p>
      <p class="meta">Stock: ${escapeHtml(ouvrage.stock)} | Note: ${Number(ouvrage.note_moyenne || 0).toFixed(1)} | Avis: ${escapeHtml(ouvrage.nb_avis)}</p>
    </a>
  `).join('');

  return pageTemplate({
    title: 'Ouvrages | livresgourmands',
    eyebrow: 'Catalogue',
    heading: 'Nos ouvrages',
    intro: 'Explorez les livres disponibles avec une presentation plus lisible directement dans le navigateur.',
    content: rows.length
      ? `<section class="grid">${cards}</section>`
      : '<section class="empty">Aucun ouvrage disponible pour le moment.</section>',
  });
}

function renderOuvrageDetailPage(ouvrage) {
  const avis = (ouvrage.avis || []).map((item) => `
    <li class="list-item">
      <strong>${escapeHtml(item.prenom || '')} ${escapeHtml(item.nom || '')}</strong>
      <div class="meta">Note: ${escapeHtml(item.note)} / 5 | ${escapeHtml(formatDate(item.date))}</div>
    </li>
  `).join('');

  const commentaires = (ouvrage.commentaires || []).map((item) => `
    <li class="list-item">
      <strong>${escapeHtml(item.prenom || '')} ${escapeHtml(item.nom || '')}</strong>
      <div class="meta">${escapeHtml(formatDate(item.date_soumission))}</div>
      <p class="meta">${escapeHtml(item.contenu)}</p>
    </li>
  `).join('');

  return pageTemplate({
    title: `${ouvrage.titre} | livresgourmands`,
    eyebrow: ouvrage.categorie_nom || 'Ouvrage',
    heading: ouvrage.titre,
    intro: ouvrage.description || 'Fiche detaillee de cet ouvrage.',
    content: `
      <section class="two-cols">
        <article class="card stack">
          <div>
            <div class="badge">${escapeHtml(ouvrage.auteur || 'Auteur inconnu')}</div>
            <p class="meta">Prix: ${escapeHtml(formatPrice(ouvrage.prix))}</p>
            <p class="meta">Stock: ${escapeHtml(ouvrage.stock)}</p>
            <p class="meta">ISBN: ${escapeHtml(ouvrage.isbn || 'Non renseigne')}</p>
            <p class="meta">Ajoute le ${escapeHtml(formatDate(ouvrage.created_at))}</p>
          </div>
          <a class="cta" href="/api/ouvrages">Retour au catalogue</a>
        </article>
        <div class="stack">
          <section class="card">
            <h2 class="section-title">Avis</h2>
            ${ouvrage.avis.length ? `<ul class="list">${avis}</ul>` : '<div class="empty">Aucun avis pour cet ouvrage.</div>'}
          </section>
          <section class="card">
            <h2 class="section-title">Commentaires valides</h2>
            ${ouvrage.commentaires.length ? `<ul class="list">${commentaires}</ul>` : '<div class="empty">Aucun commentaire publie.</div>'}
          </section>
        </div>
      </section>
    `,
  });
}

async function getOuvrages(req, res, next) {
  try {
    const { q, categorie_id, sort } = req.query;
    const isAdmin = req.user && ['gestionnaire', 'administrateur', 'editeur'].includes(req.user.role);

    let sql = `
      SELECT o.*, c.nom AS categorie_nom,
             COALESCE(AVG(a.note), 0) AS note_moyenne,
             COUNT(DISTINCT a.id)     AS nb_avis
      FROM ouvrages o
      LEFT JOIN categories c ON c.id = o.categorie_id
      LEFT JOIN avis a        ON a.ouvrage_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (!isAdmin) {
      sql += ' AND o.stock > 0';
    }

    if (q) {
      sql += ' AND MATCH(o.titre, o.auteur, o.description) AGAINST (? IN BOOLEAN MODE)';
      params.push(`${q}*`);
    }

    if (categorie_id) {
      sql += ' AND o.categorie_id = ?';
      params.push(categorie_id);
    }

    sql += ' GROUP BY o.id';

    if (sort === 'popularite') {
      sql += ' ORDER BY nb_avis DESC, note_moyenne DESC';
    } else if (sort === 'prix_asc') {
      sql += ' ORDER BY o.prix ASC';
    } else if (sort === 'prix_desc') {
      sql += ' ORDER BY o.prix DESC';
    } else {
      sql += ' ORDER BY o.created_at DESC';
    }

    const [rows] = await db.execute(sql, params);

    if (wantsHtml(req)) {
      return res.type('html').send(renderOuvragesPage(rows));
    }

    res.json(rows);
  } catch (err) { next(err); }
}

async function getOuvrageById(req, res, next) {
  try {
    const { id } = req.params;

    const [ouvrages] = await db.execute(
      `SELECT o.*, c.nom AS categorie_nom FROM ouvrages o
       LEFT JOIN categories c ON c.id = o.categorie_id
       WHERE o.id = ?`,
      [id]
    );
    if (ouvrages.length === 0) return res.status(404).json({ error: 'Ouvrage introuvable.' });

    const [avis] = await db.execute(
      `SELECT a.*, u.nom, u.prenom FROM avis a
       JOIN users u ON u.id = a.client_id
       WHERE a.ouvrage_id = ? ORDER BY a.date DESC`,
      [id]
    );

    const [commentaires] = await db.execute(
      `SELECT c.id, c.contenu, c.date_soumission, u.nom, u.prenom
       FROM commentaires c JOIN users u ON u.id = c.client_id
       WHERE c.ouvrage_id = ? AND c.valide = TRUE
       ORDER BY c.date_soumission DESC`,
      [id]
    );

    const payload = { ...ouvrages[0], avis, commentaires };

    if (wantsHtml(req)) {
      return res.type('html').send(renderOuvrageDetailPage(payload));
    }

    res.json(payload);
  } catch (err) { next(err); }
}

async function createOuvrage(req, res, next) {
  try {
    const { titre, auteur, isbn, description, prix, stock, categorie_id } = req.body;
    const [result] = await db.execute(
      `INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [titre, auteur, isbn || null, description || null, prix, stock || 0, categorie_id || null]
    );
    res.status(201).json({ message: 'Ouvrage cree.', id: result.insertId });
  } catch (err) { next(err); }
}

async function updateOuvrage(req, res, next) {
  try {
    const { id } = req.params;
    const { titre, auteur, isbn, description, prix, stock, categorie_id } = req.body;
    await db.execute(
      `UPDATE ouvrages SET titre=?, auteur=?, isbn=?, description=?, prix=?, stock=?, categorie_id=?
       WHERE id = ?`,
      [titre, auteur, isbn || null, description || null, prix, stock, categorie_id || null, id]
    );
    res.json({ message: 'Ouvrage mis a jour.' });
  } catch (err) { next(err); }
}

async function deleteOuvrage(req, res, next) {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM ouvrages WHERE id = ?', [id]);
    res.json({ message: 'Ouvrage supprime.' });
  } catch (err) { next(err); }
}

module.exports = { getOuvrages, getOuvrageById, createOuvrage, updateOuvrage, deleteOuvrage };
