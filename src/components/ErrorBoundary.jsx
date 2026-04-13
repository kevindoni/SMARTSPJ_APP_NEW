import { Component } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-10 max-w-md text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Terjadi Kesalahan</h2>
            <p className="text-sm text-slate-500 mb-2">
              Aplikasi mengalami error yang tidak terduga.
            </p>
            {this.state.error && (
              <p className="text-xs text-red-400 bg-red-50 p-3 rounded-lg mb-5 font-mono break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
            >
              <RefreshCw size={16} />
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
