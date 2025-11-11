# 🔧 Configuration Supabase pour COUPON

## ⚠️ Problème : "Email not confirmed"

Si vous rencontrez l'erreur "Email not confirmed" lors de la connexion, c'est parce que Supabase nécessite par défaut la confirmation d'email.

## ✅ Solution 1 : Désactiver la confirmation d'email (Recommandé pour le développement)

1. Allez dans votre projet Supabase
2. Cliquez sur **Authentication** dans le menu de gauche
3. Allez dans **Settings** (ou **Configuration**)
4. Dans la section **Email Auth**, trouvez **"Enable email confirmations"**
5. **Désactivez** cette option
6. Cliquez sur **Save**

Maintenant, les utilisateurs pourront se connecter immédiatement après l'inscription sans confirmer leur email.

## ✅ Solution 2 : Garder la confirmation d'email (Recommandé pour la production)

Si vous voulez garder la confirmation d'email (plus sécurisé) :

1. Laissez "Enable email confirmations" activé
2. Configurez votre SMTP dans Supabase :
   - Allez dans **Authentication** → **Email Templates**
   - Configurez votre service SMTP (Gmail, SendGrid, etc.)
   - Ou utilisez le SMTP par défaut de Supabase (limité)

3. Les utilisateurs recevront un email de confirmation après l'inscription
4. Ils devront cliquer sur le lien dans l'email avant de pouvoir se connecter

## 🔐 Configuration SMTP (Optionnel)

Pour utiliser votre propre service email :

1. Allez dans **Authentication** → **Settings**
2. Scrollez jusqu'à **SMTP Settings**
3. Configurez :
   - **Host**: smtp.gmail.com (pour Gmail)
   - **Port**: 587
   - **Username**: votre email
   - **Password**: votre mot de passe d'application
   - **Sender email**: l'email qui enverra les confirmations
   - **Sender name**: Nom d'affichage

**Note pour Gmail** : Vous devrez créer un "App Password" dans votre compte Google.

## 📧 Templates d'email personnalisés

Vous pouvez personnaliser les emails de confirmation :

1. Allez dans **Authentication** → **Email Templates**
2. Sélectionnez **Confirm signup**
3. Personnalisez le sujet et le contenu
4. Utilisez `{{ .ConfirmationURL }}` pour le lien de confirmation

## 🚀 Pour la production

Pour un environnement de production, il est recommandé de :
- ✅ Garder la confirmation d'email activée
- ✅ Configurer un service SMTP professionnel (SendGrid, Mailgun, etc.)
- ✅ Personnaliser les templates d'email avec votre branding
- ✅ Ajouter une page de redirection après confirmation

## 🔍 Vérifier si un email est confirmé

Dans Supabase SQL Editor, vous pouvez vérifier :
```sql
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'votre@email.com';
```

Si `email_confirmed_at` est NULL, l'email n'est pas encore confirmé.

