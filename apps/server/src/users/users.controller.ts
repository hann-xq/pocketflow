import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Serialize } from '../common/interceptors/serialize.interceptor';
import { Auth } from '../auth/decorators/auth.decorator';
import { AdminOnly } from '../auth/decorators/admin-only.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { TransactionResponseDto } from '../transactions/dto/transaction-response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Serialize(UserResponseDto)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiConflictResponse({ description: 'Email already in use' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @AdminOnly()
  @Serialize(UserResponseDto)
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiOkResponse({ type: [UserResponseDto] })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Auth()
  @Serialize(UserResponseDto)
  @ApiOperation({ summary: 'Get a user by ID (self or admin)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiForbiddenResponse({ description: 'Access to another user is forbidden' })
  @ApiNotFoundResponse({ description: 'User not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ) {
    if (currentUser.id !== id && !currentUser.isAdmin) {
      throw new ForbiddenException(
        'You are not allowed to access another user',
      );
    }

    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Auth()
  @Serialize(UserResponseDto)
  @ApiOperation({ summary: 'Update a user (self or admin)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiForbiddenResponse({ description: 'Access to another user is forbidden' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({ description: 'Email already in use' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    if (currentUser.id !== id && !currentUser.isAdmin) {
      throw new ForbiddenException(
        'You are not allowed to update another user',
      );
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Get(':id/transactions')
  @Auth()
  @Serialize(TransactionResponseDto)
  @ApiOperation({ summary: 'Get all transactions for a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: [TransactionResponseDto] })
  @ApiForbiddenResponse({
    description: 'Cannot access transactions of another user',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  findTransactions(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    if (user.id !== id) {
      throw new ForbiddenException(
        'You are not allowed to access transactions of another user',
      );
    }

    return this.transactionsService.findAllForUser(id);
  }

  @Delete(':id')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user (self or admin)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'User deleted' })
  @ApiBadRequestResponse({ description: 'Cannot delete an administrator' })
  @ApiForbiddenResponse({ description: 'Access to another user is forbidden' })
  @ApiNotFoundResponse({ description: 'User not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: User,
  ) {
    if (currentUser.id !== id && !currentUser.isAdmin) {
      throw new ForbiddenException(
        'You are not allowed to delete another user',
      );
    }

    return this.usersService.remove(id);
  }
}
