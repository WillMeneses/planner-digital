import React, { useState } from 'react';
import { CheckCircle2, Circle, MoreVertical } from 'lucide-react';
import './Tasks.css';

const TaskBoard = ({ tasks, onToggleTask }) => {
    const [filter, setFilter] = useState('all');

    const getFilteredTasks = () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const formatDate = (date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        const todayStr = formatDate(today);
        const tomorrowStr = formatDate(tomorrow);

        return tasks.filter(task => {
            if (filter === 'all') return true;
            if (filter === 'today') return task.date === todayStr;
            if (filter === 'tomorrow') return task.date === tomorrowStr;
            return true;
        });
    };

    const filteredTasks = getFilteredTasks();

    return (
        <div className="task-board">
            <div className="task-header">
                <h2>Minhas Tarefas</h2>
                <div className="task-filters">
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        Todas
                    </button>
                    <button
                        className={filter === 'today' ? 'active' : ''}
                        onClick={() => setFilter('today')}
                    >
                        Hoje
                    </button>
                    <button
                        className={filter === 'tomorrow' ? 'active' : ''}
                        onClick={() => setFilter('tomorrow')}
                    >
                        Amanhã
                    </button>
                </div>
            </div>

            <div className="task-list">
                {filteredTasks.map(task => (
                    <div
                        key={task.id}
                        className={`task-card ${task.completed ? 'completed' : ''}`}
                        draggable="true" // Enable Drag
                        onDragStart={(e) => {
                            e.dataTransfer.setData('taskId', task.id);
                        }}
                    >
                        <button className="check-btn" onClick={() => onToggleTask(task.id)}>
                            {task.completed ? <CheckCircle2 color="var(--accent-color)" /> : <Circle color="var(--text-secondary)" />}
                        </button>
                        <div className="task-content">
                            <h3>{task.title}</h3>
                            <div className="task-meta">
                                <span className="task-time">{task.time}</span>
                                <span className="task-category">{task.category}</span>
                            </div>
                        </div>
                        <button className="more-btn">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskBoard;
