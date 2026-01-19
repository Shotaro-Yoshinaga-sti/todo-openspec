# user-auth Specification Delta

## ADDED Requirements

### Requirement: Google OAuth認証

システムはGoogle OAuthを使用してユーザー認証を提供しなければなりません(MUST)。

#### Scenario: Google OAuth認証成功

- **WHEN** ユーザーがGET /api/auth/googleにアクセスする
- **THEN** システムはGoogle OAuth同意画面にリダイレクトする
- **AND** ユーザーがGoogleアカウントで認証を許可する
- **AND** システムはコールバックURLにリダイレクトされる
- **AND** 一時JWTトークンが発行される（2FA未完了）

#### Scenario: 初回ログイン時のユーザー自動作成

- **WHEN** 新規ユーザーがGoogle OAuthで認証する
- **THEN** システムは新しいUserレコードを自動作成する
- **AND** ユーザー情報（email, name, googleId）が保存される
- **AND** twoFactorSetupCompleteはfalseに設定される

#### Scenario: 既存ユーザーのログイン

- **WHEN** 既存ユーザーがGoogle OAuthで認証する
- **THEN** システムはgoogleIdで既存ユーザーを検索する
- **AND** ユーザー情報が取得される
- **AND** 一時JWTトークンが発行される

#### Scenario: Google OAuth認証失敗

- **WHEN** ユーザーがGoogle OAuth同意画面で拒否する
- **THEN** システムは認証エラーを返す
- **AND** ユーザーはログインページにリダイレクトされる

### Requirement: 二要素認証フロー

システムは二要素認証を必須としなければなりません(MUST)。

#### Scenario: 初回ログイン時の2FAセットアップ誘導

- **WHEN** 新規ユーザーがGoogle OAuth認証に成功する
- **AND** twoFactorSetupCompleteがfalseである
- **THEN** システムは2FAセットアップ画面にリダイレクトする
- **AND** 一時トークン（有効期限10分）が返される

#### Scenario: 2回目以降のログイン時のTOTP検証

- **WHEN** 既存ユーザーがGoogle OAuth認証に成功する
- **AND** twoFactorSetupCompleteがtrueである
- **THEN** システムはTOTP検証画面にリダイレクトする
- **AND** 一時トークン（有効期限10分）が返される

#### Scenario: 2FA検証成功後の本トークン発行

- **WHEN** ユーザーが正しいTOTPコードを入力する
- **THEN** システムはTOTPコードを検証する
- **AND** 検証成功時、本JWTトークン（有効期限7日）を発行する
- **AND** ユーザーは完全に認証された状態になる

#### Scenario: 2FA検証なしでのAPI保護

- **WHEN** ユーザーが一時トークンで保護されたAPIにアクセスする
- **AND** twoFactorVerifiedフラグがfalseである
- **THEN** システムは401 Unauthorizedエラーを返す
- **AND** エラーメッセージは"Two-factor authentication required"である

### Requirement: JWTトークン管理

システムはJWTトークンを使用してセッション管理を行わなければなりません(MUST)。

#### Scenario: 一時トークンの発行

- **WHEN** ユーザーがGoogle OAuth認証に成功する
- **AND** 2FA検証がまだ完了していない
- **THEN** システムは以下を含む一時JWTトークンを発行する:
  - sub: userId
  - email: user.email
  - twoFactorVerified: false
  - exp: 10分後

#### Scenario: 本トークンの発行

- **WHEN** ユーザーが2FA検証に成功する
- **THEN** システムは以下を含む本JWTトークンを発行する:
  - sub: userId
  - email: user.email
  - twoFactorVerified: true
  - exp: 7日後

#### Scenario: トークンの検証

- **WHEN** ユーザーが保護されたエンドポイントにアクセスする
- **AND** Authorizationヘッダーに有効なJWTトークンが含まれる
- **THEN** システムはトークンを検証する
- **AND** ペイロードからユーザー情報を抽出する
- **AND** リクエストを処理する

#### Scenario: 無効なトークンでのアクセス拒否

- **WHEN** ユーザーが無効または期限切れのトークンでアクセスする
- **THEN** システムは401 Unauthorizedエラーを返す
- **AND** エラーメッセージは"Invalid or expired token"である

### Requirement: ログアウト

システムはログアウト機能を提供しなければなりません(MUST)。

#### Scenario: ログアウト成功

- **WHEN** 認証済みユーザーがPOST /api/auth/logoutをリクエストする
- **THEN** システムは200 OKを返す
- **AND** フロントエンドはトークンを削除する必要がある

#### Scenario: トークンなしでのログアウト

- **WHEN** 未認証ユーザーがPOST /api/auth/logoutをリクエストする
- **THEN** システムは401 Unauthorizedエラーを返す
