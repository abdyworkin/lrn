import { List } from "src/project/project.repo";
import { User } from "src/user/user.repo";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 255, default: "New Task" })
    title: string

    @Column({ type: 'varchar', length: 1500, nullable: true })
    description: string

    @ManyToOne(() => User)   
    author: number

    @Column({ type: 'int', nullable: false })
    position: number

    @ManyToOne(() => List, list => list.id)
    list: number
}