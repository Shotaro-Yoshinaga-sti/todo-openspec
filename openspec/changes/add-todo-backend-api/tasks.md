# Implementation Tasks: TODO Backend API

## 1. プロジェクトセットアップ

- [ ] 1.1 NestJS プロジェクトの初期化
  - `application/backend/` ディレクトリに NestJS CLI でプロジェクト作成
  - TypeScript設定の確認
  - 必要な依存関係のインストール

- [ ] 1.2 環境変数設定
  - `.env.example` ファイルの作成
  - CosmosDB接続文字列の設定項目を定義
  - 環境変数読み込み用の `@nestjs/config` セットアップ

- [ ] 1.3 基本的なプロジェクト構造の作成
  - `src/modules/` ディレクトリ
  - `src/database/` ディレクトリ
  - `src/common/` ディレクトリ

## 2. CosmosDB統合

- [ ] 2.1 CosmosDBモジュールの作成
  - `@azure/cosmos` パッケージのインストール
  - `database/database.module.ts` の作成
  - CosmosDBクライアントの初期化と接続

- [ ] 2.2 TODOリポジトリの実装
  - `database/repositories/todo.repository.ts` の作成
  - CRUD操作のメソッド実装:
    - `create(todo: Todo): Promise<Todo>`
    - `findAll(filters?: TodoFilter): Promise<Todo[]>`
    - `findById(id: string): Promise<Todo | null>`
    - `update(id: string, updates: Partial<Todo>): Promise<Todo>`
    - `delete(id: string): Promise<boolean>`

- [ ] 2.3 データベース設定
  - データベースとコンテナの作成スクリプト
  - パーティションキー設定
  - インデックスポリシーの定義

## 3. TODOモジュール実装

- [ ] 3.1 エンティティとDTOの定義
  - `modules/todos/entities/todo.entity.ts` の作成
  - `modules/todos/dto/create-todo.dto.ts` の作成
  - `modules/todos/dto/update-todo.dto.ts` の作成
  - class-validatorデコレータの追加

- [ ] 3.2 TODOサービスの実装
  - `modules/todos/todos.service.ts` の作成
  - ビジネスロジックの実装:
    - TODO作成（バリデーション、デフォルト値設定）
    - TODO一覧取得（フィルタリング、ソート）
    - TODO詳細取得（存在確認）
    - TODO更新（部分更新対応）
    - TODO削除（ソフトデリートは不要）

- [ ] 3.3 TODOコントローラーの実装
  - `modules/todos/todos.controller.ts` の作成
  - RESTfulエンドポイントの実装:
    - `POST /api/todos` - TODO作成
    - `GET /api/todos` - TODO一覧取得（クエリパラメータ対応）
    - `GET /api/todos/:id` - TODO詳細取得
    - `PUT /api/todos/:id` - TODO更新
    - `DELETE /api/todos/:id` - TODO削除
  - Swagger/OpenAPIデコレータの追加

- [ ] 3.4 TODOモジュールの登録
  - `modules/todos/todos.module.ts` の作成
  - コントローラーとサービスの登録
  - リポジトリの依存性注入

## 4. 共通機能の実装

- [ ] 4.1 グローバルバリデーションパイプ
  - `main.ts` で ValidationPipe をグローバルに設定
  - whitelist と transform オプションの有効化

- [ ] 4.2 エラーハンドリング
  - `common/filters/http-exception.filter.ts` の作成
  - 統一されたエラーレスポンス形式の実装
  - カスタム例外クラスの作成（必要に応じて）

- [ ] 4.3 レスポンス変換
  - `common/interceptors/transform.interceptor.ts` の作成
  - 成功レスポンスの統一フォーマット

- [ ] 4.4 CORS設定
  - `main.ts` でCORSを有効化
  - フロントエンドのオリジンを許可

## 5. アプリケーション設定

- [ ] 5.1 main.ts の設定
  - アプリケーションのブートストラップ
  - グローバルプレフィックス（`/api`）の設定
  - ポート設定（デフォルト: 3001）
  - Swagger UIの有効化（開発環境のみ）

- [ ] 5.2 package.json スクリプトの追加
  - `start:dev` - 開発サーバー起動
  - `build` - プロダクションビルド
  - `start:prod` - プロダクション起動

## 6. テストとドキュメント

- [ ] 6.1 手動テスト
  - 各エンドポイントの動作確認
  - エラーケースの確認
  - バリデーションの確認

- [ ] 6.2 README.md の作成
  - セットアップ手順
  - 環境変数の説明
  - APIエンドポイントの一覧
  - ローカル開発の手順

- [ ] 6.3 API ドキュメント
  - Swagger/OpenAPI 仕様の確認
  - 各エンドポイントの説明とサンプル

## 7. 最終確認

- [ ] 7.1 コード品質チェック
  - ESLint エラーの修正
  - TypeScript型エラーの修正
  - 未使用のインポートの削除

- [ ] 7.2 動作確認
  - すべてのCRUD操作が正常に動作することを確認
  - エラーハンドリングが適切に機能することを確認
  - CosmosDBにデータが正しく保存されることを確認

- [ ] 7.3 tasks.md の更新
  - すべてのタスクを `[x]` に更新
