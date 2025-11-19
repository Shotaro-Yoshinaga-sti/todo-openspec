# Spec Delta: user-management

## MODIFIED Requirements

### Requirement: ユーザーエンティティ

システムはユーザー情報を管理するためのUserエンティティを定義しなければなりません(MUST)。

#### Scenario: Userエンティティのデータ構造（2FAフィールド追加）

- **WHEN** ユーザーが作成または取得される
- **THEN** Userエンティティは以下のフィールドを含む:
  - `id`: string (UUID形式、自動生成、プライマリキー)
  - `googleId`: string (Google OAuth ID、ユニーク制約)
  - `email`: string (メールアドレス、ユニーク制約)
  - `name`: string (表示名)
  - `picture`: string | undefined (プロフィール画像URL、オプション)
  - `createdAt`: Date (アカウント作成日時、自動設定)
  - `updatedAt`: Date (最終更新日時、自動更新)
  - **`totpSecret`: string | undefined** (TOTP秘密鍵、暗号化、オプション) ← **追加**
  - **`twoFactorEnabled`: boolean** (2FA有効フラグ、デフォルト: true) ← **追加**
  - **`twoFactorSetupComplete`: boolean** (2FAセットアップ完了フラグ、デフォルト: false) ← **追加**
  - **`totpSetupDate`: Date | undefined** (2FAセットアップ日時、オプション) ← **追加**
  - **`totpLastVerified`: Date | undefined** (最終2FA検証日時、オプション) ← **追加**

## ADDED Requirements

### Requirement: TOTP秘密鍵の管理

システムは各ユーザーのTOTP秘密鍵を安全に管理しなければなりません(MUST)。

#### Scenario: TOTP秘密鍵の保存

- **WHEN** ユーザーが2FAセットアップを開始する
- **THEN** システムはTOTP秘密鍵を生成する
- **AND** 秘密鍵をAES-256-GCMで暗号化する
- **AND** 暗号化された秘密鍵を`totpSecret`フィールドに保存する
- **AND** 平文の秘密鍵はデータベースに保存しない

#### Scenario: TOTP秘密鍵の取得

- **WHEN** システムがTOTP検証のために秘密鍵が必要になる
- **THEN** CosmosDBから`totpSecret`フィールドを取得する
- **AND** 環境変数の暗号化キーを使用して復号化する
- **AND** 復号化した秘密鍵をメモリ上でのみ使用する

### Requirement: 2FA設定状態の管理

システムは各ユーザーの2FA設定状態を管理しなければなりません(MUST)。

#### Scenario: 2FAセットアップ完了時の状態更新

- **WHEN** ユーザーが2FAセットアップを完了する（初回TOTP検証成功）
- **THEN** `twoFactorSetupComplete`をtrueに更新する
- **AND** `totpSetupDate`を現在時刻に設定する
- **AND** `twoFactorEnabled`をtrueに設定する（既にtrueの場合は変更なし）

#### Scenario: TOTP検証成功時の状態更新

- **WHEN** ユーザーがログイン時のTOTP検証に成功する
- **THEN** `totpLastVerified`を現在時刻に更新する

#### Scenario: 2FA状態の確認

- **WHEN** システムがユーザーの2FA状態を確認する
- **THEN** `twoFactorEnabled`がtrueかつ`twoFactorSetupComplete`がtrueの場合、2FA必須とする
- **AND** `twoFactorSetupComplete`がfalseの場合、セットアップが必要とする

### Requirement: ユーザー情報のレスポンス形式

システムはユーザー情報を返す際、一貫した形式を使用しなければなりません(MUST)。

#### Scenario: ユーザー情報の成功レスポンス（2FA情報含む）

- **WHEN** クライアントがユーザー情報を取得する（例: /api/auth/me）
- **THEN** システムは以下の形式でレスポンスを返す:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "picture": "https://example.com/picture.jpg",
      "createdAt": "2024-01-01T00:00:00Z",
      "twoFactorEnabled": true,
      "twoFactorSetupComplete": true
    }
  }
  ```
- **NOTE**: `totpSecret`、`totpSetupDate`、`totpLastVerified`はセキュリティ上、クライアントに返さない
