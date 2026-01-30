import { useState, useCallback } from 'react';
import { DataService } from '../services/data';

export const useCategories = (user) => {
    const [categories, setCategories] = useState([]);

    // Seed default categories if empty (Logic moved from App.jsx)
    const defaultCategories = [
        { name: 'Trabalho', color: '#3b82f6' },
        { name: 'Pessoal', color: '#10b981' },
        { name: 'Estudo', color: '#8b5cf6' },
        { name: 'Saúde', color: '#ef4444' }
    ];

    const fetchCategories = useCallback(async () => {
        if (!user) return;
        try {
            let data = await DataService.getCategories(user.id);
            if (!data || data.length === 0) {
                // Seed defaults? 
                // For now, let's keep it simple: if API returns empty, we might show defaults in UI or seed them.
                // Let's assume the View handles "No Categories" or we supply defaults in-memory.
                // Actually, let's return defaults combined with data if we want, OR
                // just return what we have. 
                // If we are strictly Cloud, we should persist defaults once.
            }
            setCategories(data && data.length > 0 ? data : defaultCategories);
        } catch (err) {
            console.error("useCategories Error:", err);
        }
    }, [user]);

    const addCategory = async (category) => {
        try {
            await DataService.addCategory(user.id, category);
            await fetchCategories();
        } catch (e) {
            console.error(e);
        }
    };

    const updateCategory = async (id, data) => {
        try {
            await DataService.updateCategory(id, data);
            await fetchCategories();
        } catch (e) {
            console.error(e);
        }
    };

    const deleteCategory = async (id) => {
        try {
            await DataService.deleteCategory(id);
            await fetchCategories();
        } catch (e) {
            console.error(e);
        }
    };

    return {
        categories,
        fetchCategories,
        addCategory,
        updateCategory,
        deleteCategory
    };
};
