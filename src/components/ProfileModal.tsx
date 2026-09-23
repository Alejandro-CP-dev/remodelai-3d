import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { X, User as UserIcon, Mail, Image, Check, ShieldCheck } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onProfileUpdated: (user: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onProfileUpdated
}) => {
  const { updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset the form to the latest user data every time the modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setAvatarUrl(currentUser.avatarUrl || '');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const updated = updateProfile(currentUser.id, { name, email, avatarUrl });
      setSuccessMessage('Perfil actualizado correctamente.');
      onProfileUpdated(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo actualizar el perfil.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Editar Perfil</h3>
              <p className="text-xs text-slate-400">
                RemodelAI 3D • Espacios asistidos por IA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="m-5 mb-0 p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-xs text-rose-300">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="m-5 mb-0 p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-xs text-emerald-300">
            {successMessage}
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <img
              src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80'}
              alt={name}
              className="w-12 h-12 rounded-full object-cover border border-slate-700"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100 truncate">{currentUser.name}</p>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-indigo-400 px-1.5 py-0.5 bg-indigo-500/10 rounded mt-1">
                <ShieldCheck className="w-3 h-3" />
                Rol: {currentUser.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Nombre completo</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Correo electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Si cambias tu correo deberás usarlo para iniciar sesión la próxima vez.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">URL de foto de perfil</label>
              <div className="relative">
                <Image className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Guardar cambios
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
