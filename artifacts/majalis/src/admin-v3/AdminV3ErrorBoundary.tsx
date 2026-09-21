import { Component, type ErrorInfo, type ReactNode } from "react";
import { AdminV3ErrorState } from "./states";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AdminV3ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env?.DEV) {
      console.error("[admin-v3]", error, info.componentStack);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <AdminV3ErrorState
          message={this.state.error.message || "تعذّر عرض لوحة التحكم."}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
