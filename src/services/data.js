import { TaskRepository } from './repositories/TaskRepository';
import { CategoryRepository } from './repositories/CategoryRepository';
import { SubtaskRepository } from './repositories/SubtaskRepository';

// Legacy Facade for backward compatibility during refactor
export const DataService = {
    // Tasks
    addTask: (userId, task) => TaskRepository.add(userId, task),
    updateTask: (taskId, updates) => TaskRepository.update(taskId, updates),
    deleteTask: (taskId) => TaskRepository.delete(taskId),
    toggleTaskCompletion: (taskId, status) => TaskRepository.toggleCompletion(taskId, status),
    getTasks: (userId) => TaskRepository.getAll(userId),

    // Categories
    getCategories: (userId) => CategoryRepository.getAll(userId),
    addCategory: (userId, cat) => CategoryRepository.add(userId, cat),
    updateCategory: (id, data) => CategoryRepository.update(id, data),
    deleteCategory: (id) => CategoryRepository.delete(id),

    // Subtasks
    getSubtasks: (taskId) => SubtaskRepository.getByTask(taskId),
    addSubtask: (taskId, title) => SubtaskRepository.add(taskId, title),
    toggleSubtask: (id, completed, taskId) => SubtaskRepository.toggle(id, completed, taskId),
    deleteSubtask: (id, taskId) => SubtaskRepository.delete(id, taskId),

    // Composite Actions
    saveTaskWithSubtasks: async (userId, taskData, subtasks) => {
        // 1. Save Task
        let savedTask;
        if (taskData.id) {
            savedTask = await TaskRepository.update(taskData.id, taskData);
        } else {
            savedTask = await TaskRepository.add(userId, taskData);
        }

        // 2. Sync Subtasks
        if (savedTask && savedTask.id) {
            await SubtaskRepository.syncSubtasks(savedTask.id, subtasks);
        }

        return savedTask;
    },

    handleRecurringCompletion: async (task) => {
        // Basic Logic: toggle current, create next.
        // For Cloud MVP, we just toggle. Recurrence generation needs backend support or Client-side logic here.
        // We'll trust TaskRepository.toggleCompletion which is simple.
        // Future: Move recurrence logic to TaskRepository or a Domain Service (TaskDomainService).
        return await TaskRepository.toggleCompletion(task.id, false);
    }
};
