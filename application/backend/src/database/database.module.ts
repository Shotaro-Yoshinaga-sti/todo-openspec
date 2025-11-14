import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CosmosClient } from '@azure/cosmos';
import * as https from 'https';

export const COSMOS_CLIENT = 'COSMOS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: COSMOS_CLIENT,
      useFactory: async (configService: ConfigService) => {
        const endpoint = configService.get<string>('COSMOS_DB_ENDPOINT');
        const key = configService.get<string>('COSMOS_DB_KEY');

        if (!endpoint || !key) {
          throw new Error('CosmosDB endpoint and key must be provided');
        }

        // For local development with Cosmos DB Emulator
        const isEmulator = endpoint.includes('localhost') || endpoint.includes('127.0.0.1');

        const client = new CosmosClient({
          endpoint,
          key,
          connectionPolicy: {
            ...(isEmulator && {
              requestTimeout: 30000,
            }),
          },
          ...(isEmulator && {
            agent: new https.Agent({
              rejectUnauthorized: false,
            }),
          }),
        });

        // Create database and container if they don't exist
        const databaseName = configService.get<string>('COSMOS_DB_DATABASE_NAME');
        const containerName = configService.get<string>('COSMOS_DB_CONTAINER_NAME');

        const { database } = await client.databases.createIfNotExists({
          id: databaseName,
        });

        await database.containers.createIfNotExists({
          id: containerName,
          partitionKey: { paths: ['/id'] },
        });

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [COSMOS_CLIENT],
})
export class DatabaseModule {}
