import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Tag, Trash2 } from 'lucide-react';
import './TaskModal.css';

const TaskModal = ({ isOpen, onClose, onSave, onDelete, taskToEdit }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('10:00');
    const [category, setCategory] = useState('Trabalho');

    useEffect(() => {
        if (isOpen) {
            if (taskToEdit) {
                setTitle(taskToEdit.title);
                setDate(taskToEdit.date);
                setTime(taskToEdit.time);
                setCategory(taskToEdit.category);
            } else {
                setTitle('');
                setDate(new Date().toISOString().split('T')[0]);
                setTime('10:00');
                setCategory('Trabalho');
            }
        }
    }, [isOpen, taskToEdit]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        onSave({
            id: taskToEdit ? taskToEdit.id : undefined,
            title,
            date,
            time,
            category,
            completed: taskToEdit ? taskToEdit.completed : false
        });
    };

    const handleDelete = () => {
        if (taskToEdit && onDelete) {
            if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
                onDelete(taskToEdit.id);
            }
        }
    };

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-actions">
                        <h2>{taskToEdit ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
                        {taskToEdit && onDelete && (
                            <button type="button" className="btn-icon-danger" onClick={handleDelete} title="Excluir tarefa">
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
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
                        <button type="submit" className="btn-save">{taskToEdit ? 'Salvar Alterações' : 'Criar Tarefa'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskModal;
