-- ============================================================
-- livresgourmands.net — Schéma de base de données
-- 420-WA6-AG | Hiver 2026 | K. TAMAZOUZT
-- ============================================================

CREATE DATABASE IF NOT EXISTS livresgourmands
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE livresgourmands;

-- ------------------------------------------------------------
-- 1. users (Internaute / Client / Éditeur / Gestionnaire / Administrateur)
-- ------------------------------------------------------------
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nom           VARCHAR(100)  NOT NULL,
  prenom        VARCHAR(100),
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  telephone     VARCHAR(20),
  adresse       TEXT,
  role          ENUM('client','editeur','gestionnaire','administrateur') NOT NULL DEFAULT 'client',
  actif         BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role  (role)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. categories
-- ------------------------------------------------------------
CREATE TABLE categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nom         VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 3. ouvrages
-- ------------------------------------------------------------
CREATE TABLE ouvrages (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  titre        VARCHAR(255)   NOT NULL,
  auteur       VARCHAR(150)   NOT NULL,
  isbn         VARCHAR(20)    UNIQUE,
  description  TEXT,
  prix         DECIMAL(10,2)  NOT NULL CHECK (prix >= 0),
  stock        INT            NOT NULL DEFAULT 0 CHECK (stock >= 0),
  categorie_id INT,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_ouvrages_stock       (stock),
  INDEX idx_ouvrages_categorie   (categorie_id),
  FULLTEXT INDEX ft_ouvrages_search (titre, auteur, description)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4. panier (RG2 : actif pendant la session uniquement)
-- ------------------------------------------------------------
CREATE TABLE panier (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  client_id  INT     NOT NULL,
  actif      BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_panier_client (client_id),
  INDEX idx_panier_actif  (actif)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5. panier_items
-- ------------------------------------------------------------
CREATE TABLE panier_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  panier_id     INT            NOT NULL,
  ouvrage_id    INT            NOT NULL,
  quantite      INT            NOT NULL DEFAULT 1 CHECK (quantite > 0),
  prix_unitaire DECIMAL(10,2)  NOT NULL,
  FOREIGN KEY (panier_id)  REFERENCES panier(id)   ON DELETE CASCADE,
  FOREIGN KEY (ouvrage_id) REFERENCES ouvrages(id)  ON DELETE CASCADE,
  UNIQUE KEY uq_panier_ouvrage (panier_id, ouvrage_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 6. commandes
-- ------------------------------------------------------------
CREATE TABLE commandes (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  client_id           INT           NOT NULL,
  date                DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total               DECIMAL(10,2) NOT NULL DEFAULT 0,
  statut              ENUM('en_cours','payee','annulee','expediee') NOT NULL DEFAULT 'en_cours',
  adresse_livraison   TEXT,
  mode_livraison      VARCHAR(50),
  mode_paiement       VARCHAR(50),
  payment_provider_id VARCHAR(255),
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_commandes_client (client_id),
  INDEX idx_commandes_statut (statut)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 7. commande_items
-- ------------------------------------------------------------
CREATE TABLE commande_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  commande_id   INT           NOT NULL,
  ouvrage_id    INT           NOT NULL,
  quantite      INT           NOT NULL CHECK (quantite > 0),
  prix_unitaire DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
  FOREIGN KEY (ouvrage_id)  REFERENCES ouvrages(id)  ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 8. listes_cadeaux (RG7 : code_partage unique)
-- ------------------------------------------------------------
CREATE TABLE listes_cadeaux (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nom             VARCHAR(150) NOT NULL,
  proprietaire_id INT          NOT NULL,
  code_partage    VARCHAR(64)  NOT NULL UNIQUE,
  date_creation   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proprietaire_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_liste_code (code_partage)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 9. liste_items
-- ------------------------------------------------------------
CREATE TABLE liste_items (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  liste_id          INT NOT NULL,
  ouvrage_id        INT NOT NULL,
  quantite_souhaitee INT NOT NULL DEFAULT 1 CHECK (quantite_souhaitee > 0),
  FOREIGN KEY (liste_id)   REFERENCES listes_cadeaux(id) ON DELETE CASCADE,
  FOREIGN KEY (ouvrage_id) REFERENCES ouvrages(id)        ON DELETE CASCADE,
  UNIQUE KEY uq_liste_ouvrage (liste_id, ouvrage_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 10. avis (RG3 : 1 avis par client/ouvrage + vérif achat)
-- ------------------------------------------------------------
CREATE TABLE avis (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  client_id  INT     NOT NULL,
  ouvrage_id INT     NOT NULL,
  note       TINYINT NOT NULL CHECK (note BETWEEN 1 AND 5),
  date       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id)  REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (ouvrage_id) REFERENCES ouvrages(id)  ON DELETE CASCADE,
  UNIQUE KEY uq_avis_client_ouvrage (client_id, ouvrage_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 11. commentaires (RG4 : valide=false par défaut)
-- ------------------------------------------------------------
CREATE TABLE commentaires (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  client_id       INT     NOT NULL,
  ouvrage_id      INT     NOT NULL,
  contenu         TEXT    NOT NULL,
  valide          BOOLEAN NOT NULL DEFAULT FALSE,
  date_soumission DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_validation DATETIME,
  valide_par      INT,
  FOREIGN KEY (client_id)  REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (ouvrage_id) REFERENCES ouvrages(id)  ON DELETE CASCADE,
  FOREIGN KEY (valide_par) REFERENCES users(id)     ON DELETE SET NULL,
  INDEX idx_commentaires_ouvrage (ouvrage_id),
  INDEX idx_commentaires_valide  (valide)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 12. payments (optionnel — référence externe prestataire)
-- ------------------------------------------------------------
CREATE TABLE payments (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  commande_id         INT           NOT NULL,
  provider            VARCHAR(50)   NOT NULL,
  provider_payment_id VARCHAR(255),
  statut              VARCHAR(50)   NOT NULL DEFAULT 'pending',
  amount              DECIMAL(10,2) NOT NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- DONNÉES DE TEST
-- ============================================================

-- Catégories
INSERT INTO categories (nom, description) VALUES
  ('Pâtisserie',    'Recettes de gâteaux, tartes et desserts'),
  ('Cuisine du monde', 'Voyages culinaires à travers les continents'),
  ('Végétarien',    'Recettes sans viande ni poisson'),
  ('Techniques pro','Guides pour chefs et cuisiniers avancés');

-- Utilisateurs (mots de passe = "Password1!" hashés par bcrypt à l'insertion)
-- NOTE : les password_hash ci-dessous sont des placeholders ;
--        utiliser le script seed.js pour insérer avec bcrypt.
INSERT INTO users (nom, prenom, email, password_hash, role) VALUES
  ('Admin',    'Sys',    'admin@livresgourmands.net',  '$PLACEHOLDER_ADMIN',   'administrateur'),
  ('Dupont',   'Marie',  'marie@example.com',           '$PLACEHOLDER_CLIENT',  'client'),
  ('Bernard',  'Paul',   'paul@example.com',            '$PLACEHOLDER_CLIENT2', 'client'),
  ('Leroy',    'Sophie', 'sophie@example.com',          '$PLACEHOLDER_EDITEUR', 'editeur'),
  ('Martin',   'Jean',   'jean@example.com',            '$PLACEHOLDER_GEST',    'gestionnaire');

-- Ouvrages
INSERT INTO ouvrages (titre, auteur, isbn, description, prix, stock, categorie_id) VALUES
  ('Le Grand Livre de la Pâtisserie', 'Lenôtre', '978-2-01-000001-1', 'La référence absolue en pâtisserie française', 49.95, 15, 1),
  ('Cuisines du Monde en 500 Recettes', 'Collectif', '978-2-01-000002-2', 'Tour du monde des saveurs', 35.00, 8, 2),
  ('Végétarien — 200 Recettes Faciles', 'Jade Loren', '978-2-01-000003-3', 'Cuisiner végétarien au quotidien', 22.50, 0, 3),
  ('Techniques de Base en Cuisine Pro', 'Jacques Martin', '978-2-01-000004-4', 'Les fondamentaux pour les chefs', 65.00, 5, 4),
  ('Ma Boulangerie Maison', 'Éric Blanc', '978-2-01-000005-5', 'Pains, brioches et viennoiseries', 28.00, 12, 1);
