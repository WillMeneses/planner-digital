import { db } from '../../db';
import { APP_CONFIG } from '../../config';
import apiClient from '../api/client';

const useCloud = () => APP_CONFIG.DATA_MODE === 'CLOUD';

export const CategoryRepository = {
    async getAll(userId) {
        if (useCloud()) {
            return await apiClient.get('/categories');
        }
        return await db.categories.where('userId').equals(Number(userId)).toArray();
    },

    async add(userId, category) {
        if (useCloud()) {
            return await apiClient.post('/categories', { ...category, userId });
        }
        return await db.categories.add({ ...category, userId: Number(userId) });
    },

    async update(categoryId, data) {
        if (useCloud()) {
            return await apiClient.put('/categories', { id: categoryId, ...data });
        }
        return await db.categories.update(Number(categoryId), data);
    },

    async delete(categoryId) {
        if (useCloud()) {
            return await apiClient.delete(`/categories?id=${categoryId}`);
        }
        return await db.categories.delete(Number(categoryId));
    }
};
