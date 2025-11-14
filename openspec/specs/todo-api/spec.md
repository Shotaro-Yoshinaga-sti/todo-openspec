# todo-api Specification

## Purpose
TBD - created by archiving change add-todo-backend-api. Update Purpose after archive.
## Requirements
### Requirement: TODO Creation

システムはTODOを作成する機能を提供しなければなりません(MUST)。

#### Scenario: 必須フィールドのみでTODO作成成功

- **WHEN** ユーザーが title と status を含む有効なTODOデータをPOSTする
- **THEN** システムは新しいTODOを作成し、201 Createdステータスとともに作成されたTODOを返す
- **AND** TODO IDは自動生成されたUUIDである
- **AND** createdAt と updatedAt は現在のタイムスタンプに設定される

#### Scenario: すべてのフィールドを含むTODO作成成功

- **WHEN** ユーザーが title, description, status, priority, dueDate を含む完全なTODOデータをPOSTする
- **THEN** システムは新しいTODOを作成し、201 Createdステータスとともに作成されたTODOを返す
- **AND** 全てのフィールドが正しく保存される

#### Scenario: 必須フィールドが欠けているTODO作成失敗

- **WHEN** ユーザーが title なしでTODOデータをPOSTする
- **THEN** システムは400 Bad Requestステータスとバリデーションエラーメッセージを返す

#### Scenario: 無効なステータス値でTODO作成失敗

- **WHEN** ユーザーが無効なstatus値（'pending', 'in-progress', 'completed'以外）でTODOデータをPOSTする
- **THEN** システムは400 Bad Requestステータスとバリデーションエラーメッセージを返す

### Requirement: TODO一覧取得

システムはTODO一覧を取得する機能を提供しなければなりません(MUST)。

#### Scenario: すべてのTODOを取得

- **WHEN** ユーザーがフィルタなしでGET /api/todosをリクエストする
- **THEN** システムはすべてのTODOを配列として返す
- **AND** レスポンスステータスは200 OKである

#### Scenario: ステータスでフィルタリング

- **WHEN** ユーザーが status='completed' クエリパラメータとともにGET /api/todosをリクエストする
- **THEN** システムはステータスが'completed'のTODOのみを返す

#### Scenario: 優先度でフィルタリング

- **WHEN** ユーザーが priority='high' クエリパラメータとともにGET /api/todosをリクエストする
- **THEN** システムは優先度が'high'のTODOのみを返す

#### Scenario: ソート順指定

- **WHEN** ユーザーが sortBy='dueDate' と order='asc' クエリパラメータとともにGET /api/todosをリクエストする
- **THEN** システムはTODOを期限の昇順でソートして返す

#### Scenario: TODOが存在しない場合

- **WHEN** ユーザーがGET /api/todosをリクエストし、TODOが1件も存在しない
- **THEN** システムは空の配列を返す
- **AND** レスポンスステータスは200 OKである

### Requirement: TODO詳細取得

システムは指定されたIDのTODO詳細を取得する機能を提供しなければなりません(MUST)。

#### Scenario: 存在するTODOの詳細取得成功

- **WHEN** ユーザーが有効なTODO IDでGET /api/todos/:idをリクエストする
- **THEN** システムは指定されたIDのTODO詳細を返す
- **AND** レスポンスステータスは200 OKである

#### Scenario: 存在しないTODOの詳細取得失敗

- **WHEN** ユーザーが存在しないTODO IDでGET /api/todos/:idをリクエストする
- **THEN** システムは404 Not Foundステータスとエラーメッセージを返す

#### Scenario: 無効なID形式での詳細取得失敗

- **WHEN** ユーザーが無効なID形式（UUID形式でない）でGET /api/todos/:idをリクエストする
- **THEN** システムは400 Bad Requestステータスとバリデーションエラーメッセージを返す

### Requirement: TODO更新

システムは既存のTODOを更新する機能を提供しなければなりません(MUST)。

#### Scenario: TODOの部分更新成功

- **WHEN** ユーザーが有効なTODO IDと更新データ（例: statusのみ）でPUT /api/todos/:idをリクエストする
- **THEN** システムは指定されたフィールドのみを更新する
- **AND** updatedAt は現在のタイムスタンプに更新される
- **AND** 更新されたTODOを200 OKステータスとともに返す

#### Scenario: TODOの完全更新成功

- **WHEN** ユーザーが有効なTODO IDとすべてのフィールドを含む更新データでPUT /api/todos/:idをリクエストする
- **THEN** システムはすべてのフィールドを更新する
- **AND** updatedAt は現在のタイムスタンプに更新される
- **AND** 更新されたTODOを200 OKステータスとともに返す

#### Scenario: 存在しないTODOの更新失敗

- **WHEN** ユーザーが存在しないTODO IDで更新をリクエストする
- **THEN** システムは404 Not Foundステータスとエラーメッセージを返す

#### Scenario: 無効なデータでの更新失敗

