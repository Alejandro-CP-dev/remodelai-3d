import React, { useState } from 'react';
import { Project, User } from '../types';
import {
  FolderPlus,
  Sparkles,
  Search,
  MoreVertical,
  Copy,
  Trash2,
  Share2,
  Calendar,
  Layers,
  ArrowRight,
  Maximize2,
  ExternalLink
} from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  currentUser: User | null;
  onOpenProject: (projectId: string) => void;
  onCreateNewProject: (name: string, dimensions?: { width: number; length: number; height: number }) => void;
  onOpenAIGenerator: () => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onShareProject: (projectId: string, projectName: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  currentUser,
  onOpenProject,
  onCreateNewProject,
  onOpenAIGenerator,
  onDuplicateProject,
  onDeleteProject,
  onShareProject
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('Nuevo Espacio 3D');
  const [newWidth, setNewWidth] = useState(4.0);
  const [newLength, setNewLength] = useState(3.0);
  const [newHeight, setNewHeight] = useState(2.6);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateNewProject(newProjectName.trim(), {
      width: Number(newWidth),
      length: Number(newLength),
      height: Number(newHeight)
    });
    setShowNewModal(false);
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 md:p-10 select-none overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Área de Trabajo
            </span>
            <h1 className="text-2xl font-bold text-slate-100 mt-1">
              Mis Proyectos de Remodelación 3D
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestiona, diseña con IA y comparte tus espacios fotorrealistas
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenAIGenerator}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Crear con IA</span>
            </button>

            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-indigo-400" />
              <span>Diseñar desde cero</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar proyecto por nombre..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="text-xs text-slate-400">
            Mostrando <strong>{filteredProjects.length}</strong> de {projects.length} proyectos
          </div>
        </div>

        {/* Projects Grid or Official Empty State */}
        {filteredProjects.length === 0 ? (
          // Official Empty State as specified in PRD & USERFLOW
          <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800/80 max-w-xl mx-auto my-12 space-y-4">
            <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Aún no tienes proyectos</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Aún no tienes proyectos. Crea tu primer proyecto y transforma tu habitación en un espacio 3D.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onOpenAIGenerator}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Crear mi primer proyecto con IA
              </button>
              <button
                onClick={() => setShowNewModal(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Diseñar manualmente
              </button>
            </div>
          </div>
        ) : (
          // Projects Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <div
                key={project.id}
                className="group relative bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:shadow-indigo-950/20 transition-all flex flex-col"
              >
                {/* Thumbnail Image Header */}
                <div
                  onClick={() => onOpenProject(project.id)}
                  className="relative h-48 bg-slate-950 overflow-hidden cursor-pointer"
                >
                  <img
                    src={project.thumbnailUrl || 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&fit=crop&q=80'}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[11px] font-mono text-indigo-300 border border-slate-800">
                    {project.scene.dimensions.width}×{project.scene.dimensions.length}m
                  </span>

                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[11px] font-medium text-slate-300 border border-slate-800 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-indigo-400" />
                    {project.scene.objects.length} objetos
                  </span>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                    <span className="font-semibold text-sm truncate">{project.name}</span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {project.description || 'Diseño de remodelación 3D paramétrico.'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                    <span>v{project.version || 1}.0</span>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenProject(project.id)}
                      className="flex-1 py-2 px-3 bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Abrir editor 3D</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onShareProject(project.id, project.name)}
                      title="Compartir enlace público"
                      className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDuplicateProject(project.id)}
                      title="Duplicar proyecto"
                      className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar el proyecto "${project.name}"?`)) {
                          onDeleteProject(project.id);
                        }
                      }}
                      title="Eliminar proyecto (Soft delete)"
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Nuevo Proyecto en Blanco</h3>
              <p className="text-xs text-slate-400 mt-0.5">Configura el nombre y las dimensiones de la habitación</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Nombre del espacio</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="Ej: Sala de Estar Nórdica"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Ancho (X)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newWidth}
                    onChange={e => setNewWidth(parseFloat(e.target.value) || 4.0)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Largo (Z)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newLength}
                    onChange={e => setNewLength(parseFloat(e.target.value) || 3.0)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Alto (Y)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newHeight}
                    onChange={e => setNewHeight(parseFloat(e.target.value) || 2.6)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Crear Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
