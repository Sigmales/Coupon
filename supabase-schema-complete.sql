-- =============================================
-- SCHEMA SQL COMPLET POUR SUPABASE - APPLICATION COUPON
-- =============================================
-- Copiez-collez ce code dans l'éditeur SQL de Supabase
-- Exécutez-le en une seule fois ou section par section

-- =============================================
-- 1. TABLES
-- =============================================

-- Table Users (Extension de auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_vip BOOLEAN DEFAULT FALSE,
  vip_level TEXT CHECK (vip_level IN ('standard', 'premium')),
  subscription_end TIMESTAMPTZ,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table Matches
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team1 TEXT NOT NULL,
  team2 TEXT NOT NULL,
  team1_logo TEXT,
  team2_logo TEXT,
  match_date TIMESTAMPTZ NOT NULL,
  league TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table Predictions
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL,
  odds DECIMAL(5,2) NOT NULL CHECK (odds > 0),
  analysis TEXT,
  is_vip_only BOOLEAN DEFAULT FALSE,
  vip_level_required TEXT CHECK (vip_level_required IN ('standard', 'premium')),
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table Reactions (Likes)
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reaction_type TEXT DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prediction_id, user_id)
);

-- Table Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table VIP Requests
CREATE TABLE IF NOT EXISTS public.vip_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  payment_proof_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. INDEXES POUR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(match_date DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON public.predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created ON public.predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_vip ON public.predictions(is_vip_only);
CREATE INDEX IF NOT EXISTS idx_reactions_prediction ON public.reactions(prediction_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON public.reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_prediction ON public.comments(prediction_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_requests_user ON public.vip_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_requests_status ON public.vip_requests(status);

-- =============================================
-- 3. FONCTIONS
-- =============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer un user automatiquement lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le nombre de réactions d'une prédiction
CREATE OR REPLACE FUNCTION get_prediction_reactions_count(prediction_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM public.reactions WHERE prediction_id = prediction_uuid);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le nombre de commentaires d'une prédiction
CREATE OR REPLACE FUNCTION get_prediction_comments_count(prediction_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM public.comments WHERE prediction_id = prediction_uuid);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 4. TRIGGERS
-- =============================================

-- Trigger pour créer automatiquement un user dans public.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_matches_updated_at ON public.matches;
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_predictions_updated_at ON public.predictions;
CREATE TRIGGER update_predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vip_requests_updated_at ON public.vip_requests;
CREATE TRIGGER update_vip_requests_updated_at
  BEFORE UPDATE ON public.vip_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_requests ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view matches" ON public.matches;
DROP POLICY IF EXISTS "Only admins can insert matches" ON public.matches;
DROP POLICY IF EXISTS "Only admins can update matches" ON public.matches;
DROP POLICY IF EXISTS "Only admins can delete matches" ON public.matches;
DROP POLICY IF EXISTS "Anyone can view predictions" ON public.predictions;
DROP POLICY IF EXISTS "Only admins can insert predictions" ON public.predictions;
DROP POLICY IF EXISTS "Only admins can update predictions" ON public.predictions;
DROP POLICY IF EXISTS "Only admins can delete predictions" ON public.predictions;
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.reactions;
DROP POLICY IF EXISTS "Authenticated users can insert reactions" ON public.reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON public.reactions;
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can view own vip requests" ON public.vip_requests;
DROP POLICY IF EXISTS "Admins can view all vip requests" ON public.vip_requests;
DROP POLICY IF EXISTS "Authenticated users can insert vip requests" ON public.vip_requests;
DROP POLICY IF EXISTS "Admins can update vip requests" ON public.vip_requests;

-- Policies pour users
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Policies pour matches (public read, admin write)
CREATE POLICY "Anyone can view matches" ON public.matches
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert matches" ON public.matches
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Only admins can update matches" ON public.matches
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Only admins can delete matches" ON public.matches
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Policies pour predictions (public read, admin write)
CREATE POLICY "Anyone can view predictions" ON public.predictions
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert predictions" ON public.predictions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Only admins can update predictions" ON public.predictions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Only admins can delete predictions" ON public.predictions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Policies pour reactions
CREATE POLICY "Anyone can view reactions" ON public.reactions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert reactions" ON public.reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions" ON public.reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Policies pour comments
CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Policies pour vip_requests
CREATE POLICY "Users can view own vip requests" ON public.vip_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vip requests" ON public.vip_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Authenticated users can insert vip requests" ON public.vip_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update vip requests" ON public.vip_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- =============================================
-- 6. STORAGE BUCKET POUR PAYMENT PROOFS
-- =============================================
-- Note: Créez le bucket via l'interface Supabase Storage
-- Nom: payment-proofs
-- Public: false
-- 
-- Ensuite, ajoutez ces policies via l'interface Storage:
-- 
-- SELECT Policy:
--   authenticated users can view: bucket_id = 'payment-proofs' AND (auth.uid()::text = (storage.foldername(name))[1] OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true))
-- 
-- INSERT Policy:
--   authenticated users can upload: bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]
-- 
-- UPDATE Policy:
--   admins only: bucket_id = 'payment-proofs' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
-- 
-- DELETE Policy:
--   admins only: bucket_id = 'payment-proofs' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)

-- =============================================
-- 7. DONNÉES DE TEST (OPTIONNEL - À DÉCOMMENTER)
-- =============================================

-- Pour créer un admin après votre première inscription:
-- UPDATE public.users SET is_admin = true WHERE email = 'votre@email.com';

-- Pour ajouter des matchs de test:
-- INSERT INTO public.matches (team1, team2, match_date, league) VALUES
-- ('Manchester United', 'Liverpool', NOW() + INTERVAL '2 days', 'Premier League'),
-- ('Real Madrid', 'Barcelona', NOW() + INTERVAL '3 days', 'La Liga'),
-- ('Bayern Munich', 'Dortmund', NOW() + INTERVAL '4 days', 'Bundesliga'),
-- ('Paris Saint-Germain', 'Marseille', NOW() + INTERVAL '5 days', 'Ligue 1'),
-- ('Juventus', 'AC Milan', NOW() + INTERVAL '6 days', 'Serie A');

-- =============================================
-- FIN DU SCHEMA
-- =============================================
-- 
-- Instructions:
-- 1. Copiez tout ce code dans l'éditeur SQL de Supabase
-- 2. Exécutez-le (Run ou F5)
-- 3. Vérifiez qu'il n'y a pas d'erreurs
-- 4. Créez le bucket Storage "payment-proofs" via l'interface
-- 5. Configurez vos variables d'environnement dans .env
-- 6. Testez l'application !

