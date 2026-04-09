const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/errorHandler');

const authCtrl = require('../controllers/authController');
const userCtrl = require('../controllers/userController');
const ouvrageCtrl = require('../controllers/ouvrageController');
const catCtrl = require('../controllers/categorieController');
const panierCtrl = require('../controllers/panierController');
const cmdCtrl = require('../controllers/commandeController');
const listeCtrl = require('../controllers/listeCadeauxController');
const avisCtrl = require('../controllers/avisCommentaireController');

const {
  authValidators,
  ouvrageValidators,
  panierValidators,
  avisValidators,
  commentaireValidators,
  commandeValidators,
} = require('../validators');

router.get('/', (req, res) => {
  const acceptsHeader = req.get('accept') || '';

  if (acceptsHeader.includes('text/html')) {
    return res.type('html').send(`
      <!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>API livresgourmands</title>
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              padding: 24px;
              font-family: Georgia, "Times New Roman", serif;
              background: linear-gradient(160deg, #f7f1e8 0%, #f3e3cf 100%);
              color: #2f241d;
            }
            main {
              max-width: 780px;
              width: 100%;
              padding: 32px;
              background: rgba(255, 250, 243, 0.94);
              border: 1px solid #e2cfb4;
              border-radius: 24px;
              box-shadow: 0 20px 45px rgba(73, 46, 23, 0.08);
            }
            h1 {
              margin-top: 0;
              font-size: clamp(2rem, 4vw, 3.4rem);
            }
            ul {
              line-height: 1.8;
            }
            a {
              color: #a44a1d;
              text-decoration: none;
              font-weight: 700;
            }
          </style>
        </head>
        <body>
          <main>
            <h1>API livresgourmands</h1>
            <p>Les routes publiques principales sont disponibles avec un affichage navigateur plus agreable.</p>
            <ul>
              <li><a href="/api/categories">/api/categories</a></li>
              <li><a href="/api/ouvrages">/api/ouvrages</a></li>
            </ul>
          </main>
        </body>
      </html>
    `);
  }

  return res.json({
    message: 'API livresgourmands',
    routes: ['/api/categories', '/api/ouvrages'],
  });
});

router.post('/auth/register', authValidators.register, validate, authCtrl.register);
router.post('/auth/login', authValidators.login, validate, authCtrl.login);

router.get('/users/me', authenticate, userCtrl.getMe);
router.get('/users', authenticate, authorize('administrateur'), userCtrl.getAllUsers);
router.put('/users/:id', authenticate, userCtrl.updateUser);

router.get('/categories', catCtrl.getCategories);
router.post('/categories', authenticate, authorize('editeur', 'gestionnaire', 'administrateur'), validate, catCtrl.createCategorie);
router.put('/categories/:id', authenticate, authorize('editeur', 'gestionnaire', 'administrateur'), validate, catCtrl.updateCategorie);
router.delete('/categories/:id', authenticate, authorize('gestionnaire', 'administrateur'), catCtrl.deleteCategorie);

router.get('/ouvrages', ouvrageCtrl.getOuvrages);
router.get('/ouvrages/:id', ouvrageCtrl.getOuvrageById);
router.post(
  '/ouvrages',
  authenticate,
  authorize('gestionnaire', 'editeur', 'administrateur'),
  ouvrageValidators.create,
  validate,
  ouvrageCtrl.createOuvrage
);
router.put(
  '/ouvrages/:id',
  authenticate,
  authorize('gestionnaire', 'editeur', 'administrateur'),
  ouvrageCtrl.updateOuvrage
);
router.delete(
  '/ouvrages/:id',
  authenticate,
  authorize('gestionnaire', 'administrateur'),
  ouvrageCtrl.deleteOuvrage
);

router.post(
  '/ouvrages/:id/avis',
  authenticate,
  authorize('client'),
  avisValidators.add,
  validate,
  avisCtrl.addAvis
);
router.post(
  '/ouvrages/:id/commentaires',
  authenticate,
  authorize('client'),
  commentaireValidators.add,
  validate,
  avisCtrl.addCommentaire
);
router.get(
  '/commentaires/pending',
  authenticate,
  authorize('editeur', 'administrateur'),
  avisCtrl.getPendingCommentaires
);
router.put(
  '/commentaires/:id/valider',
  authenticate,
  authorize('editeur', 'administrateur'),
  commentaireValidators.valider,
  validate,
  avisCtrl.validerCommentaire
);

router.get('/panier', authenticate, authorize('client'), panierCtrl.getPanier);
router.post('/panier/items', authenticate, authorize('client'), panierValidators.addItem, validate, panierCtrl.addItem);
router.put('/panier/items/:id', authenticate, authorize('client'), panierCtrl.updateItem);
router.delete('/panier/items/:id', authenticate, authorize('client'), panierCtrl.removeItem);

router.post('/commandes', authenticate, authorize('client'), commandeValidators.create, validate, cmdCtrl.createCommande);
router.get('/commandes', authenticate, cmdCtrl.getCommandes);
router.get('/commandes/:id', authenticate, cmdCtrl.getCommandeById);
router.put('/commandes/:id/status', authenticate, authorize('gestionnaire', 'administrateur'), commandeValidators.updateStatut, validate, cmdCtrl.updateStatut);

router.post('/listes', authenticate, authorize('client'), listeCtrl.createListe);
router.get('/listes/mes-listes', authenticate, authorize('client'), listeCtrl.getMesListes);
router.get('/listes/:code', listeCtrl.getListeByCode);
router.post('/listes/:id/items', authenticate, authorize('client'), listeCtrl.addItemToListe);
router.post('/listes/:id/acheter', listeCtrl.acheterDepuisListe);

module.exports = router;
