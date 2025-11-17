# Spec Delta: user-management

## ADDED Requirements

### Requirement: ユーザーエンティティ

システムはユーザー情報を管理するためのUserエンティティを定義しなければなりません(MUST)。

#### Scenario: Userエンティティのデータ構造

- **WHEN** ユーザーが作成または取得される
- **THEN** Userエンティティは以下のフィールドを含む:
  - `id`: string (UUID形式、自動生成、プライマリキー)
  - `googleId`: string (Google OAuth ID、ユニーク制約)
  - `email`: string (メールアドレス、ユニーク制約)
  - `name`: string (表示名)
  - `picture`: string | undefined (プロフィール画像URL、オプション)
  - `createdAt`: Date (アカウント作成日時、自動設定)
  - `updatedAt`: Date (最終更新日時、自動更新)

### Requirement: ユーザー作成

システムは初回Google OAuth認証時に自動的にユーザーを作成しなければなりません(MUST)。

#### Scenario: 初回ログイン時のユーザー自動作成

- **WHEN** Google OAuth認証に成功し、googleIdがデータベースに存在しない
- **THEN** システムは新しいUserレコードを作成する
- **AND** Googleから取得した情報（googleId, email, name, picture）を設定する
- **AND** idは自動生成されたUUIDである
- **AND** createdAtとupdatedAtは現在のタイムスタンプに設定される
- **AND** 作成されたユーザー情報を返す

#### Scenario: 既存ユーザーのログイン

- **WHEN** Google OAuth認証に成功し、googleIdがデータベースに既に存在する
- **THEN** システムは既存のUserレコードを取得する
- **AND** updatedAtを現在のタイムスタンプに更新する
- **AND** 取得したユーザー情報を返す

#### Scenario: Google情報の更新

- **WHEN** 既存ユーザーがログインし、Googleのname・picture・emailが変更されている
- **THEN** システムは最新のGoogle情報でUserレコードを更新する
- **AND** updatedAtを現在のタイムスタンプに更新する

### Requirement: ユーザー検索

システムはユーザーを検索する機能を提供しなければなりません(MUST)。

#### Scenario: GoogleIDによるユーザー検索

- **WHEN** システムがgoogleIdを指定してユーザーを検索する
- **THEN** 該当するUserレコードを返す
- **OR** 存在しない場合はnullを返す

#### Scenario: ユーザーIDによるユーザー検索

- **WHEN** システムがユーザーID（UUID）を指定してユーザーを検索する
- **THEN** 該当するUserレコードを返す
- **OR** 存在しない場合はnullを返す

#### Scenario: メールアドレスによるユーザー検索

- **WHEN** システムがemailを指定してユーザーを検索する
- **THEN** 該当するUserレコードを返す
- **OR** 存在しない場合はnullを返す

### Requirement: ユーザーデータの永続化

システムはAzure CosmosDBにユーザーデータを永続化しなければなりません(MUST)。

#### Scenario: ユーザーの作成と永続化

- **WHEN** 新しいユーザーが作成される
- **THEN** システムはCosmosDBのUsersコンテナ（または指定されたコンテナ）に保存する
- **AND** パーティションキーとして`id`を使用する
- **AND** 保存されたユーザーは再起動後も取得可能である

#### Scenario: ユーザーの更新と永続化

- **WHEN** ユーザー情報が更新される
- **THEN** システムはCosmosDBの既存レコードを更新する
- **AND** updatedAtタイムスタンプが更新される

#### Scenario: ユーザーの取得

- **WHEN** ユーザーIDまたはgoogleIdでユーザーを検索する
- **THEN** システムはCosmosDBからレコードを取得する
- **AND** 取得したデータをUserエンティティにマッピングして返す

### Requirement: ユーザー情報のバリデーション

システムはユーザー情報の整合性を検証しなければなりません(MUST)。

#### Scenario: 必須フィールドの検証

- **WHEN** ユーザーを作成する際、googleId, email, nameのいずれかが欠けている
- **THEN** システムはエラーを発生させる
- **AND** ユーザー作成は失敗する

