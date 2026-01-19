
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



    // Toggle completion status (requires fetching first or just passing new status)
    toggleTaskCompletion: async (taskId, currentStatus) => {
        return await db.tasks.update(Number(taskId), { completed: !currentStatus });
    },

    // Legacy load not needed with useLiveQuery, but good for one-off
    getTasks: async (userId) => {
        return await db.tasks.where('userId').equals(Number(userId)).toArray();
    }
};
