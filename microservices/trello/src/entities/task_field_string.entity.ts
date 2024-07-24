import { Task } from "src/modules/task/task.entity"
import { Entity, ManyToOne, JoinTable, Column } from "typeorm"
import { ProjectTaskField } from "../modules/field/project_field.entity"



@Entity("task_field_string")
export class TaskFieldString {
    @ManyToOne(() => ProjectTaskField, {
        cascade: true,
        onDelete: 'CASCADE'
    })
    @JoinTable({ name: 'projectTaskFieldId' })
    projectTaskField: ProjectTaskField
    
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