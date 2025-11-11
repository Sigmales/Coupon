# 👨‍💼 Guide : Créer un compte Administrateur

## Méthode 1 : Via l'interface Supabase (Recommandé)

### Étape 1 : Créer l'utilisateur

1. Allez dans votre projet Supabase
2. Cliquez sur **Authentication** dans le menu de gauche
3. Cliquez sur **Users** (ou **Utilisateurs**)
4. Cliquez sur le bouton **"Add user"** ou **"Add new user"**
5. Sélectionnez **"Create new user"**
6. Remplissez le formulaire :
   - **Email**: `yantoubri@gmail.com`
   - **Password**: Choisissez un mot de passe sécurisé (ex: `Admin123!`)
   - **Auto Confirm User**: ✅ **Cochez cette case** (important pour éviter la confirmation d'email)
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

## Méthode 2 : Via l'application (Alternative)

1. Inscrivez-vous dans l'application avec `yantoubri@gmail.com` et votre mot de passe
2. Ensuite, exécutez la requête SQL ci-dessus pour promouvoir en admin

## 🔐 Informations de connexion

Une fois créé, vous pourrez vous connecter avec :
- **Email**: `yantoubri@gmail.com`
- **Mot de passe**: Le mot de passe que vous avez défini

## ✅ Vérification

Après connexion, vous devriez voir :
- Le bouton **"Admin"** dans le header
- Accès au Dashboard Administrateur
- Toutes les fonctionnalités admin disponibles

## 🔒 Sécurité

- Le mot de passe est automatiquement hashé par Supabase
- Ne partagez jamais votre mot de passe
- Changez-le régulièrement
- Utilisez un mot de passe fort (minimum 8 caractères, majuscules, minuscules, chiffres, symboles)

