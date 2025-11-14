# Design: TODO Backend API

## Context

個人のエンジニア向けTODOリストアプリケーションの新規プロジェクトです。project.mdで定義された技術スタック（NestJS、TypeScript、CosmosDB）に基づき、シンプルで保守しやすいバックエンドアーキテクチャを設計します。

**制約条件**:
- 個人利用レベル（単一ユーザー、数百件のTODO想定）
- Azure無料枠・低コスト運用
- モノレポ構造（フロントエンドと同一リポジトリ）
- 現時点では認証機能なし（将来実装予定）

## Goals / Non-Goals

**Goals**:
- シンプルで理解しやすいアーキテクチャ
- RESTful原則に従ったAPI設計
- CosmosDBとの効率的な統合
- スケーラビリティを考慮した設計（将来的な拡張に対応）
- 型安全性の確保（TypeScript）

**Non-Goals**:
- 認証・認可機能（別の変更提案で実装）
- リアルタイム更新（WebSocket）
- キャッシング戦略（初期フェーズでは不要）
- 複雑なクエリ最適化（データ量が少ないため）

## Decisions

### 1. アーキテクチャパターン: NestJSモジュール構造

**決定**: NestJSの標準的な3層アーキテクチャを採用

```
application/backend/src/
├── main.ts                 # アプリケーションエントリーポイント
├── modules/
│   └── todos/
│       ├── todos.controller.ts  # HTTPエンドポイント
│       ├── todos.service.ts     # ビジネスロジック
│       ├── todos.module.ts      # モジュール定義
│       ├── dto/                 # Data Transfer Objects
│       │   ├── create-todo.dto.ts
│       │   └── update-todo.dto.ts
│       └── entities/
│           └── todo.entity.ts   # データモデル
├── database/
│   ├── database.module.ts       # CosmosDB接続
│   └── repositories/
│       └── todo.repository.ts   # データアクセス層
└── common/
    ├── filters/                 # エラーハンドリング
    └── interceptors/            # レスポンス変換
```

**理由**:
- NestJSのベストプラクティスに従う
- 責任の分離が明確
- テストしやすい構造
- 将来的な機能追加に対応しやすい

**代替案**:
- ❌ **単一ファイル構成**: 初期は簡単だが、拡張性が低い
- ❌ **Clean Architecture**: 過度に複雑（個人プロジェクトには不要）

### 2. データベース接続: CosmosDB SDK直接利用

**決定**: `@azure/cosmos` SDKを直接使用し、リポジトリパターンで抽象化

**理由**:
- CosmosDBに特化した最適化が可能
- ORMのオーバーヘッドを避ける
- シンプルなデータモデルに適している
- コスト効率が良い（必要なデータのみ取得）

**代替案**:
- ❌ **TypeORM**: CosmosDBサポートが限定的
- ❌ **Mongoose**: MongoDB APIを使用する場合の選択肢だが、SDKの方が柔軟

### 3. TODOデータモデル

**決定**: 以下のフィールドを持つシンプルなモデル

```typescript
interface Todo {
  id: string;              // UUID
  title: string;           // 必須、最大200文字
  description?: string;    // オプション、最大2000文字
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;          // オプション
  createdAt: Date;
  updatedAt: Date;
}
```

**理由**:
- 必要最小限のフィールド
- 明確な状態管理（status）
- 優先度と期限による整理が可能
- 拡張性を考慮（将来的にタグやカテゴリ追加可能）

**代替案**:
- ❌ **より複雑なモデル**: タグ、カテゴリ、サブタスクなど → 初期フェーズでは過剰

### 4. API設計: RESTful エンドポイント

**決定**:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /api/todos | TODO作成 |
| GET    | /api/todos | TODO一覧取得（クエリパラメータでフィルタリング） |
| GET    | /api/todos/:id | TODO詳細取得 |
| PUT    | /api/todos/:id | TODO更新 |
| DELETE | /api/todos/:id | TODO削除 |

**クエリパラメータ**:
- `status`: ステータスでフィルタリング
- `priority`: 優先度でフィルタリング
- `sortBy`: ソート項目（createdAt, dueDate, priority）
- `order`: ソート順（asc, desc）

**理由**:
- RESTful原則に従う
- 直感的で予測可能
- フロントエンドとの統合が容易

### 5. バリデーション: class-validator

**決定**: NestJSの標準的な `class-validator` と `ValidationPipe` を使用

**理由**:
- NestJSとの統合が簡単
- デコレータベースで可読性が高い
- 型安全性を保証

### 6. エラーハンドリング: 統一されたレスポンス形式

**決定**:

```typescript
// 成功レスポンス
{
  "success": true,
  "data": { ... }
}

// エラーレスポンス
{
  "success": false,
  "error": {
    "code": "TODO_NOT_FOUND",
    "message": "TODO with id 'xxx' not found",
    "statusCode": 404
  }
}
```

**理由**:
- 一貫性のあるAPI体験
- フロントエンドでのエラーハンドリングが容易
- デバッグしやすい

## Risks / Trade-offs

### リスク1: CosmosDBコスト

**リスク**: クエリが非効率だとRU消費が増加し、コストが上昇

**緩和策**:
- パーティションキーを適切に設計（userId を想定、将来実装）
- インデックスポリシーを最適化
- 必要なフィールドのみ取得（SELECT * を避ける）
- ローカル開発ではCosmosDBエミュレーターを使用

### リスク2: 認証なしのAPI

**リスク**: 現時点では誰でもAPIにアクセス可能

**緩和策**:
- ローカル開発環境のみで使用
- 次のフェーズでGoogle OAuth認証を実装
- CORSを設定し、フロントエンドのみからのアクセスに制限

### トレードオフ1: シンプルさ vs 拡張性

**選択**: シンプルさを優先

- ✅ 初期実装が迅速
- ✅ 保守しやすい
- ⚠️ 将来的なリファクタリングが必要になる可能性

**判断**: 個人プロジェクトかつ初期フェーズのため、シンプルさを優先するのが適切

### トレードオフ2: ORMなし vs ORM利用

**選択**: CosmosDB SDKを直接利用

- ✅ パフォーマンスが良い
- ✅ コスト効率が良い
- ⚠️ ボイラープレートコードが増える

**判断**: データモデルがシンプルなため、ORMのオーバーヘッドは不要

## Migration Plan

**初期セットアップ（このフェーズ）**:

1. NestJSプロジェクトの初期化
2. CosmosDBの接続設定
3. TODO APIの実装
4. ローカルテスト

**将来の移行**:

1. **認証追加（次フェーズ）**:
   - Google OAuth統合
   - ユーザーごとのデータ分離
   - パーティションキーに userId を使用

2. **GitHub連携（将来）**:
   - GitHub API統合
   - TODO ↔ Issue の紐付け

3. **スケール対応（必要に応じて）**:
   - キャッシング追加
   - ページネーション実装
   - バックグラウンドジョブ

**ロールバック**:
- データベーススキーマは後方互換性を保つ
- APIバージョニング（/api/v1/）を将来検討

## Open Questions

1. **CosmosDB パーティションキー設計**
   - 現時点: 単一パーティション（データ量が少ないため）
   - 将来: `userId` をパーティションキーにする必要がある
   - → 認証実装時に再検討

2. **ページネーション**
   - 初期: 全件取得（数百件想定）
   - 将来: データ量増加時にページネーションを追加
   - → パフォーマンステスト結果に基づいて判断

3. **ログ戦略**
   - 開発環境: コンソールログ
   - 本番環境: Azure Application Insights?
   - → インフラ設定時に決定
