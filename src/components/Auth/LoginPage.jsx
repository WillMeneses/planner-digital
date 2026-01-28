import { useState } from 'react';
import { Mail, Lock, ArrowRight, Layout, AlertCircle } from 'lucide-react';
import { AuthService } from '../../services/auth';
import './Auth.css';

const LoginPage = ({ onLogin, onNavigateRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const user = await AuthService.login(email, password);
            onLogin(user);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card animate-slide-up">
                <div className="auth-header">
                    <div className="auth-logo">
                        <Layout size={48} />
                    </div>
                    <h1>Bem-vindo!</h1>
                    <p>Entre para organizar seu dia.</p>
                </div>

                {error && (
                    <div className="auth-error animate-fade-in">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>E-mail</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon-left" />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Senha</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon-left" />
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="********"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary full-width">
                        Entrar <ArrowRight size={18} />
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Não tem conta? <button onClick={onNavigateRegister} className="btn-link">Cadastre-se</button></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