- **WHEN** ユーザーが無効なデータ（例: 無効なstatus値）で更新をリクエストする
- **THEN** システムは400 Bad Requestステータスとバリデーションエラーメッセージを返す

### Requirement: TODO削除

システムは既存のTODOを削除する機能を提供しなければなりません(MUST)。

#### Scenario: TODO削除成功

- **WHEN** ユーザーが有効なTODO IDでDELETE /api/todos/:idをリクエストする
- **THEN** システムは指定されたTODOを削除する
- **AND** 204 No Contentステータスを返す

#### Scenario: 存在しないTODOの削除失敗

- **WHEN** ユーザーが存在しないTODO IDで削除をリクエストする
- **THEN** システムは404 Not Foundステータスとエラーメッセージを返す

#### Scenario: 無効なID形式での削除失敗

- **WHEN** ユーザーが無効なID形式（UUID形式でない）でDELETE /api/todos/:idをリクエストする
- **THEN** システムは400 Bad Requestステータスとバリデーションエラーメッセージを返す

### Requirement: TODOデータモデル

システムは以下のフィールドを持つTODOデータモデルを定義しなければなりません(MUST)。

#### Scenario: TODOデータ構造の検証

- **WHEN** TODOが作成または取得される
- **THEN** TODOは以下のフィールドを含む:
  - `id`: string (UUID形式、自動生成)
  - `title`: string (必須、最大200文字)
  - `description`: string (オプション、最大2000文字)
  - `status`: 'pending' | 'in-progress' | 'completed' (必須)
  - `priority`: 'low' | 'medium' | 'high' (必須、デフォルト: 'medium')
  - `dueDate`: Date (オプション)
  - `createdAt`: Date (自動設定)
  - `updatedAt`: Date (自動更新)

### Requirement: エラーハンドリング

システムは統一されたエラーレスポンス形式を提供しなければなりません(MUST)。

#### Scenario: バリデーションエラーのレスポンス

- **WHEN** クライアントが無効なデータを送信する
- **THEN** システムは以下の形式でエラーレスポンスを返す:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": ["title should not be empty"],
    "statusCode": 400
  }
}
```

#### Scenario: リソース未検出エラーのレスポンス

- **WHEN** クライアントが存在しないリソースをリクエストする
- **THEN** システムは以下の形式でエラーレスポンスを返す:
```json
{
  "success": false,
  "error": {
    "code": "TODO_NOT_FOUND",
    "message": "TODO with id 'xxx' not found",
    "statusCode": 404
  }
}
```

#### Scenario: サーバーエラーのレスポンス

- **WHEN** 予期しないサーバーエラーが発生する
- **THEN** システムは以下の形式でエラーレスポンスを返す:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred",
    "statusCode": 500
  }
}
```

### Requirement: 成功レスポンス形式

システムは統一された成功レスポンス形式を提供しなければなりません(MUST)。

#### Scenario: 単一リソースの成功レスポンス

- **WHEN** クライアントが単一のTODOを作成、取得、または更新する
- **THEN** システムは以下の形式でレスポンスを返す:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Example TODO",
    ...
  }
}
```

#### Scenario: リソースリストの成功レスポンス

- **WHEN** クライアントがTODO一覧を取得する
- **THEN** システムは以下の形式でレスポンスを返す:
```json
{
  "success": true,
  "data": [
    { "id": "uuid1", "title": "TODO 1", ... },
    { "id": "uuid2", "title": "TODO 2", ... }
  ]
}
```

### Requirement: データ永続化

システムはAzure CosmosDBにTODOデータを永続化しなければなりません(MUST)。

#### Scenario: TODOの作成と永続化

- **WHEN** ユーザーがTODOを作成する
- **THEN** システムはCosmosDBにTODOを保存する
- **AND** 保存されたTODOは再起動後も取得可能である

#### Scenario: TODOの更新と永続化

- **WHEN** ユーザーがTODOを更新する
- **THEN** システムはCosmosDBの既存レコードを更新する
- **AND** updatedAtタイムスタンプが更新される

#### Scenario: TODOの削除と永続化

- **WHEN** ユーザーがTODOを削除する
- **THEN** システムはCosmosDBから該当レコードを完全に削除する
- **AND** 削除されたTODOは以降取得できない

### Requirement: API CORSサポート

システムはフロントエンドからのクロスオリジンリクエストをサポートしなければなりません(MUST)。

#### Scenario: フロントエンドからのリクエスト許可

- **WHEN** 許可されたオリジン（フロントエンドURL）からAPIリクエストがある
- **THEN** システムはCORSヘッダーを含めてレスポンスを返す
- **AND** リクエストは正常に処理される

#### Scenario: 未許可のオリジンからのリクエスト拒否

- **WHEN** 許可されていないオリジンからAPIリクエストがある
- **THEN** システムはCORSエラーを返す
- **AND** リクエストは処理されない

