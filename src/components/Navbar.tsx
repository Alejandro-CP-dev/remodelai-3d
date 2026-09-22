import React from 'react';
import { User } from '../types';
import {
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle,
  Wifi,
  WifiOff,
  LogOut,
  User as UserIcon,
  LogIn,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  currentView: 'landing' | 'dashboard' | 'editor' | 'admin' | 'shared';
  hasActiveProject: boolean;
  isOnline: boolean;
  onToggleOnline: () => void;
  onNavigate: (view: 'landing' | 'dashboard' | 'editor' | 'admin') => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenTestMatrix: () => void;
  onSwitchUser: (email: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  hasActiveProject,
  isOnline,
  onToggleOnline,
  onNavigate,
  onOpenAuth,
  onLogout,
  onOpenTestMatrix,
  onSwitchUser
}) => {
  return (
    <nav className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Main Links */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => onNavigate(currentUser ? 'dashboard' : 'landing')}
          className="flex items-center gap-2 text-left cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-100 tracking-tight block group-hover:text-indigo-300 transition-colors">
              RemodelAI <span className="text-indigo-400">3D</span>
            </span>
          </div>
        </button>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1 text-xs">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              currentView === 'dashboard'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Mis Proyectos
          </button>

          {hasActiveProject && (
            <button
              onClick={() => onNavigate('editor')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                currentView === 'editor'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Editor 3D Activo
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                currentView === 'admin'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-indigo-400 hover:text-indigo-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Panel Admin (RBAC)</span>
            </button>
          )}

          {/* Test Matrix QA Button */}
          <button
            onClick={onOpenTestMatrix}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 border border-emerald-900/40 text-xs font-medium transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Matriz QA (33 Casos)</span>
          </button>
        </div>
      </div>

      {/* Right Controls: Connectivity, User profile & Switcher */}
      <div className="flex items-center gap-3">
        {/* Offline / Online simulation button */}
        <button
          onClick={onToggleOnline}
          title={isOnline ? 'Conexión activa. Clic para simular modo offline.' : 'Sin conexión simulada. Clic para reconectar.'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
            isOnline
              ? 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              : 'bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span className="hidden xl:inline">En línea</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span>Sin conexión</span>
            </>
          )}
        </button>

        {currentUser ? (
          <div className="flex items-center gap-2">
            {/* User Quick Switcher Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 hover:border-slate-700 transition-colors">
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80'}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover border border-slate-700"
                />
                <span className="max-w-[100px] truncate font-medium">{currentUser.name.split(' ')[0]}</span>
                <span className="text-[10px] text-slate-500 uppercase font-mono">({currentUser.role})</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-1 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-1 hidden group-hover:block z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-xs font-semibold text-slate-200">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1 text-[10px] uppercase font-bold text-indigo-400 px-1.5 py-0.5 bg-indigo-500/10 rounded">
                    Rol: {currentUser.role}
                  </span>
                </div>

                <div className="p-1 space-y-0.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 px-2 py-1 block">
                    Cambiar rol para pruebas
                  </span>
                  <button
                    onClick={() => onSwitchUser('admin@remodelai.com')}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-300 flex items-center justify-between"
                  >
                    <span>Carlos Ruiz</span>
                    <span className="text-[10px] text-indigo-400 font-mono">Admin</span>
                  </button>
                  <button
                    onClick={() => onSwitchUser('jalejandrocp29@gmail.com')}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-300 flex items-center justify-between"
                  >
                    <span>Alejandro Carrillo</span>
                    <span className="text-[10px] text-slate-400 font-mono">Usuario</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Iniciar Sesión</span>
          </button>
        )}
      </div>
    </nav>
  );
};
