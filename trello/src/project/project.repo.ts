import { User } from "src/user/user.repo"
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { ProjectRoles } from "./project.guard"


@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 255, default: "New Project" })
    title: string

    @Column({ type: 'varchar', length: 255, default: "New Project" })
    description: string

    @OneToMany(() => UserToProject, (user) => user.project)
    projectUsers: UserToProject[]
}

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

   @ManyToOne(() => Project, p => p.id)
    project: Project
}

@Entity()
export class UserToProject {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Project, p => p.projectUsers)
    project: Project

    @ManyToOne(() => User, u => u.userProjects)
    user: User

    @Column({ type: 'varchar', length: 30, nullable: false, default: 'user' })
    role: ProjectRoles
}