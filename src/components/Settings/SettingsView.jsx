import React, { useState } from 'react';
import { Trash2, Edit2, Check, X, Plus, Moon, Sun } from 'lucide-react';
import './Settings.css';

const SettingsView = ({
    user,
    onLogout,
    categories = [],
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
    currentTheme,
    toggleTheme
}) => {
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');

    // State for new category in settings
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#3b82f6');

    const startEdit = (cat) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setEditColor(cat.color);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditColor('');
    };

    const saveEdit = () => {
        if (editName.trim()) {
            onUpdateCategory(editingId, { name: editName, color: editColor });
            setEditingId(null);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Tem certeza? Isso não apagará as tarefas, mas elas ficarão sem categoria oficial.')) {
            onDeleteCategory(id);
        }
    };

    const handleAdd = () => {
        if (newName.trim()) {
            onAddCategory({ name: newName, color: newColor });
            setNewName('');
            setNewColor('#3b82f6');
            setIsAdding(false);
        }
    };

    return (
        <div className="settings-container animate-fade-in">
            <header className="settings-header">
                <h2>Ajustes</h2>
                <p>Gerencie suas preferências e categorias</p>
            </header>

            <section className="settings-section">
                <div className="section-header">
                    <h3>Aparência</h3>
                    <button
                        className="btn-theme-toggle"
                        onClick={toggleTheme}
                        title={currentTheme === 'light' ? 'Mudar para Escuro' : 'Mudar para Claro'}
                    >
                        {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        {currentTheme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
                    </button>
                </div>
            </section>

            <section className="settings-section">
                <div className="section-header">
                    <h3>Categorias</h3>
                    {!isAdding && (
                        <button className="btn-text-primary" onClick={() => setIsAdding(true)}>
                            <Plus size={18} /> Nova Categoria
                        </button>
                    )}
                </div>

                {isAdding && (
                    <div className="category-edit-row new-category-row animate-slide-up">
                        <input
                            type="color"
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                            className="color-picker"
                        />
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Nome da categoria"
                            className="text-input"
                            autoFocus
                        />
                        <div className="actions">
                            <button onClick={handleAdd} className="btn-icon-success"><Check size={20} /></button>
                            <button onClick={() => setIsAdding(false)} className="btn-icon-cancel"><X size={20} /></button>
                        </div>
                    </div>
                )}

                <div className="categories-list">
                    {categories.map(cat => (
                        <div key={cat.id} className="category-item">
                            {editingId === cat.id ? (
                                <div className="category-edit-row">
                                    <input
                                        type="color"
                                        value={editColor}
                                        onChange={(e) => setEditColor(e.target.value)}
                                        className="color-picker"
                                    />
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="text-input"
                                    />
                                    <div className="actions">
                                        <button onClick={saveEdit} className="btn-icon-success"><Check size={20} /></button>
                                        <button onClick={cancelEdit} className="btn-icon-cancel"><X size={20} /></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="category-display-row">
                                    <div className="category-info">
                                        <div className="color-dot" style={{ backgroundColor: cat.color }}></div>
                                        <span className="category-name">{cat.name}</span>
                                    </div>
                                    <div className="actions">
                                        <button onClick={() => startEdit(cat)} className="btn-icon-edit"><Edit2 size={18} /></button>
                                        <button onClick={() => handleDelete(cat.id)} className="btn-icon-trash"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <section className="settings-section">
                <h3>Conta</h3>
                <div className="account-card">
                    <div className="avatar-large">{user?.name?.[0]}</div>
                    <div className="account-details">
                        <h4>{user?.name}</h4>
                        <p>{user?.email}</p>
                    </div>
                    <button onClick={onLogout} className="btn-logout">Sair</button>
                </div>
            </section>
        </div>
    );
};

export default SettingsView;
