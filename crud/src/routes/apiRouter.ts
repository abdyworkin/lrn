import { Router } from "express"
import { todoRouter } from "./todoRouter"

export const apiRouter = Router()

apiRouter.use('/todo', todoRouter)