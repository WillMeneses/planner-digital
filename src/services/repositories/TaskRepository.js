import { db } from '../../db';
import { APP_CONFIG } from '../../config';
import apiClient from '../api/client';

const useCloud = () => APP_CONFIG.DATA_MODE === 'CLOUD';

export const TaskRepository = {
    async getAll(userId) {
        if (useCloud()) {
            return await apiClient.get('/tasks'); // X-User-Id handled by client
        }
        return await db.tasks.where('userId').equals(Number(userId)).toArray();
    },

    async add(userId, task) {
        if (useCloud()) {
            // userId passed in body for backend compatibility, header handled by client
            return await apiClient.post('/tasks', { ...task, userId });
        }
        return await db.tasks.add({ ...task, userId: Number(userId) });
    },

    async update(taskId, updates) {
        if (useCloud()) {
            return await apiClient.put('/tasks', { id: taskId, ...updates });
        }
        return await db.tasks.update(Number(taskId), updates);
    },

    async delete(taskId) {
        if (useCloud()) {
            return await apiClient.delete(`/tasks?id=${taskId}`);
        }
        return await db.tasks.delete(Number(taskId));
    },

    async toggleCompletion(taskId, currentStatus) {
        if (useCloud()) {
            // We reuse the update method or specific endpoint if we had one
            // Adapting the logic from DataService
            const task = { id: taskId, completed: !currentStatus };
            return await apiClient.put('/tasks', task);
        }
        return await db.tasks.update(Number(taskId), { completed: !currentStatus });
    }
};
