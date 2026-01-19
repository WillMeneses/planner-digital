import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Calendar.css';

const DayView = ({ tasks = [], onMoveTask }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Hours from 6:00 to 23:00
    const hours = Array.from({ length: 18 }, (_, i) => i + 6);

    const prevDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() - 1);
        setCurrentDate(newDate);
    };

    const nextDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 1);
        setCurrentDate(newDate);
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
    };

    const isSameDay = (dateString, dateObj) => {
        if (!dateString) return false;
        try {
            const [y, m, d] = dateString.split('-').map(Number);
            return d === dateObj.getDate() &&
                (m - 1) === dateObj.getMonth() &&
                y === dateObj.getFullYear();
        } catch (e) {
            return false;
        }
    };

    return (
        <div className="calendar-container day-view">
            <div className="calendar-header">
                <h2 style={{ textTransform: 'capitalize' }}>{formatDate(currentDate)}</h2>
                <div className="calendar-nav">
                    <button onClick={prevDay}><ChevronLeft /></button>
                    <button onClick={() => setCurrentDate(new Date())}>Hoje</button>
                    <button onClick={nextDay}><ChevronRight /></button>
                </div>
            </div>

            <div className="day-timeline">
                {hours.map(hour => {
                    const timeString = `${hour.toString().padStart(2, '0')}:00`;
                    // Find tasks for this hour
                    const hourTasks = tasks.filter(t =>
                        t.time &&
                        isSameDay(t.date, currentDate) &&
                        t.time.startsWith(hour.toString().padStart(2, '0'))
                    );

                    return (
                        <div
                            key={hour}
                            className="timeline-slot"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const taskId = e.dataTransfer.getData('taskId');
                                const y = currentDate.getFullYear();
                                const m = String(currentDate.getMonth() + 1).padStart(2, '0');
                                const d = String(currentDate.getDate()).padStart(2, '0');
                                const newDate = `${y}-${m}-${d}`;

                                if (onMoveTask) {
                                    onMoveTask(taskId, newDate, timeString);
                                }
                            }}
                        >
                            <div className="time-label">{timeString}</div>
                            <div className="slot-content">
                                {hourTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className="task-event"
                                        style={{ backgroundColor: 'var(--bg-primary)', borderLeft: '3px solid var(--accent-color)', cursor: 'pointer' }}
                                        onClick={(e) => { e.stopPropagation(); onEditTask && onEditTask(task); }}
                                    >
                                        <span className="event-title">{task.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DayView;
