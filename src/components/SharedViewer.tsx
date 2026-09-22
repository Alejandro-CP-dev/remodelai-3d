import React, { useState, useEffect } from 'react';
import { Project, CameraPreset, LightingPreset, User } from '../types';
import { StorageService } from '../services/storage';
import { apiClient } from '../services/apiClient';
import { SceneCanvas } from './Editor3D/SceneCanvas';
import { WebGLErrorBoundary } from './WebGLErrorBoundary';
import { Copy, Eye, ArrowLeft, Sun, Moon, Sunset, Home, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';

interface SharedViewerProps {
  token: string;
  currentUser: User | null;
  onCloneSuccess: (clonedProject: Project) => void;
  onBackToHome: () => void;
  onRequireAuth: () => void;
}

export const SharedViewer: React.FC<SharedViewerProps> = ({
  token,
  currentUser,
  onCloneSuccess,
  onBackToHome,
  onRequireAuth
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [creatorName, setCreatorName] = useState<string>('');
  const [isRevoked, setIsRevoked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('perspectiva');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('dia');
  const [isCloning, setIsCloning] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    // 1. Try fetching from real server API (enables cross-device sharing)
    apiClient.getShareByToken(token)
      .then(res => {
        if (!isMounted) return;
        if (!res || !res.project) {
          setIsRevoked(true);
        } else {
          setProject(res.project);
          setCreatorName(res.share.creatorName || res.project.ownerName);
          setLightingPreset(res.project.scene?.lightingPreset || 'dia');
        }
      })
      .catch(() => {
        // Fallback to local storage if offline or during local test
        const share = StorageService.getShareLinkByToken(token);
        if (!share || !share.isActive) {
          if (isMounted) setIsRevoked(true);
          return;
        }
        StorageService.logShareAccess(token);
        const proj = StorageService.getProjectById(share.projectId);
        if (!proj) {
          if (isMounted) setIsRevoked(true);
          return;
        }
        if (isMounted) {
          setProject(proj);
          setCreatorName(share.creatorName || proj.ownerName);
          setLightingPreset(proj.scene.lightingPreset || 'dia');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleCloneProject = async () => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    if (!project) return;
    setIsCloning(true);
    try {
      // Try backend duplicate first
      let cloned: Project;
      try {
        cloned = await apiClient.duplicateProject(project.id);
      } catch {
        cloned = StorageService.duplicateProject(project.id, currentUser.id, currentUser.name);
      }
      onCloneSuccess(cloned);
    } catch (err) {
      alert('No se pudo clonar el proyecto.');
    } finally {
      setIsCloning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm text-slate-300 font-medium">Cargando espacio 3D compartido...</p>
        <p className="text-xs text-slate-500 mt-1">Sincronizando geometrías y texturas del servidor</p>
      </div>
    );
  }

  // Friendly Revoked Link Screen
  if (isRevoked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Este enlace ya no está disponible</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          El propietario ha revocado o desactivado el acceso compartido a este diseño 3D.
        </p>
        <button
          onClick={onBackToHome}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Home className="w-4 h-4" />
          Ir al inicio
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Cargando espacio 3D compartido...
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Header */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            title="Volver a RemodelAI"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">RemodelAI 3D</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-slate-100 max-w-[220px] sm:max-w-xs truncate">
                {project.name}
              </h1>
              <span className="text-[10px] bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium hidden md:inline">
                Solo lectura
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Diseñado por {creatorName} • {project.scene.dimensions.width}×{project.scene.dimensions.length}m ({project.scene.objects.length} objetos)
            </p>
          </div>
        </div>

        {/* Center: Camera & Lighting presets */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {(['perspectiva', 'superior', 'frontal', 'isometrica'] as CameraPreset[]).map(p => (
            <button
              key={p}
              onClick={() => setCameraPreset(p)}
              className={`px-2 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                cameraPreset === p ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p === 'superior' ? 'Planta' : p}
            </button>
          ))}
          <div className="h-3 w-px bg-slate-800 mx-1" />
          <button
            onClick={() => setLightingPreset('dia')}
            title="Luz de día"
            className={`p-1 rounded ${lightingPreset === 'dia' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLightingPreset('atardecer')}
            title="Atardecer"
            className={`p-1 rounded ${lightingPreset === 'atardecer' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            <Sunset className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLightingPreset('noche')}
            title="Noche"
            className={`p-1 rounded ${lightingPreset === 'noche' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Clone Project */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCloneProject}
            disabled={isCloning}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Crear una copia</span>
          </button>
        </div>
      </header>

      {/* 3D Viewport in Read-Only Mode */}
      <main className="flex-1 relative">
        <WebGLErrorBoundary>
          <SceneCanvas
            scene={project.scene}
            selectedObjectId={null}
            onSelectObject={() => {}}
            lightingPreset={lightingPreset}
            cameraPreset={cameraPreset}
            isReadOnly={true}
          />
        </WebGLErrorBoundary>

        {/* Floating banner on top of viewport */}
        <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-xl max-w-xs pointer-events-none">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
            <Eye className="w-3.5 h-3.5" />
            Visor 3D Interactivo
          </div>
          <p className="text-[11px] text-slate-300">
            Puedes rotar la escena y hacer zoom libremente. Si deseas hacer modificaciones, haz clic en <strong>Crear una copia</strong> para guardarlo en tu cuenta.
          </p>
        </div>
      </main>
    </div>
  );
};
