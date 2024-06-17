import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserOutputData } from 'src/modules/user/user.entity';

@ApiBearerAuth()
@ApiTags('user')
@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
    constructor(
        private readonly userService: UserService
    ) {}

    @ApiOperation({ summary: 'Получение данных пользователя по ID' })
    @ApiResponse({ status: 200, type: UserOutputData })
    @Get('/:id') 
    async getUserById(@Param('id', ParseIntPipe) id: number) {
        return UserOutputData.get(await this.userService.findUserById(id))
    }
}
