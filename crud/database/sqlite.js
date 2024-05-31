const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(process.env.DATABASE_FILE)

db.run(`
    CREATE TABLE IF NOT EXISTS todo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        complete BOOLEAN NOT NULL
    )
`)


module.exports = {
    db
}