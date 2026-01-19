import React from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

const MainLayout = ({ children, currentView, onViewChange, onAddClick }) => {
    return (
        <div className="main-layout">
            <Sidebar currentView={currentView} onViewChange={onViewChange} onAddClick={onAddClick} />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
