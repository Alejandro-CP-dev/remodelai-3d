import React, { useState } from 'react';
import { ASSET_LIBRARY } from '../../data/assets';
import { AssetCategory, LibraryAsset } from '../../types';
import { Search, Plus, Armchair, Sparkles, Building2, Layers } from 'lucide-react';

interface AssetLibraryProps {
  currentObjectCount: number;
  maxObjects?: number;
  onAddAsset: (asset: LibraryAsset) => void;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  currentObjectCount,
  maxObjects = 100,
  onAddAsset
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'todos'>('todos');

  const filteredAssets = ASSET_LIBRARY.filter(asset => {
    const matchesCat = selectedCategory === 'todos' || asset.category === selectedCategory;
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const isLimitReached = currentObjectCount >= maxObjects;

  return (
    <aside className="w-80 h-full flex flex-col bg-slate-900 border-r border-slate-800 select-none overflow-hidden">
      {/* Header with Object Counter */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-100">Catálogo de Objetos</h2>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isLimitReached
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}>
            {currentObjectCount}/{maxObjects}
          </span>
        </div>

        {isLimitReached && (
          <div className="text-[11px] text-rose-300 bg-rose-950/60 p-2 rounded border border-rose-800/60 mb-2">
            ⚠️ Has alcanzado el límite de 100 objetos para este proyecto.
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar mueble o decoración..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 p-2 px-3 border-b border-slate-800/80 bg-slate-900/50 overflow-x-auto text-xs scrollbar-none">
        <button
          onClick={() => setSelectedCategory('todos')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'todos'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Todos ({ASSET_LIBRARY.length})
        </button>
        <button
          onClick={() => setSelectedCategory('muebles')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            selectedCategory === 'muebles'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Armchair className="w-3 h-3" />
          Muebles
        </button>
        <button
          onClick={() => setSelectedCategory('decoracion')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            selectedCategory === 'decoracion'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          Decoración
        </button>
        <button
          onClick={() => setSelectedCategory('estructura')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            selectedCategory === 'estructura'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-3 h-3" />
          Estructura
        </button>
      </div>

      {/* Asset Grid List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-700">
        {filteredAssets.length === 0 ? (
          <div className="text-center py-10 px-4">
            <p className="text-xs text-slate-400">No se encontraron assets para esta búsqueda.</p>
          </div>
        ) : (
          filteredAssets.map(asset => (
            <div
              key={asset.id}
              className="group relative flex items-center gap-3 p-2 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl transition-all"
            >
              <img
                src={asset.thumbnailUrl}
                alt={asset.name}
                className="w-14 h-14 object-cover rounded-lg bg-slate-900 border border-slate-800 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-300">
                  {asset.name}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {asset.description}
                </p>
                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                  <span>{asset.defaultDimensions.width}×{asset.defaultDimensions.depth}m</span>
                  <span>•</span>
                  <span className="capitalize">{asset.category}</span>
                </div>
              </div>

              <button
                disabled={isLimitReached}
                onClick={() => onAddAsset(asset)}
                title={isLimitReached ? 'Límite de 100 objetos alcanzado' : 'Agregar a la habitación'}
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                  isLimitReached
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-indigo-600/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-indigo-600/30'
                }`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
