-- =============================================
-- SCRIPT POUR CRÉER UN COMPTE ADMINISTRATEUR
-- =============================================
-- Ce script crée un utilisateur admin directement dans Supabase
-- 
-- IMPORTANT: Exécutez ce script dans Supabase SQL Editor
-- 
-- Remplacez 'VotreMotDePasse123!' par le mot de passe souhaité
-- Le mot de passe sera automatiquement hashé par Supabase

-- Méthode 1: Créer l'utilisateur via l'extension auth (Recommandé)
-- Note: Cette méthode nécessite d'utiliser l'API Supabase ou l'interface

-- Méthode 2: Créer via l'interface Supabase (Plus simple)
-- 1. Allez dans Authentication → Users
-- 2. Cliquez sur "Add user" → "Create new user"
-- 3. Email: yantoubri@gmail.com
-- 4. Password: votre mot de passe
-- 5. Auto Confirm User: OUI (pour éviter la confirmation d'email)
-- 6. Cliquez sur "Create user"
-- 
-- Ensuite, exécutez cette requête pour le promouvoir en admin:
UPDATE public.users 
SET is_admin = true 
WHERE email = 'yantoubri@gmail.com';

-- Vérifier que l'utilisateur a été créé et promu admin
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
-- ALTERNATIVE: Créer directement via SQL (Avancé)
-- =============================================
-- ATTENTION: Cette méthode nécessite des permissions spéciales
-- et le hashage du mot de passe avec bcrypt

-- D'abord, créez l'utilisateur via l'interface Supabase ou l'API
-- Puis exécutez seulement la partie UPDATE ci-dessus

