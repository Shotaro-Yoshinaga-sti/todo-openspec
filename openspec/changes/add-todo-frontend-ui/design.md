# Design: TODO Frontend UI

## Context

個人のエンジニア向けTODOリストアプリケーションのフロントエンドを新規構築します。project.mdで定義された技術スタック（Next.js 15、React 19、Shadcn/ui、Tailwind CSS、SWR）に基づき、シンプルで使いやすいUIを設計します。

**制約条件**:
- 個人利用レベル（単一ユーザー、数百件のTODO想定）
- モノレポ構造（バックエンドと同一リポジトリ）
- 現時点では認証機能なし（将来実装予定）
- このフェーズでは一覧表示とフィルタリングのみ（CRUD操作は次フェーズ）

## Goals / Non-Goals

**Goals**:
- シンプルで直感的なUI/UX
- 高速なページロード（Next.js App Routerの最適化）
- レスポンシブデザイン（デスクトップ中心、モバイルも対応）
- 型安全性の確保（TypeScript）
- 効率的なデータフェッチング（SWR）

**Non-Goals**:
- 認証・認可機能（別の変更提案で実装）
- TODO作成・編集・削除機能（別の変更提案で実装）
- リアルタイム更新（WebSocket）
- オフライン対応
- 複雑なアニメーション

## Decisions

### 1. アーキテクチャパターン: Next.js App Router

**決定**: Next.js 15のApp Routerを使用し、React Server Componentsを活用

```
application/frontend/
├── src/
│   ├── app/                    # App Router
│   │   ├── layout.tsx          # ルートレイアウト
│   │   ├── page.tsx            # ホームページ（TODO一覧）
│   │   └── globals.css         # グローバルスタイル
│   ├── components/             # Reactコンポーネント
│   │   ├── ui/                 # Shadcn/ui コンポーネント
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   └── select.tsx
│   │   └── todos/              # TODO関連コンポーネント
│   │       ├── todo-list.tsx
│   │       ├── todo-item.tsx
│   │       └── todo-filters.tsx
│   ├── lib/                    # ユーティリティ
│   │   ├── api/
│   │   │   └── todos.ts        # TODO APIクライアント
│   │   ├── types/
│   │   │   └── todo.ts         # 型定義
│   │   └── utils.ts            # ユーティリティ関数
│   └── hooks/                  # カスタムフック
│       └── use-todos.ts        # TODO データフェッチング
└── public/                     # 静的ファイル
```

**理由**:
- Next.js 15の最新機能を活用
- React Server Componentsで初期ロードを高速化
- ファイルベースルーティングで直感的
- 将来的な機能追加に対応しやすい

**代替案**:
- ❌ **Pages Router**: 古いアーキテクチャ、project.mdでApp Router指定
- ❌ **SPA (Vite + React)**: SSRの利点を失う

### 2. UI Component Library: Shadcn/ui + カスタムコンポーネント

**決定**: 基本はShadcn/ui、必要に応じてカスタムコンポーネント

**Shadcn/uiコンポーネント**:
- Button
- Card
- Badge（ステータス・優先度表示）
- Select（フィルター）
- Skeleton（ローディング状態）

**カスタムコンポーネント**:
- TodoList
- TodoItem
- TodoFilters

**理由**:
- Shadcn/uiはコピー&ペーストで自由にカスタマイズ可能
- Tailwind CSSとの統合が優れている
- 必要なコンポーネントのみ追加可能（軽量）
- TypeScriptサポートが充実

**代替案**:
- ❌ **MUI/Chakra UI**: 重量級、オーバースペック
- ❌ **完全カスタム**: 開発コストが高い

### 3. Data Fetching: SWR

**決定**: SWRでデータフェッチングとキャッシング

```typescript
// hooks/use-todos.ts
import useSWR from 'swr';

export function useTodos(filters?: TodoFilter) {
  const { data, error, isLoading, mutate } = useSWR(
    ['/api/todos', filters],
    ([url, filters]) => fetchTodos(filters)
  );

  return {
    todos: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
```

**理由**:
- 自動再検証とキャッシング
- ローディング・エラー状態の管理が簡単
- Next.jsとの統合が優れている
- リソース効率が良い

