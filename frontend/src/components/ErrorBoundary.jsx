import React from "react";

/**
 * ErrorBoundary
 * Catches JavaScript errors anywhere in child component trees,
 * logs those errors, and displays a friendly recovery UI instead of a blank white screen.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("GrowKaro ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
              ⚠️
            </div>
            <h2 className="text-xl font-black text-gray-900">Console View Recovered</h2>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
              {this.state.error?.message || "An unexpected view error occurred while rendering this view."}
            </p>
            <div className="pt-2 flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn-secondary text-xs px-4 py-2"
              >
                Retry
              </button>
              <button
                onClick={this.handleReset}
                className="btn-primary text-xs px-4 py-2"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
