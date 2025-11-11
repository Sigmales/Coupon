-- =============================================
-- SCRIPT POUR CRÉER UN COMPTE ADMINISTRATEUR
-- =============================================
-- Ce script crée automatiquement un utilisateur admin
-- Email: yantoubri@gmail.com
-- Mot de passe par défaut: AdminCoupon2024!

-- IMPORTANT: 
-- Supabase ne permet pas de créer directement un utilisateur avec mot de passe via SQL
-- car les mots de passe doivent être hashés par le système d'authentification.
-- 
-- Vous devez créer l'utilisateur via l'interface Supabase, puis exécuter la partie UPDATE ci-dessous.

-- =============================================
-- ÉTAPE 1: Créer l'utilisateur via l'interface Supabase
-- =============================================
-- 1. Allez dans Authentication → Users
-- 2. Cliquez sur "Add user" → "Create new user"
-- 3. Email: yantoubri@gmail.com
-- 4. Password: AdminCoupon2024!
-- 5. Auto Confirm User: ✅ OUI
-- 6. Cliquez sur "Create user"

-- =============================================
-- ÉTAPE 2: Promouvoir en administrateur (Exécutez cette partie)
-- =============================================

-- Promouvoir l'utilisateur en admin
UPDATE public.users 
SET is_admin = true 
WHERE email = 'yantoubri@gmail.com';

-- Vérifier que l'utilisateur existe et est admin
SELECT 
  id, 
  email, 
  username, 
  is_admin, 
  is_vip,
  created_at 
FROM public.users 
WHERE email = 'yantoubri@gmail.com';

-- =============================================
-- INFORMATIONS DE CONNEXION
-- =============================================
-- Email: yantoubri@gmail.com
-- Mot de passe: AdminCoupon2024!
-- 
-- ⚠️ IMPORTANT: Changez ce mot de passe après la première connexion !

-- =============================================
-- ALTERNATIVE: Créer via API (si vous avez accès)
-- =============================================
-- Vous pouvez aussi créer l'utilisateur via l'API Supabase en utilisant
-- la fonction auth.admin.createUser() dans une Edge Function ou via HTTP
