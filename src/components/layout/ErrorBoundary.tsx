import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/** Catches render errors anywhere below and shows a recoverable fallback. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    // In a real app this would report to an error service.
    console.error('Unhandled error:', error)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <div className="card max-w-md p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Something went wrong</h1>
            <p className="mt-1 text-sm text-slate-500">
              An unexpected error occurred. You can try again or reload the page.
            </p>
            <pre className="mt-3 max-h-28 overflow-auto rounded-lg bg-slate-100 p-2 text-left text-xs text-slate-500">
              {this.state.error.message}
            </pre>
            <div className="mt-5 flex justify-center gap-2">
              <button onClick={this.reset} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Try again
              </button>
              <button onClick={() => (window.location.href = '/')} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                Go home
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
