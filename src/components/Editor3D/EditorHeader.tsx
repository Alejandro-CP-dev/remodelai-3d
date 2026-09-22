import React, { useState } from 'react';
import { CameraPreset, LightingPreset } from '../../types';
import {
  Undo2,
  Redo2,
  Check,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Sunset,
  Eye,
  Camera,
  Share2,
  Download,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

interface EditorHeaderProps {
  projectName: string;
  onRenameProject: (name: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  saveStatus: 'saved' | 'saving' | 'pending' | 'error';
  lastSavedAt: Date | null;
  onManualSave: () => void;
  isOnline: boolean;
  onToggleOnlineSim?: () => void;
  cameraPreset: CameraPreset;
  onChangeCameraPreset: (preset: CameraPreset) => void;
  lightingPreset: LightingPreset;
  onChangeLightingPreset: (preset: LightingPreset) => void;
  objectCount: number;
  onOpenExport: () => void;
  onOpenShare: () => void;
  onOpenAIGenerator: () => void;
  onBackToDashboard: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  projectName,
  onRenameProject,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  saveStatus,
  lastSavedAt,
  onManualSave,
  isOnline,
  onToggleOnlineSim,
  cameraPreset,
  onChangeCameraPreset,
  lightingPreset,
  onChangeLightingPreset,
  objectCount,
  onOpenExport,
  onOpenShare,
  onOpenAIGenerator,
  onBackToDashboard
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(projectName);

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      onRenameProject(titleInput.trim());
    } else {
      setTitleInput(projectName);
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between select-none z-10">
      {/* Left: Back button, Title, Undo/Redo & Save Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToDashboard}
          title="Volver a mis proyectos"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Proyectos</span>
        </button>

        <div className="h-4 w-px bg-slate-800" />

        {/* Editable Title */}
        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={e => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={e => e.key === 'Enter' && handleTitleSubmit()}
            autoFocus
            className="text-sm font-semibold bg-slate-950 border border-indigo-500 rounded px-2 py-0.5 text-slate-100 focus:outline-none"
          />
        ) : (
          <button
            onClick={() => {
              setTitleInput(projectName);
              setIsEditingTitle(true);
            }}
            title="Clic para renombrar"
            className="text-sm font-semibold text-slate-100 hover:text-indigo-300 transition-colors max-w-[200px] truncate text-left"
          >
            {projectName}
          </button>
        )}

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800 ml-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Deshacer (Ctrl+Z)"
            className={`p-1.5 rounded-md text-xs transition-colors ${
              canUndo ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Rehacer (Ctrl+Y o Ctrl+Shift+Z)"
            className={`p-1.5 rounded-md text-xs transition-colors ${
              canRedo ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Autosave Indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-amber-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Guardando...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Check className="w-3 h-3" />
              Guardado {lastSavedAt ? `(${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}
            </span>
          )}
          {saveStatus === 'pending' && (
            <button
              onClick={onManualSave}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 underline decoration-slate-600 text-[11px]"
            >
              Cambios pendientes
            </button>
          )}
          {saveStatus === 'error' && (
            <button
              onClick={onManualSave}
              className="flex items-center gap-1 text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40 text-[11px]"
            >
              <AlertCircle className="w-3 h-3" />
              Error al guardar (Reintentar)
            </button>
          )}
        </div>

        {/* Network status & simulation */}
        <button
          onClick={onToggleOnlineSim}
          title={isOnline ? 'Conexión activa. Clic para simular modo offline.' : 'Sin conexión. Los cambios se guardan localmente. Clic para reconectar.'}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
            isOnline
              ? 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              : 'bg-amber-950/80 text-amber-300 border-amber-800/80 animate-pulse'
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
      </div>

      {/* Center: Camera & Lighting Presets */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Camera Views */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
          {(['perspectiva', 'superior', 'frontal', 'lateral', 'isometrica'] as CameraPreset[]).map(preset => (
            <button
              key={preset}
              onClick={() => onChangeCameraPreset(preset)}
              className={`px-2 py-1 rounded-md text-[11px] font-medium capitalize transition-colors ${
                cameraPreset === preset
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {preset === 'superior' ? 'Planta' : preset}
            </button>
          ))}
        </div>

        {/* Lighting Presets */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => onChangeLightingPreset('dia')}
            title="Iluminación de Día"
            className={`p-1.5 rounded-md transition-colors ${
              lightingPreset === 'dia' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeLightingPreset('atardecer')}
            title="Iluminación de Atardecer"
            className={`p-1.5 rounded-md transition-colors ${
              lightingPreset === 'atardecer' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sunset className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeLightingPreset('noche')}
            title="Iluminación Nocturna"
            className={`p-1.5 rounded-md transition-colors ${
              lightingPreset === 'noche' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeLightingPreset('natural')}
            title="Luz Natural Equilibrada"
            className={`p-1.5 rounded-md transition-colors ${
              lightingPreset === 'natural' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: AI Wizard, Export & Share */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenAIGenerator}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-xs font-medium shadow-sm shadow-indigo-600/30 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Generar con IA</span>
        </button>

        <button
          onClick={onOpenShare}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Compartir</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium shadow-sm shadow-emerald-600/30 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exportar HD</span>
        </button>
      </div>
    </header>
  );
};
