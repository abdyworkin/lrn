import express from 'express'
import { SERVER_PORT } from './default.env'
import { apiRouter } from './routes/apiRouter'
import { AppDataSource, SqliteSource } from './database/sources'
import { exit } from 'process'

(async () => {
    await AppDataSource.initialize()    
            .then(() => console.log('Data Source has been initialized!'))
            .catch((err) => {
                console.error('Error during Data Source initialization', err)
                exit(1)
            })

    const app = express()

    app.use(express.json())
    
    app.use('/', apiRouter)
    
    app.listen(SERVER_PORT, () => console.log(`Server started on port ${SERVER_PORT}`))
})()

