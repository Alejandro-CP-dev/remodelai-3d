import React, { useState } from 'react';
import { CameraPreset, User, Project } from '../types';
import { useEditorScene } from '../hooks/useEditorScene';
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
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('perspectiva');

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  const {
    scene,
    selectedObjectId,
    setSelectedObjectId,
    selectedObject,
    lightingPreset,
    changeLightingPreset,
    canUndo,
    canRedo,
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
  } = useEditorScene(project, currentUser, onUpdateProject);

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* 1. Editor Header */}
      <EditorHeader
        projectName={project.name}
        onRenameProject={renameProject}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        onManualSave={manualSave}
        isOnline={isOnline}
        onToggleOnlineSim={onToggleOnline}
        cameraPreset={cameraPreset}
        onChangeCameraPreset={setCameraPreset}
        lightingPreset={lightingPreset}
        onChangeLightingPreset={changeLightingPreset}
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
          onAddAsset={addAsset}
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
          onUpdateObject={updateObject}
          onDeleteObject={deleteObject}
          onDuplicateObject={duplicateObject}
          onUpdateDimensions={updateDimensions}
          onUpdateMaterials={updateMaterials}
        />
      </div>

      {/* 3. Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        projectName={project.name}
        cameraPreset={cameraPreset}
        lightingPreset={lightingPreset}
        onExportRender={exportRender}
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
        onApplyGeneratedScene={applyGeneratedScene}
      />
    </div>
  );
};
