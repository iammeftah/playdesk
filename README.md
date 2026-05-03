# 🎮 PlayDesk — Système de Gestion de Salle de Jeux
## Spécification Complète — v2.0 (finalisée)

---

## 1. Résumé du Projet

**PlayDesk** est une application de bureau Windows (développée et testée sous Ubuntu),
conçue pour gérer les opérations d'une salle de jeux — facturation des sessions PS5,
contrôle d'accès du personnel, et analytiques métier.
Elle fonctionne entièrement **hors ligne** après activation, protégée par un système de
licence à clé de série avec empreinte machine.

**Langue de l'interface :** Français  
**Alertes sonores :** Web Audio API (aucun fichier MP3)  
**Impression :** Aucune — affichage écran uniquement  
**Développement :** Ubuntu / Vite dev server + Electron  
**Distribution :** Windows `.exe` via electron-builder  

---

## 2. Concepts Clés

| Concept | Description |
|---|---|
| **Station** | Une PS5 identifiée par un numéro (ex: PS5-1). Configurable par l'admin. |
| **Session** | Unité de facturation liée à une station — 3 types : Match, Temps, Libre. |
| **Caisse** | Écran principal de gestion des stations (vue manager). |
| **Shift** | Période pendant laquelle un manager est connecté et actif. |

---

## 3. Rôles Utilisateurs

### 3.1 Admin
- Accès complet à toutes les fonctionnalités
- Créer / modifier / désactiver les comptes managers
- Ajouter / supprimer / renommer les stations PS5
- Configurer les tarifs
- Accès au tableau de bord et aux analytiques
- Consulter l'historique complet des sessions

### 3.2 Manager
- Accès à la Caisse uniquement
- Démarrer, gérer et clôturer les sessions
- Voir le statut des stations en temps réel
- Pas d'accès au dashboard, à la config tarifaire, ni à la gestion utilisateurs

> Les deux rôles utilisent le même PC — authentification via login à l'ouverture de l'app.

---

## 4. Licensing & Installation

### Flux d'activation
1. Tu distribues le fichier `.exe` (ex: via Google Drive)
2. Le client télécharge et lance l'installeur
3. Au premier lancement → écran d'activation avec champ de saisie de clé
4. Le client entre la clé que tu lui as fournie
5. L'app valide la clé contre une **liste chiffrée AES-256 embarquée dans le binaire**
6. En cas de succès : la clé est marquée comme consommée + empreinte machine enregistrée
7. Les prochains lancements ne demandent plus la clé (stockée en DB locale)

### Format des clés
```
PLAY-XXXX-XXXX-XXXX
```

### Sécurité
- Liste de clés chiffrée AES-256, embarquée à la compilation
- Chaque clé n'active **qu'une seule installation**
- Fingerprint matériel via `node-machine-id` lié à la clé lors de l'activation
- Copier le dossier sur un autre PC → détection mismatch → re-activation requise
- Clés hashées en DB après activation — non réversibles

### Outil Key Generator (privé — pour toi uniquement)
- Script Node.js CLI : `generate <n>`, `list`, `export`
- Génère les clés, les chiffre, produit le fichier à embedder dans l'app
- Ne jamais distribuer cet outil

---

## 5. Gestion des Stations

- L'admin peut ajouter des stations PS5-1 à PS5-N (nombre configurable)
- Chaque station : **nom**, **statut** (Libre / Active / En pause / Temps écoulé), **indicateur coloré**
- Désactivation temporaire possible (maintenance) sans suppression
- Affichage en grille sur l'écran Caisse

---

## 6. Types de Sessions & Facturation

### 6.1 Par Match (ex: FIFA)

| Durée du match | Prix |
|---|---|
| 6 minutes | 7 MAD |
| 7 minutes | 8 MAD |
| 8 minutes et plus | 10 MAD |

- Compteur de matchs incrémenté manuellement (+1) par le manager
- **Total = nombre de matchs × prix par match**

