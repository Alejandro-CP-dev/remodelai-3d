import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

export class WebGLErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Error en el renderizado 3D'
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[WebGLErrorBoundary] Error capturado:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100 mb-1">
            Interrupción en el motor 3D
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-5">
            El contexto gráfico WebGL se ha reiniciado o detectó una anomalía temporal de aceleración por hardware.
          </p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition shadow-lg shadow-indigo-600/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reiniciar motor 3D
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
