const dbl = require('../database')


const getTodos = async (req, res) => {
    const todos = await dbl.todo.getTodos()
    res.json(todos)
}

const getTodo = async (req, res) => {
    const todo = await dbl.todo.getTodoById(req.params.id)
    res.json({ todo })
}

const addTodo = async (req, res) => {
    const todo = await dbl.todo.createTodo(req.body.title)
    res.json({ todo })
}

const deleteTodo = async (req, res) => {
    const todo = await dbl.todo.deleteTodo(req.params.id)
    res.json({ todo })
}

const updateTodo = async (req, res) => {
    const todo = await dbl.todo.updateTodo(req.params.id, req.body.title)
    res.json({ todo })
}

const toggleTodo = async (req, res) => {
    const todo = await dbl.todo.toggleTodo(req.params.id)
    res.json({ todo })
}

module.exports = {
    getTodos,
    getTodo,
    addTodo,
    deleteTodo,
    updateTodo,
    toggleTodo
}