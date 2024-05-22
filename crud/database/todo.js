const { db } = require('./sqlite')

module.exports = {
    async getTodos() {
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM todo`, [], (err, rows) => {
                if(err) return reject(err)
                resolve(rows)
            })
        })
    },

    async getTodoById(id) {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM todo WHERE id = ?`, [id], (err, rows) => {
                if(err) return reject(err)
                resolve(rows)
            })
        })
    },

    async createTodo(title) {
        return new Promise((resolve, reject) => {
            db.get(`INSERT INTO todo (title, complete) VALUES (?, ?) RETURNING *`, [title, false], (err, rows) => {
                if(err) return reject(err)
                resolve(rows)
            })
        })
    },

    async updateTodo(id, title) {
        return new Promise((resolve, reject) => {
            db.get(`UPDATE todo SET title = ? WHERE id = ? RETURNING *`, [title, id], (err, rows) => {
                if(err) return reject(err)
                resolve(rows)
            })
        })
    },

    async deleteTodo(id) {
        return new Promise((resolve, reject) => {
            db.get(`DELETE FROM todo WHERE id = ? RETURNING *`, [id], (err, rows) => {
                if(err) return reject(err)
                resolve(rows)
            })
        })
    },

    async toggleTodo(id) {
        return new Promise((resolve, reject) => {
            db.get(`UPDATE todo SET complete = NOT complete WHERE id = ? RETURNING *`, [id], (err, rows) => {
                if(err) return reject(err)
                resolve(rows)
            })
        })
    },
}