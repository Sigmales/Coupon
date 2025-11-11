import React, { useState } from 'react';
import { X, Upload, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  username: string;
}

interface Props {
  plan: 'standard' | 'premium';
  billingCycle: 'monthly' | 'yearly';
  currentUser: User | null;
  onClose: () => void;
}

const PLANS = {
  standard: {
    name: 'VIP Standard',
    icon: '⭐',
    monthly: 750,
    yearly: 7650
  },
  premium: {
    name: 'VIP Premium',
    icon: '🔥',
    monthly: 1500,
    yearly: 12600
  }
};

export default function VipRequestModal({ plan, billingCycle, currentUser, onClose }: Props) {
  const [uploading, setUploading] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const planDetails = PLANS[plan];
  const amount = billingCycle === 'monthly' ? planDetails.monthly : planDetails.yearly;
  const planType = `${plan}_${billingCycle}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProof(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Vous devez être connecté');
      return;
    }

    setUploading(true);

    try {
      let paymentProofUrl = '';

      // Upload payment proof if provided
      if (paymentProof) {
        const fileExt = paymentProof.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, paymentProof);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(fileName);

        paymentProofUrl = urlData.publicUrl;
      }

      const formData = new FormData(e.currentTarget);

      const { error } = await supabase.from('vip_requests').insert({
        user_id: currentUser.id,
        email: formData.get('email'),
        whatsapp: formData.get('whatsapp'),
        plan_type: planType,
        amount: amount,
        payment_proof_url: paymentProofUrl,
        status: 'pending'
      });

      if (error) throw error;

      alert('Demande envoyée avec succès ! Un administrateur va vérifier votre paiement.');
      onClose();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Demande d'abonnement VIP</h3>
            <button onClick={onClose} className="text-purple-300 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold">{planDetails.name}</span>
              <span className="text-2xl">{planDetails.icon}</span>
            </div>
            <div className="text-purple-200">
              <p className="text-3xl font-bold text-white mb-1">{amount} FCFA</p>
              <p>{billingCycle === 'monthly' ? 'par mois' : 'par an'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-purple-200 mb-2">Email</label>
              <input
                type="email"
                name="email"
                defaultValue={currentUser?.email}
                required
                className="w-full bg-gray-800 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-purple-200 mb-2">Numéro WhatsApp</label>
              <input
                type="tel"
                name="whatsapp"
                placeholder="+226 XX XX XX XX"
                required
                className="w-full bg-gray-800 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-purple-200 mb-2">Instructions de paiement</label>
              <div className="bg-gray-800 border border-purple-500/30 rounded-lg p-4 text-purple-200 space-y-2">
                <p>
                  <strong>1.</strong> Effectuez le paiement de {amount} FCFA via Mobile Money
                </p>
                <p>
                  <strong>2.</strong> Prenez une capture d'écran de la confirmation
                </p>
                <p>
                  <strong>3.</strong> Téléchargez la preuve de paiement ci-dessous
                </p>
              </div>
            </div>

            <div>
              <label className="block text-purple-200 mb-2">Preuve de paiement</label>
              <div className="bg-gray-800 border-2 border-dashed border-purple-500/30 rounded-lg p-6 text-center">
                {previewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <Check className="w-5 h-5" />
                      <span>Fichier sélectionné</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentProof(null);
                        setPreviewUrl('');
                      }}
                      className="text-purple-300 hover:text-purple-200 text-sm"
                    >
                      Changer le fichier
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                    <p className="text-purple-200 mb-1">Cliquez pour télécharger</p>
                    <p className="text-purple-400 text-sm">PNG, JPG ou JPEG (Max 5MB)</p>
                  </label>
                )}
              </div>
            </div>

            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-200 text-sm">
                <strong>Important:</strong> Votre demande sera vérifiée par un administrateur sous
                24h. Vous recevrez une notification par email une fois approuvée.
              </p>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 rounded-lg font-bold transition"
            >
              {uploading ? 'Envoi en cours...' : 'Envoyer la demande'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}