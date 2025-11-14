# Change: Add TODO Frontend UI

## Why

バックエンドAPIが実装されましたが、ユーザーがTODOを視覚的に管理するためのフロントエンドUIが存在しません。個人のエンジニア向けTODOリストアプリケーションとして機能するためには、直感的で使いやすいWebインターフェースが必要です。Next.js 15とReact 19を使用し、モダンで高速なユーザー体験を提供します。

## What Changes

- **Next.jsプロジェクトのセットアップ**
  - Next.js 15 (App Router) ベースのプロジェクト構成
  - モノレポ構造: `application/frontend/` ディレクトリに配置

- **UI基盤の構築**
  - Tailwind CSSの設定
  - Shadcn/uiコンポーネントのセットアップ
  - レイアウトとナビゲーション

- **TODO一覧表示機能**
  - バックエンドAPIからTODO一覧を取得
  - SWRによるデータフェッチングとキャッシング
  - TODO項目の一覧表示（カード形式）
  - ステータス・優先度による視覚的な区別

- **フィルタリング機能**
  - ステータスでフィルタリング（pending, in-progress, completed）
  - 優先度でフィルタリング（low, medium, high）
  - フィルター状態の保持

- **ソート機能**
  - 作成日時、期限、優先度でソート
  - 昇順・降順の切り替え

- **APIクライアント**
  - バックエンドAPIとの通信を抽象化
  - エラーハンドリング
  - TypeScript型定義

## Impact

- **新規追加される仕様**:
  - `specs/todo-frontend/` - フロントエンドUIの要件とシナリオ

- **影響を受けるコード**:
  - `application/frontend/` - 新規作成（Next.jsプロジェクト全体）
  - `application/frontend/src/app/` - App Routerページ
  - `application/frontend/src/components/` - Reactコンポーネント
  - `application/frontend/src/lib/` - APIクライアント、ユーティリティ

- **依存関係**:
  - バックエンドAPI (`application/backend/`) が動作している必要がある
  - バックエンドAPIエンドポイント: `http://localhost:3001/api`

- **開発環境**:
  - Node.js 18以上
  - Next.js 15
  - React 19

**注意**: このフェーズでは認証機能は含まれません。認証は別の変更提案で実装予定です。また、TODO作成・編集・削除機能も別の変更提案として後で追加します。
