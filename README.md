# MicroFinance App

Application microfinance avec backend Node/Express et frontend React/Vite.

## Structure du projet

- `backend/` : serveur Express, routes, connexion MySQL
- `frontend/` : application React avec Vite

## Préparation pour GitHub

1. Installer Git si ce n’est pas déjà fait :
   - https://git-scm.com/

2. Vérifier le dépôt Git local :
   - `git status`

3. Ajouter les fichiers :
   - `git add .`

4. Faire un commit :
   - `git commit -m "Préparation du projet pour GitHub"`

5. Créer un dépôt sur GitHub et lier le remote :
   - `git remote add origin https://github.com/TON_UTILISATEUR/NOM_DU_DEPOT.git`

6. Envoyer sur GitHub :
   - `git push -u origin main`

> Si ta branche principale s’appelle `master`, remplace `main` par `master`.

## Fichiers importants

- `.gitignore` : ignore les fichiers `node_modules/`, `*.env`, les logs, et les dossiers de build
- `backend/.env.example` : modèle pour les variables d’environnement

## Configuration locale

Dans `backend/`, crée un fichier `.env` en copiant `backend/.env.example` :

```bash
cd backend
copy .env.example .env
```

Puis adapte les valeurs :

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `PORT`

## Démarrage du projet

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Remarques

- Ne commite jamais le fichier `backend/.env`
- `backend/.env.example` peut être commité pour partager la configuration sans les secrets
