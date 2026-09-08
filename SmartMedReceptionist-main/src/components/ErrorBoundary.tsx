import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Stethoscope } from 'lucide-react';
import { resetDemoData } from '../utils/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Readonly<Props>;
  declare state: Readonly<State>;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught SmartMedChart Receptionist Portal error:', error, errorInfo);
  }

  private handleReset = () => {
    resetDemoData();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Workstation Recovery Mode</h1>
                <p className="text-xs text-slate-400">SmartMedChart Receptionist Portal encountered an issue</p>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 text-xs font-mono text-rose-300 overflow-x-auto">
              {this.state.error?.message || 'An unexpected rendering error occurred'}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              This usually happens when corrupted or outdated session data exists in browser cache. Click below to reset the clinic workspace with clean mock patient charts and doctor queues.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset & Reload Receptionist Workspace</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
