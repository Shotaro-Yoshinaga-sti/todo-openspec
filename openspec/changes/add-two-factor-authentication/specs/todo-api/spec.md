# todo-api Specification Delta

## MODIFIED Requirements

### Requirement: TODO Creation

システムはTODOを作成する機能を提供しなければなりません(MUST)。

#### Scenario: 認証が必要

- **WHEN** 未認証ユーザーがTODO作成をリクエストする
- **THEN** システムは401 Unauthorizedエラーを返す
- **AND** エラーメッセージは"Authentication required"である

#### Scenario: 認証済みユーザーがTODOを作成

- **WHEN** 認証済みユーザーがtitleとstatusを含む有効なTODOデータをPOSTする
- **THEN** システムは新しいTODOを作成する
- **AND** userIdは認証済みユーザーのIDに自動設定される
- **AND** 201 Createdステータスとともに作成されたTODOを返す

### Requirement: TODO一覧取得

システムはTODO一覧を取得する機能を提供しなければなりません(MUST)。

#### Scenario: 認証が必要

- **WHEN** 未認証ユーザーがTODO一覧取得をリクエストする
- **THEN** システムは401 Unauthorizedエラーを返す

#### Scenario: 認証済みユーザーのTODOのみ取得

- **WHEN** 認証済みユーザーがGET /api/todosをリクエストする
- **THEN** システムは認証済みユーザーのTODOのみを返す
- **AND** 他のユーザーのTODOは含まれない
- **AND** レスポンスステータスは200 OKである

#### Scenario: ユーザーIDでフィルタリング

- **WHEN** 認証済みユーザーがGET /api/todosをリクエストする
- **THEN** システムは内部的にuserId = 認証済みユーザーIDでフィルタリングする
- **AND** ユーザーはuserIdクエリパラメータを指定できない（自動フィルタ）

### Requirement: TODO詳細取得

システムは指定されたIDのTODO詳細を取得する機能を提供しなければなりません(MUST)。

#### Scenario: 認証が必要

- **WHEN** 未認証ユーザーがTODO詳細取得をリクエストする
- **THEN** システムは401 Unauthorizedエラーを返す

#### Scenario: 他ユーザーのTODOアクセス拒否

- **WHEN** 認証済みユーザーが他ユーザーのTODO IDでGET /api/todos/:idをリクエストする
- **THEN** システムは404 Not Foundエラーを返す
- **AND** エラーメッセージは"TODO with id 'xxx' not found"である
- **AND** TODOの存在を漏らさない（セキュリティ）

#### Scenario: 自分のTODO詳細取得成功

- **WHEN** 認証済みユーザーが自分のTODO IDでGET /api/todos/:idをリクエストする
- **THEN** システムは指定されたIDのTODO詳細を返す
- **AND** レスポンスステータスは200 OKである

### Requirement: TODO更新

システムは既存のTODOを更新する機能を提供しなければなりません(MUST)。

#### Scenario: 認証が必要

- **WHEN** 未認証ユーザーがTODO更新をリクエストする
- **THEN** システムは401 Unauthorizedエラーを返す

#### Scenario: 他ユーザーのTODO更新拒否

- **WHEN** 認証済みユーザーが他ユーザーのTODO IDでPUT /api/todos/:idをリクエストする
- **THEN** システムは404 Not Foundエラーを返す
- **AND** 更新は実行されない

#### Scenario: 自分のTODO更新成功

- **WHEN** 認証済みユーザーが自分のTODO IDと更新データでPUT /api/todos/:idをリクエストする
- **THEN** システムは指定されたフィールドを更新する
- **AND** updatedAtは現在のタイムスタンプに更新される
- **AND** 更新されたTODOを200 OKステータスとともに返す

#### Scenario: userIdフィールドの更新禁止

- **WHEN** ユーザーがuserIdを更新しようとする
- **THEN** システムは400 Bad Requestエラーを返す
- **AND** エラーメッセージは"Cannot update userId field"である

### Requirement: TODO削除

システムは既存のTODOを削除する機能を提供しなければなりません(MUST)。

#### Scenario: 認証が必要

- **WHEN** 未認証ユーザーがTODO削除をリクエストする
- **THEN** システムは401 Unauthorizedエラーを返す

#### Scenario: 他ユーザーのTODO削除拒否

- **WHEN** 認証済みユーザーが他ユーザーのTODO IDでDELETE /api/todos/:idをリクエストする
- **THEN** システムは404 Not Foundエラーを返す
- **AND** 削除は実行されない

#### Scenario: 自分のTODO削除成功

- **WHEN** 認証済みユーザーが自分のTODO IDでDELETE /api/todos/:idをリクエストする
- **THEN** システムは指定されたTODOを削除する
- **AND** 204 No Contentステータスを返す

### Requirement: TODOデータモデル

システムは以下のフィールドを持つTODOデータモデルを定義しなければなりません(MUST)。

#### Scenario: TODOデータ構造の検証

- **WHEN** TODOが作成または取得される
- **THEN** TODOは以下のフィールドを含む:
  - `id`: string (UUID形式、自動生成)
  - `userId`: string (UUID形式、必須、認証済みユーザーID) ← **追加**
  - `title`: string (必須、最大200文字)
  - `description`: string (オプション、最大2000文字)
  - `status`: 'pending' | 'in-progress' | 'completed' (必須)
  - `priority`: 'low' | 'medium' | 'high' (必須、デフォルト: 'medium')
  - `dueDate`: Date (オプション)
  - `createdAt`: Date (自動設定)
  - `updatedAt`: Date (自動更新)

## ADDED Requirements

### Requirement: TODO認証要件

すべてのTODO APIエンドポイントは認証を必要とします(MUST)。

#### Scenario: JWTトークン検証

- **WHEN** ユーザーがTODO APIエンドポイントにアクセスする
- **THEN** システムはAuthorizationヘッダーからJWTトークンを検証する
- **AND** トークンが有効な場合のみリクエストを処理する
- **AND** トークンが無効または存在しない場合は401 Unauthorizedを返す

#### Scenario: 2FA検証済み要件

- **WHEN** ユーザーがTODO APIエンドポイントにアクセスする
- **AND** JWTトークンのtwoFactorVerifiedがfalseである
- **THEN** システムは403 Forbiddenエラーを返す
- **AND** エラーメッセージは"Two-factor authentication required"である

### Requirement: データ分離

システムはユーザーごとにTODOデータを完全に分離しなければなりません(MUST)。

#### Scenario: ユーザーデータの自動フィルタリング

- **WHEN** ユーザーがTODO一覧を取得する
- **THEN** システムは認証済みユーザーのuserIdでフィルタリングする
- **AND** 他のユーザーのTODOは返されない

#### Scenario: クロスユーザーアクセスの防止

- **WHEN** ユーザーAが存在するTODO IDでリクエストする
- **AND** そのTODOのuserIdがユーザーAのIDと一致しない
- **THEN** システムは404 Not Foundエラーを返す
- **AND** TODOの存在を明かさない（情報漏洩防止）