### 6.2 Par Temps (Prépayé)

| Durée | Prix |
|---|---|
| 30 minutes | 15 MAD |
| 1 heure | 30 MAD |
| 2 heures | 60 MAD |
| Personnalisé | prorata de 30 MAD/h |

- Compte à rebours visible sur la carte de la station
- Alerte visuelle + bip sonore à expiration et 5 min avant
- **Total = durée × 30 MAD/heure**

### 6.3 Jeu Libre (Chronomètre ouvert)

- Chronomètre croissant jusqu'à ce que le manager clique "Terminer"
- **Total = temps écoulé × 30 MAD/heure** (à la minute près)

---

## 7. Écran Caisse (Vue Manager)

### Carte de station
- Nom + badge statut : `LIBRE` / `ACTIVE` / `EN PAUSE` / `TEMPS ÉCOULÉ`
- Badge type de session
- Chronomètre live (compte à rebours ou croissant)
- Montant estimé mis à jour chaque seconde
- Boutons contextuels : Démarrer / +1 Match / Pause / Reprendre / Terminer

### Flux démarrage
Clic sur carte → Modal (type + options) → "Démarrer" → session créée, chrono démarre

### Flux fin de session
"Terminer" → Popup récapitulatif (durée/matchs + total MAD + note optionnelle) → "Confirmer"

### Alertes sonores (Web Audio API)
- Bip à 5 min avant la fin d'une session Par Temps
- Bip de fin à expiration
- Bip long si session > seuil configurable (défaut 3h)

---

## 8. Tableau de Bord (Admin uniquement)

| Section | Contenu |
|---|---|
| **Résumé du jour** | CA total, sessions par type, station la plus active, durée moyenne |
| **Graphique revenus** | Journalier / Hebdomadaire / Mensuel (Recharts) |
| **Attendu vs Réel** | Détecte les écarts de facturation |
| **Historique** | Journal filtrable (date, station, manager, type) |
| **Activité managers** | Connexions, sessions gérées, revenus générés |
| **Utilisation stations** | % uptime, heatmap heures de pointe |

---

## 9. Paramètres (Admin uniquement)

- **Stations** : Ajouter, renommer, désactiver
- **Utilisateurs** : Créer / modifier / désactiver managers
- **Tarifs** : Prix par durée de match + tarif horaire
- **App** : Statut licence, ID machine, version

---

## 10. Stack Technique (Finalisée)

| Couche | Choix |
|---|---|
| Shell Desktop | Electron 29 |
| Frontend | React 18 + TypeScript |
| Style | Tailwind CSS v3 |
| État global | Zustand |
| Base de données | SQLite via `better-sqlite3` |
| ORM | Drizzle ORM |
| Auth | bcryptjs + token en mémoire |
| Licence | AES-256 + `node-machine-id` |
| Packaging | electron-builder (NSIS → `.exe`) |
| Graphiques | Recharts |
| Dev tooling | Vite 5 + concurrently + wait-on |

---

## 11. Structure Complète du Projet

