import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, Send, Star, TrendingUp, Calendar, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  username: string;
  is_admin: boolean;
  is_vip: boolean;
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
  user_has_reacted?: boolean;
}

interface Comment {
  id: string;
  user_id: string;
  prediction_id: string;
  content: string;
  created_at: string;
  users?: {
    username: string;
    is_vip: boolean;
  };
}

interface Props {
  prediction: Prediction;
  currentUser: User | null;
  onClose: () => void;
}

export default function PredictionDetailModal({ prediction, currentUser, onClose }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasReacted, setHasReacted] = useState(false);
  const [reactionsCount, setReactionsCount] = useState(prediction.reactions_count || 0);

  const canView = !prediction.is_vip_only || currentUser?.is_vip || currentUser?.is_admin;

  useEffect(() => {
    loadComments();
    checkReaction();
  }, [prediction.id]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          users:user_id (username, is_vip)
        `)
        .eq('prediction_id', prediction.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkReaction = async () => {
    if (!currentUser) return;

    try {
      const { data } = await supabase
        .from('reactions')
        .select('id')
        .eq('prediction_id', prediction.id)
        .eq('user_id', currentUser.id)
        .single();

      setHasReacted(!!data);
    } catch (error) {
      // Pas de réaction trouvée
    }
  };

  const handleReaction = async () => {
    if (!currentUser) {
      alert('Connectez-vous pour liker');
      return;
    }

    try {
      if (hasReacted) {
        await supabase
          .from('reactions')
          .delete()
          .eq('prediction_id', prediction.id)
          .eq('user_id', currentUser.id);
        setHasReacted(false);
        setReactionsCount(prev => prev - 1);
      } else {
        await supabase.from('reactions').insert({
          prediction_id: prediction.id,
          user_id: currentUser.id,
          reaction_type: 'like'
        });
        setHasReacted(true);
        setReactionsCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;

    try {
      const { error } = await supabase.from('comments').insert({
        prediction_id: prediction.id,
        user_id: currentUser.id,
        content: newComment.trim()
      });

      if (error) throw error;

      setNewComment('');
      loadComments();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-xl max-w-3xl w-full border border-purple-500/30 my-8">
        {/* Header */}
        <div className="bg-black/30 p-4 flex items-center justify-between border-b border-purple-500/30">
          <h3 className="text-xl font-bold text-white">Détails du pronostic</h3>
          <button onClick={onClose} className="text-purple-300 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Match Info */}
          <div className="bg-black/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-purple-300 text-sm">
                {prediction.match?.league || 'Football'}
              </span>
              <span className="text-purple-300 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(prediction.match?.match_date || '').toLocaleDateString('fr-FR')}
              </span>
            </div>

            <div className="flex items-center justify-between gap-6">
              {/* Team 1 */}
              <div className="flex-1 text-center">
                {prediction.match?.team1_logo && (
                  <img
                    src={prediction.match.team1_logo}
                    alt={prediction.match.team1}
                    className="w-16 h-16 mx-auto mb-2"
                  />
                )}
                <p className="text-white font-semibold">{prediction.match?.team1}</p>
              </div>

              <div className="text-purple-400 text-3xl font-bold">VS</div>

              {/* Team 2 */}
              <div className="flex-1 text-center">
                {prediction.match?.team2_logo && (
                  <img
                    src={prediction.match.team2_logo}
                    alt={prediction.match.team2}
                    className="w-16 h-16 mx-auto mb-2"
                  />
                )}
                <p className="text-white font-semibold">{prediction.match?.team2}</p>
              </div>
            </div>
          </div>

          {/* Prediction Details */}
          {canView ? (
            <div className="space-y-4 mb-6">
              <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                    <span className="text-white font-bold text-xl">
                      {prediction.prediction_type}
                    </span>
                  </div>
                  <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full font-bold text-lg">
                    Cote: {prediction.odds}
                  </div>
                </div>

                {prediction.confidence_level && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-purple-200 text-sm">Confiance:</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < prediction.confidence_level!
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {prediction.analysis && (
                  <div>
                    <h4 className="text-purple-200 font-semibold mb-2">Analyse:</h4>
                    <p className="text-white leading-relaxed">{prediction.analysis}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-6">
                <button
                  onClick={handleReaction}
                  className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition"
                >
                  <Heart
                    className={`w-6 h-6 ${hasReacted ? 'fill-red-500 text-red-500' : ''}`}
                  />
                  <span className="font-semibold">{reactionsCount}</span>
                </button>

                <div className="flex items-center gap-2 text-purple-300">
                  <MessageCircle className="w-6 h-6" />
                  <span className="font-semibold">{comments.length}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-8 text-center mb-6">
              <Lock className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h4 className="text-white text-xl font-bold mb-2">Contenu VIP Exclusif</h4>
              <p className="text-purple-200 mb-4">
                {prediction.vip_level_required === 'premium'
                  ? 'Ce pronostic est réservé aux membres VIP Premium'
                  : 'Ce pronostic est réservé aux membres VIP'}
              </p>
              <button
                onClick={() => {
                  onClose();
                  // Navigate to VIP page
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-bold transition"
              >
                Devenir VIP
              </button>
            </div>
          )}

          {/* Comments Section */}
          {canView && (
            <div className="border-t border-purple-500/30 pt-6">
              <h4 className="text-white font-bold text-lg mb-4">
                Commentaires ({comments.length})
              </h4>

              {/* Comment Form */}
              {currentUser ? (
                <form onSubmit={handleCommentSubmit} className="mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      className="flex-1 bg-gray-800 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white p-2 rounded-lg transition"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4 mb-6 text-center">
                  <p className="text-purple-200">Connectez-vous pour commenter</p>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {loading ? (
                  <p className="text-purple-300 text-center">Chargement des commentaires...</p>
                ) : comments.length === 0 ? (
                  <p className="text-purple-300 text-center">Aucun commentaire pour le moment</p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-gray-800/50 rounded-lg p-4 border border-purple-500/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold">
                            {comment.users?.username || 'Utilisateur'}
                          </span>
                          {comment.users?.is_vip && (
                            <span className="text-yellow-400 text-xs">⭐ VIP</span>
                          )}
                        </div>
                        <span className="text-purple-300 text-xs">
                          {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-purple-100">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}