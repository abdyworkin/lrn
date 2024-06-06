import { Project, UserToProject } from "src/project/project.repo";
import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 255, unique: true })
    username: string

    @Column({ type: "varchar", length: 255, unique: false})
    password: string

    @OneToMany(() => UserToProject, (u) => u.user)
    userProjects: UserToProject[]
}
