import { Request, Response } from 'express'
import { AppDataSource } from '../database/sources'
import { TodoModel } from '../database/models/TodoModel'

export type Controller<T> = (req: Request<T>, res: Response) => void

export const getTodos: Controller<{}> = async (req, res) => {
    const todos = await AppDataSource
        .getRepository(TodoModel)
        .find()
    res.json(todos)
}

export const getTodo: Controller<{ id: string }> = async (req, res) => {
    if (isNaN(Number(req.params.id))) {
        res.status(400).json({ error: 'Invalid ID' })
        return
    }

    //TODO: проверить есть ли необходимость оборачивать в try-catch
    const todo = await AppDataSource
        .getRepository(TodoModel)
        .findOneBy({ id: Number(req.params.id) })
    res.json({ todo })
}

export const addTodo: Controller<{}> = async (req, res) => {
    await AppDataSource
        .getRepository(TodoModel)
        .insert({ title: req.body.title })
        .then((result) => res.json({ result: true, id: result.generatedMaps[0].id }))
        .catch((err) => res.status(500).json({ error: err }))
}

export const deleteTodo: Controller<{ id: string }> = async (req, res) => {
    if (isNaN(Number(req.params.id))) {
        res.status(400).json({ error: 'Invalid ID' })
        return
    }

    await AppDataSource
        .getRepository(TodoModel)
        .delete({ id: Number(req.params.id) })
        .then(() => res.json({ result: true }))
        .catch((err) => res.status(500).json({ error: err }))
}

export const updateTodo: Controller<{ id: string }> = async (req, res) => {
    if (isNaN(Number(req.params.id))) {
        res.status(400).json({ error: 'Invalid ID' })
        return
    }

    await AppDataSource
        .getRepository(TodoModel)
        .update({ id: Number(req.params.id) }, { title: req.body.title })
        .then(() => res.json({ result: true }))
        .catch((err) => res.status(500).json({ error: err }))

}

export const toggleTodo: Controller<{ id: string }> = async (req, res) => {
    if (isNaN(Number(req.params.id))) {
        res.status(400).json({ error: 'Invalid ID' })
        return
    }

    await AppDataSource
        .createQueryBuilder()
        .update(TodoModel)
        .set({
            complete: () => "NOT complete"
        })
        .where("id = :id", { id: Number(req.params.id) })
        .execute()
        .then((result) => res.json({ result: true })) // TODO: найти способ вернуть текущее состояние задачи
        .catch((err) => res.status(500).json({ error: err }))
}