import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Tag, Trash2, Plus, Check, Repeat } from 'lucide-react';
import './TaskModal.css';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db'; // Still needed for some local fallbacks? No, DataService abstracts it.
// Actually, let's remove direct DB access if possible, or keep for now if unsure.
// But we definitely need DataService.
import { DataService } from '../../services/data';

const TaskModal = ({ isOpen, onClose, onSave, onDelete, taskToEdit, categories = [], onAddCategory }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('10:00');
    const [category, setCategory] = useState('Trabalho');
    const [recurring, setRecurring] = useState('none');
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');



    // Subtasks State
    const [subtasks, setSubtasks] = useState([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    // React State for loading subtasks (Cloud + Local Compat)
    // const existingSubtasks = useLiveQuery(...) is Local only.

    useEffect(() => {
        const loadSubtasks = async () => {
            // If we have a task to edit, load its subtasks
            if (isOpen && taskToEdit && taskToEdit.id) {
                try {
                    // Note: DataService.getSubtasks abstracts Local vs Cloud
                    const loaded = await DataService.getSubtasks(taskToEdit.id);
                    setSubtasks(loaded || []);
                } catch (e) {
                    console.error("Failed to load subtasks", e);
                    setSubtasks([]);
                }
            } else if (isOpen && !taskToEdit) {
                // Reset for new task
                setSubtasks([]);
            }
        };
        loadSubtasks();
    }, [isOpen, taskToEdit]);

    useEffect(() => {
        if (isOpen) {
            if (taskToEdit) {
                setTitle(taskToEdit.title);
                setDate(taskToEdit.date);
                setTime(taskToEdit.time);
                setCategory(taskToEdit.category);
                setRecurring(taskToEdit.recurring || 'none');
            } else {
                setTitle('');
                setDate(new Date().toISOString().split('T')[0]);
                setTime('10:00');
                setCategory('Trabalho');
                setRecurring('none');
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
            recurring,
            completed: taskToEdit ? taskToEdit.completed : false
        }, subtasks);
    };

    const handleAddSubtask = (e) => {
        e.preventDefault(); // Stop form submit
        if (newSubtaskTitle.trim()) {
            setSubtasks([...subtasks, { title: newSubtaskTitle, completed: false }]);
            setNewSubtaskTitle('');
        }
    };

    const toggleSubtask = (index) => {
        const updated = [...subtasks];
        updated[index] = { ...updated[index], completed: !updated[index].completed };
        setSubtasks(updated);
    };

    const removeSubtask = (index) => {
        const updated = subtasks.filter((_, i) => i !== index);
        setSubtasks(updated);
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

                    <div className="form-row">
                        <div className="input-group full-width">
                            <label><Repeat size={16} /> Repetição</label>
                            <select
                                value={recurring}
                                onChange={(e) => setRecurring(e.target.value)}
                                className="custom-select"
                            >
                                <option value="none">Não repete</option>
                                <option value="daily">Diariamente</option>
                                <option value="weekly">Semanalmente</option>
                                <option value="monthly">Mensalmente</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label><Tag size={16} /> Categoria</label>
                        <div className="category-select">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    className={`category-chip ${category === cat.name ? 'selected' : ''}`}
                                    onClick={() => setCategory(cat.name)}
                                    style={{
                                        '--cat-color': cat.color,
                                        borderColor: category === cat.name ? cat.color : 'transparent',
                                        backgroundColor: category === cat.name ? `${cat.color}20` : 'var(--bg-secondary)',
                                        color: category === cat.name ? cat.color : 'var(--text-secondary)'
                                    }}
                                >
                                    {cat.name}
                                </button>
                            ))}

                            {!isAddingCategory ? (
                                <button
                                    type="button"
                                    className="category-chip add-new"
                                    onClick={() => setIsAddingCategory(true)}
                                    style={{ border: '1px dashed var(--text-tertiary)', color: 'var(--text-tertiary)' }}
                                >
                                    <Plus size={14} /> Nova
                                </button>
                            ) : (
                                <div className="add-category-form animate-fade-in">
                                    <input
                                        type="text"
                                        placeholder="Nome"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        className="mini-input"
                                        autoFocus
                                    />
                                    <input
                                        type="color"
                                        value={newCategoryColor}
                                        onChange={(e) => setNewCategoryColor(e.target.value)}
                                        className="mini-color-picker"
                                    />
                                    <button
                                        type="button"
                                        className="btn-icon-success"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (newCategoryName.trim()) {
                                                onAddCategory({ name: newCategoryName, color: newCategoryColor });
                                                setCategory(newCategoryName); // Auto-select new category
                                                setIsAddingCategory(false);
                                                setNewCategoryName('');
                                            }
                                        }}
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-icon-cancel"
                                        onClick={() => setIsAddingCategory(false)}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="subtask-label">Checklist ({subtasks.filter(s => s.completed).length}/{subtasks.length})</label>
                        <div className="subtask-list">
                            {subtasks.map((sub, index) => (
                                <div key={index} className="subtask-item animate-slide-up">
                                    <button
                                        type="button"
                                        className={`checkbox-circle ${sub.completed ? 'checked' : ''}`}
                                        onClick={() => toggleSubtask(index)}
                                    >
                                        {sub.completed && <Check size={12} />}
                                    </button>
                                    <span className={sub.completed ? 'completed-text' : ''}>{sub.title}</span>
                                    <button
                                        type="button"
                                        className="btn-icon-danger small"
                                        onClick={() => removeSubtask(index)}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="add-subtask-row">
                            <input
                                type="text"
                                placeholder="Adicionar item..."
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddSubtask(e);
                                    }
                                }}
                            />
                            <button type="button" onClick={handleAddSubtask} className="btn-icon-primary">
                                <Plus size={18} />
                            </button>
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
