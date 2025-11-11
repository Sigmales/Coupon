import { useState, useEffect } from 'react';
import { 
  Trophy, Star, LogOut, 
  Menu, X, ThumbsUp, MessageCircle, Crown, Settings
} from 'lucide-react';
import { supabase } from './lib/supabase';
import AdminPage from './components/AdminPage';
import AuthModal from './components/AuthModal';
import PredictionDetailModal from './components/PredictionDetailModal';
import VipRequestModal from './components/VipRequestModal';

// Types
interface User {
  id: string;
  email: string;
  username: string;
  is_vip: boolean;
  is_admin: boolean;
  avatar_url?: string;
  vip_level?: 'standard' | 'premium';
}

interface Match {
  id: string;
  team1: string;
  team2: string;
  team1_logo?: string;
  team2_logo?: string;
  match_date: string;
  league?: string;
}

interface Prediction {
  id: string;
  match_id: string;
  prediction_type: string;
  odds: number;
  analysis?: string;
  is_vip_only: boolean;
  vip_level_required?: 'standard' | 'premium';
  confidence_level?: number;
  created_at: string;
  match?: Match;
  reactions_count?: number;
  comments_count?: number;
}

// Main App Component
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [vipPlan, setVipPlan] = useState<'standard' | 'premium'>('standard');
  const [vipBillingCycle, setVipBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'free' | 'vip'>('free');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check auth state on mount
  useEffect(() => {
    checkUser();
    loadMatches();
    loadPredictions();

    // Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
        if (session) {
          loadUserData(session.user.id);
        } else {
          setUser(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const checkUser = async () => {
    try {
      if (!supabase) {
        console.warn('Supabase non configuré');
        setLoading(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserData(session.user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setUser({
          id: data.id,
          email: data.email,
          username: data.username,
          is_vip: data.is_vip || false,
          is_admin: data.is_admin || false,
          avatar_url: data.avatar_url,
          vip_level: data.vip_level,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadMatches = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const loadPredictions = async () => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('predictions')
        .select(`
          *,
          match:matches(*)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPredictions(data || []);
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) {
      alert('Supabase n\'est pas configuré. Vérifiez vos variables d\'environnement.');
      return;
    }
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await loadUserData(data.user.id);
        setShowAuthModal(false);
      }
    } catch (error: any) {
      alert('Erreur de connexion: ' + error.message);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) {
      alert('Supabase n\'est pas configuré. Vérifiez vos variables d\'environnement.');
      return;
    }
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // User will be created automatically by trigger
        alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        setAuthMode('login');
      }
    } catch (error: any) {
      alert('Erreur d\'inscription: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      if (!supabase) return;
      await supabase.auth.signOut();
      setUser(null);
      setShowAdmin(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const openPredictionDetail = (prediction: Prediction) => {
    setSelectedPrediction(prediction);
    setShowPredictionModal(true);
  };

  const freePredictions = predictions.filter(p => !p.is_vip_only);
  const vipPredictions = predictions.filter(p => p.is_vip_only);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700">Chargement...</div>
        </div>
      </div>
    );
  }

  if (showAdmin && user?.is_admin) {
    return (
      <div>
        <div className="mb-4 p-4 bg-gray-100">
          <button
            onClick={() => setShowAdmin(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ← Retour
          </button>
        </div>
        <AdminPage currentUser={user} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Trophy className="text-yellow-400" size={32} />
              <h1 className="text-2xl md:text-3xl font-bold">COUPON</h1>
            </div>

            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
                      {user.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">{user.username}</div>
                      {user.is_vip && (
                        <div className="flex items-center gap-1 text-yellow-400 text-sm">
                          <Crown size={12} />
                          VIP {user.vip_level === 'premium' ? 'Premium' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  {user.is_admin && (
                    <button
                      onClick={() => setShowAdmin(true)}
                      className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                      <Settings size={18} />
                      Admin
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <LogOut size={18} />
                    Déconnexion
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="px-6 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-semibold"
                >
                  Connexion
                </button>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{matches.length}</div>
              <div className="text-blue-200">Matchs à venir</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{freePredictions.length}</div>
              <div className="text-blue-200">Pronostics gratuits</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{vipPredictions.length}</div>
              <div className="text-blue-200">Pronostics VIP</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">85%</div>
              <div className="text-blue-200">Taux de réussite</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* VIP Banner */}
        {user && !user.is_vip && (
          <div className="mb-8 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Crown className="text-yellow-200" />
                  Devenez VIP et accédez aux pronostics exclusifs !
                </h3>
                <p className="text-yellow-100">
                  Rejoignez notre communauté VIP et bénéficiez de pronostics premium avec analyses détaillées.
                </p>
              </div>
              <button
                onClick={() => {
                  setVipPlan('standard');
                  setVipBillingCycle('monthly');
                  setShowVIPModal(true);
                }}
                className="px-6 py-3 bg-white text-yellow-600 rounded-lg hover:bg-yellow-50 font-bold"
              >
                Devenir VIP
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('free')}
            className={`px-6 py-3 font-semibold border-b-2 transition ${
              activeTab === 'free'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Pronostics Gratuits ({freePredictions.length})
          </button>
          {user?.is_vip && (
            <button
              onClick={() => setActiveTab('vip')}
              className={`px-6 py-3 font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'vip'
                  ? 'border-yellow-600 text-yellow-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <Crown size={18} />
              Pronostics VIP ({vipPredictions.length})
            </button>
          )}
        </div>

        {/* Predictions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeTab === 'free' ? freePredictions : vipPredictions).map((prediction) => (
            <div
              key={prediction.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-6 cursor-pointer"
              onClick={() => openPredictionDetail(prediction)}
            >
              {prediction.match && (
                <div className="mb-4 pb-4 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{prediction.match.league}</span>
                    <span className="text-sm text-gray-600">
                      {new Date(prediction.match.match_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      {prediction.match.team1_logo && (
                        <img src={prediction.match.team1_logo} alt={prediction.match.team1} className="w-8 h-8 mx-auto mb-1" />
                      )}
                      <div className="font-semibold text-sm">{prediction.match.team1}</div>
                    </div>
                    <div className="text-gray-400 px-2">VS</div>
                    <div className="text-center flex-1">
                      {prediction.match.team2_logo && (
                        <img src={prediction.match.team2_logo} alt={prediction.match.team2} className="w-8 h-8 mx-auto mb-1" />
                      )}
                      <div className="font-semibold text-sm">{prediction.match.team2}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">{prediction.prediction_type}</h3>
                  {prediction.is_vip_only && (
                    <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Crown size={12} />
                      VIP
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded font-semibold">
                    Cote: {prediction.odds}
                  </span>
                  {prediction.confidence_level && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span>{prediction.confidence_level}/5</span>
                    </div>
                  )}
                </div>
              </div>

              {prediction.analysis && (
                <p className="text-gray-700 text-sm line-clamp-2 mb-4">{prediction.analysis}</p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <ThumbsUp size={16} />
                    <span>{prediction.reactions_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle size={16} />
                    <span>{prediction.comments_count || 0}</span>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-semibold">
                  Voir détails →
                </button>
              </div>
            </div>
          ))}
        </div>

        {predictions.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-600">Aucun pronostic disponible</h3>
            <p className="text-gray-500 mt-2">Les pronostics seront bientôt disponibles</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onToggleMode={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
        />
      )}

      {showVIPModal && user && (
        <VipRequestModal
          plan={vipPlan}
          billingCycle={vipBillingCycle}
          currentUser={user}
          onClose={() => setShowVIPModal(false)}
        />
      )}

      {showPredictionModal && selectedPrediction && (
        <PredictionDetailModal
          prediction={selectedPrediction}
          currentUser={user}
          onClose={() => {
            setShowPredictionModal(false);
            setSelectedPrediction(null);
            loadPredictions(); // Reload to get updated counts
          }}
        />
      )}
    </div>
  );
}
