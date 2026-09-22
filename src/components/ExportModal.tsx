import React, { useState } from 'react';
import { ExportFormat, ExportResolution, CameraPreset, LightingPreset } from '../types';
import { Download, Share2, Check, Loader2, Sparkles, X, ArrowLeft } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  cameraPreset: CameraPreset;
  lightingPreset: LightingPreset;
  onExportRender: (format: ExportFormat, resolution: ExportResolution) => Promise<string>;
  onOpenShare: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  projectName,
  cameraPreset,
  lightingPreset,
  onExportRender,
  onOpenShare
}) => {
  const [format, setFormat] = useState<ExportFormat>('PNG');
  const [resolution, setResolution] = useState<ExportResolution>('1080p');
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedImageUrl, setRenderedImageUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const resolutionInfo: Record<ExportResolution, { label: string; pixels: string; note: string }> = {
    '1080p': { label: 'Full HD', pixels: '1920 × 1080 px', note: 'Ideal para presentaciones y pantallas estándar' },
    '2K': { label: 'Quad HD (2K)', pixels: '2560 × 1440 px', note: 'Excelente balance entre fidelidad y peso' },
    '4K': { label: 'Ultra HD (4K)', pixels: '3840 × 2160 px', note: 'Máxima resolución para impresión y render profesional' }
  };

  const handleStartRender = async () => {
    setIsRendering(true);
    setRenderProgress(10);

    const progressTimer = setInterval(() => {
      setRenderProgress(prev => {
        if (prev >= 85) return prev;
        return prev + 15;
      });
    }, 200);

    try {
      const dataUrl = await onExportRender(format, resolution);
      clearInterval(progressTimer);
      setRenderProgress(100);
      setRenderedImageUrl(dataUrl);
    } catch (err) {
      clearInterval(progressTimer);
      alert('Ocurrió un error al capturar el render WebGL.');
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownload = () => {
    if (!renderedImageUrl) return;
    const link = document.createElement('a');
    const filename = `${projectName.toLowerCase().replace(/\s+/g, '_')}_${resolution}_${Date.now()}.${format.toLowerCase()}`;
    link.href = renderedImageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                {renderedImageUrl ? 'Exportación completada' : 'Exportar Escena 3D en Alta Resolución'}
              </h3>
              <p className="text-xs text-slate-400">
                {renderedImageUrl ? `${format} · ${resolutionInfo[resolution].pixels}` : 'Captura fotorrealista del modelo WebGL actual'}
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

        {/* Content */}
        <div className="p-6">
          {renderedImageUrl ? (
            // --- RESULT STATE: Exportación completada ---
            <div className="space-y-5">
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center group">
                <img
                  src={renderedImageUrl}
                  alt="Render exportado"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-medium text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Renderizado {resolution} ({format})
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[11px]">Dimensiones nativas:</span>
                  <span className="font-semibold text-slate-200">{resolutionInfo[resolution].pixels}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Formato de codificación:</span>
                  <span className="font-semibold text-slate-200">{format}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Iluminación:</span>
                  <span className="font-semibold capitalize text-slate-200">{lightingPreset}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <button
                  onClick={handleDownload}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Descargar imagen
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenShare();
                  }}
                  className="w-full sm:w-auto py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir proyecto
                </button>
                <button
                  onClick={() => setRenderedImageUrl(null)}
                  className="w-full sm:w-auto py-2.5 px-4 bg-slate-800/60 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver al editor
                </button>
              </div>
            </div>
          ) : (
            // --- CONFIGURATION STATE ---
            <div className="space-y-6">
              {/* Formato */}
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-2">
                  Formato de Imagen
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PNG', 'JPG', 'WEBP'] as ExportFormat[]).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        format === fmt
                          ? 'bg-emerald-600/15 border-emerald-500 text-emerald-300 font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-sm block">{fmt}</span>
                      <span className="text-[10px] text-slate-400">
                        {fmt === 'PNG' ? 'Sin compresión' : fmt === 'JPG' ? 'Estándar web' : 'Alta eficiencia'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolución (1080p, 2K, 4K) */}
              <div>
                <label className="text-xs font-semibold text-slate-200 block mb-2">
                  Resolución de Renderizado
                </label>
                <div className="space-y-2">
                  {(['1080p', '2K', '4K'] as ExportResolution[]).map(res => (
                    <button
                      key={res}
                      onClick={() => setResolution(res)}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                        resolution === res
                          ? 'bg-emerald-600/15 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200">{res}</span>
                          <span className="text-[11px] text-slate-400">({resolutionInfo[res].pixels})</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{resolutionInfo[res].note}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        resolution === res ? 'border-emerald-500 bg-emerald-500' : 'border-slate-700'
                      }`}>
                        {resolution === res && <Check className="w-3 h-3 text-slate-950" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Indicator when rendering */}
              {isRendering && (
                <div className="space-y-2 p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-xs text-slate-300 font-medium">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      Optimizando iluminación y buffers WebGL...
                    </span>
                    <span>{renderProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                disabled={isRendering}
                onClick={handleStartRender}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                {isRendering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando renderizado...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Renderizar {resolution} ({format})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
