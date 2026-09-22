import React, { useState, useEffect } from 'react';
import { ShareLink } from '../types';
import { useShareLink } from '../hooks/useShareLink';
import { Share2, Copy, Check, ShieldAlert, Eye, X, Globe, Link as LinkIcon } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  currentUserId: string;
  currentUserName: string;
  onNavigateToShareView?: (token: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  currentUserId,
  currentUserName,
  onNavigateToShareView
}) => {
  const { getOrCreateActiveShare, createShare, revokeShare } = useShareLink();
  const [activeShare, setActiveShare] = useState<ShareLink | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActiveShare(getOrCreateActiveShare(projectId, projectName, currentUserId, currentUserName));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, projectId, projectName, currentUserId, currentUserName]);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const shareUrl = activeShare ? `${origin}/#share=${activeShare.token}` : '';

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRevoke = () => {
    if (!activeShare) return;
    if (confirm('¿Estás seguro de revocar este enlace? Quienes lo tengan ya no podrán visualizar el proyecto.')) {
      revokeShare(activeShare.id);
      setActiveShare(null);
    }
  };

  const handleCreateNew = () => {
    setActiveShare(createShare(projectId, projectName, currentUserId, currentUserName));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Compartir Proyecto 3D</h3>
              <p className="text-xs text-slate-400">Enlace seguro de visualización interactiva</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {activeShare && activeShare.isActive ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                  Enlace de solo lectura
                </label>
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-transparent text-xs text-slate-300 font-mono focus:outline-none truncate"
                  />
                  <button
                    onClick={handleCopy}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Enlace copiado al portapapeles.
                  </p>
                )}
              </div>

              {/* Status and permissions info */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    Visitas registradas:
                  </span>
                  <span className="font-semibold text-slate-200">{activeShare.accessCount} visitas</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Permisos:</span>
                  <span className="text-emerald-400 font-medium">Solo lectura (Visor 3D)</span>
                </div>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  Cualquier persona con el link puede interactuar con el modelo 3D y clonarlo en su propia cuenta. No podrán modificar tu diseño original.
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                {onNavigateToShareView && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToShareView(activeShare.token);
                    }}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Abrir visor público
                  </button>
                )}

                <button
                  onClick={handleRevoke}
                  className="py-2 px-3 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Revocar enlace
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-xs text-slate-400">
                El enlace para este proyecto se encuentra desactivado o fue revocado.
              </p>
              <button
                onClick={handleCreateNew}
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Generar nuevo enlace público
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
