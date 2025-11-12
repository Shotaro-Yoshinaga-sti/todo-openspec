import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CosmosClient, Container } from '@azure/cosmos';
import { Todo, TodoStatus, TodoPriority } from '../../modules/todos/entities/todo.entity';
import { COSMOS_CLIENT } from '../database.module';

export interface TodoFilter {
  status?: TodoStatus;
  priority?: TodoPriority;
  sortBy?: 'createdAt' | 'dueDate' | 'priority';
  order?: 'asc' | 'desc';
}

@Injectable()
export class TodoRepository {
  private container: Container;

  constructor(
    @Inject(COSMOS_CLIENT) private cosmosClient: CosmosClient,
    private configService: ConfigService,
  ) {
    const databaseName = this.configService.get<string>('COSMOS_DB_DATABASE_NAME');
    const containerName = this.configService.get<string>('COSMOS_DB_CONTAINER_NAME');
    this.container = this.cosmosClient
      .database(databaseName)
      .container(containerName);
  }

  async create(todo: Todo): Promise<Todo> {
    const { resource } = await this.container.items.create(todo);
    return new Todo(resource);
  }

  async findAll(filters?: TodoFilter): Promise<Todo[]> {
    let query = 'SELECT * FROM c';
    const conditions: string[] = [];
    const parameters: any[] = [];

    if (filters?.status) {
      conditions.push('c.status = @status');
      parameters.push({ name: '@status', value: filters.status });
    }

    if (filters?.priority) {
      conditions.push('c.priority = @priority');
      parameters.push({ name: '@priority', value: filters.priority });
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    if (filters?.sortBy) {
      const order = filters.order === 'desc' ? 'DESC' : 'ASC';
      query += ` ORDER BY c.${filters.sortBy} ${order}`;
    }

    const { resources } = await this.container.items
      .query({
        query,
        parameters,
      })
      .fetchAll();

    return resources.map((resource) => new Todo(resource));
  }

  async findById(id: string): Promise<Todo | null> {
    try {
      const { resource } = await this.container.item(id, id).read();
      return resource ? new Todo(resource) : null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async update(id: string, updates: Partial<Todo>): Promise<Todo> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Todo with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };

    const { resource } = await this.container.item(id, id).replace(updated);
    return new Todo(resource);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.container.item(id, id).delete();
      return true;
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(`Todo with id ${id} not found`);
      }
      throw error;
    }
  }
}
