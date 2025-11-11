-- =============================================
-- SCHEMA SQL COMPLET POUR SUPABASE - APPLICATION COUPON
-- =============================================

-- 1. Table Users (Extension de auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_vip BOOLEAN DEFAULT FALSE,
  vip_level TEXT CHECK (vip_level IN ('standard', 'premium')),
  subscription_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table Matches
CREATE TABLE public.matches (
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

-- 3. Table Predictions
CREATE TABLE public.predictions (
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

-- 4. Table Reactions (Likes)
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reaction_type TEXT DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prediction_id, user_id)
);

-- 5. Table Comments
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table VIP Requests
CREATE TABLE public.vip_requests (
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
-- INDEXES POUR PERFORMANCE
-- =============================================

CREATE INDEX idx_matches_date ON public.matches(match_date DESC);
CREATE INDEX idx_predictions_match ON public.predictions(match_id);
CREATE INDEX idx_predictions_created ON public.predictions(created_at DESC);
CREATE INDEX idx_reactions_prediction ON public.reactions(prediction_id);
CREATE INDEX idx_reactions_user ON public.reactions(user_id);
CREATE INDEX idx_comments_prediction ON public.comments(prediction_id);
CREATE INDEX idx_vip_requests_user ON public.vip_requests(user_id);
CREATE INDEX idx_vip_requests_status ON public.vip_requests(status);

-- =============================================
-- TRIGGERS POUR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vip_requests_updated_at
  BEFORE UPDATE ON public.vip_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FONCTION POUR CRÉER UN USER AUTOMATIQUEMENT
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un user dans public.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_requests ENABLE ROW LEVEL SECURITY;

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
-- STORAGE BUCKET POUR PAYMENT PROOFS
-- =============================================

-- Créer le bucket (à faire via l'interface Supabase Storage)
-- Nom: payment-proofs
-- Public: false

-- Policies pour le bucket payment-proofs (à ajouter via l'interface)
-- SELECT: authenticated users can view own proofs + admins can view all
-- INSERT: authenticated users can upload
-- UPDATE: admins only
-- DELETE: admins only

-- =============================================
-- DONNÉES DE TEST (OPTIONNEL)
-- =============================================

-- Créer un admin test (remplacer YOUR_AUTH_USER_ID par votre ID réel après inscription)
-- UPDATE public.users SET is_admin = true WHERE email = 'votre@email.com';

-- Ajouter des matchs de test
INSERT INTO public.matches (team1, team2, match_date, league) VALUES
('Manchester United', 'Liverpool', NOW() + INTERVAL '2 days', 'Premier League'),
('Real Madrid', 'Barcelona', NOW() + INTERVAL '3 days', 'La Liga'),
('Bayern Munich', 'Dortmund', NOW() + INTERVAL '4 days', 'Bundesliga');

-- =============================================
-- FIN DU SCHEMA
-- =============================================