#### Scenario: メールアドレス形式の検証

- **WHEN** ユーザーを作成する際、emailが有効なメールアドレス形式でない
- **THEN** システムはエラーを発生させる
- **AND** ユーザー作成は失敗する

#### Scenario: GoogleIDの一意性検証

- **WHEN** 既に存在するgoogleIdでユーザーを作成しようとする
- **THEN** システムはエラーを発生させる
- **AND** ユーザー作成は失敗する

### Requirement: ユーザーとTODOの関連付け

システムはTODOエンティティにユーザーIDを紐付けなければなりません(MUST)。

#### Scenario: TODO作成時のユーザーID自動設定

- **WHEN** 認証済みユーザーがTODOを作成する
- **THEN** システムは自動的にTODOの`userId`フィールドに認証ユーザーのIDを設定する
- **AND** ユーザーが明示的にuserIdを指定することはできない

#### Scenario: ユーザー自身のTODOのみ取得

- **WHEN** 認証済みユーザーがGET /api/todosをリクエストする
- **THEN** システムは該当ユーザーの`userId`でフィルタリングされたTODOのみを返す
- **AND** 他のユーザーのTODOは含まれない

#### Scenario: ユーザー自身のTODOのみ更新可能

- **WHEN** 認証済みユーザーが他のユーザーのTODOを更新しようとする
- **THEN** システムは404 Not Foundを返す
- **AND** TODOは更新されない

#### Scenario: ユーザー自身のTODOのみ削除可能

- **WHEN** 認証済みユーザーが他のユーザーのTODOを削除しようとする
- **THEN** システムは404 Not Foundを返す
- **AND** TODOは削除されない

### Requirement: プライバシーとデータ分離

システムは各ユーザーのデータを完全に分離しなければなりません(MUST)。

#### Scenario: ユーザーAはユーザーBのTODOを閲覧できない

- **WHEN** ユーザーAが認証済みでGET /api/todosをリクエストする
- **THEN** システムはユーザーAのTODOのみを返す
- **AND** ユーザーB、C、その他のユーザーのTODOは返されない

#### Scenario: ユーザーAは直接IDを指定しても他ユーザーのTODOにアクセスできない

- **WHEN** ユーザーAがユーザーBのTODO IDを指定してGET /api/todos/:idをリクエストする
- **THEN** システムは404 Not Foundを返す
- **AND** ユーザーBのTODO情報は返されない

#### Scenario: CosmosDBクエリでのuserIdフィルタリング

- **WHEN** システムがTODOデータをクエリする
- **THEN** すべてのクエリに`userId = <current-user-id>`条件が含まれなければならない
- **AND** パーティションキーとして`userId`を使用することで効率的なクエリが実現される

### Requirement: ユーザー情報のレスポンス形式

システムはユーザー情報を返す際、一貫した形式を使用しなければなりません(MUST)。

#### Scenario: ユーザー情報の成功レスポンス

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
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
  ```
- **NOTE**: `googleId`と`updatedAt`はセキュリティ上、クライアントに返さない

#### Scenario: ユーザーが見つからない場合

- **WHEN** 存在しないユーザーIDで検索する
- **THEN** システムは404 Not Foundを返す
- **AND** エラーメッセージは標準形式:
  ```json
  {
    "success": false,
    "error": {
      "code": "USER_NOT_FOUND",
      "message": "User not found",
      "statusCode": 404
    }
  }
  ```

### Requirement: ユーザー削除（将来実装）

システムはユーザーアカウント削除機能を将来的に提供しなければなりません(MUST)。

#### Scenario: ユーザー削除時のデータ処理

- **WHEN** ユーザーがアカウント削除をリクエストする（将来実装）
- **THEN** システムはユーザーのすべてのTODOを削除しなければならない
- **AND** ユーザーレコードを削除しなければならない
- **AND** 削除操作はトランザクション的に実行されなければならない（すべて成功またはすべて失敗）

**NOTE**: 現在の実装範囲外。GDPR対応や将来の要件として考慮。