```
playdesk/
│
├── electron/                          # Processus principal Electron (Node.js)
│   ├── main/
│   │   └── index.ts                   # Point d'entrée Electron, création fenêtre
│   ├── preload/
│   │   └── index.ts                   # Pont IPC sécurisé (contextBridge)
│   ├── ipc/
│   │   ├── auth.ts                    # Login, logout, session
│   │   ├── licensing.ts               # Validation clé, fingerprint machine
│   │   ├── stations.ts                # CRUD stations
│   │   ├── sessions.ts                # Start/end/pause sessions, compteurs
│   │   ├── dashboard.ts               # Requêtes analytiques
│   │   └── users.ts                   # Gestion utilisateurs (admin)
│   └── db/
│       ├── client.ts                  # Initialisation better-sqlite3
│       ├── schema.ts                  # Schéma Drizzle (tables, types)
│       ├── seed.ts                    # Seed admin par défaut
│       └── migrations/
│           └── 0001_init.sql          # Migration initiale
│
├── src/                               # Frontend React
│   ├── main.tsx                       # Point d'entrée React
│   ├── App.tsx                        # Router : Activation → Login → App
│   ├── index.css                      # Tailwind directives + CSS globaux
│   ├── pages/
│   │   ├── ActivationPage.tsx         # Saisie clé de série (premier lancement)
│   │   ├── LoginPage.tsx              # Authentification
│   │   ├── CaissePage.tsx             # Vue principale manager
│   │   └── DashboardPage.tsx          # Tableau de bord admin
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TitleBar.tsx           # Barre de titre custom (minimize/max/close)
│   │   │   ├── Sidebar.tsx            # Navigation latérale admin
│   │   │   └── AppShell.tsx           # Layout wrapper
│   │   ├── station/
│   │   │   ├── StationCard.tsx        # Carte d'une station
│   │   │   ├── StationGrid.tsx        # Grille de toutes les stations
│   │   │   └── StationBadge.tsx       # Badge de statut coloré
│   │   ├── session/
│   │   │   ├── StartSessionModal.tsx  # Modal démarrage de session
│   │   │   ├── EndSessionModal.tsx    # Modal clôture + récapitulatif
│   │   │   └── SessionTimer.tsx       # Timer (compte à rebours / croissant)
│   │   ├── dashboard/
│   │   │   ├── SummaryCards.tsx       # KPI cards du jour
│   │   │   ├── RevenueChart.tsx       # Graphique revenus
│   │   │   ├── StationUtilization.tsx # Utilisation par station
│   │   │   ├── PeakHoursHeatmap.tsx   # Heatmap heures de pointe
│   │   │   └── SessionHistory.tsx     # Tableau historique filtrable
│   │   └── common/
│   │       ├── Modal.tsx              # Modal réutilisable
│   │       ├── Button.tsx             # Bouton avec variantes
│   │       ├── Badge.tsx              # Badge générique
│   │       └── ConfirmDialog.tsx      # Dialog de confirmation
│   ├── store/
│   │   ├── authStore.ts               # Utilisateur connecté, rôle
│   │   ├── sessionStore.ts            # Sessions actives, timers
│   │   ├── stationStore.ts            # Liste et statut des stations
│   │   └── licenseStore.ts            # Statut de la licence
│   ├── lib/
│   │   ├── ipc.ts                     # Wrappers typés autour de window.playdesk
│   │   ├── audio.ts                   # Générateur de bips Web Audio API
│   │   ├── pricing.ts                 # Calcul des montants par type de session
│   │   └── utils.ts                   # Formatage temps, MAD, dates
│   └── types/
│       └── index.ts                   # Types partagés (Session, Station, User...)
│
├── tools/
│   └── key-generator/                 # CLI privé de génération de clés
│       ├── index.ts
│       ├── crypto.ts
│       └── package.json
│
├── resources/
│   └── icon.ico                       # Icône Windows
│
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json                      # TypeScript frontend
├── tsconfig.electron.json             # TypeScript Electron main/preload
├── tsconfig.node.json                 # TypeScript vite.config
├── package.json
└── README.md
```

---

## 12. Commande de Scaffold — Ubuntu

Lance cette commande **depuis le dossier parent** où tu veux créer le projet :

