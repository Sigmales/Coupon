# 🏆 COUPON - Application de Pronostics Football

Application web moderne pour les pronostics de football avec système VIP et abonnements premium.

## ✨ Fonctionnalités

- 🔐 **Authentification complète** avec Supabase
- ⭐ **Système VIP** avec deux niveaux (Standard et Premium)
- 📊 **Pronostics détaillés** avec analyses et cotes
- 💬 **Commentaires et réactions** sur les pronostics
- 👨‍💼 **Dashboard Admin** pour gérer matchs, pronostics et demandes VIP
- 📱 **Interface responsive** avec Tailwind CSS
- 🎨 **Design moderne** et intuitif

## 🚀 Technologies

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Icônes**: Lucide React

## 📋 Prérequis

- Node.js 18+ 
- npm ou yarn
- Compte Supabase

## 🛠️ Installation

1. **Cloner le repository**
```bash
git clone https://github.com/Sigmales/Coupon.git
cd Coupon
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
```

Puis éditez `.env` et ajoutez vos clés :
```env
VITE_SUPABASE_URL=votre-url-supabase
VITE_SUPABASE_ANON_KEY=votre-clé-anon
VITE_GROQ_API_KEY=votre-clé-groq (optionnel - pour les logos d'équipes)
```

**Note**: La clé API Groq est optionnelle. L'application utilise par défaut une API gratuite (TheSportsDB) pour récupérer les logos d'équipes.

4. **Configurer la base de données**
- Ouvrez Supabase SQL Editor
- Copiez le contenu de `supabase-schema-complete.sql`
- Exécutez le script SQL
- Créez le bucket Storage `payment-proofs` (Private)

5. **Lancer l'application**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 📁 Structure du projet

```
coupon-app/
├── src/
│   ├── components/          # Composants React
│   │   ├── AdminPage.tsx
│   │   ├── AuthModal.tsx
│   │   ├── PredictionDetailModal.tsx
│   │   └── VipRequestModal.tsx
│   ├── lib/
│   │   └── supabase.ts      # Configuration Supabase
│   ├── services/
│   │   └── groqService.ts   # Service pour logos d'équipes
│   ├── App.tsx              # Composant principal
│   ├── main.tsx             # Point d'entrée
│   └── index.css            # Styles globaux
├── supabase-schema-complete.sql  # Schéma SQL complet
├── supabase-fix-migration.sql    # Script de migration
└── package.json
```

## 🗄️ Base de données

Le schéma SQL crée les tables suivantes :
- `users` - Utilisateurs avec statut VIP/Admin
- `matches` - Matchs de football
- `predictions` - Pronostics (gratuits et VIP)
- `reactions` - Likes sur les pronostics
- `comments` - Commentaires
- `vip_requests` - Demandes d'abonnement VIP

## 👤 Créer un admin

Après votre première inscription, exécutez dans Supabase SQL Editor :
```sql
UPDATE public.users SET is_admin = true WHERE email = 'votre@email.com';
```

## 🔒 Sécurité

- Row Level Security (RLS) activé sur toutes les tables
- Policies de sécurité configurées
- Variables d'environnement pour les clés API
- Authentification via Supabase Auth

## 📝 Scripts disponibles

- `npm run dev` - Lancer le serveur de développement
- `npm run build` - Build de production
- `npm run preview` - Prévisualiser le build
- `npm run lint` - Linter le code

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

Ce projet est sous licence MIT.

## 👨‍💻 Auteur

**Sigmales**

---

⭐ N'oubliez pas de mettre une étoile si ce projet vous a aidé !

