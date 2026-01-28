import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import MainLayout from './components/Layout/MainLayout';
import MonthView from './components/Calendar/MonthView';
import WeekView from './components/Calendar/WeekView';
import DayView from './components/Calendar/DayView';
import TaskBoard from './components/Tasks/TaskBoard';
import TaskModal from './components/Tasks/TaskModal';
import SettingsView from './components/Settings/SettingsView';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import { AuthService } from './services/auth';
import { DataService } from './services/data';
import './App.css';

function App() {
    const [user, setUser] = useState(null);
    const [authView, setAuthView] = useState('login'); // 'login' or 'register'
    const [currentView, setCurrentView] = useState('calendar');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    // Theme Effect
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
        console.log('App: Theme class toggled to', theme);
    }, [theme]);

    const toggleTheme = () => {
        console.log('App: Toggle theme called. Current:', theme);
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Reactive tasks query
    const tasks = useLiveQuery(
        () => user ? db.tasks.where('userId').equals(Number(user.id)).toArray() : [],
        [user]
    ) || [];

    // Reactive categories query
    const categories = useLiveQuery(
        () => user ? db.categories.where('userId').equals(Number(user.id)).toArray() : [],
        [user]
    ) || [];

    // Seed default categories & Deduplicate
    useEffect(() => {
        const manageCategories = async () => {
            if (!user) return;

            // 1. Check actual DB count to avoid race conditions with useLiveQuery
            const count = await db.categories.where('userId').equals(Number(user.id)).count();

            if (count === 0) {
                // Seed defaults
                const defaults = [
                    { name: 'Trabalho', color: '#3b82f6' },
                    { name: 'Pessoal', color: '#10b981' },
                    { name: 'Saúde', color: '#f59e0b' },
                    { name: 'Estudos', color: '#8b5cf6' }
                ];
                await Promise.all(defaults.map(cat => DataService.addCategory(user.id, cat)));
            } else {
                // 2. Deduplication Logic (Cleanup existing mess)
                const allCats = await db.categories.where('userId').equals(Number(user.id)).toArray();
                const uniqueNames = new Set();
                const duplicates = [];

                for (const cat of allCats) {
                    if (uniqueNames.has(cat.name)) {
                        duplicates.push(cat.id);
                    } else {
                        uniqueNames.add(cat.name);
                    }
                }

                if (duplicates.length > 0) {
                    await db.categories.bulkDelete(duplicates);
                    console.log('Cleaned up duplicate categories:', duplicates.length);
                }
            }
        };
        manageCategories();
    }, [user]);

    // Check auth on mount
    useEffect(() => {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
    }, []);

    const handleLogout = () => {
        AuthService.logout();
        setUser(null);
        setAuthView('login');
    };

    const toggleTask = async (id) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            // New Logic: Check for recurrence if marking as completed
            if (!task.completed && task.recurring && task.recurring !== 'none') {
                await DataService.handleRecurringCompletion(task);
            } else {
                await DataService.toggleTaskCompletion(id, task.completed);
            }
        }
    };

    const openEditModal = (task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleSaveTask = async (taskData, subtasks = []) => {
        if (!user) return;

        // Use the new transaction-safe method for both Create and Update
        await DataService.saveTaskWithSubtasks(user.id, taskData, subtasks);

        setIsModalOpen(false);
        setEditingTask(null);
    };

    const handleDeleteTask = async (taskId) => {
        if (!user) return;
        await DataService.deleteTask(taskId);
        setIsModalOpen(false);
        setEditingTask(null);
    };

    const moveTask = async (taskId, newDate, newTime) => {
        await DataService.updateTask(taskId, { date: newDate, time: newTime });
    };

    const handleAddCategory = async (category) => {
        if (!user) return;
        await DataService.addCategory(user.id, category);
    };

    const handleUpdateCategory = async (categoryId, categoryData) => {
        if (!user) return;
        await DataService.updateCategory(categoryId, categoryData);
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!user) return;
        await DataService.deleteCategory(categoryId);
    };

    const renderContent = () => {
        const commonProps = {
            tasks,
            categories, // Pass categories to all views
            onMoveTask: moveTask,
            onEditTask: openEditModal
        };

        switch (currentView) {
            case 'calendar':
                return <MonthView {...commonProps} onAddClick={() => { setEditingTask(null); setIsModalOpen(true); }} />;
            case 'week':
                return <WeekView {...commonProps} />;
            case 'day':
                return <DayView {...commonProps} />;
            case 'dashboard':
                return <DayView {...commonProps} />;
            case 'tasks':
                return <TaskBoard tasks={tasks} onToggleTask={toggleTask} onEditTask={openEditModal} />;
            case 'settings':
                return (
                    <SettingsView
                        user={user}
                        onLogout={handleLogout}
                        categories={categories}
                        onAddCategory={handleAddCategory}
                        onUpdateCategory={handleUpdateCategory}
                        onDeleteCategory={handleDeleteCategory}
                    />
                );
            default:
                return <MonthView tasks={tasks} />;
        }
    };

    // Auth Flow
    if (!user) {
        return authView === 'login' ? (
            <LoginPage
                onLogin={setUser}
                onNavigateRegister={() => setAuthView('register')}
            />
        ) : (
            <RegisterPage
                onLogin={setUser}
                onNavigateLogin={() => setAuthView('login')}
            />
        );
    }

    return (
        <MainLayout
            currentView={currentView}
            onViewChange={setCurrentView}
            onAddClick={() => { setEditingTask(null); setIsModalOpen(true); }}
            userName={user.name}
            theme={theme}
        >
            <div className="animate-fade-in view-container">
                {renderContent()}
            </div>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
                onSave={handleSaveTask}
                onDelete={handleDeleteTask}
                taskToEdit={editingTask}
                categories={categories}
                onAddCategory={handleAddCategory}
            />
        </MainLayout>
    );
}

export default App;
