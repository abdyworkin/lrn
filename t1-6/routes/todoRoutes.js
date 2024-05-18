const { createRoute } = require('./router')
const {
    getTodos,
    getTodo,
    addTodo,
    deleteTodo,
    updateTodo,
    toggleTodo
} = require('../controllers/todo')

const todoRootRoute = createRoute.get('todo', getTodos, [
    createRoute.post('add', addTodo),
    createRoute.put(':id', updateTodo, [
        createRoute.patch('toggle', toggleTodo)
    ]),
    createRoute.get(':id', getTodo),
    createRoute.delete(':id', deleteTodo)
])


module.exports = {
    todoRootRoute
}