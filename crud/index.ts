import express from 'express'
import { SERVER_PORT } from './default.env'
import { apiRouter } from './routes/apiRouter'

const app = express()

app.use(express.json())

app.use('/', apiRouter)

app.listen(SERVER_PORT, () => console.log(`Server started on port ${SERVER_PORT}`))