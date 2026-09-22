import React, { useState } from 'react';
import { Sparkles, Layers, Download, Share2, ArrowRight, CheckCircle2, ShieldCheck, Box } from 'lucide-react';

interface LandingPageProps {
  onOpenDemo: () => void;
  onOpenRegister: () => void;
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenDemo,
  onOpenRegister,
  onOpenLogin
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        {/* Subtle Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generación Paramétrica 3D Asistida por IA</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-100 max-w-4xl leading-tight">
          Visualiza la remodelación de tu habitación{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-amber-300">
            antes de ejecutarla en la realidad
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Convierte fotos y descripciones en lenguaje natural en escenas 3D WebGL interactivas.
          Distribuye mobiliario con precisión métrica, exporta renders en 4K y comparte con tus clientes.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onOpenDemo}
            className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-sm font-semibold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Explorar Demo Interactivo 3D</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenRegister}
            className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            Crear cuenta gratis
          </button>
        </div>

        {/* Interactive Before / After Showcase */}
        <div className="mt-14 w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl overflow-hidden">
          <div className="relative aspect-video rounded-2xl overflow-hidden select-none">
            {/* After Image (Full background) */}
            <img
              src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&auto=format&fit=crop&q=80"
              alt="Habitación Remodelada 3D"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 bg-indigo-600/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg">
              ✨ Después: Remodelación 3D con RemodelAI
            </div>

            {/* Before Image (Clipped by slider) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src="https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&auto=format&fit=crop&q=80"
                alt="Habitación Original Vacía"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: '100%', height: '100%' }}
              />
              <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-slate-300 border border-slate-800">
                📷 Antes: Habitación Vacía
              </div>
            </div>

            {/* Slider Divider Bar */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] cursor-ew-resize flex items-center justify-center"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-xl text-xs font-bold">
                ↔
              </div>
            </div>

            {/* Hidden range slider for smooth touch & drag */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={e => setSliderPosition(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 px-2">
            <span>Arrastra la barra central para comparar el estado original y la transformación 3D</span>
            <span className="hidden sm:inline">WebGL Three.js • PBR Materials</span>
          </div>
        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-slate-100">
            Arquitectura Completa para Diseñadores y Propietarios
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Desde la captura fotográfica hasta la exportación en 4K y la compartición segura
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-100">Pipeline Asíncrono de IA</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detecta proporciones, puertas, ventanas y mobiliario en 4 etapas transparentes con tolerancia a cancelaciones y reintentos.
            </p>
          </div>

          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Box className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-100">Editor 3D Paramétrico</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Catálogo de más de 15 muebles y acabados. Control milimétrico de posición (X, Y, Z), rotación, escala y hasta 50 niveles de Undo/Redo.
            </p>
          </div>

          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-100">Matriz de Exportación HD</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Capturas nativas WebGL en 9 combinaciones: formatos PNG, JPG y WEBP a resoluciones 1080p, 2K y 4K con iluminación fotorrealista.
            </p>
          </div>

          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-100">Visor Público Seguro</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Comparte enlaces de solo lectura con protección de tokens revocables y posibilidad de clonar copias independientes.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        <p>RemodelAI 3D • Plataforma de remodelación tridimensional asistida por inteligencia artificial.</p>
      </footer>
    </div>
  );
};
