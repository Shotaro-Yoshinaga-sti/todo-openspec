import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { TodoRepository, TodoFilter } from '../../database/repositories/todo.repository';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo, TodoPriority } from './entities/todo.entity';

@Injectable()
export class TodosService {
  constructor(private readonly todoRepository: TodoRepository) {}

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    const now = new Date();
    const todo = new Todo({
      id: uuidv4(),
      title: createTodoDto.title,
      description: createTodoDto.description,
      status: createTodoDto.status,
      priority: createTodoDto.priority || TodoPriority.MEDIUM,
      dueDate: createTodoDto.dueDate ? new Date(createTodoDto.dueDate) : undefined,
      createdAt: now,
      updatedAt: now,
    });

    return this.todoRepository.create(todo);
  }

  async findAll(filters?: TodoFilter): Promise<Todo[]> {
    return this.todoRepository.findAll(filters);
  }

  async findOne(id: string): Promise<Todo> {
    const todo = await this.todoRepository.findById(id);
    if (!todo) {
      throw new NotFoundException(`TODO with id '${id}' not found`);
    }
    return todo;
  }

  async update(id: string, updateTodoDto: UpdateTodoDto): Promise<Todo> {
    const existingTodo = await this.todoRepository.findById(id);
    if (!existingTodo) {
      throw new NotFoundException(`TODO with id '${id}' not found`);
    }

    const updates: Partial<Todo> = {
      ...updateTodoDto,
      dueDate: updateTodoDto.dueDate ? new Date(updateTodoDto.dueDate) : existingTodo.dueDate,
    };

    return this.todoRepository.update(id, updates);
  }

  async remove(id: string): Promise<void> {
    const existingTodo = await this.todoRepository.findById(id);
    if (!existingTodo) {
      throw new NotFoundException(`TODO with id '${id}' not found`);
    }

    await this.todoRepository.delete(id);
  }
}
