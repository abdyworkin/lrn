import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm"
import { List } from "./list"
import { User } from "./user"

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 255, default: "New Task" })
    title: string

    @Column({ type: 'varchar', length: 1500, nullable: true })
    description: string

    @Column({ type: 'int', nullable: false })
    position: number

    @ManyToOne(() => List)
    list: List
}