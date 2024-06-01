import { db } from './sqlite'

export const getTodos = async () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM todo`, [], (err, rows) => {
            if(err) return reject(err)
            resolve(rows)
        })
    })
}

export const getTodoById = async (id: number) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM todo WHERE id = ?`, [id], (err, rows) => {
            if(err) return reject(err)
            resolve(rows)
        })
    })
}

export const createTodo = async (title: string) => {
    return new Promise((resolve, reject) => {
        db.get(`INSERT INTO todo (title, complete) VALUES (?, ?) RETURNING *`, [title, false], (err, rows) => {
            if(err) return reject(err)
            resolve(rows)
        })
    })
}

export const deleteTodo = async (id: number) => {
    return new Promise((resolve, reject) => {
        db.get(`DELETE FROM todo WHERE id = ? RETURNING *`, [id], (err, rows) => {
            if(err) return reject(err)
            resolve(rows)
        })
    })
}

export const updateTodo = async (id: number, title: string) => {
    return new Promise((resolve, reject) => {
        db.get(`UPDATE todo SET title = ? WHERE id = ? RETURNING *`, [title, id], (err, rows) => {
            if(err) return reject(err)
            resolve(rows)
        })
    })
}

export const toggleTodo = async (id: number) => {
    return new Promise((resolve, reject) => {
        db.get(`UPDATE todo SET complete = NOT complete WHERE id = ? RETURNING *`, [id], (err, rows) => {
            if(err) return reject(err)
            resolve(rows)
        })
    })
}