# Project Context

## Purpose

エンジニア向けTODOリスト

## Tech Stack

### フロントエンド

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19 + Shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: SWR
- **Authentication**: Google OAuth

### バックエンド

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: CosmosDB

## Project Conventions

### Code Style

- **Path aliases** - Use `@/` for imports from `application/frontend/src/` directory
- **Component organization** - React functional components with hooks
- **Naming conventions:**
  - PascalCase for components and types
  - camelCase for functions and variables
  - SCREAMING_SNAKE_CASE for constants

### Architecture Patterns

- **Monorepo Structure** - Separate frontend and backend in `application/` directory
- **Next.js App Router** - File-system based routing in `application/frontend/src/app/`
- **Component-based architecture** - Reusable React components with Shadcn/ui in `application/frontend/src/components/`
- **State management** - SWR for data fetching, React hooks for local state
- **Backend API** - NestJS controllers and services in `application/backend/src/modules/`

### Testing Strategy

Currently no automated testing infrastructure. Future consideration for Jest + React Testing Library for component tests.

**Manual Testing Workflow:**

1. Use the test HTTP endpoint for manual testing
2. Monitor logs in Azure Functions Core Tools console
3. Verify Firestore updates after processing
4. Check X (Twitter) for successfully posted content

### Git Workflow

本プロジェクトは **GitHub Flow** を採用しています。

#### ワークフロー

1. **Feature Branch 作成**

   ```bash
   git checkout -b feature/新機能名
   ```

2. **開発とコミット**

   ```bash
   git add .
   git commit -m "feat: 新機能の実装"
   ```

3. **Pull Request 作成**

   - GitHub上でPRを作成
   - コードレビューを依頼
   - CI/CDパイプラインの自動実行

4. **マージとデプロイ**

   - レビュー承認後、mainブランチへマージ
   - 自動デプロイの実行

#### コミットメッセージ規約

```txt
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: フォーマット変更
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルドプロセスやツールの変更

## Domain Context

**アプリケーションの目的:**
個人のエンジニアが日々の開発タスクを効率的に管理するためのTODOリストアプリケーション。

**主要機能:**
- **シンプルなTODO管理** - タスクの作成、更新、完了、削除などの基本的なCRUD操作
- **Git/GitHub連携** - リポジトリやイシューと連携したタスク管理
- **Google OAuth認証** - セキュアなユーザー認証

**想定ユースケース:**
- 個人の開発タスクの追跡と管理
- コードレビューやPRに紐づくタスクの整理
- 複数プロジェクトにまたがるタスクの一元管理
- 日次・週次のタスク進捗確認

**ユーザー特性:**
- ターゲット：個人のソフトウェアエンジニア
- 技術レベル：中級〜上級
- 利用規模：単一ユーザー、数百件のTODO管理を想定

## Important Constraints

### セキュリティ・プライバシー

- **Google OAuth認証必須** - 全てのAPIエンドポイントは認証されたユーザーのみアクセス可能
- **データの分離** - ユーザーごとにデータを完全に分離し、他ユーザーのデータにアクセス不可
- **個人情報保護** - ユーザーの個人情報（メールアドレス等）は適切に保護
- **HTTPS通信** - 本番環境では全ての通信をHTTPS経由で実施

### パフォーマンス要件

- **想定スケール** - 個人利用レベル（単一ユーザー、数百件のTODO）
- **レスポンスタイム** - 一般的なCRUD操作は1秒以内に完了
- **データベース** - CosmosDBを使用、適切なインデックス設計でクエリ効率化

### インフラ・コスト制約

- **Azure無料枠・低コスト運用** - 個人プロジェクトのため、できる限りコストを抑えた構成
- **CosmosDB容量** - 必要最小限のRU（Request Units）で運用
- **効率的なクエリ設計** - 不要なデータ取得を避け、コスト最適化

### 技術的制約

- **モノレポ構造** - フロントエンドとバックエンドを同一リポジトリで管理
- **TypeScript必須** - 型安全性を保つため、全コードをTypeScriptで記述
- **Next.js App Router** - Pages Routerではなく、App Routerを使用
- **自動テスト未整備** - 現状は手動テストのみ、将来的にJest導入を検討

## External Dependencies

- **GitHub Actions** - CI/CD pipelines
