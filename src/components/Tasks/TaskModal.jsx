import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, Tag } from 'lucide-react';
import './TaskModal.css';

const TaskModal = ({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('10:00');
    const [category, setCategory] = useState('Trabalho');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        onSave({
            title,
            date,
            time,
            category,
            completed: false
        });

        // Reset form
        setTitle('');
        setTime('10:00');
        setCategory('Trabalho');
        onClose();
    };

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Nova Tarefa</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="O que você precisa fazer?"
                            className="task-input-lg"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label><CalendarIcon size={16} /> Data</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label><Clock size={16} /> Hora</label>
                            <input
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label><Tag size={16} /> Categoria</label>
                        <div className="category-select">
                            {['Trabalho', 'Pessoal', 'Saúde', 'Estudos'].map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    className={`category-chip ${category === cat ? 'selected' : ''}`}
                                    onClick={() => setCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-save">Criar Tarefa</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskModal;
