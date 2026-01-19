
import Dexie from 'dexie';

export const db = new Dexie('PlannerDatabase');

db.version(1).stores({
    users: '++id, &email, name, password', // Primary key and indexed props
    tasks: '++id, userId, title, date, time, category, completed'
});
