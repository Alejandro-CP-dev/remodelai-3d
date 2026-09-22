import React, { useState, useEffect } from 'react';
import { User, AdminMetrics, AuditLog } from '../types';
import { StorageService } from '../services/storage';
import { apiClient } from '../services/apiClient';
import {
  ShieldCheck,
  Users,
  FolderKanban,
  Sparkles,
  Download,
  Share2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Clock,
  ShieldAlert
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User | null;
  onBackToApp: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onBackToApp
}) => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMetricsAndLogs = async () => {
    setIsRefreshing(true);
    try {
      const [m, l] = await Promise.all([
        apiClient.getAdminMetrics(),
        apiClient.getAuditLogs()
      ]);
      setMetrics(m);
      setLogs(l);
    } catch {
      // Offline fallback
      const m = StorageService.getAdminMetrics();
      const l = StorageService.getAuditLogs();
      setMetrics(m);
      setLogs(l);
    } finally {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }
  };

  // Auto-refresh every 30s as requested in TRD
  useEffect(() => {
    fetchMetricsAndLogs();
    const timer = setInterval(() => {
      fetchMetricsAndLogs();
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // RBAC Access Control Guard
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">403 • Acceso Restringido</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Se requiere rol de <strong>Administrador</strong> para consultar el panel de métricas operativas y registros de auditoría.
        </p>
        <button
          onClick={onBackToApp}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la aplicación
        </button>
      </div>
    );
  }

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.metadata).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      {/* Admin Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToApp}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                Panel de Auditoría y Métricas (RBAC)
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                  Admin Activo
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Última sincronización: {lastUpdated.toLocaleTimeString()} (auto-refresco 30s)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMetricsAndLogs}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* KPI Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Users */}
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Usuarios</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">{metrics.users.total}</div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span>Activos: <strong className="text-emerald-400">{metrics.users.active}</strong></span>
                <span>Verificados: <strong className="text-indigo-400">{metrics.users.verified}</strong></span>
              </div>
            </div>

            {/* Projects */}
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Proyectos 3D</span>
                <FolderKanban className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">{metrics.projects.total}</div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span>Activos: <strong className="text-sky-400">{metrics.projects.active}</strong></span>
                <span>En papelera: <strong className="text-rose-400">{metrics.projects.deleted}</strong></span>
              </div>
            </div>

            {/* AI Generations */}
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Generaciones IA</span>
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">{metrics.aiGenerations.total}</div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span>Éxito: <strong className="text-emerald-400">{metrics.aiGenerations.successful}</strong></span>
                <span>Media: <strong className="text-violet-400">{((metrics.aiGenerations.averageDurationMs || 0) / 1000).toFixed(1)}s</strong></span>
              </div>
            </div>

            {/* Exports */}
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Exportaciones HD</span>
                <Download className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">{metrics.exports.total}</div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span>PNG: {metrics.exports.byFormat.PNG}</span>
                <span>JPG: {metrics.exports.byFormat.JPG}</span>
                <span>WEBP: {metrics.exports.byFormat.WEBP}</span>
              </div>
            </div>

            {/* Shares */}
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Enlaces Compartidos</span>
                <Share2 className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">{metrics.shares.totalCreated}</div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                <span>Visitas: <strong className="text-amber-400">{metrics.shares.totalViews}</strong></span>
                <span>Activos: <strong className="text-emerald-400">{metrics.shares.active}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Audit Log Table Section */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Registro de Auditoría del Sistema (Audit Trail)
              </h3>
              <p className="text-xs text-slate-400">
                Trazabilidad completa de autenticación, mutaciones 3D, llamadas IA y enlaces compartidos
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar usuario o ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={filterAction}
                onChange={e => setFilterAction(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-1.5 focus:outline-none"
              >
                <option value="all">Todas las acciones</option>
                <option value="login">Login</option>
                <option value="register">Registro</option>
                <option value="ai_generate">Generación IA</option>
                <option value="edit_scene">Edición 3D</option>
                <option value="export_render">Exportación HD</option>
                <option value="share_create">Enlace Compartido</option>
                <option value="project_delete">Eliminación</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 px-3 py-1.5 focus:outline-none"
              >
                <option value="all">Todos los estados</option>
                <option value="SUCCESS">Éxito</option>
                <option value="FAILED">Fallo</option>
                <option value="TIMEOUT">Timeout</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3 pl-5">Fecha / Hora</th>
                  <th className="p-3">Usuario</th>
                  <th className="p-3">Acción</th>
                  <th className="p-3">Entidad</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 pr-5">Metadatos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No se encontraron registros de auditoría para estos filtros.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 pl-5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3 font-medium text-slate-200">
                        {log.userName || log.userId}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 font-mono text-[11px] text-indigo-300">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">
                        {log.entityType}: <span className="font-mono text-[11px] text-slate-300">{log.entityId}</span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          log.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          log.status === 'TIMEOUT' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {log.status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3" />}
                          {log.status === 'FAILED' && <XCircle className="w-3 h-3" />}
                          {log.status === 'TIMEOUT' && <AlertTriangle className="w-3 h-3" />}
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 pr-5 font-mono text-[10px] text-slate-400 max-w-xs truncate">
                        {JSON.stringify(log.metadata)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
