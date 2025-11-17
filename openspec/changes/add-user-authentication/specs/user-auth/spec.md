# Spec Delta: user-auth

## ADDED Requirements

### Requirement: Google OAuth認証

システムはGoogle OAuth 2.0を使用したユーザー認証機能を提供しなければなりません(MUST)。

#### Scenario: Google OAuth認証フローの開始

- **WHEN** ユーザーがGET /api/auth/googleにアクセスする
- **THEN** システムはGoogle OAuth認証画面にリダイレクトする
- **AND** リダイレクトURLには適切なclient_id, redirect_uri, scopeパラメータが含まれる
- **AND** scopeには最低限'profile'と'email'が含まれる

#### Scenario: Google OAuth認証成功

- **WHEN** ユーザーがGoogle認証画面で承認し、コールバックURL（/api/auth/google/callback）にリダイレクトされる
- **AND** 認可コードが正常に取得される
- **THEN** システムはGoogle APIからユーザー情報（googleId, email, name, picture）を取得する
- **AND** システムはユーザー情報をデータベースに保存（新規ユーザー）または取得（既存ユーザー）する
- **AND** システムはJWTトークンを生成する
- **AND** システムはフロントエンドにリダイレクトし、トークンをクエリパラメータまたはCookieで渡す

#### Scenario: Google OAuth認証失敗

- **WHEN** ユーザーがGoogle認証画面で拒否する
- **OR** 認可コードの交換に失敗する
- **THEN** システムはエラーメッセージとともにフロントエンドのエラーページにリダイレクトする
- **AND** エラーの詳細をログに記録する

#### Scenario: 無効なGoogle Client設定

- **WHEN** GOOGLE_CLIENT_IDまたはGOOGLE_CLIENT_SECRETが設定されていない
- **THEN** システムはアプリケーション起動時にエラーを出力する
- **AND** 認証エンドポイントにアクセスすると500 Internal Server Errorを返す

### Requirement: JWTトークン発行

システムは認証成功時にJWT（JSON Web Token）を発行しなければなりません(MUST)。

#### Scenario: JWTトークン生成

- **WHEN** ユーザーがGoogle OAuth認証に成功する
- **THEN** システムは以下の情報を含むJWTトークンを生成する:
  - `sub`: ユーザーID（UUID）
  - `email`: ユーザーのメールアドレス
  - `iat`: 発行時刻（UNIX timestamp）
  - `exp`: 有効期限（UNIX timestamp）
- **AND** トークンはJWT_SECRETで署名される
- **AND** 有効期限はJWT_EXPIRES_IN環境変数で指定された期間（デフォルト: 1時間）

#### Scenario: JWTトークンの返却

- **WHEN** JWTトークンが正常に生成される
- **THEN** システムはトークンをクライアントに返す
- **AND** 返却方法はクエリパラメータ（?token=xxx）またはCookieのいずれか

#### Scenario: JWT Secret未設定

- **WHEN** JWT_SECRET環境変数が設定されていない
- **THEN** システムはアプリケーション起動時にエラーを出力する
- **AND** トークン生成を試みると500 Internal Server Errorを返す

### Requirement: JWTトークン検証

システムはAPIリクエストごとにJWTトークンを検証しなければなりません(MUST)。

#### Scenario: 有効なJWTトークンでのリクエスト

- **WHEN** クライアントが`Authorization: Bearer <valid-token>`ヘッダーとともにAPIリクエストを送信する
- **THEN** システムはトークンの署名を検証する
- **AND** トークンの有効期限を確認する
- **AND** トークンが有効な場合、ペイロードからユーザー情報（userId, email）を抽出する
- **AND** ユーザー情報をリクエストコンテキスト（req.user）に注入する
- **AND** リクエストを処理する

#### Scenario: 無効なJWTトークンでのリクエスト

- **WHEN** クライアントが無効な署名を持つトークンでAPIリクエストを送信する
- **OR** トークンの形式が不正である
- **THEN** システムは401 Unauthorizedステータスを返す
- **AND** エラーメッセージは`{"success": false, "error": {"code": "UNAUTHORIZED", "message": "Invalid token", "statusCode": 401}}`の形式

#### Scenario: 有効期限切れトークンでのリクエスト

