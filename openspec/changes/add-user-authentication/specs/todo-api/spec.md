# Spec Delta: todo-api

## MODIFIED Requirements

### Requirement: TODO Creation

システムはTODOを作成する機能を提供しなければなりません(MUST)。

#### Scenario: 認証済みユーザーによるTODO作成成功

- **WHEN** 認証済みユーザーが title と status を含む有効なTODOデータをPOSTする
- **AND** 有効なJWTトークンがAuthorizationヘッダーに含まれる
- **THEN** システムは新しいTODOを作成し、201 Createdステータスとともに作成されたTODOを返す
- **AND** TODO IDは自動生成されたUUIDである
- **AND** userIdは認証されたユーザーのIDに自動設定される
- **AND** createdAt と updatedAt は現在のタイムスタンプに設定される

#### Scenario: 未認証ユーザーによるTODO作成失敗

- **WHEN** 未認証ユーザーがTODO作成をリクエストする
- **OR** 無効なJWTトークンが提供される
- **THEN** システムは401 Unauthorizedステータスを返す
- **AND** TODOは作成されない

#### Scenario: ユーザーが明示的にuserIdを指定できない

- **WHEN** ユーザーがリクエストボディに`userId`フィールドを含める
- **THEN** システムは`userId`フィールドを無視する
- **AND** 認証されたユーザーのIDを自動的に設定する

### Requirement: TODO一覧取得

システムはTODO一覧を取得する機能を提供しなければなりません(MUST)。

#### Scenario: 認証済みユーザー自身のTODOのみ取得

- **WHEN** 認証済みユーザーがGET /api/todosをリクエストする
- **THEN** システムは該当ユーザーのTODOのみを配列として返す
- **AND** 他のユーザーのTODOは含まれない
- **AND** レスポンスステータスは200 OK

#### Scenario: 未認証ユーザーによるTODO一覧取得失敗

- **WHEN** 未認証ユーザーがGET /api/todosをリクエストする
- **THEN** システムは401 Unauthorizedステータスを返す
- **AND** TODOデータは返されない

#### Scenario: フィルタリング時もユーザー自身のTODOのみ対象

- **WHEN** 認証済みユーザーが status='completed' クエリパラメータとともにGET /api/todosをリクエストする
- **THEN** システムは該当ユーザーのTODOで、かつステータスが'completed'のもののみを返す
- **AND** 他のユーザーのTODOは含まれない

### Requirement: TODO詳細取得

システムは指定されたIDのTODO詳細を取得する機能を提供しなければなりません(MUST)。

#### Scenario: 認証済みユーザー自身のTODO詳細取得成功

- **WHEN** 認証済みユーザーが自分のTODO IDでGET /api/todos/:idをリクエストする
- **THEN** システムは指定されたIDのTODO詳細を返す
- **AND** レスポンスステータスは200 OK

#### Scenario: 他ユーザーのTODO詳細取得失敗

- **WHEN** 認証済みユーザーが他のユーザーのTODO IDでGET /api/todos/:idをリクエストする
- **THEN** システムは404 Not Foundステータスを返す
- **AND** エラーメッセージは`TODO with id 'xxx' not found`

#### Scenario: 未認証ユーザーによるTODO詳細取得失敗

- **WHEN** 未認証ユーザーがGET /api/todos/:idをリクエストする
- **THEN** システムは401 Unauthorizedステータスを返す

### Requirement: TODO更新

システムは既存のTODOを更新する機能を提供しなければなりません(MUST)。

#### Scenario: 認証済みユーザー自身のTODO更新成功

- **WHEN** 認証済みユーザーが自分のTODO IDと更新データでPUT /api/todos/:idをリクエストする
- **THEN** システムは指定されたフィールドのみを更新する
- **AND** updatedAt は現在のタイムスタンプに更新される
- **AND** userIdは変更されない（更新対象外）
- **AND** 更新されたTODOを200 OKステータスとともに返す

#### Scenario: 他ユーザーのTODO更新失敗

