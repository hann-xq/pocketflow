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
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { BankAccountResponseDto } from './dto/bank-account-response.dto';

@ApiTags('Bank Accounts')
@Auth()
@Serialize(BankAccountResponseDto)
@Controller('bank-accounts')
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new bank account' })
  @ApiCreatedResponse({ type: BankAccountResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({ description: 'Account number already exists' })
  create(@Body() createBankAccountDto: CreateBankAccountDto) {
    return this.bankAccountsService.create(createBankAccountDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bank account by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BankAccountResponseDto })
  @ApiNotFoundResponse({ description: 'Bank account not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bankAccountsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a bank account' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BankAccountResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiNotFoundResponse({ description: 'Bank account not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBankAccountDto: UpdateBankAccountDto,
  ) {
    return this.bankAccountsService.update(id, updateBankAccountDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a bank account' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Bank account deleted' })
  @ApiNotFoundResponse({ description: 'Bank account not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.bankAccountsService.remove(id);
  }
}
