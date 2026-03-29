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
import { TransactionsService } from './transactions.service';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';

@ApiTags('Transactions')
@Auth()
@Serialize(TransactionResponseDto)
@Controller()
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly bankAccountsService: BankAccountsService,
  ) {}

  @Post('bank-accounts/:bankAccountId/transactions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a transaction for a bank account' })
  @ApiParam({ name: 'bankAccountId', format: 'uuid' })
  @ApiCreatedResponse({ type: TransactionResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiForbiddenResponse({ description: 'Bank account belongs to another user' })
  @ApiNotFoundResponse({ description: 'Bank account or category not found' })
  async create(
    @Param('bankAccountId', ParseUUIDPipe) bankAccountId: string,
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser() user: User,
  ) {
    const bankAccount = await this.bankAccountsService.findOne(bankAccountId);

    if (bankAccount.userId !== user.id) {
      throw new ForbiddenException(
        'You are not allowed to add transactions to this bank account',
      );
    }

    return this.transactionsService.create(createTransactionDto, bankAccountId);
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get a transaction by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TransactionResponseDto })
  @ApiForbiddenResponse({ description: 'Transaction belongs to another user' })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const transaction = await this.transactionsService.findOne(id);

    if (transaction.bankAccount.userId !== user.id) {
      throw new ForbiddenException(
        'You are not allowed to access this transaction',
      );
    }

    return transaction;
  }

  @Patch('transactions/:id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TransactionResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiForbiddenResponse({ description: 'Transaction belongs to another user' })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @CurrentUser() user: User,
  ) {
    const transaction = await this.transactionsService.findOne(id);

    if (transaction.bankAccount.userId !== user.id) {
      throw new ForbiddenException(
        'You are not allowed to update this transaction',
      );
    }

    return this.transactionsService.update(id, updateTransactionDto);
  }

  @Delete('transactions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Transaction deleted' })
  @ApiForbiddenResponse({ description: 'Transaction belongs to another user' })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const transaction = await this.transactionsService.findOne(id);

    if (transaction.bankAccount.userId !== user.id) {
      throw new ForbiddenException(
        'You are not allowed to delete this transaction',
      );
    }

    return this.transactionsService.remove(id);
  }
}
