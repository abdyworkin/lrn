import { Router } from 'express'
import controllers from '../controllers'

export const todoRouter = Router()

todoRouter.get('/', controllers.todo.getTodos)
todoRouter.get('/:id', controllers.todo.getTodo)
todoRouter.post('/', controllers.todo.addTodo)
todoRouter.delete('/:id', controllers.todo.deleteTodo)
todoRouter.put('/:id', controllers.todo.updateTodo)
todoRouter.patch('/:id', controllers.todo.toggleTodo)

