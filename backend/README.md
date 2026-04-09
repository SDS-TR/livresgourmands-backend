# livresgourmands-backend

API REST Node.js / Express pour la plateforme `livresgourmands`, avec authentification JWT, gestion des roles, base MySQL et collection Postman incluse dans le repo.

## Apercu

- Backend : Node.js + Express
- Base de donnees : MySQL 8+
- Authentification : JWT
- Hash des mots de passe : bcrypt
- Validation : express-validator

Cette API couvre :

- authentification et profil utilisateur
- categories et ouvrages
- panier et commandes
- listes de cadeaux
- avis et commentaires moderes

## Structure

```text
backend/
|-- scripts/
|   |-- schema.sql
|   |-- seed.js
|   `-- fix-placeholder-passwords.js
|-- src/
|   |-- config/
|   |-- controllers/
|   |-- middlewares/
|   |-- routes/
|   |-- utils/
|   |-- validators/
|   `-- server.js
|-- .gitignore
|-- package.json
`-- README.md
```

## Installation

### 1. Cloner le depot

```bash
git clone https://github.com/SDS-TR/livresgourmands-backend.git
cd livresgourmands-backend
```

### 2. Installer les dependances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Cree un fichier `.env` a la racine du projet avec par exemple :

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=livresgourmand

JWT_SECRET=change_this_secret_in_production
JWT_EXPIRES_IN=24h

PORT=3000
NODE_ENV=development
```

Important : le script SQL cree la base `livresgourmands`, alors que le `.env` de developpement actuel pointe vers `livresgourmand`. Utilise le meme nom des deux cotes.

## Mise en route de la base de donnees

### 1. Creer le schema

```bash
mysql -u root -p < scripts/schema.sql
```

### 2. Corriger les utilisateurs de test

Le fichier `schema.sql` insere des `password_hash` placeholder. Pour rendre les comptes de test utilisables, execute :

```bash
node scripts/fix-placeholder-passwords.js
```

Alternative :

```bash
npm run seed
```

`seed.js` ajoute des utilisateurs avec de vrais hashes bcrypt si besoin.

## Demarrage

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

Serveur local :

```text
http://localhost:3000
```

Healthcheck :

```text
GET http://localhost:3000/health
```

## Authentification JWT

Certaines routes sont protegees. Il faut d'abord recuperer un token via :

```text
POST /api/auth/login
```

Puis envoyer ce token dans l'en-tete :

```text
Authorization: Bearer VOTRE_TOKEN
```

Exemple :

