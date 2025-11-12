# TODO Backend API

NestJSとAzure CosmosDBを使用したTODO管理のRESTful API。

## 技術スタック

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: Azure CosmosDB
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI

## セットアップ

### 前提条件

- Node.js 18以上
- Azure CosmosDBアカウント（または CosmosDB Emulator）

### インストール

```bash
npm install
```

### 環境変数設定

`.env.example` をコピーして `.env` ファイルを作成し、以下の環境変数を設定してください：

```env
# Application
PORT=3001
NODE_ENV=development

# CosmosDB Configuration
COSMOS_DB_ENDPOINT=https://your-cosmosdb-account.documents.azure.com:443/
COSMOS_DB_KEY=your-cosmosdb-primary-key
COSMOS_DB_DATABASE_NAME=todo-db
COSMOS_DB_CONTAINER_NAME=todos

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### CosmosDB Emulator（ローカル開発用）

ローカル開発にはAzure CosmosDB Emulatorを使用できます：

1. [CosmosDB Emulatorをダウンロード](https://aka.ms/cosmosdb-emulator)
2. エミュレーターを起動
3. `.env` に以下を設定：

```env
COSMOS_DB_ENDPOINT=https://localhost:8081
COSMOS_DB_KEY=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==
```

## 起動

### 開発モード

```bash
npm run start:dev
```

### プロダクションビルド

```bash
npm run build
npm run start:prod
```

## API エンドポイント

ベースURL: `http://localhost:3001/api`

### TODO操作

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/todos` | TODO作成 |
| GET | `/todos` | TODO一覧取得 |
| GET | `/todos/:id` | TODO詳細取得 |
| PUT | `/todos/:id` | TODO更新 |
| DELETE | `/todos/:id` | TODO削除 |

### クエリパラメータ（GET /todos）

- `status`: フィルタリング（`pending`, `in-progress`, `completed`）
- `priority`: 優先度フィルタリング（`low`, `medium`, `high`）
- `sortBy`: ソート項目（`createdAt`, `dueDate`, `priority`）
- `order`: ソート順（`asc`, `desc`）

### リクエスト例

#### TODO作成

```bash
curl -X POST http://localhost:3001/api/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement user authentication",
    "description": "Add Google OAuth integration",
    "status": "pending",
    "priority": "high",
    "dueDate": "2024-12-31T23:59:59Z"
  }'
```

#### TODO一覧取得（フィルタリング）

```bash
curl "http://localhost:3001/api/todos?status=pending&priority=high&sortBy=dueDate&order=asc"
```

#### TODO更新

```bash
curl -X PUT http://localhost:3001/api/todos/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

### レスポンス形式

#### 成功レスポンス

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Example TODO",
    "description": "Description here",
    "status": "pending",
    "priority": "medium",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "createdAt": "2024-11-12T00:00:00.000Z",
    "updatedAt": "2024-11-12T00:00:00.000Z"
  }
}
```

#### エラーレスポンス

```json
{
  "success": false,
  "error": {
    "code": "TODO_NOT_FOUND",
    "message": "TODO with id 'xxx' not found",
    "statusCode": 404
  }
}
```

## Swagger ドキュメント

開発モードでは、Swagger UIでAPIドキュメントを確認できます：

```
http://localhost:3001/api/docs
```

## プロジェクト構造

```
src/
├── main.ts                     # アプリケーションエントリーポイント
├── app.module.ts               # ルートモジュール
├── modules/
│   └── todos/
│       ├── todos.controller.ts  # HTTPエンドポイント
│       ├── todos.service.ts     # ビジネスロジック
│       ├── todos.module.ts      # モジュール定義
│       ├── dto/                 # Data Transfer Objects
│       │   ├── create-todo.dto.ts
│       │   └── update-todo.dto.ts
│       └── entities/
│           └── todo.entity.ts   # データモデル
├── database/
│   ├── database.module.ts       # CosmosDB接続
│   └── repositories/
│       └── todo.repository.ts   # データアクセス層
└── common/
    ├── filters/                 # エラーハンドリング
    │   └── http-exception.filter.ts
    └── interceptors/            # レスポンス変換
        └── transform.interceptor.ts
```

## TODOデータモデル

```typescript
interface Todo {
  id: string;              // UUID（自動生成）
  title: string;           // 必須、最大200文字
  description?: string;    // オプション、最大2000文字
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';  // デフォルト: medium
  dueDate?: Date;          // オプション
  createdAt: Date;         // 自動設定
  updatedAt: Date;         // 自動更新
}
```

## 開発

### コードフォーマット

```bash
npm run format
```

### Lint

```bash
npm run lint
```

## トラブルシューティング

### CosmosDBに接続できない

- 環境変数 `COSMOS_DB_ENDPOINT` と `COSMOS_DB_KEY` が正しく設定されているか確認
- CosmosDBアカウントのファイアウォール設定を確認
- ローカル開発の場合、CosmosDB Emulatorが起動しているか確認

### バリデーションエラー

- リクエストボディが正しいJSON形式か確認
- 必須フィールド（`title`, `status`）が含まれているか確認
- 列挙型フィールド（`status`, `priority`）の値が正しいか確認

## ライセンス

MIT
