import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import './Calendar.css';

const MonthView = ({ tasks = [], onAddClick, onMoveTask, onEditTask }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const renderCalendarDays = () => {
        const totalDays = getDaysInMonth(currentDate);
        const startDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty cells for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Days of current month
        const today = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        for (let day = 1; day <= totalDays; day++) {
            const isToday =
                day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();

            // Filter tasks for this day
            const dayTasks = tasks.filter(t => {
                if (!t.date) return false; // Safety check
                try {
                    const [tYear, tMonth, tDay] = t.date.split('-').map(Number);
                    return tDay === day && (tMonth - 1) === currentMonth && tYear === currentYear;
                } catch (e) {
                    return false;
                }
            });

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isToday ? 'today' : ''}`}
                    onDragOver={(e) => e.preventDefault()} // Allow Drop
                    onDrop={(e) => {
                        e.preventDefault();
                        const taskId = e.dataTransfer.getData('taskId');
                        const y = currentYear;
                        const m = String(currentMonth + 1).padStart(2, '0');
                        const d = String(day).padStart(2, '0');
                        const newDate = `${y}-${m}-${d}`;

                        if (onMoveTask) {
                            onMoveTask(taskId, newDate); // Preserve existing time
                        }
                    }}
                >
                    <div className="day-header">
                        <span className="day-number">{day}</span>
                        {isToday && <span className="today-badge">Hoje</span>}
                    </div>
                    <div className="day-tasks">
                        {dayTasks.map(task => (
                            <div
                                key={task.id}
                                className="mini-task-dot"
                                style={{ backgroundColor: 'var(--accent-color)', cursor: 'pointer' }}
                                title={task.title}
                                onClick={(e) => { e.stopPropagation(); onEditTask && onEditTask(task); }}
                            ></div>
                        ))}
                    </div>
                    <button className="add-task-mini" onClick={onAddClick}>
                        <Plus size={14} />
                    </button>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                <div className="calendar-nav">
                    <button onClick={prevMonth}><ChevronLeft /></button>
                    <button onClick={nextMonth}>Hoje</button>
                    <button onClick={nextMonth}><ChevronRight /></button>
                </div>
            </div>

            <div className="calendar-grid-header">
                {daysOfWeek.map(day => (
                    <div key={day} className="weekday-label">{day}</div>
                ))}
            </div>

            <div className="calendar-grid">
                {renderCalendarDays()}
            </div>
        </div>
    );
};

export default MonthView;
