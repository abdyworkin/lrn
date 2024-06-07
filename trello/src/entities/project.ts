import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { List } from "./list"
import { UserToProject, getUserFromRelation } from "./user_to_project"

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 255, default: "New Project" })
    title: string

    @Column({ type: 'varchar', length: 255, default: "New Project" })
    description: string

    @Column({ type: 'varchar', length: 500, nullable: false })
    inviteCode: string

    @Column({ type: 'bigint', nullable: false, default: Date.now() })
    inviteExpires: number

    @OneToMany(() => List, list => list.project)
    lists: List[]

    @OneToMany(() => UserToProject, p => p.project)
    users: UserToProject[]
}

export const getProjectOutput = (p: Project) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    lists: p.lists,
    users: p.users.map(getUserFromRelation)
})