# Implementation Tasks: TODO Frontend UI

## 1. プロジェクトセットアップ

- [ ] 1.1 Next.jsプロジェクトの初期化
  - `application/frontend/` ディレクトリにNext.js 15プロジェクト作成
  - TypeScript設定の確認
  - 必要な依存関係のインストール

- [ ] 1.2 Tailwind CSSのセットアップ
  - Tailwind CSS、PostCSS、Autoprefixerのインストール
  - `tailwind.config.ts` の設定
  - `globals.css` の作成とTailwindディレクティブの追加

- [ ] 1.3 Shadcn/uiのセットアップ
  - Shadcn/ui CLIのインストール
  - `components.json` の設定
  - 必要なコンポーネントの追加（Button, Card, Badge, Select, Skeleton）

- [ ] 1.4 環境変数設定
  - `.env.local.example` ファイルの作成
  - バックエンドAPIのURL設定

- [ ] 1.5 基本的なプロジェクト構造の作成
  - `src/app/` ディレクトリ
  - `src/components/` ディレクトリ
  - `src/lib/` ディレクトリ
  - `src/hooks/` ディレクトリ

## 2. 型定義とAPIクライアント

- [ ] 2.1 型定義の作成
  - `lib/types/todo.ts` の作成
  - TodoStatus、TodoPriority、Todo インターフェースの定義
  - TodoFilter、TodoSort 型の定義

- [ ] 2.2 APIクライアントの実装
  - `lib/api/client.ts` の作成
  - ベースURL、ヘッダー設定
  - エラーハンドリング関数

- [ ] 2.3 TODO APIクライアントの実装
  - `lib/api/todos.ts` の作成
  - `fetchTodos(filters?: TodoFilter)` 関数の実装
  - レスポンスの型付け

## 3. カスタムフックの実装

- [ ] 3.1 useTodos フックの作成
  - `hooks/use-todos.ts` の作成
  - SWRを使用したデータフェッチング
  - ローディング・エラー状態の管理
  - フィルター適用のロジック

## 4. UIコンポーネントの実装

- [ ] 4.1 TodoItemコンポーネント
  - `components/todos/todo-item.tsx` の作成
  - TODO情報の表示（タイトル、説明、ステータス、優先度、期限）
  - ステータスに応じたバッジの色分け
  - 優先度に応じたスタイリング

- [ ] 4.2 TodoListコンポーネント
  - `components/todos/todo-list.tsx` の作成
  - TODO一覧の表示
  - 空状態の表示
  - ローディング状態（Skeletonコンポーネント）

- [ ] 4.3 TodoFiltersコンポーネント
  - `components/todos/todo-filters.tsx` の作成
  - ステータスフィルター（Select）
  - 優先度フィルター（Select）
  - ソート選択（作成日時、期限、優先度）
  - ソート順序（昇順・降順）
  - フィルタークリアボタン

## 5. ページとレイアウトの実装

- [ ] 5.1 ルートレイアウトの作成
  - `app/layout.tsx` の作成
  - メタデータの設定
  - フォント設定
  - グローバルスタイルの読み込み

- [ ] 5.2 ホームページの実装
  - `app/page.tsx` の作成
  - TodoFiltersコンポーネントの配置
  - TodoListコンポーネントの配置
  - ページタイトルとヘッダー

- [ ] 5.3 エラーページの実装
  - `app/error.tsx` の作成
  - エラーメッセージの表示
  - リトライボタン

## 6. スタイリングとレイアウト

- [ ] 6.1 グローバルスタイルの設定
  - `app/globals.css` の作成
  - CSS変数の定義（カラースキーム）
  - Tailwindディレクティブの追加

- [ ] 6.2 レスポンシブデザインの実装
  - デスクトップ向けレイアウト
  - タブレット向けレイアウト
  - モバイル向けレイアウト

- [ ] 6.3 ステータス・優先度の色分け
  - pending: グレー
  - in-progress: ブルー
  - completed: グリーン
  - low: ライトブルー
  - medium: イエロー
  - high: レッド

## 7. ユーティリティとヘルパー

- [ ] 7.1 日付フォーマット関数
  - `lib/utils.ts` に日付フォーマット関数を追加
  - 相対時間表示（"2日前"など）

- [ ] 7.2 ステータス・優先度表示名
  - 列挙型から表示名への変換関数
  - 日本語表示対応

## 8. テストとドキュメント

- [ ] 8.1 手動テスト
  - TODO一覧表示の動作確認
  - フィルタリングの動作確認
  - ソートの動作確認
  - レスポンシブデザインの確認
  - エラー状態の確認

- [ ] 8.2 README.md の作成
  - セットアップ手順
  - 環境変数の説明
  - 開発サーバーの起動方法
  - ビルド方法

- [ ] 8.3 バックエンドとの統合テスト
  - バックエンドAPIとの接続確認
  - データの取得と表示の確認
  - CORS設定の確認

## 9. 最終確認

- [ ] 9.1 コード品質チェック
  - ESLint エラーの修正
  - TypeScript型エラーの修正
  - 未使用のインポートの削除

- [ ] 9.2 パフォーマンスチェック
  - ページロード時間の確認
  - Lighthouseスコアの確認
  - バンドルサイズの確認

- [ ] 9.3 動作確認
  - すべての表示機能が正常に動作することを確認
  - フィルタリング・ソートが正常に動作することを確認
  - バックエンドAPIとの統合が正常に動作することを確認

- [ ] 9.4 tasks.md の更新
  - すべてのタスクを `[x]` に更新
