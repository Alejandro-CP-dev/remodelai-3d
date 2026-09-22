import React from 'react';
import {
  Object3DItem,
  RoomDimensions,
  SceneMaterials,
  WallMaterial,
  FloorMaterial
} from '../../types';
import {
  Trash2,
  Copy,
  Maximize2,
  Sliders,
  Palette,
  Home,
  Check
} from 'lucide-react';

interface PropertiesPanelProps {
  selectedObject: Object3DItem | null;
  dimensions: RoomDimensions;
  materials: SceneMaterials;
  onUpdateObject: (updated: Object3DItem) => void;
  onDeleteObject: (objectId: string) => void;
  onDuplicateObject: (objectId: string) => void;
  onUpdateDimensions: (dim: RoomDimensions) => void;
  onUpdateMaterials: (mat: SceneMaterials) => void;
}

const WALL_MATERIALS: { id: WallMaterial; name: string; color: string }[] = [
  { id: 'pintura', name: 'Pintura Lisa', color: '#f8fafc' },
  { id: 'madera', name: 'Madera Natural', color: '#b45309' },
  { id: 'ladrillo', name: 'Ladrillo Visto', color: '#991b1b' },
  { id: 'cemento', name: 'Cemento / Concreto', color: '#64748b' },
  { id: 'marmol', name: 'Mármol Blanco', color: '#f1f5f9' },
  { id: 'ceramica', name: 'Cerámica Blanca', color: '#e2e8f0' }
];

const FLOOR_MATERIALS: { id: FloorMaterial; name: string; color: string }[] = [
  { id: 'madera', name: 'Roble Cálido', color: '#92400e' },
  { id: 'ceramica', name: 'Porcelanato Claro', color: '#e2e8f0' },
  { id: 'marmol', name: 'Mármol Pulido', color: '#f8fafc' },
  { id: 'cemento', name: 'Microcemento Gris', color: '#475569' },
  { id: 'alfombra', name: 'Alfombra Beige', color: '#d6d3d1' }
];

