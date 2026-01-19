# Implementation Tasks: Add Two-Factor Authentication

## Phase 1: 基盤セットアップ

### 1.1 依存関係のインストール
- [ ] バックエンドに認証関連パッケージを追加
  - `@nestjs/passport`, `passport`, `passport-google-oauth20`
  - `@nestjs/jwt`
  - `otplib`, `qrcode`
- [ ] package.json更新後、`npm install`実行
- [ ] TypeScript型定義パッケージのインストール確認

**検証**: `npm list`で依存関係が正しくインストールされていることを確認

### 1.2 環境変数の設定
- [ ] `.env.example`に必要な環境変数を追加
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
  - `JWT_SECRET`, `JWT_EXPIRATION`
  - `TOTP_ENCRYPTION_KEY`, `TOTP_ISSUER`, `TOTP_WINDOW`, `TOTP_MAX_ATTEMPTS`, `TOTP_LOCKOUT_DURATION`
- [ ] ローカル開発用`.env`ファイルの作成と設定
- [ ] Google Cloud Consoleで OAuth 2.0 クライアントIDの作成

**検証**: 環境変数が正しく読み込まれることを確認（console.log）

## Phase 2: ユーザー管理モジュール

### 2.1 Userエンティティの作成
- [ ] `application/backend/src/modules/users/entities/user.entity.ts`を作成
  - id, email, name, googleId, totpSecret, twoFactorEnabled, twoFactorSetupComplete, createdAt, updatedAt
- [ ] CosmosDBデコレーター設定（partitionKey: id）
- [ ] インデックス設定（googleId: unique, email: index）

**検証**: エンティティがTypeScriptエラーなくコンパイルされる

### 2.2 Userリポジトリの作成
- [ ] `application/backend/src/modules/users/users.repository.ts`を作成
  - findByGoogleId, findByEmail, create, update メソッド
- [ ] CosmosDB接続とCRUD操作の実装

**検証**: ユニットテストまたは手動テストでCRUD操作が動作

### 2.3 Usersサービスの作成
- [ ] `application/backend/src/modules/users/users.service.ts`を作成
  - ユーザー作成、取得、更新ロジック
  - TOTP秘密鍵の暗号化・復号化ロジック
- [ ] `EncryptionService`をusers.service.tsに統合またはユーティリティとして作成

**検証**: サービスメソッドが正しくリポジトリを呼び出す

### 2.4 Usersコントローラーの作成
- [ ] `application/backend/src/modules/users/users.controller.ts`を作成
  - `GET /api/users/me`: 現在のユーザー情報取得
  - `PUT /api/users/me`: ユーザー情報更新
- [ ] JWT認証ガードを適用

**検証**: Swagger UIでエンドポイントが表示される

### 2.5 Usersモジュールの登録
- [ ] `application/backend/src/modules/users/users.module.ts`を作成
- [ ] `app.module.ts`にUsersModuleをインポート

**検証**: NestJSアプリが正常に起動する

## Phase 3: 認証モジュール（Google OAuth）

### 3.1 Google OAuth戦略の実装
- [ ] `application/backend/src/modules/auth/strategies/google.strategy.ts`を作成
- [ ] PassportStrategyを継承してGoogle OAuth2.0設定
- [ ] `validate`メソッドでユーザー検索または自動作成

**検証**: Google OAuth戦略が正しく登録される

### 3.2 JWT戦略の実装
- [ ] `application/backend/src/modules/auth/strategies/jwt.strategy.ts`を作成
- [ ] JWTペイロードの検証とユーザー情報抽出
- [ ] twoFactorVerifiedフラグの確認

**検証**: JWT戦略が正しく登録される

### 3.3 認証サービスの作成
- [ ] `application/backend/src/modules/auth/auth.service.ts`を作成
  - OAuth認証後のユーザー処理
  - 一時トークン・本トークンの発行ロジック
- [ ] JWTサービスの統合

**検証**: トークン発行ロジックが正しく動作

### 3.4 認証コントローラーの作成
- [ ] `application/backend/src/modules/auth/auth.controller.ts`を作成
  - `GET /api/auth/google`: Google OAuth開始
  - `GET /api/auth/google/callback`: OAuthコールバック
  - `POST /api/auth/logout`: ログアウト
- [ ] GoogleAuthGuardの適用

**検証**: Swagger UIでエンドポイントが表示され、Google OAuthフローが動作

### 3.5 認証ガードの作成
- [ ] `application/backend/src/common/guards/jwt-auth.guard.ts`を作成
- [ ] `application/backend/src/common/guards/totp-verified.guard.ts`を作成
  - twoFactorVerifiedフラグを確認

