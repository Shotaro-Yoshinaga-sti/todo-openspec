# user-management Specification Delta

## ADDED Requirements

### Requirement: ユーザーデータモデル

システムはユーザー情報を管理するUserエンティティを定義しなければなりません(MUST)。

#### Scenario: Userエンティティの構造検証

- **WHEN** Userレコードが作成または取得される
- **THEN** Userは以下のフィールドを含む:
  - `id`: string (UUID形式、自動生成)
  - `email`: string (必須、Google アカウントメール)
  - `name`: string (必須、表示名)
  - `googleId`: string (必須、ユニーク、Google ユーザーID)
  - `totpSecret`: string (オプション、暗号化済みTOTP秘密鍵)
  - `twoFactorEnabled`: boolean (必須、デフォルト: false)
  - `twoFactorSetupComplete`: boolean (必須、デフォルト: false)
  - `createdAt`: Date (自動設定)
  - `updatedAt`: Date (自動更新)

### Requirement: ユーザー作成

システムは新規ユーザーを作成する機能を提供しなければなりません(MUST)。

#### Scenario: Google OAuthでの初回ユーザー作成

- **WHEN** 新規ユーザーがGoogle OAuthで認証する
- **AND** googleIdが既存ユーザーと一致しない
- **THEN** システムは新しいUserレコードを作成する
- **AND** email, name, googleIdがGoogle プロフィールから設定される
- **AND** twoFactorEnabledはfalseに設定される
- **AND** twoFactorSetupCompleteはfalseに設定される
- **AND** createdAtとupdatedAtは現在のタイムスタンプに設定される

#### Scenario: 既存ユーザーの重複作成防止

- **WHEN** 既存のgoogleIdでユーザーを作成しようとする
- **THEN** システムは既存ユーザーを返す
- **AND** 新しいレコードは作成されない

### Requirement: ユーザー情報取得

システムは認証済みユーザーの情報を取得する機能を提供しなければなりません(MUST)。

#### Scenario: 現在のユーザー情報取得

- **WHEN** 認証済みユーザーがGET /api/users/meをリクエストする
- **THEN** システムは現在のユーザー情報を返す
- **AND** レスポンスステータスは200 OKである
- **AND** 返されるデータにtotpSecretは含まれない（セキュリティ）

#### Scenario: 未認証ユーザーの情報取得拒否

- **WHEN** 未認証ユーザーがGET /api/users/meをリクエストする
- **THEN** システムは401 Unauthorizedエラーを返す

### Requirement: ユーザー情報更新

システムは認証済みユーザーの情報を更新する機能を提供しなければなりません(MUST)。

#### Scenario: ユーザー名の更新

- **WHEN** 認証済みユーザーがPUT /api/users/meでnameを更新する
- **THEN** システムはユーザーのnameを更新する
- **AND** updatedAtは現在のタイムスタンプに更新される
- **AND** 更新されたユーザー情報を200 OKで返す

#### Scenario: 保護されたフィールドの更新拒否

- **WHEN** ユーザーがgoogleId, totpSecret, twoFactorEnabledを更新しようとする
- **THEN** システムは400 Bad Requestエラーを返す
- **AND** エラーメッセージは"Cannot update protected fields"である

### Requirement: ユーザー検索

システムはgoogleIdまたはemailでユーザーを検索する機能を提供しなければなりません(MUST)。

#### Scenario: googleIdでユーザー検索成功

- **WHEN** システムがgoogleIdでユーザーを検索する
- **AND** 一致するユーザーが存在する
- **THEN** システムは該当ユーザーを返す

#### Scenario: googleIdでユーザー検索失敗

- **WHEN** システムがgoogleIdでユーザーを検索する
- **AND** 一致するユーザーが存在しない
- **THEN** システムはnullを返す

#### Scenario: emailでユーザー検索成功

- **WHEN** システムがemailでユーザーを検索する
- **AND** 一致するユーザーが存在する
- **THEN** システムは該当ユーザーを返す

### Requirement: データ永続化

システムはユーザーデータをCosmosDBに永続化しなければなりません(MUST)。

#### Scenario: ユーザーの作成と永続化

- **WHEN** 新規ユーザーが作成される
- **THEN** システムはCosmosDBにUserレコードを保存する
- **AND** 保存されたユーザーは再起動後も取得可能である

#### Scenario: ユーザー情報の更新と永続化

- **WHEN** ユーザー情報が更新される
- **THEN** システムはCosmosDBの既存レコードを更新する
- **AND** updatedAtタイムスタンプが更新される
