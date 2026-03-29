import {
  Body,
  Controller,
  Delete,
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
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Serialize } from '../common/interceptors/serialize.interceptor';
import { Auth } from '../auth/decorators/auth.decorator';
import { UsersService } from './users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { BankAccountResponseDto } from '../bank-accounts/dto/bank-account-response.dto';
import { TransactionResponseDto } from '../transactions/dto/transaction-response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
    private readonly bankAccountsService: BankAccountsService,
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
  @Auth()
  @Serialize(UserResponseDto)
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({ type: [UserResponseDto] })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Auth()
  @Serialize(UserResponseDto)
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Auth()
  @Serialize(UserResponseDto)
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({ description: 'Email already in use' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Get(':id/bank-accounts')
  @Auth()
  @Serialize(BankAccountResponseDto)
  @ApiOperation({ summary: 'Get all bank accounts for a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: [BankAccountResponseDto] })
  @ApiNotFoundResponse({ description: 'User not found' })
  findBankAccounts(@Param('id', ParseUUIDPipe) id: string) {
    return this.bankAccountsService.findAllForUser(id);
  }

  @Get(':id/transactions')
  @Auth()
  @Serialize(TransactionResponseDto)
  @ApiOperation({ summary: 'Get all transactions for a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: [TransactionResponseDto] })
  @ApiNotFoundResponse({ description: 'User not found' })
  findTransactions(@Param('id', ParseUUIDPipe) id: string) {
    return this.transactionsService.findAllForUser(id);
  }

  @Delete(':id')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'User deleted' })
  @ApiNotFoundResponse({ description: 'User not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
