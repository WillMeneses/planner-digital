
import { db } from '../db';

const CURRENT_USER_KEY = 'planner_current_user';

export const AuthService = {
    register: async (name, email, password) => {
        // Check if user exists
        const existing = await db.users.where('email').equals(email).first();
        if (existing) {
            throw new Error('Email já cadastrado');
        }

        // Add user
        const id = await db.users.add({
            name,
            email,
            password
        });

        const newUser = { id, name, email };

        // Auto login session
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
        return newUser;
    },

    login: async (email, password) => {
        const user = await db.users.where('email').equals(email).first();

        if (!user || user.password !== password) {
            throw new Error('Email ou senha inválidos');
        }

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
