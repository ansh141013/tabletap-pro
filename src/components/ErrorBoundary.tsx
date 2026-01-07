
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-500" />
                    </div>
                    <h1 className="mb-2 text-2xl font-bold text-foreground">
                        Something went wrong
                    </h1>
                    <p className="mb-6 max-w-md text-muted-foreground">
                        We apologize for the inconvenience. An unexpected error has occurred.
                    </p>
                    <div className="rounded-md bg-muted p-4 mb-6 max-w-lg w-full overflow-auto text-left">
                        <p className="font-mono text-xs text-red-500 break-words">{this.state.error?.message}</p>
                    </div>
                    <Button onClick={() => window.location.reload()} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Reload Application
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