const PRESET_COLORS = [
  '#f8fafc', '#e2e8f0', '#94a3b8', '#334155', '#1e293b',
  '#b45309', '#78350f', '#0284c7', '#15803d', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#ffffff'
];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedObject,
  dimensions,
  materials,
  onUpdateObject,
  onDeleteObject,
  onDuplicateObject,
  onUpdateDimensions,
  onUpdateMaterials
}) => {
  // Helpers for object modification
  const handleCoordChange = (axis: 'x' | 'y' | 'z', val: number) => {
    if (!selectedObject) return;
    onUpdateObject({
      ...selectedObject,
      position: { ...selectedObject.position, [axis]: Number(val.toFixed(2)) }
    });
  };

  const handleRotChange = (axis: 'x' | 'y' | 'z', val: number) => {
    if (!selectedObject) return;
    onUpdateObject({
      ...selectedObject,
      rotation: { ...selectedObject.rotation, [axis]: Math.round(val) }
    });
  };

  const handleScaleChange = (val: number) => {
    if (!selectedObject) return;
    const clamped = Math.max(0.3, Math.min(3.0, val));
    onUpdateObject({
      ...selectedObject,
      scale: { x: clamped, y: clamped, z: clamped }
    });
  };

  const handleDropToFloor = () => {
    if (!selectedObject) return;
    onUpdateObject({
      ...selectedObject,
      position: { ...selectedObject.position, y: 0.1 }
    });
  };

  return (
    <aside className="w-80 h-full flex flex-col bg-slate-900 border-l border-slate-800 select-none overflow-hidden">
      {selectedObject ? (
        // --- OBJECT PROPERTIES ---
        <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-semibold text-indigo-400 tracking-wider">
                {selectedObject.category}
              </span>
              <h3 className="text-sm font-semibold text-slate-100 mt-0.5 truncate max-w-[180px]">
                {selectedObject.name}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDuplicateObject(selectedObject.id)}
                title="Duplicar objeto (Ctrl+D)"
                className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteObject(selectedObject.id)}
                title="Eliminar objeto (Supr)"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Position X, Y, Z */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Posición (metros)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">X (Ancho)</span>
                <input
                  type="number"
                  step="0.1"
                  value={selectedObject.position.x}
                  onChange={e => handleCoordChange('x', parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Y (Altura)</span>
                <input
                  type="number"
                  step="0.1"
                  value={selectedObject.position.y}
                  onChange={e => handleCoordChange('y', parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Z (Largo)</span>
                <input
                  type="number"
                  step="0.1"
                  value={selectedObject.position.z}
                  onChange={e => handleCoordChange('z', parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Rotation (Degrees) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Rotación horizontal</label>
              <span className="text-xs text-slate-400">{selectedObject.rotation.y}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="15"
              value={selectedObject.rotation.y}
              onChange={e => handleRotChange('y', parseInt(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <button onClick={() => handleRotChange('y', 0)} className="hover:text-slate-300">0°</button>
              <button onClick={() => handleRotChange('y', 90)} className="hover:text-slate-300">90°</button>
              <button onClick={() => handleRotChange('y', 180)} className="hover:text-slate-300">180°</button>
              <button onClick={() => handleRotChange('y', -90)} className="hover:text-slate-300">-90°</button>
            </div>
          </div>

          {/* Scale */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                Escala uniforme
              </label>
              <span className="text-xs text-slate-400">{selectedObject.scale.x.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={selectedObject.scale.x}
              onChange={e => handleScaleChange(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Object Color / Finish */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              Color del objeto
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => onUpdateObject({ ...selectedObject, color: c })}
                  className={`w-7 h-7 rounded-md border flex items-center justify-center transition-transform ${
                    selectedObject.color === c ? 'scale-110 border-indigo-400 ring-2 ring-indigo-500/50' : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {selectedObject.color === c && (
                    <Check className={`w-3 h-3 ${['#f8fafc', '#ffffff', '#e2e8f0'].includes(c) ? 'text-slate-900' : 'text-white'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Object Actions */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <button
              onClick={handleDropToFloor}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              Apoyar en el suelo
            </button>
            <button
              onClick={() => handleCoordChange('x', 0)}
              className="w-full py-1.5 bg-slate-800/60 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Centrar en X
            </button>
          </div>
        </div>
      ) : (
        // --- ROOM GENERAL PROPERTIES ---
        <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-100">Dimensiones de Habitación</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Selecciona un objeto en la escena 3D para editarlo, o ajusta la arquitectura aquí.
            </p>
          </div>

          {/* Room Dimensions Width, Length, Height */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Ancho (X)</span>
                <span className="text-indigo-400 font-semibold">{dimensions.width.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min="2.5"
                max="8.0"
                step="0.1"
                value={dimensions.width}
                onChange={e => onUpdateDimensions({ ...dimensions, width: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Largo (Z)</span>
                <span className="text-indigo-400 font-semibold">{dimensions.length.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min="2.5"
                max="8.0"
                step="0.1"
                value={dimensions.length}
                onChange={e => onUpdateDimensions({ ...dimensions, length: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Altura de Paredes (Y)</span>
                <span className="text-indigo-400 font-semibold">{dimensions.height.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min="2.2"
                max="4.0"
                step="0.1"
                value={dimensions.height}
                onChange={e => onUpdateDimensions({ ...dimensions, height: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex justify-between">
              <span>Área total de suelo:</span>
              <span className="text-slate-200 font-medium">{(dimensions.width * dimensions.length).toFixed(1)} m²</span>
            </div>
          </div>

          {/* Wall Finish & Color */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Material de Paredes</label>
            <div className="grid grid-cols-2 gap-1.5">
              {WALL_MATERIALS.map(m => (
                <button
                  key={m.id}
                  onClick={() => onUpdateMaterials({ ...materials, wallMaterial: m.id, wallColor: m.color })}
                  className={`p-2 rounded-lg text-left text-xs border transition-all ${
                    materials.wallMaterial === m.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-slate-700 shrink-0" style={{ backgroundColor: m.color }} />
                    <span className="truncate">{m.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Floor Finish */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Material de Suelo</label>
            <div className="grid grid-cols-2 gap-1.5">
              {FLOOR_MATERIALS.map(f => (
                <button
                  key={f.id}
                  onClick={() => onUpdateMaterials({ ...materials, floorMaterial: f.id, floorColor: f.color })}
                  className={`p-2 rounded-lg text-left text-xs border transition-all ${
                    materials.floorMaterial === f.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-slate-700 shrink-0" style={{ backgroundColor: f.color }} />
                    <span className="truncate">{f.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Ceiling Toggle */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-slate-300 font-medium">Mostrar Techo</span>
              <input
                type="checkbox"
                checked={materials.ceilingVisible}
                onChange={e => onUpdateMaterials({ ...materials, ceilingVisible: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
            </label>
          </div>
        </div>
      )}
    </aside>
  );
};
