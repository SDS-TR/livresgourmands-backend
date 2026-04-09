// src/validators/index.js
const { body, param } = require('express-validator');

const authValidators = {
  register: [
    body('nom').trim().notEmpty().withMessage('Le nom est requis.'),
    body('email').isEmail().normalizeEmail().withMessage('Email invalide.'),
    body('password')
      .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères.')
      .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir une majuscule.')
      .matches(/[0-9]/).withMessage('Le mot de passe doit contenir un chiffre.'),
  ],
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
};

const ouvrageValidators = {
  create: [
    body('titre').trim().notEmpty().withMessage('Le titre est requis.'),
    body('auteur').trim().notEmpty().withMessage('L\'auteur est requis.'),
    body('prix').isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif.'),
    body('stock').isInt({ min: 0 }).withMessage('Le stock doit être un entier >= 0.'),
  ],
};

const panierValidators = {
  addItem: [
    body('ouvrage_id').isInt({ min: 1 }).withMessage('ouvrage_id invalide.'),
    body('quantite').optional().isInt({ min: 1 }).withMessage('Quantité invalide.'),
  ],
};

const avisValidators = {
  add: [
    body('note').isInt({ min: 1, max: 5 }).withMessage('La note doit être entre 1 et 5.'),
  ],
};

const commentaireValidators = {
  add: [
    body('contenu').trim().isLength({ min: 10 }).withMessage('Le commentaire doit faire au moins 10 caractères.'),
  ],
  valider: [
    body('action').isIn(['valider', 'rejeter']).withMessage('Action invalide.'),
  ],
};

const commandeValidators = {
  create: [
    body('adresse_livraison').optional().trim(),
    body('mode_paiement').optional().trim(),
  ],
  updateStatut: [
    body('statut').isIn(['en_cours','payee','annulee','expediee']).withMessage('Statut invalide.'),
  ],
};

module.exports = {
  authValidators,
  ouvrageValidators,
  panierValidators,
  avisValidators,
  commentaireValidators,
  commandeValidators,
};
