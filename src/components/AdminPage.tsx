import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, X, Calendar, Trophy, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getTeamLogo } from '../services/groqService';

interface User {
  id: string;
  username: string;
  is_admin: boolean;
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
  match?: Match;
}

interface VipRequest {
  id: string;
  user_id: string;
  email: string;
  whatsapp: string;
  plan_type: string;
  amount: number;
  payment_proof_url?: string;
  status: string;
  created_at: string;
  users?: {
    username: string;
  };
}

interface Props {
  currentUser: User;
}

export default function AdminPage({ currentUser: _currentUser }: Props) {
  const [activeTab, setActiveTab] = useState<'matches' | 'predictions' | 'vip' | 'stats'>('matches');
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [vipRequests, setVipRequests] = useState<VipRequest[]>([]);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [showAddPrediction, setShowAddPrediction] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'matches') {
        const { data } = await supabase
          .from('matches')
          .select('*')
          .order('match_date', { ascending: false });
        setMatches(data || []);
      } else if (activeTab === 'predictions') {
        const { data } = await supabase
          .from('predictions')
          .select('*, match:matches(*)')
          .order('created_at', { ascending: false });
        setPredictions(data || []);
      } else if (activeTab === 'vip') {
        const { data } = await supabase
          .from('vip_requests')
          .select('*, users:user_id(username)')
          .order('created_at', { ascending: false });
        setVipRequests(data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMatch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const team1 = formData.get('team1') as string;
      const team2 = formData.get('team2') as string;

      // Récupérer les logos
      const [team1Logo, team2Logo] = await Promise.all([
        getTeamLogo(team1),
        getTeamLogo(team2)
      ]);

      const { error } = await supabase.from('matches').insert({
        team1,
        team2,
        team1_logo: team1Logo,
        team2_logo: team2Logo,
        match_date: formData.get('match_date'),
        league: formData.get('league')
      });

      if (error) throw error;

      alert('Match ajouté avec succès !');
      setShowAddMatch(false);
      loadData();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleAddPrediction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const { error } = await supabase.from('predictions').insert({
        match_id: formData.get('match_id'),
        prediction_type: formData.get('prediction_type'),
        odds: parseFloat(formData.get('odds') as string),
        analysis: formData.get('analysis'),
        is_vip_only: formData.get('is_vip_only') === 'true',
        vip_level_required: formData.get('vip_level_required') || null,
        confidence_level: parseInt(formData.get('confidence_level') as string)
      });

      if (error) throw error;

      alert('Pronostic ajouté avec succès !');
      setShowAddPrediction(false);
      loadData();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleApproveVip = async (requestId: string, userId: string, planType: string) => {
    try {
      // Calculer la date de fin d'abonnement
      const endDate = new Date();
      const isYearly = planType.includes('yearly');
      endDate.setMonth(endDate.getMonth() + (isYearly ? 12 : 1));

      // Déterminer le niveau VIP
      const vipLevel = planType.includes('premium') ? 'premium' : 'standard';

      // Mettre à jour l'utilisateur
      const { error: userError } = await supabase
        .from('users')
        .update({
          is_vip: true,
          vip_level: vipLevel,
          subscription_end: endDate.toISOString()
        })
        .eq('id', userId);

      if (userError) throw userError;

      // Mettre à jour le statut de la demande
      const { error: requestError } = await supabase
        .from('vip_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (requestError) throw requestError;

      alert('Demande VIP approuvée !');
      loadData();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleRejectVip = async (requestId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir rejeter cette demande ?')) return;

    try {
      const { error } = await supabase
        .from('vip_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      alert('Demande rejetée');
      loadData();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce match ?')) return;

    try {
      const { error } = await supabase.from('matches').delete().eq('id', matchId);
      if (error) throw error;

      alert('Match supprimé');
      loadData();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleDeletePrediction = async (predictionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce pronostic ?')) return;

    try {
      const { error } = await supabase.from('predictions').delete().eq('id', predictionId);
      if (error) throw error;

      alert('Pronostic supprimé');
      loadData();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 shadow-xl">
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard Administrateur</h2>
        <p className="text-white/90">Gérez les matchs, pronostics et abonnements VIP</p>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900/50 rounded-lg p-2 flex gap-2">
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
            activeTab === 'matches'
              ? 'bg-purple-600 text-white'
              : 'text-purple-300 hover:text-white'
          }`}
        >
          <Trophy className="w-5 h-5 inline mr-2" />
          Matchs
        </button>
        <button
          onClick={() => setActiveTab('predictions')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
            activeTab === 'predictions'
              ? 'bg-purple-600 text-white'
              : 'text-purple-300 hover:text-white'
          }`}
        >
          <Calendar className="w-5 h-5 inline mr-2" />
          Pronostics
        </button>
        <button
          onClick={() => setActiveTab('vip')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
            activeTab === 'vip'
              ? 'bg-purple-600 text-white'
              : 'text-purple-300 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          Demandes VIP
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-white text-center py-12">Chargement...</div>
      ) : (
        <>
          {/* Matches Tab */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Matchs ({matches.length})</h3>
                <button
                  onClick={() => setShowAddMatch(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter un match
                </button>
              </div>

              <div className="grid gap-4">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-gray-900/50 border border-purple-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          {match.team1_logo && (
                            <img src={match.team1_logo} alt="" className="w-8 h-8" />
                          )}
                          <span className="text-white font-semibold">{match.team1}</span>
                        </div>
                        <span className="text-purple-400">VS</span>
                        <div className="flex items-center gap-2">
                          {match.team2_logo && (
                            <img src={match.team2_logo} alt="" className="w-8 h-8" />
                          )}
                          <span className="text-white font-semibold">{match.team2}</span>
                        </div>
                        <span className="text-purple-300 text-sm ml-4">
                          {new Date(match.match_date).toLocaleDateString('fr-FR')}
                        </span>
                        {match.league && (
                          <span className="text-purple-400 text-sm">• {match.league}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteMatch(match.id)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Predictions Tab */}
          {activeTab === 'predictions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  Pronostics ({predictions.length})
                </h3>
                <button
                  onClick={() => setShowAddPrediction(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter un pronostic
                </button>
              </div>

              <div className="grid gap-4">
                {predictions.map((pred) => (
                  <div
                    key={pred.id}
                    className="bg-gray-900/50 border border-purple-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white font-bold">{pred.prediction_type}</span>
                          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm">
                            Cote: {pred.odds}
                          </span>
                          {pred.is_vip_only && (
                            <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-sm">
                              {pred.vip_level_required === 'premium' ? '🔥 Premium' : '⭐ VIP'}
                            </span>
                          )}
                        </div>
                        <p className="text-purple-200 text-sm mb-2">
                          {pred.match?.team1} vs {pred.match?.team2}
                        </p>
                        {pred.analysis && (
                          <p className="text-purple-300 text-sm">{pred.analysis}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeletePrediction(pred.id)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIP Requests Tab */}
          {activeTab === 'vip' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">
                Demandes VIP ({vipRequests.filter((r) => r.status === 'pending').length} en attente)
              </h3>

              <div className="grid gap-4">
                {vipRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`bg-gray-900/50 border rounded-lg p-4 ${
                      request.status === 'pending'
                        ? 'border-yellow-500/50'
                        : request.status === 'approved'
                        ? 'border-green-500/50'
                        : 'border-red-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white font-bold">
                            {request.users?.username || 'Utilisateur'}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              request.status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : request.status === 'approved'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {request.status === 'pending'
                              ? 'En attente'
                              : request.status === 'approved'
                              ? 'Approuvé'
                              : 'Rejeté'}
                          </span>
                        </div>
                        <p className="text-purple-200 text-sm mb-1">{request.email}</p>
                        <p className="text-purple-300 text-sm mb-1">
                          WhatsApp: {request.whatsapp}
                        </p>
                        <p className="text-purple-300 text-sm mb-2">
                          Plan: {request.plan_type} • {request.amount} FCFA
                        </p>
                        {request.payment_proof_url && (
                          <a
                            href={request.payment_proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 text-sm"
                          >
                            Voir la preuve de paiement →
                          </a>
                        )}
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleApproveVip(request.id, request.user_id, request.plan_type)
                            }
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleRejectVip(request.id)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Match Modal */}
      {showAddMatch && (
        <AddMatchModal onClose={() => setShowAddMatch(false)} onSubmit={handleAddMatch} />
      )}

      {/* Add Prediction Modal */}
      {showAddPrediction && (
        <AddPredictionModal
          matches={matches}
          onClose={() => setShowAddPrediction(false)}
          onSubmit={handleAddPrediction}
        />
      )}
    </div>
  );
}

// Add Match Modal Component
function AddMatchModal({ onClose, onSubmit }: any) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full border border-purple-500/30">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Ajouter un match</h3>
            <button onClick={onClose} className="text-purple-300 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-purple-200 mb-2">Équipe 1</label>
              <input
                type="text"
                name="team1"
                required
                placeholder="Ex: Manchester United"
                className="w-full bg-gray-800 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-purple-200 mb-2">Équipe 2</label>
              <input
                type="text"
                name="team2"
                required
                placeholder="Ex: Liverpool"
                className="w-full bg-gray-800 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-purple-200 mb-2">Date du match</label>
              <input
                type="datetime-local"
                name="match_date"
                required
                className="w-full bg-gray-800 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-purple-200 mb-2">Ligue (optionnel)</label>
              <input
                type="text"
                name="league"
                placeholder="Ex: Premier League"
                className="w-full bg-gray-800 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-bold transition"
            >
              Ajouter le match
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Add Prediction Modal Component
function AddPredictionModal({ matches, onClose, onSubmit }: any) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full border border-purple-500/30 my-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Ajouter un pronostic</h3>
            <button onClick={onClose} className="text-purple-300 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-purple-200 mb-2">Match</label>
              <select
                name="match_id"
                required
                className="w-full bg-gray-800 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Sélectionner un match</option>
                {matches.map((match: Match) => (
                  <option key={match.id} value={match.id}>
                    {match.team1} vs {match.team2} -{' '}
                    {new Date(match.match_date).toLocaleDateString('fr-FR')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-purple-200 mb-2">Type de pronostic</label>
              <input
                type="text"
                name="prediction_type"
                required
                placeholder="Ex: 1X, Over 2.5, BTTS"
                className="w-full bg-gray-800 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-purple-200 mb-2">Cote</label>
              <input
                type="number"
                name="odds"
                step="0.01"
                required
                placeholder="Ex: 1.85"
                className="w-full bg-gray-800 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-purple-200 mb-2">Analyse (optionnel)</label>
              <textarea
                name="analysis"
                rows={4}
                placeholder="Analyse détaillée du pronostic..."
                className="w-full bg-gray-800 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-purple-200 mb-2">Niveau de confiance (1-5)</label>
              <input
                type="number"
                name="confidence_level"
                min="1"
                max="5"
                defaultValue="3"
                className="w-full bg-gray-800 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-purple-200 mb-2">Réservé aux VIP ?</label>
              <select
                name="is_vip_only"
                className="w-full bg-gray-800 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="false">Non - Public</option>
                <option value="true">Oui - VIP uniquement</option>
              </select>
            </div>

            <div>
              <label className="block text-purple-200 mb-2">
                Niveau VIP requis (si VIP uniquement)
              </label>
              <select
                name="vip_level_required"
                className="w-full bg-gray-800 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Tous les VIP</option>
                <option value="standard">VIP Standard et Premium</option>
                <option value="premium">VIP Premium uniquement</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-bold transition"
            >
              Ajouter le pronostic
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}