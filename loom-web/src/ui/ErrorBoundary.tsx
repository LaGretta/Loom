import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from './primitives'

/**
 * Keeps one broken screen from taking down the whole app. Without it a single
 * unexpected field shape (a renamed DTO property, a null where an object was
 * assumed) unmounts the entire React tree and leaves a blank page with no way back.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) { return { error } }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the detail in the console for debugging; the UI stays human.
    console.error('[loom] screen crashed', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="pane" style={{ height: '100%' }}>
        <ErrorState
          title="This screen hit a problem"
          subtitle="Something in the data didn’t look the way the app expected."
          retryLabel="Reload this screen"
          onRetry={() => { this.setState({ error: null }); this.props.onReset?.() }}
        />
      </div>
    )
  }
}
