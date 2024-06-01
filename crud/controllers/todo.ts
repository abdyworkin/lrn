import { Request, Response } from 'express'
import * as dbl from '../database'

export type Controller<T> = (req: Request<T>, res: Response) => void

export const getTodos: Controller<{}> = async (req, res) => {
    const todos = await dbl.todo.getTodos()
    res.json(todos)
}

export const getTodo: Controller<{ id: string }> = async (req, res) => {
    try {
        const todo = await dbl.todo.getTodoById(Number(req.params.id))
        res.json({ todo })
    } catch (err) {
        res.status(400).json({ error: err })
    }
}

export const addTodo: Controller<{}> = async (req, res) => {
    const todo = await dbl.todo.createTodo(req.body.title)
    res.json({ todo })
}

export const deleteTodo: Controller<{ id: string }> = async (req, res) => {
    try {
        const todo = await dbl.todo.deleteTodo(Number(req.params.id))
        res.json({ todo })
    } catch (err) {
        res.status(400).json({ error: err })
    }
}

export const updateTodo: Controller<{ id: string }> = async (req, res) => {
    try {
        const todo = await dbl.todo.updateTodo(Number(req.params.id), req.body.title)
        res.json({ todo })
    } catch (err) {
        res.status(400).json({ error: err })
    }

}

export const toggleTodo: Controller<{ id: string }> = async (req, res) => {
    try {
        const todo = await dbl.todo.toggleTodo(Number(req.params.id))
        res.json({ todo })
    } catch (err) {
        res.status(400).json({ error: err })
    }
}