import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { TodoRepository } from '../../database/repositories/todo.repository';

@Module({
  controllers: [TodosController],
  providers: [TodosService, TodoRepository],
})
export class TodosModule {}
