# Change: Add TODO Backend API

## Why

個人のエンジニア向けTODOリストアプリケーションの基盤となるバックエンドAPIが必要です。現在、バックエンドインフラとAPIエンドポイントが存在せず、フロントエンドからTODOデータの永続化や操作ができません。NestJSとCosmosDBを使用したRESTful APIを構築し、TODO管理の基本機能を提供します。

## What Changes

- **NestJSプロジェクトのセットアップ**
  - TypeScriptベースのNestJSアプリケーション構成
  - モノレポ構造: `application/backend/` ディレクトリに配置

- **CosmosDB統合**
  - Azure CosmosDBへの接続設定
  - TODO用のデータコンテナの作成
  - リポジトリパターンの実装

- **TODOデータモデルの定義**
  - 基本フィールド: id, title, description, status, createdAt, updatedAt
  - 追加フィールド: priority (優先度), dueDate (期限)

- **TODO CRUD RESTful API**
  - `POST /api/todos` - TODO作成
  - `GET /api/todos` - TODO一覧取得
  - `GET /api/todos/:id` - TODO詳細取得
  - `PUT /api/todos/:id` - TODO更新
  - `DELETE /api/todos/:id` - TODO削除

- **バリデーションとエラーハンドリング**
  - リクエストDTOによる入力バリデーション
  -統一されたエラーレスポンス形式

## Impact

- **新規追加される仕様**:
  - `specs/todo-api/` - TODO管理APIの要件とシナリオ

- **影響を受けるコード**:
  - `application/backend/` - 新規作成（NestJSプロジェクト全体）
  - `application/backend/src/modules/todos/` - TODOモジュール
  - `application/backend/src/database/` - CosmosDB接続とリポジトリ
  - `application/backend/src/main.ts` - アプリケーションエントリーポイント

- **インフラストラクチャ**:
  - Azure CosmosDBのセットアップと設定が必要
  - 環境変数の設定（接続文字列、データベース名など）

- **開発環境**:
  - Node.js 18以上
  - NestJS CLI
  - CosmosDBエミュレーター（ローカル開発用）

**注意**: このフェーズでは認証機能は含まれません。認証は別の変更提案で実装予定です。
