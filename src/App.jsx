import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import MainLayout from './components/Layout/MainLayout';
import MonthView from './components/Calendar/MonthView';
import WeekView from './components/Calendar/WeekView';
import DayView from './components/Calendar/DayView';
import TaskBoard from './components/Tasks/TaskBoard';
import TaskModal from './components/Tasks/TaskModal';
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

    // Reactive tasks query
    const tasks = useLiveQuery(
        () => user ? db.tasks.where('userId').equals(Number(user.id)).toArray() : [],
        [user]
    ) || [];

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
            await DataService.toggleTaskCompletion(id, task.completed);
        }
    };

    const addTask = async (newTask) => {
        if (user) {
            await DataService.addTask(user.id, newTask);
            setIsModalOpen(false);
        }
    };

    const moveTask = async (taskId, newDate, newTime) => {
        await DataService.updateTask(taskId, { date: newDate, time: newTime });
    };

    const renderContent = () => {
        const commonProps = {
            tasks,
            onMoveTask: moveTask
        };

        switch (currentView) {
            case 'calendar':
                return <MonthView {...commonProps} onAddClick={() => setIsModalOpen(true)} />;
            case 'week':
                return <WeekView {...commonProps} />;
            case 'day':
                return <DayView {...commonProps} />;
            case 'dashboard':
                return <DayView {...commonProps} />;
            case 'tasks':
                return <TaskBoard tasks={tasks} onToggleTask={toggleTask} />;
            case 'settings':
                return (
                    <div className="placeholder-view">
                        <h2>Configurações</h2>
                        <div style={{ marginTop: '2rem' }}>
                            <p>Usuário Logado: <strong>{user?.name}</strong> ({user?.email})</p>
                            <button
                                onClick={handleLogout}
                                style={{
                                    marginTop: '1rem',
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Sair da Conta
                            </button>
                        </div>
                    </div>
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
            onAddClick={() => setIsModalOpen(true)}
            userName={user.name}
        >
            <div className="animate-fade-in view-container">
                {renderContent()}
            </div>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={addTask}
            />
        </MainLayout>
    );
}

export default App;
