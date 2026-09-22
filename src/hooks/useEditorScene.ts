import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Project,
  Scene,
  Object3DItem,
  LibraryAsset,
  LightingPreset,
  RoomDimensions,
  SceneMaterials,
  User,
  ExportFormat,
  ExportResolution
} from '../types';
import { StorageService } from '../services/storage';

// Application-layer logic for the 3D editor: scene state, undo/redo history,
// debounced autosave, keyboard shortcuts, and the object/material/dimension
// mutations. EditorPage.tsx (and its children) stay presentation-only.
export function useEditorScene(project: Project, currentUser: User | null, onUpdateProject: (updated: Project) => void) {
  const [scene, setScene] = useState<Scene>(project.scene);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [lightingPreset, setLightingPresetState] = useState<LightingPreset>(project.scene.lightingPreset || 'dia');

  // History stack for Undo/Redo (up to 50 actions as per PRD)
  const [history, setHistory] = useState<Scene[]>([JSON.parse(JSON.stringify(project.scene))]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'pending' | 'error'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date(project.updatedAt));
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Export render callback from Three.js canvas
  const exportFnRef = useRef<((format: ExportFormat, resolution: ExportResolution) => Promise<string>) | null>(null);

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
  const manualSave = () => {
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
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const targetScene = JSON.parse(JSON.stringify(history[newIndex]));
      setHistoryIndex(newIndex);
      setScene(targetScene);
      triggerAutoSave(targetScene);
    }
  }, [historyIndex, history, triggerAutoSave]);

  // Redo (Ctrl+Y / Ctrl+Shift+Z)
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const targetScene = JSON.parse(JSON.stringify(history[newIndex]));
      setHistoryIndex(newIndex);
      setScene(targetScene);
      triggerAutoSave(targetScene);
    }
  }, [historyIndex, history, triggerAutoSave]);

  // Add Asset with 100-object limit enforcement
  const addAsset = (asset: LibraryAsset) => {
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
  const deleteObject = useCallback((objectId: string) => {
    updateSceneState(prev => ({
      ...prev,
      objects: prev.objects.filter(o => o.id !== objectId)
    }));
    if (selectedObjectId === objectId) {
      setSelectedObjectId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObjectId]);

  // Duplicate Object
  const duplicateObject = useCallback((objectId: string) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.objects, scene.dimensions]);

  // Update Object Transform & Material
  const updateObject = (updated: Object3DItem) => {
    updateSceneState(prev => ({
      ...prev,
      objects: prev.objects.map(o => (o.id === updated.id ? updated : o))
    }));
  };

  // Update Dimensions
  const updateDimensions = (dimensions: RoomDimensions) => {
    updateSceneState(prev => ({
      ...prev,
      dimensions
    }));
  };

  // Update Materials
  const updateMaterials = (materials: SceneMaterials) => {
    updateSceneState(prev => ({
      ...prev,
      materials
    }));
  };

  // Rename Project
  const renameProject = (newName: string) => {
    const updated = { ...project, name: newName, updatedAt: new Date().toISOString() };
    StorageService.saveProject(updated);
    onUpdateProject(updated);
  };

  // Apply AI-generated scene
  const applyGeneratedScene = (newScene: Scene) => {
    updateSceneState(() => newScene);
    setSelectedObjectId(null);
  };

  // Lighting preset drives both local UI state and the persisted scene field
  const changeLightingPreset = (preset: LightingPreset) => {
    setLightingPresetState(preset);
    updateSceneState(prev => ({ ...prev, lightingPreset: preset }));
  };

  // Export render handler
  const exportRender = async (format: ExportFormat, resolution: ExportResolution): Promise<string> => {
    if (!exportFnRef.current) {
      throw new Error('El renderizador WebGL aún no está listo.');
    }
    const dataUrl = await exportFnRef.current(format, resolution);

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

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        redo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedObjectId) {
          e.preventDefault();
          duplicateObject(selectedObjectId);
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjectId) {
          e.preventDefault();
          deleteObject(selectedObjectId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, duplicateObject, deleteObject, selectedObjectId]);

  const selectedObject = scene.objects.find(o => o.id === selectedObjectId) || null;

  return {
    scene,
    selectedObjectId,
    setSelectedObjectId,
    selectedObject,
    lightingPreset,
    changeLightingPreset,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    undo,
    redo,
    saveStatus,
    lastSavedAt,
    manualSave,
    addAsset,
    deleteObject,
    duplicateObject,
    updateObject,
    updateDimensions,
    updateMaterials,
    renameProject,
    applyGeneratedScene,
    exportFnRef,
    exportRender
  };
}
