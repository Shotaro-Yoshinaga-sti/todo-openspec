# Design: User Authentication

## Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Frontend   │  HTTPS  │   NestJS     │  HTTPS  │   Google    │
│  (Next.js)  │◄───────►│   Backend    │◄───────►│   OAuth     │
└─────────────┘         └──────────────┘         └─────────────┘
                              │
                              │ CosmosDB
                              ▼
                        ┌──────────────┐
                        │  Users       │
                        │  TODOs       │
                        └──────────────┘
```

## Authentication Flow

### 1. Google OAuth Login Flow
```
User → Frontend → Backend(/auth/google) → Google OAuth → Callback → Backend → JWT Token → Frontend
```

詳細なシーケンス：
1. ユーザーが「Googleでログイン」ボタンをクリック
2. フロントエンドが`GET /api/auth/google`にリダイレクト
3. バックエンドがGoogle OAuth認証画面にリダイレクト
4. ユーザーがGoogleアカウントでログイン・許可
5. GoogleがバックエンドのコールバックURL（`/api/auth/google/callback`）にリダイレクト
6. バックエンドが認可コードをアクセストークンに交換
7. バックエンドがGoogle APIからユーザー情報を取得
8. バックエンドがユーザーをDBに保存（または既存ユーザーを取得）
9. バックエンドがJWTトークンを生成
10. フロントエンドにトークンを返す（クエリパラメータまたはCookie）
11. フロントエンドがトークンをlocalStorageに保存

### 2. Authenticated API Request Flow
```
Frontend → Add JWT to Header → Backend → Validate JWT → Extract userId → Process Request
```

詳細な処理：
1. フロントエンドがAPI呼び出し時に`Authorization: Bearer <token>`ヘッダーを追加
2. `JwtAuthGuard`がトークンを検証
3. トークンが有効な場合、ペイロードから`userId`を抽出
4. `userId`をリクエストオブジェクトに注入（`req.user`）
5. コントローラーとサービスが`req.user.id`を使用してユーザー固有の操作を実行

## Data Model

### User Entity
```typescript
{
  id: string;           // UUID
  googleId: string;     // Google OAuth ID (unique)
  email: string;        // user@example.com
  name: string;         // Display name
  picture?: string;     // Profile image URL
  createdAt: Date;
  updatedAt: Date;
}
```

### Todo Entity (Updated)
```typescript
{
  id: string;
  userId: string;       // 追加: ユーザーID (外部キー)
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## CosmosDB Schema Design

### Option 1: Separate Containers
- **Usersコンテナ**: `/id`をパーティションキーとする
- **TODOsコンテナ**: `/userId`をパーティションキーとする

**メリット**:
- ユーザーとTODOの分離が明確
- パーティションキーが最適（TODOクエリは常にuserIdでフィルタリング）
- RU消費が効率的

**デメリット**:
- コンテナが増える（コスト増加の可能性）

### Option 2: Single Container with Discriminator
- 単一の`AppData`コンテナ
- `type`フィールドで`user`または`todo`を判別
- パーティションキー: `/type` または `/userId`

**メリット**:
- コンテナ数が少ない（コスト削減）

**デメリット**:
- ユーザークエリとTODOクエリが混在
- パーティションキーの選択が難しい

**推奨**: Option 1（Separate Containers）- データの分離が明確で、クエリ効率が良い

## Security Considerations

### JWT Token Security
- **Secret Key**: 環境変数`JWT_SECRET`で管理（256ビット以上推奨）
- **Expiration**: デフォルト1時間（`JWT_EXPIRES_IN=1h`）
- **Algorithm**: HS256（HMAC + SHA-256）
- **Payload**: 最小限の情報のみ（userId, email）

### Session Management
- **Stateless JWT**: リフレッシュトークンなし（シンプル実装）
- トークン有効期限切れ時は再ログインが必要
- 将来的にリフレッシュトークン機能を追加可能

### CORS Configuration
```typescript
app.enableCors({
  origin: [frontendUrl],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### Google OAuth Configuration
- **Scopes**: `profile`, `email`のみ（最小限の権限）
- **Redirect URI**: 本番環境と開発環境で異なるURLを設定
- **Client Secret**: 環境変数で管理、Gitにコミットしない

## Implementation Strategy

### Phase 1: Core Authentication (MVP)
1. Userエンティティとリポジトリの作成
2. Google OAuth戦略の実装
3. JWT戦略の実装
4. 認証エンドポイントの作成（`/auth/google`, `/auth/google/callback`）
5. JWTトークン発行機能

### Phase 2: API Protection
1. TODOエンティティに`userId`フィールド追加
2. `JwtAuthGuard`の実装
3. すべてのTODOエンドポイントにガードを適用
4. TodoServiceでuserIdによるフィルタリング実装

### Phase 3: User Management
1. `/auth/me`エンドポイントの実装
2. `/auth/logout`エンドポイントの実装（オプション）
3. Swaggerドキュメントに認証要件を追加

### Phase 4: Testing & Documentation
1. 認証フローのE2Eテスト
2. JWTガードのユニットテスト
3. README更新（セットアップ手順、OAuth設定）

## Migration Strategy

既存のTODOデータ（userIdなし）の取り扱い：

### Development Environment
- 既存データを削除してクリーンスタート（推奨）
- または、マイグレーションスクリプトでデフォルトuserIdを設定

### Production Environment (将来)
- マイグレーションスクリプトで既存TODOにuserIdを追加
- 最初にログインしたユーザーに割り当てる
- または、孤児TODOとして別管理

現段階では開発環境のみのため、データ削除が最もシンプル。

## Alternative Approaches Considered

### Alternative 1: Session-based Authentication
- **却下理由**: ステートフルなセッション管理が必要で、スケーラビリティが低い
- JWTのステートレスアプローチの方がクラウドネイティブなアプリに適している

### Alternative 2: Firebase Authentication
- **却下理由**: プロジェクトはAzure中心のインフラ（CosmosDB）を使用している
- Firebaseを追加すると複数クラウドプロバイダーの管理が必要

### Alternative 3: Custom Email/Password Authentication
- **却下理由**: Google OAuth認証が仕様で要求されている
- セキュリティリスク（パスワードハッシュ、忘れた場合の処理など）が高い

## Performance Considerations

### Database Queries
- **Usersテーブル**: GoogleIDでのルックアップ（O(1)、パーティションキー検索）
- **TODOsテーブル**: userIdでのフィルタリング（効率的、パーティションキー）

### Token Validation
- JWT検証はCPU処理のみ（DB不要）
- 毎リクエストでの検証オーバーヘッドは最小限

### Caching Opportunities (Future)
- ユーザー情報をRedisにキャッシュ（頻繁にアクセスされる場合）
- 現段階では不要（個人利用レベル）

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Google OAuth設定ミス | 認証不可 | 開発環境で十分にテスト、ドキュメント整備 |
| JWT Secret漏洩 | セキュリティ侵害 | 環境変数で管理、Gitにコミットしない、定期的なローテーション |
| トークン有効期限切れのUX | ユーザー体験低下 | フロントエンドで適切なエラーハンドリング、再ログインフロー |
| 既存データの互換性 | データ損失 | マイグレーション計画、バックアップ |

## Open Questions

1. **リフレッシュトークンの実装**: 初期実装では不要？
   - **決定**: MVP では実装しない。必要に応じて後から追加

2. **複数デバイスログイン**: 同じユーザーが複数デバイスでログイン可能にする？
   - **決定**: JWT方式により自動的に対応（同じトークンを複数デバイスで使用可能）

3. **ログアウト機能**: JWTはステートレスなのでサーバー側でのログアウトは不要？
   - **決定**: フロントエンドでトークン削除のみ。サーバー側ログアウトは将来実装

4. **既存TODOの所有権**: 誰が所有する？
   - **決定**: 開発段階では既存データを削除してクリーンスタート
