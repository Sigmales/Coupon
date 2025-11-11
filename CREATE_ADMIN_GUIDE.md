# 👨‍💼 Guide : Créer un compte Administrateur

## 📋 Informations du compte admin par défaut

- **Email**: `yantoubri@gmail.com`
- **Mot de passe par défaut**: `AdminCoupon2024!`
- **Statut**: Administrateur (après promotion)

⚠️ **IMPORTANT**: Changez ce mot de passe après la première connexion !

## 🚀 Méthode rapide : Via l'interface Supabase

### Étape 1 : Créer l'utilisateur

1. Allez dans votre projet Supabase
2. Cliquez sur **Authentication** dans le menu de gauche
3. Cliquez sur **Users** (ou **Utilisateurs**)
4. Cliquez sur le bouton **"Add user"** ou **"Add new user"**
5. Sélectionnez **"Create new user"**
6. Remplissez le formulaire :
   - **Email**: `yantoubri@gmail.com`
   - **Password**: `AdminCoupon2024!`
   - **Auto Confirm User**: ✅ **Cochez cette case** (très important !)
7. Cliquez sur **"Create user"**

### Étape 2 : Promouvoir en administrateur

1. Allez dans **SQL Editor** dans Supabase
2. Créez une nouvelle requête
3. Copiez-collez ce code :

```sql
UPDATE public.users 
SET is_admin = true 
WHERE email = 'yantoubri@gmail.com';
```

4. Cliquez sur **Run** (ou F5)
5. Vous devriez voir "Success. No rows returned"

### Étape 3 : Vérifier

Exécutez cette requête pour vérifier :

```sql
SELECT 
  id, 
  email, 
  username, 
  is_admin, 
  is_vip,
  created_at 
FROM public.users 
WHERE email = 'yantoubri@gmail.com';
```

Vous devriez voir `is_admin = true`

## 🔐 Connexion

Une fois créé, connectez-vous avec :
- **Email**: `yantoubri@gmail.com`
- **Mot de passe**: `AdminCoupon2024!`

## ✅ Vérification après connexion

Après connexion, vous devriez voir :
- ✅ Le bouton **"Admin"** dans le header (en haut à droite)
- ✅ Accès au Dashboard Administrateur
- ✅ Toutes les fonctionnalités admin disponibles

## 🔒 Sécurité - Changez le mot de passe !

**IMPORTANT**: Après votre première connexion, changez immédiatement le mot de passe :

1. Connectez-vous avec le mot de passe par défaut
2. Allez dans votre profil (si vous ajoutez cette fonctionnalité)
3. Ou utilisez la fonction "Reset password" de Supabase

## 📝 Alternative : Créer via l'application

Si vous préférez :

1. Inscrivez-vous dans l'application avec `yantoubri@gmail.com` et le mot de passe `AdminCoupon2024!`
2. Ensuite, exécutez la requête SQL ci-dessus pour promouvoir en admin

## 🛠️ Dépannage

### L'utilisateur n'existe pas encore
- Créez-le d'abord via l'interface Supabase (Étape 1)
- Puis exécutez la requête UPDATE

### Le bouton Admin n'apparaît pas
- Vérifiez que `is_admin = true` dans la base de données
- Déconnectez-vous et reconnectez-vous
- Videz le cache du navigateur

### Erreur "Email not confirmed"
- Assurez-vous d'avoir coché "Auto Confirm User" lors de la création
- Ou désactivez la confirmation d'email dans Authentication → Settings
