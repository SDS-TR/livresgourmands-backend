const db = require('../config/db');
const { escapeHtml, pageTemplate, wantsHtml } = require('../utils/htmlView');

function renderCategoriesPage(rows) {
  const cards = rows.map((category) => `
    <article class="card">
      <div class="badge">#${category.id}</div>
      <h2>${escapeHtml(category.nom)}</h2>
      <p class="meta">${escapeHtml(category.description || 'Aucune description disponible.')}</p>
    </article>
  `).join('');

  return pageTemplate({
    title: 'Categories | livresgourmands',
    eyebrow: 'Catalogue',
    heading: 'Nos categories culinaires',
    intro: 'Retrouvez les univers de lecture disponibles dans livresgourmands dans une vue plus agreable pour le navigateur.',
    content: rows.length
      ? `<section class="grid">${cards}</section>`
      : '<section class="empty">Aucune categorie disponible pour le moment.</section>',
  });
}

async function getCategories(req, res, next) {
  try {
    const [rows] = await db.execute('SELECT * FROM categories ORDER BY nom');

    if (wantsHtml(req)) {
      return res.type('html').send(renderCategoriesPage(rows));
    }

    return res.json(rows);
  } catch (err) { return next(err); }
}

async function createCategorie(req, res, next) {
  try {
    const { nom, description } = req.body;
    const [result] = await db.execute(
      'INSERT INTO categories (nom, description) VALUES (?, ?)',
      [nom, description || null]
    );
    res.status(201).json({ message: 'Categorie creee.', id: result.insertId });
  } catch (err) { next(err); }
}

async function updateCategorie(req, res, next) {
  try {
    const { id } = req.params;
    const { nom, description } = req.body;
    await db.execute('UPDATE categories SET nom=?, description=? WHERE id=?', [nom, description, id]);
    res.json({ message: 'Categorie mise a jour.' });
  } catch (err) { next(err); }
}

async function deleteCategorie(req, res, next) {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM categories WHERE id=?', [id]);
    res.json({ message: 'Categorie supprimee.' });
  } catch (err) { next(err); }
}

module.exports = { getCategories, createCategorie, updateCategorie, deleteCategorie };
