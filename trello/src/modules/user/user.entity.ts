import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { UserToProject } from "../../entities/user_to_project.entity"
import { ApiProperty } from "@nestjs/swagger"

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


export class UserOutputData {
    @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
    id: number

    @ApiProperty({ example: 'ivan1234', description: 'Уникальное имя пользователя' })
    username: string
}


export const getUserOutputData = (u: User) => {
    return {
        id: u.id,
        username: u.username
    }
}