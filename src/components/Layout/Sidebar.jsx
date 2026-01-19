import React from 'react';
import { Calendar, CheckSquare, Sun, Settings, PlusCircle } from 'lucide-react';

const Sidebar = ({ currentView, onViewChange, onAddClick }) => {
    const navItems = [
        { id: 'dashboard', icon: Sun, label: 'Hoje (Dia)' },
        { id: 'week', icon: Calendar, label: 'Semana' },
        { id: 'calendar', icon: Calendar, label: 'Mês' },
        { id: 'tasks', icon: CheckSquare, label: 'Tarefas' },
        { id: 'settings', icon: Settings, label: 'Ajustes' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="avatar-placeholder">W</div>
                <div className="user-info">
                    <h3>Olá, Willians</h3>
                    <p>Tenha um ótimo dia!</p>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                        onClick={() => onViewChange(item.id)}
                    >
                        <item.icon size={24} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="add-task-btn" onClick={onAddClick}>
                    <PlusCircle size={24} />
                    <span>Nova Tarefa</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
