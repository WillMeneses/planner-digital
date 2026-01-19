import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Calendar.css';

const WeekView = ({ tasks = [], onMoveTask }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getStartOfWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day; // Sunday start
        return new Date(d.setDate(diff));
    };

    const startOfWeek = getStartOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d;
    });

    const hours = Array.from({ length: 18 }, (_, i) => i + 6);

    const prevWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 7);
        setCurrentDate(d);
    };

    const nextWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 7);
        setCurrentDate(d);
    };

    const formatDateRange = (start, end) => {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const startMonth = months[start.getMonth()];
        const endMonth = months[end.getMonth()];
        const year = start.getFullYear();

        if (startMonth === endMonth) {
            return `${start.getDate()} - ${end.getDate()} de ${startMonth} ${year}`;
        }
        return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${year}`;
    };

    // Helper to format date as YYYY-MM-DD
    const formatDateKey = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    return (
        <div className="calendar-container week-view">
            <div className="calendar-header">
                <h2>{formatDateRange(startOfWeek, weekDays[6])}</h2>
                <div className="calendar-nav">
                    <button onClick={prevWeek}><ChevronLeft /></button>
                    <button onClick={() => setCurrentDate(new Date())}>Hoje</button>
                    <button onClick={nextWeek}><ChevronRight /></button>
                </div>
            </div>

            <div className="week-grid">
                {/* Header Row */}
                <div className="time-col-header"></div>
                {weekDays.map(day => (
                    <div key={day.toString()} className={`week-day-header ${day.getDate() === new Date().getDate() ? 'today' : ''}`}>
                        <span className="wd-name">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][day.getDay()]}</span>
                        <span className="wd-num">{day.getDate()}</span>
                    </div>
                ))}

                {/* Time Grid */}
                {hours.map(hour => (
                    <React.Fragment key={hour}>
                        <div className="time-label-cell">{hour}:00</div>
                        {weekDays.map(day => {
                            // Check for tasks
                            const dayTasks = tasks.filter(t => {
                                if (!t.date || !t.time) return false;
                                try {
                                    const [tYear, tMonth, tDay] = t.date.split('-').map(Number);
                                    return tDay === day.getDate() &&
                                        (tMonth - 1) === day.getMonth() &&
                                        tYear === day.getFullYear() &&
                                        t.time.startsWith(hour.toString().padStart(2, '0'));
                                } catch (e) {
                                    return false;
                                }
                            });

                            return (
                                <div
                                    key={`${day}-${hour}`}
                                    className="week-slot"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const taskId = e.dataTransfer.getData('taskId');
                                        const newDate = formatDateKey(day);
                                        const newTime = `${hour.toString().padStart(2, '0')}:00`;

                                        if (onMoveTask) {
                                            onMoveTask(taskId, newDate, newTime);
                                        }
                                    }}
                                >
                                    {dayTasks.map(t => (
                                        <div
                                            key={t.id}
                                            className="mini-event"
                                            title={t.title}
                                            style={{ cursor: 'pointer' }}
                                            onClick={(e) => { e.stopPropagation(); onEditTask && onEditTask(t); }}
                                        >
                                            <span className="mini-event-title">{t.title}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default WeekView;
