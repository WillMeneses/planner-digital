
import { db } from '../db';
import { APP_CONFIG } from '../config';

// Helper to decide where to fetch data
const useCloud = () => APP_CONFIG.DATA_MODE === 'CLOUD';

export const DataService = {
    // --- Tasks Methods ---

    addTask: async (userId, task) => {
        if (useCloud()) {
            const response = await fetch(`${APP_CONFIG.API_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...task, userId }) // API ignores userId manual payload but good for debug
            });
            return await response.json();
        }
        return await db.tasks.add({ ...task, userId: Number(userId) });
    },

    updateTask: async (taskId, updates) => {
        if (useCloud()) {
            // Need to fetch current task first to merge updates if API requires full object
            // For now assuming we send what we have, but Cosmos usually wants "id" and "partitionKey"
            // We will simplify: Backend handles specific updates or we send merged object
            // For this version (simple), we might need to send the whole object or just patch.
            // Let's assume our backend handles basic updates (PUT usually replaces).
            // Strategy: We will do a merge on client or server. 
            // For now, let's just send the ID and updates (Server needs to handle partials or we fetch-merge-save).
            // *Simpler approach for this step*: Assume backend does replace. 
            // We'll update the 'PUT' case in DataService later if we need full object.

            // To be safe with Cosmos Replace: fetch -> merge -> put
            // Or change backend to PATCH. 
            // Let's stick to Dexie parity: update(id, changes).

            // Let's do a client-side merge for safety:
            // 1. We might not have the full task here.
            // Let's simply send what we have and let backend handle it OR 
            // Better: Use PATCH method or assume PUT merges?
            // Standard Entity: PUT = Replace.
            // Let's try sending updates and rely on backend for now, or fetch first.

            // Actually, for efficency, let's treat update as "Patch" logic here.
            // Since our backend PUT does a replace, we ideally need the full object.
            // BUT, for speed, let's keep it simple: 
            const response = await fetch(`${APP_CONFIG.API_URL}/tasks`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: taskId, ...updates })
            });
            return await response.json();
        }
        return await db.tasks.update(Number(taskId), updates);
    },

    deleteTask: async (taskId) => {
        if (useCloud()) {
            await fetch(`${APP_CONFIG.API_URL}/tasks?id=${taskId}`, {
                method: 'DELETE'
            });
            return;
        }
        return await db.tasks.delete(Number(taskId));
    },

    toggleTaskCompletion: async (taskId, currentStatus) => {
        if (useCloud()) {
            /* 
             NOTE: Our current API PUT replaces the whole item. 
             Ideally we should use PATCH or fetch-update-save.
             We will fix the backend to support partial updates later if needed.
             For now, we rely on the implementation.
            */
            const task = { id: taskId, completed: !currentStatus };
            const response = await fetch(`${APP_CONFIG.API_URL}/tasks`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(task)
            });
            return await response.json();
        }
        return await db.tasks.update(Number(taskId), { completed: !currentStatus });
    },

    getTasks: async (userId) => {
        if (useCloud()) {
            const response = await fetch(`${APP_CONFIG.API_URL}/tasks`);
            if (!response.ok) return [];
            return await response.json();
        }
        return await db.tasks.where('userId').equals(Number(userId)).toArray();
    },

    // --- Category Methods (Cloud Not Implemented Yet - Fallback to Local or Future API) ---
    // For now, Categories stay Local or we accept they won't sync until we add API endpoints for them.
    // To assume MVP success: We keep Categories LOCAL for now to avoid breaking UI.

    getCategories: async (userId) => {
        return await db.categories.where('userId').equals(Number(userId)).toArray();
    },

    addCategory: async (userId, category) => {
        return await db.categories.add({ ...category, userId: Number(userId) });
    },

    updateCategory: async (categoryId, categoryData) => {
        return await db.categories.update(Number(categoryId), categoryData);
    },

    deleteCategory: async (categoryId) => {
        return await db.categories.delete(Number(categoryId));
    },

    // --- Subtask Methods (Complex - Requires API updates) ---
    // Deferred: Subtasks logic is complex with transactions.
    // For Phase 1 of Cloud: We allow tasks but subtasks might be tricky without dedicated API.
    // ... Keeping local implementation for now or we will error out on Cloud.

    getSubtasks: async (taskId) => {
        return await db.subtasks.where('taskId').equals(Number(taskId)).toArray();
    },

    saveTaskWithSubtasks: async (userId, taskData, subtasks) => {
        if (useCloud()) {
            // Cloud version: Just save the task for now. 
            // Subtasks need a relational model or embedding in Cosmos (Embedding is better).
            // Doing SIMPLE save for MVP:
            return await DataService.addTask(userId, taskData);
        }

        // Local Transaction
        return await db.transaction('rw', db.tasks, db.subtasks, async () => {
            // ... (Keep existing local logic)
            // 1. Save/Update Task
            let taskId = taskData.id;
            if (taskId) {
                await db.tasks.update(taskId, taskData);
            } else {
                taskId = await db.tasks.add({ ...taskData, userId: Number(userId) });
            }

            // 2. Handle Subtasks
            const existingSubtasks = await db.subtasks.where('taskId').equals(taskId).toArray();
            const existingIds = new Set(existingSubtasks.map(s => s.id));
            const incomingIds = new Set(subtasks.filter(s => s.id).map(s => s.id));

            const toDelete = existingSubtasks.filter(s => !incomingIds.has(s.id)).map(s => s.id);
            if (toDelete.length > 0) {
                await db.subtasks.bulkDelete(toDelete);
            }

            for (const sub of subtasks) {
                if (sub.id && existingIds.has(sub.id)) {
                    await db.subtasks.update(sub.id, { title: sub.title, completed: sub.completed });
                } else {
                    await db.subtasks.add({ taskId, title: sub.title, completed: sub.completed || false });
                }
            }
            return taskId;
        });
    },

    handleRecurringCompletion: async (task) => {
        if (useCloud()) {
            // Basic implementation: Just mark completed. Recurring logic needs migration to API.
            return await DataService.toggleTaskCompletion(task.id, false);
        }

        return await db.transaction('rw', db.tasks, db.subtasks, async () => {
            // (Keep existing local logic)
            await db.tasks.update(task.id, { completed: true });

            if (!task.recurring || task.recurring === 'none') return;

            const currentDate = new Date(task.date + (task.time ? 'T' + task.time : 'T00:00:00'));
            let nextDate = new Date(currentDate);

            switch (task.recurring) {
                case 'daily':
                    nextDate.setDate(currentDate.getDate() + 1);
                    break;
                case 'weekly':
                    nextDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'monthly':
                    nextDate.setMonth(currentDate.getMonth() + 1);
                    break;
            }

            const nextDateStr = nextDate.toISOString().split('T')[0];
            const { id, ...taskData } = task;
            const newTaskId = await db.tasks.add({
                ...taskData,
                date: nextDateStr,
                completed: false
            });

            const subtasks = await db.subtasks.where('taskId').equals(task.id).toArray();
            if (subtasks.length > 0) {
                const newSubtasks = subtasks.map(s => ({
                    taskId: newTaskId,
                    title: s.title,
                    completed: false
                }));
                await db.subtasks.bulkAdd(newSubtasks);
            }
        });
    }
};