**検証**: ガードが未認証リクエストを拒否

### 3.6 カスタムデコレーターの作成
- [ ] `application/backend/src/common/decorators/current-user.decorator.ts`を作成
  - リクエストから現在のユーザー情報を抽出

**検証**: コントローラーでデコレーターが動作

### 3.7 認証モジュールの登録
- [ ] `application/backend/src/modules/auth/auth.module.ts`を作成
- [ ] `app.module.ts`にAuthModuleをインポート
- [ ] PassportModuleとJwtModuleの設定

**検証**: NestJSアプリが正常に起動し、Google OAuthでログイン可能

## Phase 4: 二要素認証（TOTP）

### 4.1 TOTPサービスの作成
- [ ] `application/backend/src/modules/auth/services/totp.service.ts`を作成
  - TOTP秘密鍵の生成
  - QRコードのData URL生成
  - TOTPコードの検証
  - 使用済みコードキャッシュ（Replay Attack対策）

**検証**: TOTP生成・検証ロジックが正しく動作

### 4.2 レート制限サービスの作成
- [ ] `application/backend/src/modules/auth/services/rate-limiter.service.ts`を作成
  - 失敗回数のカウント（メモリベース）
  - アカウントロックアウト管理
  - リセットロジック

**検証**: レート制限が5回失敗後にアカウントをロック

### 4.3 2FA関連エンドポイントの追加
- [ ] auth.controller.tsに以下を追加
  - `POST /api/auth/2fa/setup`: 2FAセットアップ開始
  - `POST /api/auth/2fa/verify-setup`: セットアップ時のTOTP検証
  - `POST /api/auth/2fa/verify`: ログイン時のTOTP検証
  - `GET /api/auth/2fa/status`: 2FA状態確認
- [ ] 各エンドポイントに適切なガードを適用

**検証**: Swagger UIでエンドポイントが表示され、2FAフローが動作

### 4.4 2FA統合テスト
- [ ] Google Authenticatorアプリで2FAセットアップをテスト
- [ ] TOTPコードでログイン検証をテスト
- [ ] 誤ったコードで認証拒否をテスト
- [ ] レート制限とロックアウトをテスト

**検証**: 全ての2FAシナリオが正しく動作

## Phase 5: TODO API統合

### 5.1 TODOエンティティの拡張
- [ ] `application/backend/src/modules/todos/entities/todo.entity.ts`にuserIdフィールド追加
- [ ] userIdインデックスをCosmosDBに設定

**検証**: エンティティがコンパイルエラーなく動作

### 5.2 TODO DTOの更新
- [ ] `create-todo.dto.ts`からuserIdを除外（自動設定）
- [ ] `update-todo.dto.ts`でuserIdを更新不可に設定

**検証**: DTOバリデーションが正しく動作

### 5.3 TODOサービスの更新
- [ ] `todos.service.ts`の全メソッドにuserIdフィルタリング追加
  - findAll: userIdでフィルタ
  - findOne: userIdと一致確認
  - create: userIdを自動設定
  - update: userIdと一致確認
  - remove: userIdと一致確認

**検証**: ユーザーは自分のTODOのみアクセス可能

### 5.4 TODOコントローラーの更新
- [ ] `todos.controller.ts`に認証ガード追加（JwtAuthGuard, TotpVerifiedGuard）
- [ ] @CurrentUserデコレーターで現在のユーザー取得
- [ ] userIdをサービスメソッドに渡す

**検証**: 未認証ユーザーはTODO APIにアクセスできない

### 5.5 既存TODOデータの移行
- [ ] 既存TODOデータを確認
- [ ] 最初にログインしたユーザーのIDを既存TODOに設定
  - 手動スクリプトまたは自動マイグレーション

**検証**: 既存TODOが適切なユーザーに紐付けられる

## Phase 6: フロントエンド統合

### 6.1 認証APIクライアントの作成
- [ ] `application/frontend/src/lib/api/auth.ts`を作成
  - Google OAuthログインURL生成
  - 2FAセットアップAPI呼び出し
  - TOTP検証API呼び出し
  - ログアウトAPI呼び出し

**検証**: APIクライアントが正しくバックエンドと通信

### 6.2 認証状態管理の実装
- [ ] `application/frontend/src/lib/auth/auth-context.tsx`を作成
  - JWTトークンの保存（localStorage）
  - 現在のユーザー情報管理
  - 認証状態フック（useAuth）

