import { Task } from "src/modules/task/task.entity"
import { Entity, ManyToOne, JoinTable, Column } from "typeorm"
import { ProjectTaskFields } from "./project_field.entity"



@Entity("task_field_string")
export class TaskFieldString {
    @ManyToOne(() => ProjectTaskFields)
    @JoinTable({ name: 'projectTaskFieldId' })
    projectTaskField: ProjectTaskFields
    
    @Column({ primary: true, type: 'bigint', nullable: false })
    projectTaskFieldId: number

    @ManyToOne(() => Task, task => task.numberFields, {
        cascade: true,
        onDelete: 'CASCADE'
    })
    @JoinTable({ name: 'taskId' })
    task: Task

    @Column({ primary: true, type: 'bigint', nullable: false })
    taskId: number

    @Column({ type: 'varchar', length: 500, nullable: true })
    value: string
}