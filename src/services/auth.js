import { db } from '../db';
import { APP_CONFIG } from '../config';

const CURRENT_USER_KEY = 'planner_current_user';
const useCloud = () => APP_CONFIG.DATA_MODE === 'CLOUD';

export const AuthService = {
    register: async (name, email, password) => {
        if (useCloud()) {
            const response = await fetch(`${APP_CONFIG.API_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Erro no cadastro');
            }

            const newUser = await response.json();
            // Auto login session (save to localstorage just like local mode)
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
            return newUser;
        }

        // Local Mode
        const existing = await db.users.where('email').equals(email).first();
        if (existing) throw new Error('Email já cadastrado');

        const id = await db.users.add({ name, email, password });
        const newUser = { id, name, email };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
        return newUser;
    },

    login: async (email, password) => {
        if (useCloud()) {
            const response = await fetch(`${APP_CONFIG.API_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Erro no login');
            }

            const userSession = await response.json();
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userSession));
            return userSession;
        }

        // Local Mode
        const user = await db.users.where('email').equals(email).first();
        if (!user || user.password !== password) throw new Error('Email ou senha inválidos');

        const userSession = { id: user.id, name: user.name, email: user.email };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userSession));
        return userSession;
    },

    logout: () => {
        localStorage.removeItem(CURRENT_USER_KEY);
    },

    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    }
};
