# Change Proposal: Add User Authentication

## Why

現在のTODOバックエンドAPIは認証機能が一切実装されておらず、すべてのエンドポイントが無防備な状態です。これにより以下の重大な問題があります：

1. **セキュリティリスク**: 誰でもTODOデータにアクセス・変更・削除が可能
2. **データの混在**: 複数ユーザーのTODOが区別できず、すべて混在してしまう
3. **プライバシー違反**: ユーザーごとのデータ分離ができない
4. **仕様との不整合**: `openspec/project.md`では「Google OAuth認証必須」と明記されているが未実装

個人のエンジニア向けTODOリストアプリとして、Google OAuth認証を実装し、ユーザーごとにデータを完全に分離する必要があります。

## What Changes

### 認証システムの実装
- **Google OAuth 2.0統合**
  - Passportを使用したGoogle OAuth戦略の実装
  - OAuth認証フロー（認可、コールバック、トークン交換）
  - ユーザー情報の取得（Googleアカウント情報）

- **JWTトークン管理**
  - アクセストークンの発行と検証
  - リフレッシュトークンの管理（オプション）
  - トークンの有効期限管理

- **認証ガード**
  - すべてのTODO APIエンドポイントに認証ガードを適用
  - `/auth/google`と`/auth/google/callback`は公開エンドポイント
  - 未認証リクエストは401 Unauthorizedを返す

### ユーザー管理機能
- **Userエンティティ**
  - `id`: UUID（プライマリキー）
  - `googleId`: Google OAuth ID（ユニーク）
  - `email`: メールアドレス
  - `name`: 表示名
  - `picture`: プロフィール画像URL
  - `createdAt`: アカウント作成日時
  - `updatedAt`: 最終更新日時

- **UserRepository**
  - CosmosDBにユーザーデータを永続化
  - GoogleIDによる検索機能
  - 初回ログイン時のユーザー自動作成

### TODOエンティティの拡張
- **userIdフィールド追加**
  - すべてのTODOに所有者（userId）を紐付け
  - TODOの作成時に認証ユーザーのIDを自動設定
  - 一覧取得・詳細取得・更新・削除は自分のTODOのみ操作可能

### 新規APIエンドポイント
- `GET /api/auth/google` - Google OAuth認証開始
- `GET /api/auth/google/callback` - OAuth認証コールバック
- `GET /api/auth/me` - 現在のログインユーザー情報取得
- `POST /api/auth/logout` - ログアウト（トークン無効化）

### セキュリティ強化
- **CORSの改善**
  - 認証情報を含むリクエストに対応（credentials: true）
  - 明示的なオリジン指定

- **環境変数の追加**
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_CALLBACK_URL`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`

## Impact

### 新規追加される仕様
- `specs/user-auth/` - ユーザー認証とGoogle OAuth統合の要件
- `specs/user-management/` - ユーザー管理機能の要件

### 変更される仕様
- `specs/todo-api/` - すべてのTODO操作に認証が必須となる
  - 各エンドポイントに「認証済みユーザーのみアクセス可能」を追加
  - TODOは所有者のみ操作可能という要件を追加

### 影響を受けるコード
- `application/backend/src/modules/todos/`
  - `entities/todo.entity.ts` - userIdフィールド追加
  - `todos.controller.ts` - JwtAuthGuard適用
  - `todos.service.ts` - userIdによるフィルタリング追加

- `application/backend/src/modules/auth/` - 新規作成
  - `auth.controller.ts` - 認証エンドポイント
  - `auth.service.ts` - 認証ロジック
  - `strategies/google.strategy.ts` - Google OAuth戦略
  - `strategies/jwt.strategy.ts` - JWT戦略
  - `guards/jwt-auth.guard.ts` - JWT認証ガード

- `application/backend/src/modules/users/` - 新規作成
  - `entities/user.entity.ts` - ユーザーエンティティ
  - `users.service.ts` - ユーザー管理ロジック

- `application/backend/src/database/repositories/`
  - `user.repository.ts` - 新規作成
  - `todo.repository.ts` - userIdによるフィルタリング追加

- `application/backend/src/main.ts`
  - セッション設定の追加

- `application/backend/package.json`
  - 依存関係追加: `@nestjs/passport`, `passport`, `passport-google-oauth20`, `@nestjs/jwt`, `passport-jwt`, `express-session`

### フロントエンドへの影響
- すべてのAPI呼び出しにJWTトークンを含める必要がある
- ログイン・ログアウトUIの実装が必要
- 未認証時のリダイレクト処理が必要

### 開発環境への影響
- Google Cloud Consoleで OAuth 2.0クライアントIDの作成が必要
- `.env`に認証関連の環境変数追加が必要
- CosmosDBに新しいUsersコンテナ（またはパーティション）が必要

### 互換性
- **破壊的変更**: 既存のTODO APIエンドポイントはすべて認証が必須になる
- 既存のTODOデータには`userId`がないため、マイグレーション戦略が必要
  - オプション1: 既存データをすべて削除（開発段階のみ推奨）
  - オプション2: デフォルトユーザーIDを設定
  - オプション3: 最初にログインしたユーザーに既存データを割り当て

## Success Criteria

- Google OAuth認証フローが正常に動作する
- ログインしたユーザーのみTODO操作が可能
- 各ユーザーは自分のTODOのみ閲覧・操作可能
- 他のユーザーのTODOにはアクセスできない
- JWTトークンの発行と検証が正常に動作する
- 未認証リクエストは適切に401エラーを返す
- Swagger UIで認証が必要なエンドポイントが明示される
