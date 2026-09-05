import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = (): void => {
    try {
      localStorage.removeItem('my_pocket_finance_data');
    } catch {
      // Ignore
    }
    window.location.reload();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#17191C] text-[#F4F6F8] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#202328] border border-[#30353B] rounded-2xl p-6 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#F0525D]/20 text-[#F0525D] mx-auto flex items-center justify-center text-xl font-bold">
              !
            </div>
            <h1 className="text-xl font-bold">Ha ocurrido un error al cargar</h1>
            <p className="text-sm text-[#9AA3AD]">
              Ocurrió un problema inesperado en la interfaz. Puedes reiniciar la aplicación o restaurar los datos por defecto.
            </p>
            {this.state.error && (
              <div className="text-left bg-[#17191C] p-3 rounded-lg border border-[#30353B] text-xs font-mono text-[#F0525D] overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#35D0BA] text-[#07150D] font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity"
              >
                Recargar página
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-lg bg-[#272B30] text-[#9AA3AD] hover:text-[#F0525D] border border-[#30353B] font-medium text-sm cursor-pointer transition-colors"
              >
                Limpiar datos
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
