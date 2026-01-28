
import { db } from '../db';

export const DataService = {
    // Add a new task linked to a user
    addTask: async (userId, task) => {
        // Ensure userId is added to the task object
        return await db.tasks.add({ ...task, userId: Number(userId) });
    },

    // Update specific fields of a task
    updateTask: async (taskId, updates) => {
        return await db.tasks.update(Number(taskId), updates);
    },

    // Delete a task
    deleteTask: async (taskId) => {
        return await db.tasks.delete(Number(taskId));
    },

    // Toggle completion status (requires fetching first or just passing new status)
    toggleTaskCompletion: async (taskId, currentStatus) => {
        return await db.tasks.update(Number(taskId), { completed: !currentStatus });
    },

    // Legacy load not needed with useLiveQuery, but good for one-off
    getTasks: async (userId) => {
        return await db.tasks.where('userId').equals(Number(userId)).toArray();
    },

    // --- Category Methods ---

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

    // --- Subtask Methods ---

    getSubtasks: async (taskId) => {
        return await db.subtasks.where('taskId').equals(Number(taskId)).toArray();
    },

    saveTaskWithSubtasks: async (userId, taskData, subtasks) => {
        return await db.transaction('rw', db.tasks, db.subtasks, async () => {
            // 1. Save/Update Task
            let taskId = taskData.id;
            if (taskId) {
                await db.tasks.update(taskId, taskData);
            } else {
                taskId = await db.tasks.add({ ...taskData, userId: Number(userId) });
            }

            // 2. Handle Subtasks
            // Current subtasks in DB
            const existingSubtasks = await db.subtasks.where('taskId').equals(taskId).toArray();
            const existingIds = new Set(existingSubtasks.map(s => s.id));

            // Validate incoming subtasks
            const incomingIds = new Set(subtasks.filter(s => s.id).map(s => s.id));

            // Delete removed subtasks
            const toDelete = existingSubtasks.filter(s => !incomingIds.has(s.id)).map(s => s.id);
            if (toDelete.length > 0) {
                await db.subtasks.bulkDelete(toDelete);
            }

            // Add/Update subtasks
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
        return await db.transaction('rw', db.tasks, db.subtasks, async () => {
            // 1. Mark current as completed
            await db.tasks.update(task.id, { completed: true });

            if (!task.recurring || task.recurring === 'none') return;

            // 2. Calculate Next Date
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

            // Format date YYYY-MM-DD
            const nextDateStr = nextDate.toISOString().split('T')[0];

            // 3. Create Clone
            // Copy task data minus ID
            const { id, ...taskData } = task;
            const newTaskId = await db.tasks.add({
                ...taskData,
                date: nextDateStr,
                completed: false
            });

            // 4. Clone Subtasks (Reset completion)
            const subtasks = await db.subtasks.where('taskId').equals(task.id).toArray();
            if (subtasks.length > 0) {
                const newSubtasks = subtasks.map(s => ({
                    taskId: newTaskId,
                    title: s.title,
                    completed: false // Reset subtasks for the new instance
                }));
                await db.subtasks.bulkAdd(newSubtasks);
            }
        });
    }
};
