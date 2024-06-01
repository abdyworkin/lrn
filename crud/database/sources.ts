import { DataSource }  from 'typeorm'
import * as env from '../default.env'
import { TodoModel } from './models/TodoModel'

export const SqliteSource = new DataSource({
    type: 'sqlite',
    database: env.DATABASE_FILE,
    synchronize: true,
    entities: [TodoModel],
})

export const AppDataSource = SqliteSource