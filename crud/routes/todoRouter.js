const todoRouter = require('express').Router()
const todoControllers = require('../controllers/todo')

todoRouter.get('/', todoControllers.getTodos)
todoRouter.get('/:id', todoControllers.getTodo)
todoRouter.post('/', todoControllers.addTodo)
todoRouter.delete('/:id', todoControllers.deleteTodo)
todoRouter.put('/:id', todoControllers.updateTodo)
todoRouter.patch('/:id', todoControllers.toggleTodo)

module.exports = {
    todoRouter
}