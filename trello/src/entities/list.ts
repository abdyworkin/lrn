import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm"
import { Project } from "./project"
import { Task } from "./task"

@Entity('lists')
export class List {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 255, default: "New List" })
    title: string

    @Column({ type: 'varchar', length: 255, default: "New List" })
    description: string
    
    @Column({ type: 'int', nullable: false })
    position: number

    @ManyToOne(() => Project)
    project: Project

    @OneToMany(() => Task, task => task.list)
    tasks: Task[]
}