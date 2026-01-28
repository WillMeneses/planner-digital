
import Dexie from 'dexie';

export const db = new Dexie('PlannerDatabase');

db.version(1).stores({
    users: '++id, &email, name, password', // Primary key and indexed props
    tasks: '++id, userId, title, date, time, category, completed'
});

db.version(2).stores({
    users: '++id, &email, name, password',
    tasks: '++id, userId, title, date, time, category, completed',
    categories: '++id, userId, name, color'
});

db.version(3).stores({
    users: '++id, &email, name, password',
    tasks: '++id, userId, title, date, time, category, completed',
    categories: '++id, userId, name, color',
    subtasks: '++id, taskId, title, completed'
});

db.version(4).stores({
    users: '++id, &email, name, password',
    tasks: '++id, userId, title, date, time, category, completed, recurring',
    categories: '++id, userId, name, color',
    subtasks: '++id, taskId, title, completed'
});
