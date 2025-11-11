-- =============================================
-- SCRIPT DE CORRECTION - Ajouter la colonne is_vip_only
-- =============================================
-- Exécutez ce script si vous avez l'erreur "column is_vip_only does not exist"

-- Vérifier et ajouter la colonne is_vip_only si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'predictions' 
        AND column_name = 'is_vip_only'
    ) THEN
        ALTER TABLE public.predictions 
        ADD COLUMN is_vip_only BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Colonne is_vip_only ajoutée à la table predictions';
    ELSE
        RAISE NOTICE 'La colonne is_vip_only existe déjà';
    END IF;
END $$;

-- Vérifier et ajouter l'index si nécessaire
CREATE INDEX IF NOT EXISTS idx_predictions_vip ON public.predictions(is_vip_only);

-- Vérifier et ajouter la colonne vip_level_required si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'predictions' 
        AND column_name = 'vip_level_required'
    ) THEN
        ALTER TABLE public.predictions 
        ADD COLUMN vip_level_required TEXT CHECK (vip_level_required IN ('standard', 'premium'));
        
        RAISE NOTICE 'Colonne vip_level_required ajoutée à la table predictions';
    ELSE
        RAISE NOTICE 'La colonne vip_level_required existe déjà';
    END IF;
END $$;

-- Vérifier et ajouter la colonne confidence_level si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'predictions' 
        AND column_name = 'confidence_level'
    ) THEN
        ALTER TABLE public.predictions 
        ADD COLUMN confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5);
        
        RAISE NOTICE 'Colonne confidence_level ajoutée à la table predictions';
    ELSE
        RAISE NOTICE 'La colonne confidence_level existe déjà';
    END IF;
END $$;

-- Vérifier et ajouter la colonne avatar_url à users si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN avatar_url TEXT;
        
        RAISE NOTICE 'Colonne avatar_url ajoutée à la table users';
    ELSE
        RAISE NOTICE 'La colonne avatar_url existe déjà';
    END IF;
END $$;

-- Afficher un message de confirmation
SELECT 'Migration terminée avec succès!' as status;