- **WHEN** クライアントが有効期限切れのトークンでAPIリクエストを送信する
- **THEN** システムは401 Unauthorizedステータスを返す
- **AND** エラーメッセージは`{"success": false, "error": {"code": "TOKEN_EXPIRED", "message": "Token has expired", "statusCode": 401}}`の形式

#### Scenario: トークン未提供でのリクエスト

- **WHEN** クライアントがAuthorizationヘッダーなしで保護されたAPIエンドポイントにリクエストを送信する
- **THEN** システムは401 Unauthorizedステータスを返す
- **AND** エラーメッセージは`{"success": false, "error": {"code": "UNAUTHORIZED", "message": "No token provided", "statusCode": 401}}`の形式

### Requirement: 認証状態確認

システムは現在のログインユーザー情報を取得するエンドポイントを提供しなければなりません(MUST)。

#### Scenario: ログインユーザー情報取得成功

- **WHEN** 認証済みユーザーがGET /api/auth/meをリクエストする
- **THEN** システムは現在のユーザー情報を返す:
  ```json
  {
    "success": true,
    "data": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "User Name",
      "picture": "https://example.com/picture.jpg",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
  ```
- **AND** レスポンスステータスは200 OK

#### Scenario: 未認証でのユーザー情報取得失敗

- **WHEN** 未認証ユーザーがGET /api/auth/meをリクエストする
- **THEN** システムは401 Unauthorizedステータスを返す
- **AND** エラーメッセージは認証エラーの標準形式

### Requirement: ログアウト

システムはログアウト機能を提供しなければなりません(MUST)。

#### Scenario: ログアウト成功

- **WHEN** 認証済みユーザーがPOST /api/auth/logoutをリクエストする
- **THEN** システムは成功レスポンスを返す:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```
- **AND** レスポンスステータスは200 OK
- **NOTE**: JWTはステートレスなため、実際のトークン無効化はクライアント側で行う

#### Scenario: 未認証でのログアウト

- **WHEN** 未認証ユーザーがPOST /api/auth/logoutをリクエストする
- **THEN** システムは401 Unauthorizedステータスを返す

### Requirement: 認証エラーハンドリング

システムは認証関連のエラーを統一された形式で返さなければなりません(MUST)。

#### Scenario: 認証エラーのレスポンス形式

- **WHEN** 認証関連のエラーが発生する
- **THEN** システムは以下の形式でエラーレスポンスを返す:
  ```json
  {
    "success": false,
    "error": {
      "code": "UNAUTHORIZED" | "TOKEN_EXPIRED" | "INVALID_TOKEN",
      "message": "Human-readable error message",
      "statusCode": 401
    }
  }
  ```
- **AND** HTTPステータスコードは401 Unauthorized

### Requirement: CORS設定

システムは認証情報を含むクロスオリジンリクエストをサポートしなければなりません(MUST)。

#### Scenario: 認証情報を含むCORSリクエスト

- **WHEN** 許可されたオリジン（フロントエンドURL）から認証情報を含むリクエストがある
- **THEN** システムはCORSヘッダーを適切に設定する:
  - `Access-Control-Allow-Origin`: フロントエンドのURL
  - `Access-Control-Allow-Credentials`: true
  - `Access-Control-Allow-Headers`: Content-Type, Authorization
  - `Access-Control-Allow-Methods`: GET, POST, PUT, DELETE
- **AND** リクエストは正常に処理される

#### Scenario: 未許可のオリジンからのリクエスト

- **WHEN** 許可されていないオリジンからリクエストがある
- **THEN** システムはCORSエラーを返す
- **AND** リクエストは処理されない

### Requirement: Swagger認証ドキュメント

システムはSwagger UIで認証が必要なエンドポイントを明示しなければなりません(MUST)。

#### Scenario: Swagger UIでの認証設定表示

- **WHEN** 開発者がSwagger UI（/api/docs）にアクセスする
- **THEN** 認証が必要なエンドポイントには鍵アイコンが表示される
- **AND** 「Authorize」ボタンが表示され、JWTトークンを入力できる
- **AND** トークンを設定後、認証が必要なエンドポイントのテストが可能

#### Scenario: 認証エンドポイントのドキュメント

- **WHEN** 開発者がSwagger UIで認証エンドポイントを参照する
- **THEN** `/auth/google`, `/auth/google/callback`, `/auth/me`, `/auth/logout`のドキュメントが表示される
- **AND** 各エンドポイントの説明、リクエスト形式、レスポンス形式が明記される
