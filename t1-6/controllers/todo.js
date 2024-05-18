const dbl = require('../database')


const getTodos = async (req, res) => {
    res.send(await dbl.todo.getTodos())
}

const getTodo = async (req, res) => {
    const todo = await dbl.todo.getTodoById(req.params.id)
    res.send({ todo })
}

const addTodo = async (req, res) => {
    const todo = await dbl.todo.createTodo(req.body.title)
    console.log(todo)
    res.send({ todo })
}

const deleteTodo = async (req, res) => {
    const todo = await dbl.todo.deleteTodo(req.params.id)
    res.send({ todo })
}

const updateTodo = async (req, res) => {
    const todo = await dbl.todo.updateTodo(req.params.id, req.body.title)
    res.send({ todo })
}

const toggleTodo = async (req, res) => {
    const todo = await dbl.todo.toggleTodo(req.params.id)
    res.send({ todo })
}

module.exports = {
    getTodos,
    getTodo,
    addTodo,
    deleteTodo,
    updateTodo,
    toggleTodo
}