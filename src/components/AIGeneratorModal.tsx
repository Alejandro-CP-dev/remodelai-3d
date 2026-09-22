import React, { useState, useRef } from 'react';
import { RoomDimensions, Scene, AIGeneration } from '../types';
import { useAIGeneration } from '../hooks/useAIGeneration';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Loader2,
  X,
  AlertTriangle,
  History,
  Clock,
  RotateCcw,
  Edit3
} from 'lucide-react';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  userId: string;
  initialDimensions?: RoomDimensions;
  onApplyGeneratedScene: (scene: Scene) => void;
}

const SAMPLE_ROOM_IMAGES = [
  {
    name: 'Habitación Vacía',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&fit=crop&q=80',
    prompt: 'Habitación nórdica de 4.0m x 3.0m con cama queen contra la pared derecha, escritorio junto a la ventana, paredes blancas y piso de madera cálida.'
  },
  {
    name: 'Dormitorio Minimalista',
    url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&fit=crop&q=80',
    prompt: 'Dormitorio estilo japandi con armario de dos puertas, mesitas de noche flotantes, paredes gris suave y alfombra de lana.'
  },
  {
    name: 'Espacio Loft Industrial',
    url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&fit=crop&q=80',
    prompt: 'Habitación tipo loft de 5.0m x 4.0m con pared de ladrillo visto, suelo de microcemento, estantería modular negra y sofá moderno.'
  }
];

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  onClose,
  projectId,
  userId,
  initialDimensions = { width: 4.0, length: 3.0, height: 2.6 },
  onApplyGeneratedScene
}) => {
  const [prompt, setPrompt] = useState(
    'Habitación moderna de 4.0m x 3.0m, cama doble contra la pared derecha, escritorio junto a la ventana, paredes claras y piso de madera de roble.'
  );
  const [dimensions, setDimensions] = useState<RoomDimensions>(initialDimensions);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Failure & edge-case simulation controls for testing TRD compliance
  const [simulateTimeout, setSimulateTimeout] = useState(false);
  const [simulateCriticalError, setSimulateCriticalError] = useState(false);
  const [simulateRecoverableError, setSimulateRecoverableError] = useState(false);

  // History tab
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<AIGeneration[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isProcessing,
    progress,
    stageMessage,
    errorState,
    setErrorState,
    pendingScene,
    startGeneration,
    cancelGeneration,
    loadHistory: loadHistoryList
  } = useAIGeneration(projectId, userId);

  if (!isOpen) return null;

  const handleImageFile = (file: File) => {
    // Validate size (<= 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen excede el límite de 10MB permitidos.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelGeneration = () => {
    cancelGeneration(prompt, dimensions);
  };

  const handleStartGeneration = async () => {
    const result = await startGeneration({
      prompt,
      dimensions,
      imageUrl: selectedImage || undefined,
      simulateTimeout,
      simulateCriticalError,
      simulateRecoverableError
    });

    if (result.success && result.scene) {
      onApplyGeneratedScene(result.scene);
      onClose();
    }
  };

  const loadHistory = () => {
    setHistoryList(loadHistoryList());
    setShowHistory(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-lg shadow-md shadow-indigo-600/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Generador de Espacios 3D Asistido por IA
              </h3>
              <p className="text-xs text-slate-400">
                Transforma fotos y descripciones en lenguaje natural en habitaciones 3D interactivas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (showHistory) setShowHistory(false);
                else loadHistory();
              }}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">{showHistory ? 'Volver al asistente' : 'Historial'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin scrollbar-thumb-slate-700">
          {showHistory ? (
            // --- HISTORY VIEW ---
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Historial de Generaciones ({historyList.length})
              </h4>
              {historyList.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No hay generaciones previas registradas para este proyecto.
                </div>
              ) : (
                historyList.map(item => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        item.status === 'TIMEOUT' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        item.status === 'CANCELLED' ? 'bg-slate-800 text-slate-400' :
                        'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleTimeString()} ({((item.durationMs || 0) / 1000).toFixed(1)}s)
                      </span>
                    </div>
                    <p className="text-slate-300 font-medium line-clamp-2">{item.prompt}</p>
                    {item.resultScene && (
                      <button
                        onClick={() => {
                          onApplyGeneratedScene(item.resultScene!);
                          onClose();
                        }}
                        className="mt-2 text-indigo-400 hover:text-indigo-300 underline text-[11px] font-medium block"
                      >
                        Restaurar este diseño en el editor 3D →
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            // --- GENERATION FORM / PIPELINE VIEW ---
            <>
              {/* Error Callouts with standard actions (Reintentar, Modificar, Editar) */}
              {errorState && (
                <div className={`p-4 rounded-xl border ${
                  errorState.type === 'RECOVERABLE'
                    ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold">
                        {errorState.type === 'RECOVERABLE' ? 'Generación con información incompleta' :
                         errorState.type === 'TIMEOUT' ? 'Tiempo de procesamiento agotado' : 'Fallo de Generación'}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">{errorState.msg}</p>

                      {/* Action buttons on failure */}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={handleStartGeneration}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reintentar
                        </button>

                        <button
                          onClick={() => setErrorState(null)}
                          className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Modificar descripción
                        </button>

                        {pendingScene && (
                          <button
                            onClick={() => {
                              onApplyGeneratedScene(pendingScene);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            Usar y editar manualmente en 3D
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Photo Upload / Samples */}
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                  1. Foto o Plano de la Habitación (Opcional, hasta 10MB)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 hover:border-indigo-500/60 bg-slate-950/60 rounded-xl p-4 text-center cursor-pointer transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                  />

                  {selectedImage ? (
                    <div className="relative inline-block">
                      <img
                        src={selectedImage}
                        alt="Preview"
                        className="max-h-36 rounded-lg border border-slate-800 object-cover"
                      />
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedImage(null);
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-500 shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-300 font-medium">
                        Arrastra una foto o haz clic para subir
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Formatos soportados: JPG, PNG, WEBP (máx. 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Sample Photos */}
                <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-[11px] text-slate-400 shrink-0">O probar muestra:</span>
                  {SAMPLE_ROOM_IMAGES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedImage(sample.url);
                        setPrompt(sample.prompt);
                      }}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg text-[11px] border border-slate-800 whitespace-nowrap flex items-center gap-1 transition-colors"
                    >
                      <ImageIcon className="w-3 h-3 text-indigo-400" />
                      {sample.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Natural Language Prompt */}
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                  2. Descripción del Diseño en Lenguaje Natural
                </label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Ej: Habitación de 4m x 3m con cama doble contra la pared derecha, ventana de 1.5m, escritorio de roble y piso de madera cálida..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Step 3: Room Dimensions */}
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                  3. Dimensiones Paramétricas (Metros)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">Ancho (X)</span>
                    <input
                      type="number"
                      step="0.1"
                      min="2.5"
                      max="10.0"
                      value={dimensions.width}
                      onChange={e => setDimensions({ ...dimensions, width: parseFloat(e.target.value) || 4.0 })}
                      className="w-full bg-transparent text-xs text-slate-200 font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">Largo (Z)</span>
                    <input
                      type="number"
                      step="0.1"
                      min="2.5"
                      max="10.0"
                      value={dimensions.length}
                      onChange={e => setDimensions({ ...dimensions, length: parseFloat(e.target.value) || 3.0 })}
                      className="w-full bg-transparent text-xs text-slate-200 font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1">Altura (Y)</span>
                    <input
                      type="number"
                      step="0.1"
                      min="2.2"
                      max="4.5"
                      value={dimensions.height}
                      onChange={e => setDimensions({ ...dimensions, height: parseFloat(e.target.value) || 2.6 })}
                      className="w-full bg-transparent text-xs text-slate-200 font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Pipeline Progress Indicator */}
              {isProcessing && (
                <div className="p-4 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-3 animate-pulse">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-indigo-400 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      {stageMessage}
                    </span>
                    <span className="text-slate-400 font-mono">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Etapas: Análisis → Detección → Modelo 3D → Texturas</span>
                    <button
                      onClick={handleCancelGeneration}
                      className="text-rose-400 hover:text-rose-300 underline font-medium"
                    >
                      Cancelar generación
                    </button>
                  </div>
                </div>
              )}

              {/* Test Edge Cases Checklist (as explicitly requested in TRD Section 5.10) */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Simulación de Casos de Borde (Testing QA)
                </span>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simulateTimeout}
                      onChange={e => setSimulateTimeout(e.target.checked)}
                      className="accent-indigo-600 rounded"
                    />
                    <span>Simular Timeout 60s</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simulateCriticalError}
                      onChange={e => setSimulateCriticalError(e.target.checked)}
                      className="accent-indigo-600 rounded"
                    />
                    <span>Simular Fallo Crítico</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simulateRecoverableError}
                      onChange={e => setSimulateRecoverableError(e.target.checked)}
                      className="accent-indigo-600 rounded"
                    />
                    <span>Simular Fallo Recuperable</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!showHistory && (
          <div className="p-5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end gap-2.5 shrink-0">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleStartGeneration}
              disabled={isProcessing || !prompt.trim()}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generando escena...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generar Habitación 3D
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
