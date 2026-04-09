const jwt = require('jsonwebtoken');
const { pageTemplate } = require('../utils/htmlView');

function wantsHtml(req) {
  const acceptsHeader = req.get('accept') || '';
  return acceptsHeader.includes('text/html');
}

function sendAuthError(req, res, status, message) {
  if (wantsHtml(req)) {
    return res.status(status).type('html').send(pageTemplate({
      title: 'Acces protege | livresgourmands',
      eyebrow: 'Authentification',
      heading: 'Connexion requise',
      intro: message,
      content: `
        <section class="card">
          <p class="meta">
            Cette page fait partie de l API protegee. Pour y acceder, il faut envoyer
            un token JWT valide dans l en-tete <strong>Authorization</strong>.
          </p>
          <p class="meta">
            Exemple : <code>Authorization: Bearer VOTRE_TOKEN</code>
          </p>
        </section>
      `,
    }));
  }

  return res.status(status).json({ error: message });
}

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return sendAuthError(req, res, 401, 'Token manquant ou invalide.');
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return sendAuthError(req, res, 401, 'Token expire ou invalide.');
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendAuthError(req, res, 401, 'Non authentifie.');
    }
    if (!roles.includes(req.user.role)) {
      return sendAuthError(req, res, 403, 'Acces refuse : role insuffisant.');
    }
    next();
  };
}

module.exports = { authenticate, authorize };
