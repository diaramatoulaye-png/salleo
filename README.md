# SALLEO — Plateforme de réservation de salles UAM

Plateforme web de gestion et de réservation en ligne des salles de l'Université Amadou Mahtar Mbow (UAM), développée pour centraliser la planification des espaces, éliminer les conflits d'occupation et simplifier le travail des gestionnaires.

## Contexte

La réservation des salles reposait jusqu'ici sur des pratiques informelles (demandes par message, passages physiques), source de doubles réservations et de manque de visibilité sur l'occupation réelle des espaces. SALLEO centralise ce processus dans une plateforme unique, avec détection automatique des conflits de créneaux.

## Fonctionnalités principales

- **Authentification sécurisée** (JWT, mots de passe hashés)
- **4 rôles** : étudiant, enseignant, personnel administratif, responsable de département
- **Statut « responsable de classe »** pour un étudiant, avec droit de réserver au nom de son groupe
- **Suggestion intelligente de salle** selon l'effectif renseigné
- **Détection automatique des conflits de créneaux** à la création et à la validation d'une réservation
- **Consultation des disponibilités** d'une salle avant réservation
- **Modification et annulation** des réservations
- **Tableau de bord administratif** : validation/refus des demandes, gestion du parc de salles, statistiques d'occupation
- **Vue en lecture seule** pour le responsable de département sur les réservations de son département

## Stack technique

| Côté | Technologies |
|---|---|
| Front-end | HTML5, CSS3, JavaScript (vanilla) |
| Back-end | Node.js, Express.js |
| Base de données | PostgreSQL |
| Authentification | JWT (access + refresh tokens), bcrypt |

## Structure du projet
salleo/
├── src/
│ ├── server.js # point d'entrée de l'API
│ ├── config/db.js # connexion PostgreSQL
│ ├── middlewares/ # authentification, gestion des erreurs
│ ├── models/ # requêtes SQL (users, salles, reservations)
│ ├── controllers/ # logique métier
│ ├── routes/ # routes Express
│ └── db/
│ ├── schema.sql # schéma de base de données
│ └── seedAdmin.js # script de création des comptes administratif/responsable
└── public/
├── index.html / script.js # interface étudiant / enseignant
├── admin.html / admin.js # interface administration
├── departement.html / .js # interface responsable de département
└── style.css # thème UAM (bleu / terracotta)

## Installation et lancement

### Prérequis
- Node.js (v18+)
- PostgreSQL

### Étapes

```bash
# 1. Installer les dépendances
npm install

# 2. Créer la base de données
createdb salleo

# 3. Configurer les variables d'environnement
# Copier .env.example vers .env et adapter les identifiants PostgreSQL

# 4. Lancer la migration (création des tables)
npm run migrate

# 4bis. Insérer un jeu de salles de démonstration
psql -h localhost -U postgres -d salleo -f src/db/seedSalles.sql

# 5. Créer un compte administratif (aucune inscription publique pour ce rôle)
node src/db/seedAdmin.js "Nom Complet" admin@uam.sn motdepasse administratif

# 6. Lancer le serveur
npm run dev
```

Le site est accessible sur `http://localhost:4000` :
- `/` — interface étudiant / enseignant
- `/admin.html` — interface administration
- `/departement.html` — interface responsable de département

## Rôles et permissions

| Rôle | Peut réserver | Peut valider/refuser | Peut annuler toute réservation | Vue département |
|---|:---:|:---:|:---:|:---:|
| Étudiant | Non (sauf responsable de classe) | Non | Non | Non |
| Étudiant responsable de classe | Oui | Non | Non | Non |
| Enseignant | Oui | Non | Non | Non |
| Administratif | — | Oui | Oui | Non |
| Responsable de département | — | Non | Non | Oui (lecture seule) |

## Auteur

Ramatoulaye Dia — L3 DSTI, Polytech Diamniadio, UAM

## Document de cadrage

Le cahier des charges complet du projet est disponible dans ce dépôt (`Cahier-des-Charges-SALLEO.pdf`).