**検証**: 認証状態がアプリ全体で共有される

### 6.3 ログイン画面の作成
- [ ] `application/frontend/src/app/login/page.tsx`を作成
  - Google OAuthログインボタン

**検証**: ログインボタンクリックでGoogle OAuth同意画面へ遷移

### 6.4 OAuthコールバック画面の作成
- [ ] `application/frontend/src/app/auth/callback/page.tsx`を作成
  - コールバックURLからトークンを取得
  - 2FA状態に応じて適切な画面へリダイレクト

**検証**: コールバック後、適切な画面へ遷移

### 6.5 2FAセットアップ画面の作成
- [ ] `application/frontend/src/app/2fa/setup/page.tsx`を作成
  - QRコード表示
  - シークレットキー表示
  - TOTP検証コード入力フォーム

**検証**: QRコードをスキャンしてAuthenticatorアプリに登録可能

### 6.6 2FAログイン画面の作成
- [ ] `application/frontend/src/app/2fa/verify/page.tsx`を作成
  - TOTP検証コード入力フォーム
  - エラーメッセージ表示

**検証**: 正しいコードでログイン成功、誤ったコードでエラー表示

### 6.7 保護されたルートの実装
- [ ] `application/frontend/src/components/auth/protected-route.tsx`を作成
  - 未認証ユーザーをログイン画面へリダイレクト
- [ ] TODO一覧画面などを保護

**検証**: 未認証ユーザーはログイン画面へリダイレクトされる

### 6.8 ユーザープロフィール表示の追加
- [ ] ヘッダーまたはサイドバーに現在のユーザー情報を表示
- [ ] ログアウトボタンの追加

**検証**: ユーザー名とログアウトボタンが表示される

### 6.9 TODO APIクライアントの更新
- [ ] `application/frontend/src/lib/api/todos.ts`にJWTトークンヘッダー追加
  - Authorization: Bearer <token>
- [ ] エラーハンドリング（401エラーでログイン画面へ）

**検証**: TODO APIリクエストがJWTトークン付きで送信される

## Phase 7: テストとドキュメント

### 7.1 統合テスト
- [ ] Google OAuthログインから2FAセットアップ、TODO作成までのE2Eフロー
- [ ] 複数ユーザーでデータ分離を確認
- [ ] レート制限とロックアウトをテスト

**検証**: 全シナリオが期待通りに動作

### 7.2 セキュリティ検証
- [ ] TOTP秘密鍵が暗号化されてCosmosDBに保存されることを確認
- [ ] 使用済みTOTPコードの再利用が防止されることを確認
- [ ] 他ユーザーのTODOへのアクセスが拒否されることを確認

**検証**: セキュリティ要件が満たされている

### 7.3 Swaggerドキュメント更新
- [ ] 全認証エンドポイントにSwaggerデコレーター追加
- [ ] JWTトークンの説明を追加
- [ ] エラーレスポンスの例を追加

**検証**: Swagger UIで全エンドポイントが正しくドキュメント化

### 7.4 README更新
- [ ] 認証フローの説明を追加
- [ ] 環境変数の設定手順を追加
- [ ] Google OAuth設定手順を追加
- [ ] 2FAセットアップ手順を追加

**検証**: READMEを読めば新規開発者が環境構築できる

## Phase 8: デプロイと監視

### 8.1 環境変数の本番設定
- [ ] Azure環境に本番用環境変数を設定
- [ ] TOTP_ENCRYPTION_KEYを安全に生成・保存

**検証**: 本番環境で環境変数が正しく読み込まれる

### 8.2 本番デプロイ
- [ ] バックエンドをAzureにデプロイ
- [ ] フロントエンドをデプロイ
- [ ] Google OAuth Callback URLを本番URLに更新

**検証**: 本番環境で認証フロー全体が動作

### 8.3 ログと監視の設定
- [ ] 認証失敗ログの記録
- [ ] レート制限ログの記録
- [ ] セキュリティイベントの監視

**検証**: ログが適切に記録される

## タスク依存関係

**並行実行可能**:
- Phase 2（ユーザー管理）とPhase 3（Google OAuth）の一部タスクは並行可能
- Phase 6（フロントエンド）はPhase 5完了後に開始可能

**順次実行必須**:
- Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8

**重要マイルストーン**:
- ✅ Phase 3完了: Google OAuthログイン可能
- ✅ Phase 4完了: 2FA認証可能
- ✅ Phase 5完了: TODO APIが認証保護
- ✅ Phase 6完了: フロントエンド統合完了
