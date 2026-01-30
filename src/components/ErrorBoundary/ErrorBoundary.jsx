import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught Error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <AlertTriangle size={64} color="var(--accent-color)" style={{ marginBottom: '1rem' }} />
                    <h1>Ops! Algo deu errado.</h1>
                    <p style={{ maxWidth: '500px', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                        Encontramos um erro inesperado. Tente recarregar a página.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'var(--accent-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '1rem'
                        }}
                    >
                        <RefreshCw size={18} />
                        Recarregar Aplicação
                    </button>
                    {this.state.error && (
                        <details style={{ marginTop: '2rem', textAlign: 'left', background: '#00000010', padding: '1rem', borderRadius: '8px' }}>
                            <summary>Detalhes do Erro</summary>
                            <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
                                {this.state.error.toString()}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
