import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Project,
  Scene,
  Object3DItem,
  LibraryAsset,
  CameraPreset,
  LightingPreset,
  RoomDimensions,
  SceneMaterials,
  User,
  ExportFormat,
  ExportResolution
} from '../types';
import { StorageService } from '../services/storage';
import { EditorHeader } from './Editor3D/EditorHeader';
import { SceneCanvas } from './Editor3D/SceneCanvas';
import { WebGLErrorBoundary } from './WebGLErrorBoundary';
import { AssetLibrary } from './Editor3D/AssetLibrary';
import { PropertiesPanel } from './Editor3D/PropertiesPanel';
import { ExportModal } from './ExportModal';
import { ShareModal } from './ShareModal';
import { AIGeneratorModal } from './AIGeneratorModal';

interface EditorPageProps {
  project: Project;
  currentUser: User | null;
  isOnline: boolean;
  onToggleOnline: () => void;
  onUpdateProject: (updated: Project) => void;
  onBackToDashboard: () => void;
  onNavigateToShareView?: (token: string) => void;
}

export const EditorPage: React.FC<EditorPageProps> = ({
  project,
  currentUser,
  isOnline,
  onToggleOnline,
  onUpdateProject,
  onBackToDashboard,
  onNavigateToShareView
}) => {
  // Local state for active scene
  const [scene, setScene] = useState<Scene>(project.scene);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('perspectiva');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>(project.scene.lightingPreset || 'dia');

  // History stack for Undo/Redo (up to 50 actions as per PRD)
  const [history, setHistory] = useState<Scene[]>([JSON.parse(JSON.stringify(project.scene))]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'pending' | 'error'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date(project.updatedAt));
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Export render callback from Three.js canvas
  const exportFnRef = useRef<((format: ExportFormat, resolution: ExportResolution) => Promise<string>) | null>(null);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Sync scene when external project changes
  useEffect(() => {
    setScene(project.scene);
  }, [project.id]);

  // Push new state to history stack (max 50)
  const pushToHistory = useCallback((newScene: Scene) => {
    setHistory(prev => {
      const sliced = prev.slice(0, historyIndex + 1);
      const updated = [...sliced, JSON.parse(JSON.stringify(newScene))];
      if (updated.length > 50) {
        return updated.slice(updated.length - 50);
      }
      return updated;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Trigger Debounced Auto-Save (3 seconds of inactivity as specified in PRD Section 5.10)
  const triggerAutoSave = useCallback((newScene: Scene) => {
    setSaveStatus('pending');
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      setSaveStatus('saving');
      try {
        const updatedProject: Project = {
          ...project,
          scene: newScene,
          updatedAt: new Date().toISOString(),
          version: (project.version || 1) + 1
        };

        StorageService.saveProject(updatedProject);
        onUpdateProject(updatedProject);
        setSaveStatus('saved');
        setLastSavedAt(new Date());

        // Audit log
        StorageService.logAudit({
          action: 'edit_scene',
          entityType: 'project',
          entityId: project.id,
          userId: currentUser?.id || 'anon',
          userName: currentUser?.name || 'Anónimo',
          userEmail: currentUser?.email || 'anon@remodelai.com',
          status: 'SUCCESS',
          metadata: { objectsCount: newScene.objects.length }
        });
      } catch (err) {
        setSaveStatus('error');
      }
    }, 3000);
  }, [project, currentUser, onUpdateProject]);

  // Immediate manual save
  const handleManualSave = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    setSaveStatus('saving');
    try {
      const updatedProject: Project = {
        ...project,
        scene,
        updatedAt: new Date().toISOString(),
        version: (project.version || 1) + 1
      };
      StorageService.saveProject(updatedProject);
      onUpdateProject(updatedProject);
      setSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch (err) {
      setSaveStatus('error');
    }
  };

  // Mutate scene helper
  const updateSceneState = (updater: (prev: Scene) => Scene) => {
    setScene(prev => {
      const next = updater(prev);
      pushToHistory(next);
      triggerAutoSave(next);
      return next;
    });
  };

  // Undo (Ctrl+Z)
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const targetScene = JSON.parse(JSON.stringify(history[newIndex]));
      setHistoryIndex(newIndex);
      setScene(targetScene);
      triggerAutoSave(targetScene);
    }
  }, [historyIndex, history, triggerAutoSave]);

  // Redo (Ctrl+Y / Ctrl+Shift+Z)
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const targetScene = JSON.parse(JSON.stringify(history[newIndex]));
      setHistoryIndex(newIndex);
      setScene(targetScene);
      triggerAutoSave(targetScene);
    }
  }, [historyIndex, history, triggerAutoSave]);

  // Add Asset with 100-object limit enforcement
  const handleAddAsset = (asset: LibraryAsset) => {
    if (scene.objects.length >= 100) {
      alert('Has alcanzado el límite de 100 objetos para este proyecto.');
      return;
    }

    const newObj: Object3DItem = {
      id: `obj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sceneId: scene.id,
      libraryAssetId: asset.id,
      name: asset.name,
      category: asset.category,
      type: asset.type,
      position: {
        x: (Math.random() - 0.5) * (scene.dimensions.width * 0.5),
        y: (asset.defaultDimensions?.height || 0.8) / 2,
        z: (Math.random() - 0.5) * (scene.dimensions.length * 0.5)
      },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: asset.defaultColor,
      material: asset.defaultMaterial,
      visible: true,
      locked: false
    };

    updateSceneState(prev => ({
      ...prev,
      objects: [...prev.objects, newObj]
    }));

    setSelectedObjectId(newObj.id);
  };

  // Delete Object
  const handleDeleteObject = useCallback((objectId: string) => {
    updateSceneState(prev => ({
      ...prev,
      objects: prev.objects.filter(o => o.id !== objectId)
    }));
    if (selectedObjectId === objectId) {
      setSelectedObjectId(null);
    }
  }, [selectedObjectId]);

  // Duplicate Object
  const handleDuplicateObject = useCallback((objectId: string) => {
    if (scene.objects.length >= 100) {
      alert('Has alcanzado el límite de 100 objetos para este proyecto.');
      return;
    }

    const target = scene.objects.find(o => o.id === objectId);
    if (!target) return;

    const cloned: Object3DItem = {
      ...JSON.parse(JSON.stringify(target)),
      id: `obj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${target.name} (Copia)`,
      position: {
        x: Math.min(scene.dimensions.width / 2 - 0.2, target.position.x + 0.3),
        y: target.position.y,
        z: Math.min(scene.dimensions.length / 2 - 0.2, target.position.z + 0.3)
      }
    };

    updateSceneState(prev => ({
      ...prev,
      objects: [...prev.objects, cloned]
    }));
    setSelectedObjectId(cloned.id);
  }, [scene.objects, scene.dimensions]);

  // Update Object Transform & Material
  const handleUpdateObject = (updated: Object3DItem) => {
    updateSceneState(prev => ({
      ...prev,
      objects: prev.objects.map(o => (o.id === updated.id ? updated : o))
    }));
  };

  // Update Dimensions
  const handleUpdateDimensions = (dimensions: RoomDimensions) => {
    updateSceneState(prev => ({
      ...prev,
      dimensions
    }));
  };

  // Update Materials
  const handleUpdateMaterials = (materials: SceneMaterials) => {
    updateSceneState(prev => ({
      ...prev,
      materials
    }));
  };

  // Rename Project
  const handleRenameProject = (newName: string) => {
    const updated = { ...project, name: newName, updatedAt: new Date().toISOString() };
    StorageService.saveProject(updated);
    onUpdateProject(updated);
  };

  // Apply AI-generated scene
  const handleApplyGeneratedScene = (newScene: Scene) => {
    updateSceneState(() => newScene);
    setSelectedObjectId(null);
  };

  // Export render handler
  const handleExportRender = async (format: ExportFormat, resolution: ExportResolution): Promise<string> => {
    if (!exportFnRef.current) {
      throw new Error('El renderizador WebGL aún no está listo.');
    }
    const dataUrl = await exportFnRef.current(format, resolution);

    // Register export in audit and metrics
    StorageService.logExport({
      id: `exp-${Date.now()}`,
      projectId: project.id,
      userId: currentUser?.id || 'anon',
      format,
      resolution,
      fileSizeBytes: Math.floor(dataUrl.length * 0.75),
      createdAt: new Date().toISOString()
    });

    return dataUrl;
  };

  // Keyboard Shortcuts Listener (Ctrl+Z, Ctrl+Y, Ctrl+D, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z (without Shift)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Redo: Ctrl+Y, Cmd+Y or Ctrl+Shift+Z, Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }

      // Duplicate: Ctrl+D or Cmd+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedObjectId) {
          e.preventDefault();
          handleDuplicateObject(selectedObjectId);
        }
      }

      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjectId) {
          e.preventDefault();
          handleDeleteObject(selectedObjectId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleDuplicateObject, handleDeleteObject, selectedObjectId]);

  const selectedObject = scene.objects.find(o => o.id === selectedObjectId) || null;

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* 1. Editor Header */}
      <EditorHeader
        projectName={project.name}
        onRenameProject={handleRenameProject}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        onManualSave={handleManualSave}
        isOnline={isOnline}
        onToggleOnlineSim={onToggleOnline}
        cameraPreset={cameraPreset}
        onChangeCameraPreset={setCameraPreset}
        lightingPreset={lightingPreset}
        onChangeLightingPreset={p => {
          setLightingPreset(p);
          updateSceneState(prev => ({ ...prev, lightingPreset: p }));
        }}
        objectCount={scene.objects.length}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenAIGenerator={() => setIsAIOpen(true)}
        onBackToDashboard={onBackToDashboard}
      />

      {/* 2. Workspace Body: Left Catalog + Center 3D Viewport + Right Properties */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Asset Catalog */}
        <AssetLibrary
          currentObjectCount={scene.objects.length}
          maxObjects={100}
          onAddAsset={handleAddAsset}
        />

        {/* Center 3D WebGL Canvas */}
        <main className="flex-1 relative bg-slate-950 overflow-hidden">
          <WebGLErrorBoundary>
            <SceneCanvas
              scene={scene}
              selectedObjectId={selectedObjectId}
              onSelectObject={setSelectedObjectId}
              lightingPreset={lightingPreset}
              cameraPreset={cameraPreset}
              onCanvasReady={fn => {
                exportFnRef.current = fn;
              }}
            />
          </WebGLErrorBoundary>
        </main>

        {/* Right Properties Panel */}
        <PropertiesPanel
          selectedObject={selectedObject}
          dimensions={scene.dimensions}
          materials={scene.materials}
          onUpdateObject={handleUpdateObject}
          onDeleteObject={handleDeleteObject}
          onDuplicateObject={handleDuplicateObject}
          onUpdateDimensions={handleUpdateDimensions}
          onUpdateMaterials={handleUpdateMaterials}
        />
      </div>

      {/* 3. Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        projectName={project.name}
        cameraPreset={cameraPreset}
        lightingPreset={lightingPreset}
        onExportRender={handleExportRender}
        onOpenShare={() => {
          setIsExportOpen(false);
          setIsShareOpen(true);
        }}
      />

      {/* 4. Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        projectId={project.id}
        projectName={project.name}
        currentUserId={currentUser?.id || 'anon'}
        currentUserName={currentUser?.name || 'Anónimo'}
        onNavigateToShareView={onNavigateToShareView}
      />

      {/* 5. AI Room Generator Wizard */}
      <AIGeneratorModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        projectId={project.id}
        userId={currentUser?.id || 'anon'}
        initialDimensions={scene.dimensions}
        onApplyGeneratedScene={handleApplyGeneratedScene}
      />
    </div>
  );
};
