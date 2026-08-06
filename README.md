# 🚀 Smart Business Assistant

Application web intelligente d'analyse des données commerciales basée sur l'IA.

---

## 📁 Structure du Projet

```
smart-business-assistant/
├── frontend/           # Next.js 14 + Tailwind CSS + Recharts
├── backend/            # Node.js + Express + JWT
├── ai/                 # Python Flask + Scikit-learn
└── README.md
```

---

## 🛠️ Installation & Lancement

### Option 1 : Lancement rapide (Frontend seul)
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Option 2 : Lancement complet

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Backend
```bash
cd backend
npm install
npm start
# → http://localhost:5000
```

#### Module IA
```bash
cd ai
pip install -r requirements.txt
python app.py
# → http://localhost:8000
```

---

## 🔑 Compte Démo
- **Email** : demo@smartbusiness.com
- **Mot de passe** : demo123

---

## 📊 Fonctionnalités

| Module | Description |
|--------|-------------|
| 📊 Tableau de Bord | KPIs, graphiques ventes, alertes temps réel |
| 📈 Analyse Ventes | Ventes vs objectifs, top produits, tableau détaillé |
| 📦 Produits & Stock | CRUD produits, gestion stock, alertes rupture |
| 💬 Avis Clients | Analyse NLP sentiment, notes, distribution |
| 🔮 Prédictions IA | Régression polynomiale, horizon 3-6 mois |
| ⚠️ Anomalies | Détection ruptures, baisses, stock faible |
| 💡 Recommandations | Actions IA automatiques, suivi d'implémentation |
| 👤 Profil | Gestion compte, sécurité |

---

## 🏗️ Architecture Technique

```
┌─────────────────┐    REST API    ┌─────────────────┐
│   Next.js 14    │ ◄────────────► │  Express.js API │
│   Tailwind CSS  │                │  JWT Auth       │
│   Recharts      │                │  Port: 5000     │
│   Port: 3000    │                └─────────────────┘
└─────────────────┘                        │
                                           │ HTTP
                                           ▼
                                ┌─────────────────┐
                                │  Python Flask   │
                                │  Scikit-learn   │
                                │  Pandas/NumPy   │
                                │  Port: 8000     │
                                └─────────────────┘
```

---

## 🤖 Module IA - Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/health` | GET | Status du module |
| `/predict?horizon=6` | GET | Prédictions ventes |
| `/sentiment` | POST | Analyse sentiment texte |
| `/anomalies` | POST | Détection anomalies |
| `/analyze` | POST | Analyse complète |

---

## 🎨 Technologies

- **Frontend** : Next.js 14, React 18, Tailwind CSS, Recharts, Lucide Icons
- **Backend** : Node.js, Express, JWT, bcrypt, Multer
- **IA** : Python, Flask, Scikit-learn, Pandas, NumPy
- **Base de données** : MySQL/PostgreSQL (à configurer en production)

---

## 📝 Variables d'Environnement

### Backend (.env)
```env
PORT=5000
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:3000
DATABASE_URL=mysql://user:pass@localhost:3306/sba_db
AI_MODULE_URL=http://localhost:8000
```

### IA (.env)
```env
PORT=8000
```

---

*Projet de Fin d'Études — Smart Business Assistant*
