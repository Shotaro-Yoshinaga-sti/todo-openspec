# Tasks: Add User Authentication

## Phase 1: 基盤準備

- [ ] **依存パッケージのインストール**
  - `@nestjs/passport`, `passport`, `passport-google-oauth20`
  - `@nestjs/jwt`, `passport-jwt`
  - `@types/passport-google-oauth20`, `@types/passport-jwt`
  - 検証: package.jsonに依存関係が追加され、`npm install`が成功する

- [ ] **環境変数の設定**
  - `.env.example`ファイルを作成
  - 必要な環境変数を追加: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`
  - 検証: `.env.example`が存在し、すべての必要な変数が記載されている

- [ ] **Userエンティティの作成**
  - `src/modules/users/entities/user.entity.ts`を作成
  - `id`, `googleId`, `email`, `name`, `picture`, `createdAt`, `updatedAt`フィールドを定義
  - 検証: Userクラスがエクスポートされ、型定義が正しい

- [ ] **UserRepositoryの実装**
  - `src/database/repositories/user.repository.ts`を作成
  - CosmosDBとの連携実装: `create`, `findByGoogleId`, `findById`, `update`メソッド
  - 検証: 各メソッドが正しい型を返し、CosmosClientを使用している

## Phase 2: 認証機能の実装

- [ ] **Google OAuth戦略の実装**
  - `src/modules/auth/strategies/google.strategy.ts`を作成
  - Passport Google OAuth 2.0戦略を設定
  - `validate`メソッドでユーザー情報を処理
  - 検証: 戦略クラスが`PassportStrategy(Strategy, 'google')`を継承している

- [ ] **JWT戦略の実装**
  - `src/modules/auth/strategies/jwt.strategy.ts`を作成
  - Passport JWT戦略を設定
  - `validate`メソッドでペイロードからユーザー情報を抽出
  - 検証: 戦略クラスが`PassportStrategy(Strategy, 'jwt')`を継承している

- [ ] **JwtAuthGuardの作成**
  - `src/modules/auth/guards/jwt-auth.guard.ts`を作成
  - `@nestjs/passport`の`AuthGuard('jwt')`を継承
  - カスタムエラーハンドリング（401 Unauthorized）
  - 検証: ガードが正しく動作し、未認証リクエストを拒否する

- [ ] **GoogleAuthGuardの作成**
  - `src/modules/auth/guards/google-auth.guard.ts`を作成
  - `@nestjs/passport`の`AuthGuard('google')`を継承
  - 検証: ガードがGoogle OAuth認証フローを開始する

- [ ] **AuthServiceの実装**
  - `src/modules/auth/auth.service.ts`を作成
  - `validateGoogleUser`: Google OAuth認証後のユーザー検証・作成
  - `login`: JWTトークン生成
  - 検証: サービスがUserRepositoryを使用し、JWTトークンを返す

- [ ] **AuthControllerの実装**
  - `src/modules/auth/auth.controller.ts`を作成
  - `GET /auth/google`: Google OAuth認証開始
  - `GET /auth/google/callback`: OAuth認証コールバック
  - `GET /auth/me`: 現在のユーザー情報取得
  - `POST /auth/logout`: ログアウト（オプション）
  - 検証: すべてのエンドポイントが正しくルーティングされる

- [ ] **AuthModuleの作成**
  - `src/modules/auth/auth.module.ts`を作成
  - PassportModule、JwtModuleを設定
  - Google戦略、JWT戦略、AuthService、AuthControllerを登録
  - 検証: モジュールが正しくインポートされ、依存関係が解決される

## Phase 3: TODO APIの認証統合

- [ ] **TODOエンティティにuserIdフィールド追加**
  - `src/modules/todos/entities/todo.entity.ts`を更新
  - `userId: string`フィールドを追加
  - 検証: エンティティが新しいフィールドを含む

- [ ] **TodoRepositoryにuserIdフィルタ追加**
  - `src/database/repositories/todo.repository.ts`を更新
  - `findAll`メソッドにuserIdフィルタを追加
  - `findById`メソッドにuserIdフィルタを追加
  - 検証: クエリにuserIdフィルタが含まれる

- [ ] **TodoServiceの認証対応**
  - `src/modules/todos/todos.service.ts`を更新
  - すべてのメソッドに`userId`パラメータを追加
  - `create`: userIdを自動設定
  - `findAll`, `findOne`, `update`, `remove`: userIdでフィルタリング
  - 検証: サービスメソッドがuserIdを正しく使用する

- [ ] **TodoControllerに認証ガード適用**
  - `src/modules/todos/todos.controller.ts`を更新
  - `@UseGuards(JwtAuthGuard)`をコントローラークラスに追加
  - `@Req()`デコレータで`req.user`からuserIdを取得
  - 各メソッドでuserIdをサービスに渡す
  - 検証: すべてのエンドポイントが認証を要求する

- [ ] **CreateTodoDtoのバリデーション更新**
  - `src/modules/todos/dto/create-todo.dto.ts`を確認
  - `userId`フィールドが含まれていないことを確認（自動設定のため）
  - 検証: DTOがuserIdを受け付けない

## Phase 4: Swaggerドキュメント更新

- [ ] **Swagger認証設定**
  - `src/main.ts`でSwaggerドキュメント設定を更新
  - `addBearerAuth()`を追加してJWT認証をサポート
  - 検証: Swagger UIに「Authorize」ボタンが表示される

- [ ] **AuthControllerのSwaggerデコレータ**
  - `@ApiTags('auth')`を追加
  - 各エンドポイントに`@ApiOperation`, `@ApiResponse`を追加
  - 検証: Swagger UIに認証エンドポイントが表示される

- [ ] **TodoControllerのSwagger認証表示**
  - `@ApiBearerAuth()`をコントローラークラスに追加
  - 検証: Swagger UIでTODOエンドポイントに鍵アイコンが表示される

## Phase 5: CosmosDB設定

- [ ] **Usersコンテナの作成**
  - `src/database/database.module.ts`を更新
  - Usersコンテナの自動作成ロジックを追加
  - パーティションキーを`/id`に設定
  - 検証: アプリケーション起動時にUsersコンテナが作成される

- [ ] **TODOsコンテナのパーティションキー変更（オプション）**
  - 既存のTODOsコンテナのパーティションキーを確認
  - `/userId`をパーティションキーとするコンテナを新規作成（推奨）
  - または、既存の`/id`を維持（互換性優先）
  - 検証: CosmosDBにコンテナが存在し、正しいパーティションキーが設定されている

- [ ] **データベース接続設定の検証**
  - 環境変数`COSMOS_DB_USERS_CONTAINER_NAME`を追加（オプション）
  - `database.module.ts`で複数コンテナを管理
  - 検証: アプリケーションがUsersとTODOsの両方のコンテナに接続できる

## Phase 6: エラーハンドリング強化

- [ ] **認証エラーフィルタの追加**
  - `src/common/filters/http-exception.filter.ts`を更新
  - `UNAUTHORIZED`, `TOKEN_EXPIRED`, `INVALID_TOKEN`エラーコードを追加
  - 検証: 認証エラーが統一された形式で返される

- [ ] **UnauthorizedExceptionの適切な使用**
  - JwtAuthGuardで`UnauthorizedException`をスロー
  - 検証: 未認証リクエストが401ステータスを返す

## Phase 7: CORS設定の更新

- [ ] **CORSの認証情報サポート**
  - `src/main.ts`でCORS設定を更新
  - `credentials: true`を設定
  - `allowedHeaders`に`Authorization`を追加
  - 検証: フロントエンドからJWTトークン付きリクエストが成功する

## Phase 8: テスト

- [ ] **AuthServiceのユニットテスト**
  - `src/modules/auth/auth.service.spec.ts`を作成
  - `validateGoogleUser`と`login`メソッドをテスト
  - 検証: テストが成功する

- [ ] **UserRepositoryのユニットテスト**
  - `src/database/repositories/user.repository.spec.ts`を作成
  - CRUD操作をモックしてテスト
  - 検証: テストが成功する

- [ ] **TodoServiceの認証対応テスト**
  - `src/modules/todos/todos.service.spec.ts`を更新
  - userIdフィルタリングのテストを追加
  - 検証: テストが成功する

- [ ] **認証フローのE2Eテスト**
  - `test/auth.e2e-spec.ts`を作成
  - Google OAuth認証フロー（モック）をテスト
  - JWT認証ガードのテスト
  - 検証: E2Eテストが成功する

- [ ] **TODO API認証のE2Eテスト**
  - `test/todos.e2e-spec.ts`を更新
  - 未認証リクエストが拒否されることをテスト
  - 認証済みユーザーのTODO操作をテスト
  - 他ユーザーのTODOへのアクセスが拒否されることをテスト
  - 検証: E2Eテストが成功する

## Phase 9: ドキュメント整備

- [ ] **READMEの更新**
  - `application/backend/README.md`を作成
  - Google OAuth設定手順を追加
  - 環境変数の説明を追加
  - 認証フローの説明を追加
  - 検証: READMEが明確で、新しい開発者がセットアップできる

- [ ] **Google OAuth設定ガイド**
  - Google Cloud Consoleでのクライアント作成手順を記載
  - リダイレクトURIの設定例を記載
  - 検証: ドキュメントに従ってOAuth設定が完了できる

- [ ] **マイグレーション手順**
  - 既存TODOデータの取り扱い方法を記載
  - 開発環境でのデータリセット手順を記載
  - 検証: 開発者がデータ移行を理解できる

## Phase 10: 統合テストと検証

- [ ] **ローカル環境での統合テスト**
  - Google OAuth認証フローを手動でテスト
  - TODO作成・取得・更新・削除をテスト
  - 複数ユーザーでデータ分離をテスト
  - 検証: すべての機能が正常に動作する

- [ ] **エラーケースの検証**
  - 無効なトークンでのリクエスト
  - 有効期限切れトークンでのリクエスト
  - 他ユーザーのTODOへのアクセス試行
  - 検証: 適切なエラーメッセージが返される

- [ ] **パフォーマンステスト**
  - 複数ユーザー・複数TODOでのクエリ性能を確認
  - CosmosDBのRU消費を監視
  - 検証: 許容範囲のパフォーマンス

- [ ] **セキュリティレビュー**
  - JWT Secretが環境変数で管理されている
  - Google Client Secretがコードにハードコードされていない
  - ユーザーデータが適切に分離されている
  - 検証: セキュリティベストプラクティスに準拠

## Dependencies

- Phase 2はPhase 1に依存
- Phase 3はPhase 2に依存
- Phase 4はPhase 3に依存
- Phase 8はPhase 1-7に依存
- Phase 10はPhase 1-9に依存

## Parallel Work Opportunities

- Phase 1の「依存パッケージのインストール」と「環境変数の設定」は並行可能
- Phase 2の各タスク（戦略、ガード、サービス、コントローラー）は部分的に並行可能
- Phase 4（Swaggerドキュメント）はPhase 3完了後に独立して作業可能
- Phase 8（テスト）の各タスクは並行可能