```bash
mkdir -p playdesk && cd playdesk && \
mkdir -p \
  electron/main \
  electron/preload \
  electron/ipc \
  electron/db/migrations \
  src/pages \
  src/components/layout \
  src/components/station \
  src/components/session \
  src/components/dashboard \
  src/components/common \
  src/store \
  src/lib \
  src/types \
  tools/key-generator \
  resources && \
touch \
  electron/main/index.ts \
  electron/preload/index.ts \
  electron/ipc/auth.ts \
  electron/ipc/licensing.ts \
  electron/ipc/stations.ts \
  electron/ipc/sessions.ts \
  electron/ipc/dashboard.ts \
  electron/ipc/users.ts \
  electron/db/client.ts \
  electron/db/schema.ts \
  electron/db/seed.ts \
  electron/db/migrations/0001_init.sql \
  src/main.tsx \
  src/App.tsx \
  src/index.css \
  src/pages/ActivationPage.tsx \
  src/pages/LoginPage.tsx \
  src/pages/CaissePage.tsx \
  src/pages/DashboardPage.tsx \
  src/components/layout/TitleBar.tsx \
  src/components/layout/Sidebar.tsx \
  src/components/layout/AppShell.tsx \
  src/components/station/StationCard.tsx \
  src/components/station/StationGrid.tsx \
  src/components/station/StationBadge.tsx \
  src/components/session/StartSessionModal.tsx \
  src/components/session/EndSessionModal.tsx \
  src/components/session/SessionTimer.tsx \
  src/components/dashboard/SummaryCards.tsx \
  src/components/dashboard/RevenueChart.tsx \
  src/components/dashboard/StationUtilization.tsx \
  src/components/dashboard/PeakHoursHeatmap.tsx \
  src/components/dashboard/SessionHistory.tsx \
  src/components/common/Modal.tsx \
  src/components/common/Button.tsx \
  src/components/common/Badge.tsx \
  src/components/common/ConfirmDialog.tsx \
  src/store/authStore.ts \
  src/store/sessionStore.ts \
  src/store/stationStore.ts \
  src/store/licenseStore.ts \
  src/lib/ipc.ts \
  src/lib/audio.ts \
  src/lib/pricing.ts \
  src/lib/utils.ts \
  src/types/index.ts \
  tools/key-generator/index.ts \
  tools/key-generator/crypto.ts \
  tools/key-generator/package.json \
  index.html \
  vite.config.ts \
  tailwind.config.js \
  postcss.config.js \
  tsconfig.json \
  tsconfig.electron.json \
  tsconfig.node.json \
  package.json \
  README.md && \
echo "✅ PlayDesk — structure créée avec succès !"
```

---

## 13. Lancer l'App en Développement (Ubuntu)

### Prérequis

```bash
# Vérifier Node.js 20+
node -v

# Installer les outils de build natifs (requis pour better-sqlite3)
sudo apt install python3 make g++ -y

# Installer les dépendances
npm install
```

### Démarrer

```bash
npm run dev
```

Ce que ça fait :
1. **Vite** démarre → React disponible sur `http://localhost:5173` avec hot reload
2. **wait-on** attend que Vite soit prêt
3. **Electron** compile le TypeScript du main process puis ouvre une fenêtre sur `localhost:5173`

Les changements dans `src/` → rechargement instantané  
Les changements dans `electron/` → relancer `npm run dev`

### Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Développement (Vite + Electron en parallèle) |
| `npm run build` | Compile React + Electron TypeScript |
| `npm run dist:win` | Produit le `.exe` Windows (nécessite Wine sur Ubuntu) |
| `npm run typecheck` | Vérification TypeScript sans compilation |

### Compiler le `.exe` depuis Ubuntu

```bash
# Installer Wine (nécessaire pour electron-builder cross-compile)
sudo apt install wine64 -y

# Générer l'installeur Windows
npm run dist:win
# → Le .exe se trouve dans /release/
```

---

## 14. Base de Données

- Fichier SQLite : `~/.config/playdesk/playdesk.db` (Linux dev) / `%APPDATA%\playdesk\playdesk.db` (Windows)
- Créée et migrée automatiquement au premier lancement
- **Compte admin par défaut** : `admin` / `admin123` — à changer au premier login

---

*Document version: 2.0 — toutes décisions finalisées — prêt à coder*
# playdesk
# playdesk
