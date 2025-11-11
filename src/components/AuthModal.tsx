import React from 'react';
import { X, Mail, Lock, User } from 'lucide-react';

interface AuthModalProps {
  mode: 'login' | 'signup';
  onClose: () => void;
  onToggleMode: () => void;
  onSignIn: (e: React.FormEvent<HTMLFormElement>) => void;
  onSignUp: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function AuthModal({
  mode,
  onClose,
  onToggleMode,
  onSignIn,
  onSignUp
}: AuthModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-md w-full border border-purple-500/30">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">
              {mode === 'login' ? 'Connexion' : 'Inscription'}
            </h3>
            <button
              onClick={onClose}
              className="text-purple-300 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={mode === 'login' ? onSignIn : onSignUp} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-purple-200 mb-2 text-sm font-medium">
                  Nom d'utilisateur
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <input
                    type="text"
                    name="username"
                    required
                    placeholder="Choisissez un nom d'utilisateur"
                    className="w-full bg-gray-800 border border-purple-500/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-purple-200 mb-2 text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="votre@email.com"
                  className="w-full bg-gray-800 border border-purple-500/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-purple-200 mb-2 text-sm font-medium">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-purple-500/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                />
              </div>
              {mode === 'signup' && (
                <p className="text-purple-300 text-xs mt-1">
                  Minimum 6 caractères
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-bold transition shadow-lg"
            >
              {mode === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-purple-300 text-sm">
              {mode === 'login' ? "Pas encore de compte ?" : "Déjà un compte ?"}
              {' '}
              <button
                onClick={onToggleMode}
                className="text-purple-400 hover:text-purple-300 font-semibold transition"
              >
                {mode === 'login' ? "S'inscrire" : "Se connecter"}
              </button>
            </p>
          </div>

          {/* Info */}
          {mode === 'signup' && (
            <div className="mt-4 bg-purple-600/20 border border-purple-500/30 rounded-lg p-3">
              <p className="text-purple-200 text-xs text-center">
                En vous inscrivant, vous acceptez de recevoir nos pronostics exclusifs
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}