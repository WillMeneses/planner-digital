import { useState, useCallback } from 'react';
import { DataService } from '../services/data';

export const useTasks = (user) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTasks = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await DataService.getTasks(user.id);
            setTasks(data || []);
            setError(null);
        } catch (err) {
            console.error("useTasks Error:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const addTask = async (taskData, subtasks = []) => {
        try {
            await DataService.saveTaskWithSubtasks(user.id, taskData, subtasks);
            await fetchTasks();
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    const updateTask = async (taskData) => {
        // Optimistic update could go here
        try {
            await DataService.updateTask(taskData.id, taskData);
            await fetchTasks();
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    const deleteTask = async (taskId) => {
        try {
            await DataService.deleteTask(taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (err) {
            setError(err);
            throw err;
        }
    };

    const toggleTask = async (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        try {
            // Optimistic UI
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));

            if (!task.completed && task.recurring && task.recurring !== 'none') {
                await DataService.handleRecurringCompletion(task);
            } else {
                await DataService.toggleTaskCompletion(taskId, task.completed);
            }
            await fetchTasks(); // Sync to be sure
        } catch (err) {
            setError(err);
            // Revert optimistic? 
            await fetchTasks();
        }
    };

    return {
        tasks,
        loading,
        error,
        fetchTasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTask
    };
};
