# livresgourmands

Depot principal du projet `livresgourmands`, avec le backend API Express/MySQL et les documents de remise.

## Contenu

```text
livresgourmands/
|-- backend/
|   |-- src/
|   |-- scripts/
|   |-- package.json
|   `-- README.md
|-- docs/
|   |-- livresgourmands_postman_collection.json
|   |-- livresgourmanddb.pdf
|   `-- rapport.pdf
|-- .gitignore
`-- README.md
```

## Dossiers

### `backend/`

Contient l'API REST Node.js / Express :

- authentification JWT
- gestion des roles
- categories et ouvrages
- panier et commandes
- listes de cadeaux
- avis et commentaires

Documentation detaillee :

[README backend](C:/Users/18197/Downloads/PROJET_PWA_ETAPE_2/livresgourmands/backend/README.md)

### `docs/`

Contient les documents du projet :

- collection Postman
- schema / documentation PDF de la base
- rapport PDF

## Lancement rapide

```bash
cd backend
npm install
npm run dev
```

API locale :

```text
http://localhost:3000
```

## Base de donnees

Le schema SQL est ici :

[schema.sql](C:/Users/18197/Downloads/PROJET_PWA_ETAPE_2/livresgourmands/backend/scripts/schema.sql)

Comptes de test utilises par le projet :

| Role | Email | Mot de passe |
|---|---|---|
| administrateur | `admin@livresgourmands.net` | `Admin123!` |
| client | `marie@example.com` | `Client123!` |
| client | `paul@example.com` | `Client123!` |
| editeur | `sophie@example.com` | `Editeur123!` |
| gestionnaire | `jean@example.com` | `Gest123!` |

## Postman

Collection a importer :

[livresgourmands_postman_collection.json](C:/Users/18197/Downloads/PROJET_PWA_ETAPE_2/livresgourmands/docs/livresgourmands_postman_collection.json)

## Remarque

Le repository GitHub doit desormais contenir ensemble :

- `backend/`
- `docs/`

pour respecter la structure attendue du projet.
