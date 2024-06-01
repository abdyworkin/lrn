import { Router } from 'express'
import * as todoControllers from './../controllers/todo'

export const todoRouter = Router()

todoRouter.get('/', todoControllers.getTodos)
todoRouter.get('/:id', todoControllers.getTodo)
todoRouter.post('/', todoControllers.addTodo)
todoRouter.delete('/:id', todoControllers.deleteTodo)
todoRouter.put('/:id', todoControllers.updateTodo)
todoRouter.patch('/:id', todoControllers.toggleTodo)

