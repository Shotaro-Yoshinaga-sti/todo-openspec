import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo, TodoStatus, TodoPriority } from './entities/todo.entity';

@ApiTags('todos')
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new TODO' })
  @ApiResponse({
    status: 201,
    description: 'The TODO has been successfully created.',
    type: Todo,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(@Body() createTodoDto: CreateTodoDto): Promise<Todo> {
    return this.todosService.create(createTodoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all TODOs' })
  @ApiQuery({ name: 'status', enum: TodoStatus, required: false })
  @ApiQuery({ name: 'priority', enum: TodoPriority, required: false })
  @ApiQuery({
    name: 'sortBy',
    enum: ['createdAt', 'dueDate', 'priority'],
    required: false,
  })
  @ApiQuery({ name: 'order', enum: ['asc', 'desc'], required: false })
  @ApiResponse({
    status: 200,
    description: 'Return all TODOs.',
    type: [Todo],
  })
  async findAll(
    @Query('status') status?: TodoStatus,
    @Query('priority') priority?: TodoPriority,
    @Query('sortBy') sortBy?: 'createdAt' | 'dueDate' | 'priority',
    @Query('order') order?: 'asc' | 'desc',
  ): Promise<Todo[]> {
    return this.todosService.findAll({ status, priority, sortBy, order });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a TODO by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the TODO.',
    type: Todo,
  })
  @ApiResponse({ status: 404, description: 'TODO not found.' })
  async findOne(@Param('id') id: string): Promise<Todo> {
    return this.todosService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a TODO' })
  @ApiResponse({
    status: 200,
    description: 'The TODO has been successfully updated.',
    type: Todo,
  })
  @ApiResponse({ status: 404, description: 'TODO not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async update(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ): Promise<Todo> {
    return this.todosService.update(id, updateTodoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a TODO' })
  @ApiResponse({
    status: 204,
    description: 'The TODO has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'TODO not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.todosService.remove(id);
  }
}