```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

## Comptes de test

Apres execution de `fix-placeholder-passwords.js` ou du seed :

| Role | Email | Mot de passe |
|---|---|---|
| administrateur | `admin@livresgourmands.net` | `Admin123!` |
| client | `marie@example.com` | `Client123!` |
| client | `paul@example.com` | `Client123!` |
| editeur | `sophie@example.com` | `Editeur123!` |
| gestionnaire | `jean@example.com` | `Gest123!` |

## Scripts utiles

| Commande | Description |
|---|---|
| `npm start` | demarre l'API |
| `npm run dev` | demarre l'API avec nodemon |
| `npm run seed` | insere les utilisateurs de test avec bcrypt |
| `node scripts/fix-placeholder-passwords.js` | remplace les placeholders de `password_hash` |

## Endpoints

### Public

| Methode | Route | Description |
|---|---|---|
| `GET` | `/` | page d'accueil de l'API |
| `GET` | `/health` | verification du serveur |
| `GET` | `/api` | index JSON ou HTML des routes publiques |
| `POST` | `/api/auth/register` | inscription client |
| `POST` | `/api/auth/login` | connexion et retour JWT |
| `GET` | `/api/categories` | liste des categories |
| `GET` | `/api/ouvrages` | liste des ouvrages |
| `GET` | `/api/ouvrages/:id` | detail d'un ouvrage |
| `GET` | `/api/listes/:code` | consultation d'une liste cadeau partagee |
| `POST` | `/api/listes/:id/acheter` | ouvrages disponibles depuis une liste |

### Authentifie

| Methode | Route | Role requis | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | authentifie | profil courant |
| `PUT` | `/api/users/:id` | proprietaire ou administrateur | mise a jour utilisateur |
| `GET` | `/api/commandes` | authentifie | liste des commandes du client ou toutes pour admin/gestionnaire |
| `GET` | `/api/commandes/:id` | authentifie | detail d'une commande |

### Client

| Methode | Route | Description |
|---|---|---|
| `GET` | `/api/panier` | recuperer le panier actif |
| `POST` | `/api/panier/items` | ajouter un ouvrage au panier |
| `PUT` | `/api/panier/items/:id` | modifier une quantite |
| `DELETE` | `/api/panier/items/:id` | supprimer un item |
| `POST` | `/api/commandes` | creer une commande depuis le panier |
| `POST` | `/api/listes` | creer une liste cadeau |
| `GET` | `/api/listes/mes-listes` | voir ses listes |
| `POST` | `/api/listes/:id/items` | ajouter un item a une liste |
| `POST` | `/api/ouvrages/:id/avis` | laisser un avis apres achat |
| `POST` | `/api/ouvrages/:id/commentaires` | laisser un commentaire |

### Editeur / Gestionnaire / Administrateur

| Methode | Route | Role requis |
|---|---|---|
| `POST` | `/api/categories` | editeur, gestionnaire, administrateur |
| `PUT` | `/api/categories/:id` | editeur, gestionnaire, administrateur |
| `POST` | `/api/ouvrages` | gestionnaire, editeur, administrateur |
| `PUT` | `/api/ouvrages/:id` | gestionnaire, editeur, administrateur |

### Gestionnaire / Administrateur

| Methode | Route | Description |
|---|---|---|
| `DELETE` | `/api/categories/:id` | supprimer une categorie |
| `DELETE` | `/api/ouvrages/:id` | supprimer un ouvrage |
| `PUT` | `/api/commandes/:id/status` | mettre a jour le statut d'une commande |

### Editeur / Administrateur

| Methode | Route | Description |
|---|---|---|
| `GET` | `/api/commentaires/pending` | commentaires en attente |
| `PUT` | `/api/commentaires/:id/valider` | valider ou rejeter un commentaire |

### Administrateur

| Methode | Route | Description |
|---|---|---|
| `GET` | `/api/users` | liste de tous les utilisateurs |

## Exemples de requetes

### Inscription

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"nom\":\"Test\",\"prenom\":\"User\",\"email\":\"test@example.com\",\"password\":\"Bonjour123\"}"
```

### Connexion

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"marie@example.com\",\"password\":\"Client123!\"}"
```

### Profil utilisateur

```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### Ajouter au panier

```bash
curl -X POST http://localhost:3000/api/panier/items \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"ouvrage_id\":1,\"quantite\":2}"
```

### Creer une commande

```bash
curl -X POST http://localhost:3000/api/commandes \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"adresse_livraison\":\"123 rue Sainte-Catherine, Montreal\",\"mode_livraison\":\"standard\",\"mode_paiement\":\"stripe\"}"
```

## Collection Postman

Le repo contient une collection importable ici :

[`../docs/livresgourmands_postman_collection.json`](C:/Users/18197/Downloads/PROJET_PWA_ETAPE_2/livresgourmands/docs/livresgourmands_postman_collection.json)

Elle inclut :

- variables de base (`baseUrl`, `clientToken`, `editorToken`, `managerToken`, `adminToken`)
- requetes de login qui enregistrent automatiquement les JWT
- dossiers par domaine fonctionnel
- exemples prets a tester pour chaque role

## Remarques

- Les routes HTML existent pour certaines pages publiques quand l'en-tete `Accept: text/html` est envoye.
- Les mots de passe ne sont jamais recuperables depuis `password_hash` seul ; ils sont connus ici uniquement parce qu'ils sont definis dans les scripts du projet.
- Le projet peut etre enrichi avec un `.env.example`, des tests automatises et une CI GitHub Actions.
