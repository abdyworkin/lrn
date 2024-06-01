import { DataSource }  from 'typeorm'
import * as env from '../default.env'
import { TodoModel } from './models/TodoModel'

export const SqliteSource = new DataSource({
    type: 'sqlite',
    database: env.DATABASE_FILE,
    synchronize: true,
    entities: [TodoModel],
})

export const PostgresSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_FILE,
    synchronize: true,
    entities: [TodoModel],
})

const sources: Record<string, DataSource> = {
    'sqlite': SqliteSource,
    'postgres': PostgresSource
}

export const AppDataSource = sources[env.DATA_SOURCE]