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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { BankAccountResponseDto } from './dto/bank-account-response.dto';

@ApiTags('Bank Accounts')
@Auth()
@Serialize(BankAccountResponseDto)
@Controller()
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Post('users/:userId/bank-accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a bank account for a user' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiCreatedResponse({ type: BankAccountResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiForbiddenResponse({
    description: 'Cannot create bank account for another user',
  })
  @ApiConflictResponse({ description: 'Account number already exists' })
  create(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() createBankAccountDto: CreateBankAccountDto,
    @CurrentUser() user: User,
  ) {
    if (user.id !== userId) {
      throw new ForbiddenException(
        'You are not allowed to create a bank account for another user',
      );
    }

    return this.bankAccountsService.create(createBankAccountDto, userId);
  }

  @Get('users/:userId/bank-accounts')
  @ApiOperation({ summary: 'Get all bank accounts for a user' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOkResponse({ type: [BankAccountResponseDto] })
  @ApiForbiddenResponse({
    description: 'Cannot access bank accounts of another user',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  findAllForUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: User,
  ) {
    if (user.id !== userId) {
      throw new ForbiddenException(
        'You are not allowed to access bank accounts of another user',
      );
    }

    return this.bankAccountsService.findAllForUser(userId);
  }

  @Get('bank-accounts/:id')
  @ApiOperation({ summary: 'Get a bank account by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BankAccountResponseDto })
  @ApiForbiddenResponse({ description: 'Bank account belongs to another user' })
  @ApiNotFoundResponse({ description: 'Bank account not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const bankAccount = await this.bankAccountsService.findOne(id);

    if (bankAccount.userId !== user.id) {
      throw new ForbiddenException(
        'You are not allowed to access this bank account',
      );
    }

    return bankAccount;
  }

  @Patch('bank-accounts/:id')
  @ApiOperation({ summary: 'Update a bank account' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BankAccountResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiForbiddenResponse({ description: 'Bank account belongs to another user' })
  @ApiNotFoundResponse({ description: 'Bank account not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBankAccountDto: UpdateBankAccountDto,
    @CurrentUser() user: User,
  ) {
    const bankAccount = await this.bankAccountsService.findOne(id);

    if (bankAccount.userId !== user.id) {
      throw new ForbiddenException(
        'You are not allowed to update this bank account',
      );
    }

    return this.bankAccountsService.update(id, updateBankAccountDto);
  }

  @Delete('bank-accounts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a bank account' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Bank account deleted' })
  @ApiForbiddenResponse({ description: 'Bank account belongs to another user' })
  @ApiNotFoundResponse({ description: 'Bank account not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const bankAccount = await this.bankAccountsService.findOne(id);

    if (bankAccount.userId !== user.id) {
      throw new ForbiddenException(
        'You are not allowed to delete this bank account',
      );
    }

    return this.bankAccountsService.remove(id);
  }
}
