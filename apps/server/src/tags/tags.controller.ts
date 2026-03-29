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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagResponseDto } from './dto/tag-response.dto';

@ApiTags('Tags')
@Auth()
@Serialize(TagResponseDto)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a tag',
    description:
      'Creates a new tag owned by the authenticated user. Tag names must be unique per user.',
  })
  @ApiCreatedResponse({ type: TagResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiConflictResponse({
    description:
      'A tag with this name already exists for the authenticated user',
  })
  create(@Body() createTagDto: CreateTagDto, @CurrentUser() user: User) {
    return this.tagsService.create(createTagDto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all tags',
    description: 'Returns all tags owned by the authenticated user.',
  })
  @ApiOkResponse({ type: [TagResponseDto] })
  findAll(@CurrentUser() user: User) {
    return this.tagsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a tag by ID',
    description:
      'Returns a tag by ID. Only tags owned by the authenticated user are accessible.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TagResponseDto })
  @ApiNotFoundResponse({
    description: 'Tag not found or does not belong to the authenticated user',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.tagsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a tag',
    description: 'Updates a tag owned by the authenticated user.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: TagResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiNotFoundResponse({
    description: 'Tag not found or does not belong to the authenticated user',
  })
  @ApiConflictResponse({
    description:
      'A tag with this name already exists for the authenticated user',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTagDto: UpdateTagDto,
    @CurrentUser() user: User,
  ) {
    return this.tagsService.update(id, user.id, updateTagDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a tag',
    description: 'Deletes a tag owned by the authenticated user.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Tag deleted' })
  @ApiNotFoundResponse({
    description: 'Tag not found or does not belong to the authenticated user',
  })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.tagsService.remove(id, user.id);
  }
}
