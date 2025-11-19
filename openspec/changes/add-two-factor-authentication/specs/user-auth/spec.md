# Spec Delta: user-auth

## MODIFIED Requirements

### Requirement: Google OAuth認証

システムはGoogle OAuth 2.0を使用したユーザー認証機能を提供しなければなりません(MUST)。

#### Scenario: Google OAuth認証成功後の2FA確認

- **WHEN** ユーザーがGoogle認証画面で承認し、コールバックURL（/api/auth/google/callback）にリダイレクトされる
- **AND** 認可コードが正常に取得される
- **THEN** システムはGoogle APIからユーザー情報（googleId, email, name, picture）を取得する
- **AND** システムはユーザー情報をデータベースに保存（新規ユーザー）または取得（既存ユーザー）する
- **AND** システムはユーザーの2FAセットアップ状態を確認する
- **AND** `twoFactorSetupComplete`がfalseの場合、一時トークンを発行して2FAセットアップページにリダイレクトする
- **AND** `twoFactorSetupComplete`がtrueの場合、一時トークンを発行して2FA検証ページにリダイレクトする
- **AND** 完全なJWTトークンは2FA検証後のみ発行される

### Requirement: JWTトークン発行

システムは認証成功時にJWT（JSON Web Token）を発行しなければなりません(MUST)。

#### Scenario: 2FA検証前の一時トークン発行

- **WHEN** ユーザーがGoogle OAuth認証に成功する
- **THEN** システムは以下の情報を含む一時トークンを生成する:
  - `sub`: ユーザーID（UUID）
  - `email`: ユーザーのメールアドレス
  - `requiresTwoFactor`: true
  - `iat`: 発行時刻（UNIX timestamp）
  - `exp`: 有効期限（発行時刻 + 5分）
- **AND** トークンはJWT_SECRETで署名される
- **AND** 一時トークンでは保護されたリソースにアクセスできない

#### Scenario: 2FA検証後の完全なJWTトークン発行

- **WHEN** ユーザーが2FA検証に成功する
- **THEN** システムは以下の情報を含む完全なJWTトークンを生成する:
  - `sub`: ユーザーID（UUID）
  - `email`: ユーザーのメールアドレス
  - `twoFactorVerified`: true
  - `iat`: 発行時刻（UNIX timestamp）
  - `exp`: 有効期限（JWT_EXPIRES_INで指定された期間、デフォルト: 1時間）
- **AND** トークンはJWT_SECRETで署名される
- **AND** 完全なトークンでTODO APIへのアクセスが可能

## ADDED Requirements

### Requirement: 2FA必須化

システムはすべてのユーザーに対して2FAを必須化しなければなりません(MUST)。

#### Scenario: 新規ユーザーの2FA強制

- **WHEN** 新規ユーザーが初めてGoogle OAuth認証を完了する
- **THEN** システムは`twoFactorEnabled`をtrueに設定する
- **AND** `twoFactorSetupComplete`をfalseに設定する
- **AND** 2FAセットアップページへのリダイレクトを返す

#### Scenario: 既存ユーザーの2FA必須化

- **WHEN** 2FA未設定の既存ユーザーがログインする
- **THEN** システムは`twoFactorEnabled`をtrueに更新する
- **AND** 2FAセットアップページへのリダイレクトを返す
- **AND** セットアップ完了まで完全なJWTトークンは発行しない
