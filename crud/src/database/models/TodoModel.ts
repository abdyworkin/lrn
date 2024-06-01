import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('todos')
export class TodoModel {
    @PrimaryGeneratedColumn()
    id!: number
    
    @Column({ type: "varchar", length: 255, nullable: false })
    title!: string

    @Column({ type: "boolean", default: false })
    complete!: boolean
}