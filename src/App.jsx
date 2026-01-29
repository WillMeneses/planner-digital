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

    // Reactive State replaces useLiveQuery for Cloud compatibility
    const [tasks, setTasks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refreshData = () => setRefreshTrigger(prev => prev + 1);

    // Fetch Data Effect (Works for both Local and Cloud via DataService)
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const [loadedTasks, loadedCategories] = await Promise.all([
                    DataService.getTasks(user.id),
                    DataService.getCategories(user.id)
                ]);
                setTasks(loadedTasks || []);
                setCategories(loadedCategories || []);
            } catch (error) {
                console.error("Failed to load data:", error);
            }
        };
        fetchData();
    }, [user, currentView, refreshTrigger]);

    // Seed default categories (Local Mode Only Check usually, but safe to keep)
    useEffect(() => {
        const manageCategories = async () => {
            if (!user) return;
            // Only seed if we are managing categories (Cloud Categories not fully implemented yet)
            // But let's leave duplication check for now, it's harmless if list is empty
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
            if (!task.completed && task.recurring && task.recurring !== 'none') {
                await DataService.handleRecurringCompletion(task);
            } else {
                await DataService.toggleTaskCompletion(id, task.completed);
            }
            refreshData();
        }
    };

    const openEditModal = (task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleSaveTask = async (taskData, subtasks = []) => {
        if (!user) return;
        try {
            await DataService.saveTaskWithSubtasks(user.id, taskData, subtasks);
            refreshData();
            setIsModalOpen(false);
            setEditingTask(null);
        } catch (error) {
            console.error("Save failed:", error);
            alert(`Erro ao salvar: ${error.message}`);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!user) return;
        await DataService.deleteTask(taskId);
        refreshData();
        setIsModalOpen(false);
        setEditingTask(null);
    };

    const moveTask = async (taskId, newDate, newTime) => {
        await DataService.updateTask(taskId, { date: newDate, time: newTime });
        refreshData();
    };

    const handleAddCategory = async (category) => {
        if (!user) return;
        await DataService.addCategory(user.id, category);
        refreshData();
    };

    const handleUpdateCategory = async (categoryId, categoryData) => {
        if (!user) return;
        await DataService.updateCategory(categoryId, categoryData);
        refreshData();
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!user) return;
        await DataService.deleteCategory(categoryId);
        refreshData();
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
