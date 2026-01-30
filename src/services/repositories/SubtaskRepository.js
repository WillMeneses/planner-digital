import { db } from '../../db';
import { APP_CONFIG } from '../../config';
import apiClient from '../api/client';

const useCloud = () => APP_CONFIG.DATA_MODE === 'CLOUD';

export const SubtaskRepository = {
    async getByTask(taskId) {
        if (useCloud()) {
            return await apiClient.get(`/subtasks?taskId=${taskId}`);
        }
        return await db.subtasks.where('taskId').equals(Number(taskId)).toArray();
    },

    async add(taskId, title) {
        if (useCloud()) {
            return await apiClient.post('/subtasks', { taskId, title, completed: false });
        }
        return await db.subtasks.add({ taskId: Number(taskId), title, completed: false });
    },

    async toggle(subtaskId, completed, taskId) {
        if (useCloud()) {
            return await apiClient.put('/subtasks', { id: subtaskId, taskId, completed });
        }
        return await db.subtasks.update(Number(subtaskId), { completed });
    },

    async delete(subtaskId, taskId) {
        if (useCloud()) {
            return await apiClient.delete(`/subtasks?id=${subtaskId}&taskId=${taskId}`);
        }
        return await db.subtasks.delete(Number(subtaskId));
    },

    // Complex Sync Logic (previously in DataService)
    async syncSubtasks(taskId, subtasks) {
        if (useCloud()) {
            // 1. Fetch current cloud subtasks
            const existing = await this.getByTask(taskId);

            // 2. Identify deletions
            const incomingIds = new Set(subtasks.filter(s => s.id).map(s => s.id));
            const toDelete = existing.filter(s => !incomingIds.has(s.id));

            await Promise.all(toDelete.map(s => this.delete(s.id, taskId)));

            // 3. Upsert (Add or Update)
            for (const sub of subtasks) {
                if (sub.id) {
                    await this.toggle(sub.id, sub.completed, taskId);
                } else {
                    await this.add(taskId, sub.title);
                }
            }
        } else {
            // Local Sync logic (Transactions handled nicely by Dexie, but we can do manual sync too)
            // Keeping Dexie transaction logic in DataService might be cleaner for legacy,
            // OR we verify if we can replicate this loop locally.
            // Local loop is fine too!

            const existing = await db.subtasks.where('taskId').equals(taskId).toArray();
            const existingIds = new Set(existing.map(s => s.id));
            const incomingIds = new Set(subtasks.filter(s => s.id).map(s => s.id));

            const toDelete = existing.filter(s => !incomingIds.has(s.id)).map(s => s.id);
            if (toDelete.length > 0) await db.subtasks.bulkDelete(toDelete);

            for (const sub of subtasks) {
                if (sub.id && existingIds.has(sub.id)) {
                    await db.subtasks.update(sub.id, { title: sub.title, completed: sub.completed });
                } else {
                    await db.subtasks.add({ taskId, title: sub.title, completed: sub.completed || false });
                }
            }
        }
    }
};
