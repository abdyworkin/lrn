import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany } from "typeorm"
import { UserToProject } from "./user_to_project"

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 255, unique: true })
    username: string

    @Column({ type: "varchar", length: 255, unique: false})
    password: string

    @OneToMany(() => UserToProject, u => u.user)
    projects: UserToProject[]
}