**代替案**:
- ❌ **TanStack Query**: 過剰な機能（個人プロジェクトには不要）
- ❌ **useEffect + fetch**: 手動でキャッシュ管理が必要

### 4. State Management: React hooks + URL state

**決定**: フィルター状態をURL searchParamsで管理

```typescript
// フィルター状態をURLに保存
// 例: /?status=pending&priority=high&sortBy=dueDate

const searchParams = useSearchParams();
const status = searchParams.get('status');
const priority = searchParams.get('priority');
```

**理由**:
- ブックマーク可能
- ブラウザの戻る/進むボタンが機能
- ページリロード後も状態を保持
- グローバル状態管理ライブラリ不要

**代替案**:
- ❌ **Zustand/Jotai**: シンプルなフィルターには過剰
- ❌ **localStorage**: URL状態の方が明示的

### 5. Styling: Tailwind CSS + CSS Variables

**決定**: Tailwind CSSで基本スタイリング、CSS変数でテーマ管理

```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --muted: 210 40% 96.1%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
```

**理由**:
- Tailwind CSSで迅速な開発
- CSS変数で将来的なダークモード対応が容易
- Shadcn/uiとの統合が優れている

### 6. Type Safety: TypeScript + Shared Types

**決定**: バックエンドと同じ型定義を使用

```typescript
// lib/types/todo.ts
export enum TodoStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
}

export enum TodoPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

**理由**:
- フロントエンド・バックエンド間の型の一貫性
- コンパイル時のエラー検出
- IDEの補完サポート

## Risks / Trade-offs

### リスク1: バックエンドAPIへの依存

**リスク**: バックエンドが動作していないとフロントエンドが使用できない

**緩和策**:
- 開発時はバックエンドとフロントエンドを同時に起動
- モックデータでの開発も可能にする（開発用フラグ）
- エラー状態の適切な表示

### リスク2: 認証なしのAPI

**リスク**: 現時点では誰でもAPIにアクセス可能

**緩和策**:
- ローカル開発環境のみで使用
- 次のフェーズでGoogle OAuth認証を実装
- CORS設定で localhost のみ許可

### トレードオフ1: Server Components vs Client Components

**選択**: 一覧表示はServer Component、フィルターはClient Component

- ✅ 初期ロードが高速
- ✅ SEO対応（将来的に有用）
- ⚠️ クライアント側の状態管理が複雑になる可能性

**判断**: 個人プロジェクトかつ一覧表示中心のため、シンプルさを優先

### トレードオフ2: Shadcn/ui vs フルカスタム

**選択**: Shadcn/uiをベースに必要に応じてカスタマイズ

- ✅ 開発速度が速い
- ✅ アクセシビリティ対応済み
- ⚠️ カスタマイズに制限がある可能性

**判断**: 初期フェーズではShadcn/uiで十分、将来的にカスタマイズ可能

## Migration Plan

**初期セットアップ（このフェーズ）**:

1. Next.jsプロジェクトの初期化
2. Tailwind CSS + Shadcn/uiのセットアップ
3. TODO一覧表示機能の実装
4. フィルタリング・ソート機能の実装
5. ローカルテスト

**将来の拡張（次フェーズ以降）**:

1. **CRUD操作追加（次フェーズ）**:
   - TODO作成フォーム
   - TODO編集機能
   - TODO削除機能

2. **認証追加（将来）**:
   - Google OAuth統合
   - ユーザーセッション管理
   - 保護されたルート

3. **UX改善（必要に応じて）**:
   - ダークモード
   - ドラッグ&ドロップ
   - キーボードショートカット

**ロールバック**:
- フロントエンドは独立しているため、削除しても影響なし
- バックエンドAPIは影響を受けない

## Open Questions

1. **ページネーション**
   - 初期: 全件取得（数百件想定）
   - 将来: データ量増加時にページネーションを追加
   - → パフォーマンステスト結果に基づいて判断

2. **エラー表示**
   - トースト通知？
   - インラインエラー？
   - → シンプルなインラインエラーから開始

3. **ローディング状態**
   - Skeletonコンポーネント？
   - スピナー？
   - → Shadcn/ui の Skeleton を使用
