// src/middlewares/errorHandler.js
const { validationResult } = require('express-validator');

/**
 * Vérifie les erreurs de validation express-validator.
 * À placer après les règles de validation dans les routes.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

/**
 * Gestionnaire d'erreurs global (dernière middleware Express).
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  const status  = err.status  || 500;
  const message = err.expose  ? err.message : 'Erreur interne du serveur.';

  res.status(status).json({ error: message });
}

module.exports = { validate, errorHandler };