- **WHEN** 認証済みユーザーが他のユーザーのTODO IDで更新をリクエストする
- **THEN** システムは404 Not Foundステータスを返す
- **AND** TODOは更新されない

#### Scenario: 未認証ユーザーによるTODO更新失敗

- **WHEN** 未認証ユーザーがTODO更新をリクエストする
- **THEN** システムは401 Unauthorizedステータスを返す

#### Scenario: userIdの更新試行は無視される

- **WHEN** ユーザーが更新データに`userId`フィールドを含める
- **THEN** システムは`userId`フィールドを無視する
- **AND** userIdは変更されない

### Requirement: TODO削除

システムは既存のTODOを削除する機能を提供しなければなりません(MUST)。

#### Scenario: 認証済みユーザー自身のTODO削除成功

- **WHEN** 認証済みユーザーが自分のTODO IDでDELETE /api/todos/:idをリクエストする
- **THEN** システムは指定されたTODOを削除する
- **AND** 204 No Contentステータスを返す

#### Scenario: 他ユーザーのTODO削除失敗

- **WHEN** 認証済みユーザーが他のユーザーのTODO IDで削除をリクエストする
- **THEN** システムは404 Not Foundステータスを返す
- **AND** TODOは削除されない

#### Scenario: 未認証ユーザーによるTODO削除失敗

- **WHEN** 未認証ユーザーがTODO削除をリクエストする
- **THEN** システムは401 Unauthorizedステータスを返す

### Requirement: TODOデータモデル

システムは以下のフィールドを持つTODOデータモデルを定義しなければなりません(MUST)。

#### Scenario: TODOデータ構造の検証（userIdフィールド追加）

- **WHEN** TODOが作成または取得される
- **THEN** TODOは以下のフィールドを含む:
  - `id`: string (UUID形式、自動生成)
  - `userId`: string (UUID形式、自動設定、認証ユーザーのID) ← **追加**
  - `title`: string (必須、最大200文字)
  - `description`: string (オプション、最大2000文字)
  - `status`: 'pending' | 'in-progress' | 'completed' (必須)
  - `priority`: 'low' | 'medium' | 'high' (必須、デフォルト: 'medium')
  - `dueDate`: Date (オプション)
  - `createdAt`: Date (自動設定)
  - `updatedAt`: Date (自動更新)

### Requirement: データ永続化

システムはAzure CosmosDBにTODOデータを永続化しなければなりません(MUST)。

#### Scenario: TODOの作成と永続化（userId含む）

- **WHEN** 認証済みユーザーがTODOを作成する
- **THEN** システムはCosmosDBにTODOを保存する
- **AND** TODOには`userId`フィールドが含まれる
- **AND** パーティションキーとして`userId`を使用することが推奨される（効率的なクエリのため）
- **AND** 保存されたTODOは再起動後も取得可能である

#### Scenario: userIdによる効率的なクエリ

- **WHEN** ユーザーのTODO一覧を取得する
- **THEN** システムはCosmosDBクエリにuserIdフィルタを含める
- **AND** パーティションキーとして`userId`を使用している場合、クロスパーティションクエリを回避できる
- **AND** クエリのRU（Request Units）消費が最小化される

## ADDED Requirements

### Requirement: 認証ガードの適用

すべてのTODO APIエンドポイントは認証が必須でなければなりません(MUST)。

#### Scenario: すべてのTODOエンドポイントに認証ガード適用

- **WHEN** クライアントがTODO関連のエンドポイント（/api/todos/*）にアクセスする
- **THEN** システムはリクエストのAuthorizationヘッダーを検証する
- **AND** 有効なJWTトークンがない場合、401 Unauthorizedを返す
- **AND** 有効なトークンがある場合のみ、リクエストを処理する

#### Scenario: SwaggerドキュメントでのTODO認証要件表示

- **WHEN** 開発者がSwagger UI（/api/docs）でTODOエンドポイントを参照する
- **THEN** すべてのTODOエンドポイントに鍵アイコンが表示される
- **AND** エンドポイント説明に「Requires authentication」が明記される
