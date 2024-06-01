import sqlite3 from 'sqlite3'

export const db = new sqlite3.Database(process.env.DATABASE_FILE || 'todos.db')

db.run(`
    CREATE TABLE IF NOT EXISTS todo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        complete BOOLEAN NOT NULL
    )
`)
