import { Task } from "src/modules/task/task.entity";
import { Column, Entity, JoinTable, ManyToOne } from "typeorm";
import { ProjectTaskField } from "../modules/field/project_field.entity";


@Entity("task_field_number")
export class TaskFieldNumber {
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

    @Column({ type: 'float', nullable: true })
    value: number
}