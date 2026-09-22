import React, { useState } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storage';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, X, Check, ArrowLeft, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'verify' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      const { user } = StorageService.registerUser(name, email);
      setPendingUserId(user.id);
      setMode('verify');
      setSuccessMessage('Hemos enviado un enlace y código de verificación a tu correo.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error en el registro');
    }
  };

  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUserId) return;
    try {
      const user = StorageService.verifyEmail(pendingUserId);
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMessage('Código de verificación inválido.');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const user = StorageService.login(email);
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        const existing = StorageService.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          setPendingUserId(existing.id);
          setMode('verify');
          setErrorMessage('Tu cuenta aún no está verificada. Por favor ingresa el código o verifica tu correo.');
          return;
        }
      }
      setErrorMessage(err.message || 'Credenciales incorrectas');
    }
  };

  const handleQuickSwitch = (targetEmail: string) => {
    try {
      const user = StorageService.login(targetEmail);
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        const u = StorageService.getUsers().find(usr => usr.email === targetEmail);
        if (u) {
          setPendingUserId(u.id);
          setMode('verify');
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              {mode === 'login' && <LogIn className="w-4 h-4" />}
              {mode === 'register' && <UserPlus className="w-4 h-4" />}
              {mode === 'verify' && <Mail className="w-4 h-4" />}
              {mode === 'forgot' && <KeyRound className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                {mode === 'login' && 'Iniciar Sesión'}
                {mode === 'register' && 'Crear Cuenta'}
                {mode === 'verify' && 'Verificar Correo Electrónico'}
                {mode === 'forgot' && 'Recuperar Contraseña'}
              </h3>
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
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Correo electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-indigo-400 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Ingresar a mi cuenta
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">¿No tienes una cuenta? </span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('register');
                  }}
                  className="text-xs text-indigo-400 hover:underline font-medium"
                >
                  Registrarse gratis
                </button>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Nombre completo</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej. Sofía Morales"
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
                    placeholder="sofia@ejemplo.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Al menos 6 caracteres"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Confirmar contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Crear cuenta y verificar
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">¿Ya tienes cuenta? </span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('login');
                  }}
                  className="text-xs text-indigo-400 hover:underline font-medium"
                >
                  Iniciar sesión
                </button>
              </div>
            </form>
          )}

          {mode === 'verify' && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="text-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                <Mail className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <p className="text-xs text-slate-300">
                  Hemos enviado un correo a <strong className="text-white">{email || 'tu email'}</strong>.
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Introduce el código de verificación o haz clic directamente en el botón de abajo para simular el enlace del correo.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Código de 6 dígitos</label>
                <input
                  type="text"
                  maxLength={6}
                  value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value)}
                  placeholder="849201"
                  className="w-full text-center tracking-widest text-base py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Confirmar y activar cuenta
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessMessage('Nuevo código enviado a tu bandeja.');
                  }}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  Reenviar código de verificación
                </button>
              </div>
            </form>
          )}

          {mode === 'forgot' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Ingresa tu correo electrónico registrado y te enviaremos un enlace de recuperación.
              </p>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Correo electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSuccessMessage('Si el correo existe en el sistema, recibirás las instrucciones.');
                  setMode('login');
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Enviar enlace de recuperación
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver al login
              </button>
            </div>
          )}

          {/* Testing Accounts Quick-Switcher */}
          <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block text-center">
              Cuentas demo para pruebas rápidas
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickSwitch('admin@remodelai.com')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-slate-300 transition-colors"
              >
                <span className="font-semibold text-indigo-400 block">Carlos Ruiz</span>
                <span className="text-slate-500 text-[10px]">Rol: Admin (Métricas)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch('jalejandrocp29@gmail.com')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-left text-slate-300 transition-colors"
              >
                <span className="font-semibold text-indigo-400 block">Alejandro Carrillo</span>
                <span className="text-slate-500 text-[10px]">Rol: Usuario Estándar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
