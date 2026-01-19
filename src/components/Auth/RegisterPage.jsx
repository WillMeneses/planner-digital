import React, { useState } from 'react';
import { AuthService } from '../../services/auth';
import './Auth.css';

const RegisterPage = ({ onLogin, onNavigateLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const user = await AuthService.register(name, email, password);
            onLogin(user);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card animate-fade-in">
                <div className="auth-header">
                    <h1>Criar Conta</h1>
                    <p>Comece a planejar seu futuro hoje.</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nome</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Seu nome"
                            required
                        />
                    </div>
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

                    <button type="submit" className="btn-primary full-width">Criar Conta</button>
                </form>

                <div className="auth-footer">
                    <p>Já tem conta? <button onClick={onNavigateLogin} className="btn-link">Fazer Login</button></p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
