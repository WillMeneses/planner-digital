import React, { useState } from 'react';
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
            <div className="auth-card animate-fade-in">
                <div className="auth-header">
                    <h1>Bem-vindo!</h1>
                    <p>Entre para organizar seu dia.</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="********"
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary full-width">Entrar</button>
                </form>

                <div className="auth-footer">
                    <p>Não tem conta? <button onClick={onNavigateRegister} className="btn-link">Cadastre-se</button></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
