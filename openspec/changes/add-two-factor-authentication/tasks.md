# Tasks: Add Two-Factor Authentication (TOTP)

## 前提条件

- `add-user-authentication` 変更が完了していること
- Google OAuth認証が動作していること
- Userエンティティが実装されていること

## Phase 1: 基盤準備

- [ ] **依存パッケージのインストール**
  - `otplib` - TOTP生成と検証
  - `qrcode` - QRコード生成
  - `@nestjs/throttler` - レート制限（オプション）
  - `@types/qrcode` - 型定義
  - 検証: package.jsonに依存関係が追加され、`npm install`が成功する

- [ ] **環境変数の追加**
  - `.env.example`に2FA関連の環境変数を追加
  - `TOTP_ENCRYPTION_KEY` (256ビット、64文字のhex文字列)
  - `TOTP_ISSUER` (アプリ名、例: "TODO App")
  - `TOTP_WINDOW` (デフォルト: 1)
  - `TOTP_MAX_ATTEMPTS` (デフォルト: 5)
  - `TOTP_LOCKOUT_DURATION` (デフォルト: 1800秒)
  - `TOTP_BYPASS_FOR_TESTING` (開発環境用、デフォルト: false)
  - 検証: `.env.example`にすべての変数が記載されている

- [ ] **Userエンティティの拡張**
  - `src/modules/users/entities/user.entity.ts`を更新
  - 新しいフィールドを追加: `totpSecret`, `twoFactorEnabled`, `twoFactorSetupComplete`, `totpSetupDate`, `totpLastVerified`
  - 検証: エンティティが新しいフィールドを含む

- [ ] **暗号化ユーティリティの作成**
  - `src/common/utils/encryption.util.ts`を作成
  - `encryptTOTPSecret(secret: string): string` メソッド
  - `decryptTOTPSecret(encrypted: string): string` メソッド
  - AES-256-GCM暗号化を使用
  - 検証: ユニットテストで暗号化/復号化が正しく動作する

## Phase 2: TOTP サービスの実装

- [ ] **TOTPServiceの作成**
  - `src/modules/auth/services/totp.service.ts`を作成
  - `generateSecret()`: TOTP秘密鍵生成
  - `generateQRCode(user: User, secret: string)`: QRコード生成
  - `verifyToken(token: string, secret: string)`: TOTP検証
  - `checkReplayAttack(userId: string, token: string)`: Replay Attack チェック
  - 検証: すべてのメソッドが正しく動作する

- [ ] **レート制限サービスの作成**
  - `src/modules/auth/services/rate-limit.service.ts`を作成
  - `incrementAttempts(userId: string)`: 失敗回数増加
  - `getAttempts(userId: string)`: 失敗回数取得
  - `resetAttempts(userId: string)`: 失敗回数リセット
  - `lockAccount(userId: string, duration: number)`: アカウントロック
  - `isLockedOut(userId: string)`: ロック状態確認
  - 検証: レート制限が正しく動作する

## Phase 3: 2FA エンドポイントの実装

- [ ] **TwoFactorController の作成**
  - `src/modules/auth/controllers/two-factor.controller.ts`を作成
  - `POST /api/auth/2fa/setup` - セットアップ開始
  - `POST /api/auth/2fa/verify-setup` - セットアップ検証
  - `POST /api/auth/2fa/verify` - ログイン時の検証
  - `GET /api/auth/2fa/status` - 状態確認
  - 検証: すべてのエンドポイントがルーティングされる

- [ ] **TwoFactorServiceの作成**
  - `src/modules/auth/services/two-factor.service.ts`を作成
  - `initiateSetup(user: User)`: セットアップ開始ロジック
  - `verifySetup(user: User, token: string)`: セットアップ検証
  - `verifyLogin(user: User, token: string)`: ログイン検証
  - `getStatus(user: User)`: 状態取得
  - 検証: サービスが正しくロジックを実行する

## Phase 4: 認証フローの変更

- [ ] **AuthServiceの更新**
  - `src/modules/auth/auth.service.ts`を更新
  - OAuth成功後、2FA状態を確認
  - `twoFactorSetupComplete`に応じて一時トークンを発行
  - 完全なJWTトークンは2FA検証後のみ発行
  - 検証: 認証フローが正しく動作する

- [ ] **一時トークン用のDTOとガードの作成**
  - `src/modules/auth/dto/temp-token-payload.dto.ts`を作成
  - `src/modules/auth/guards/temp-token.guard.ts`を作成
  - 一時トークンの検証ロジック
  - `requiresTwoFactor`フラグの確認
  - 検証: 一時トークンが正しく検証される

- [ ] **JWTトークンペイロードの拡張**
  - `src/modules/auth/dto/jwt-payload.dto.ts`を更新
  - `twoFactorVerified: boolean`フィールドを追加
  - JWT戦略で2FA検証状態を確認
  - 検証: トークンペイロードが正しく拡張される

## Phase 5: Swagger ドキュメント更新

- [ ] **TwoFactorControllerのSwaggerデコレータ追加**
  - `@ApiTags('2FA')`を追加
  - 各エンドポイントに`@ApiOperation`, `@ApiResponse`を追加
  - リクエスト/レスポンスのDTOを定義
  - 検証: Swagger UIに2FAエンドポイントが表示される

- [ ] **2FAフローのドキュメント作成**
  - Swagger UIの説明に2FAフローを追加
  - セットアップフローとログインフローの図を含める
  - 検証: ドキュメントが明確で理解しやすい

## Phase 6: エラーハンドリング

- [ ] **2FA関連エラークラスの作成**
  - `src/modules/auth/exceptions/invalid-totp.exception.ts`
  - `src/modules/auth/exceptions/too-many-attempts.exception.ts`
  - `src/modules/auth/exceptions/2fa-setup-required.exception.ts`
  - `src/modules/auth/exceptions/token-already-used.exception.ts`
  - 検証: すべてのエラークラスが正しく動作する

- [ ] **HttpExceptionFilterの更新**
  - `src/common/filters/http-exception.filter.ts`を更新
  - 2FA関連エラーコードを追加 (`INVALID_TOTP`, `TOO_MANY_ATTEMPTS`, `2FA_SETUP_REQUIRED`)
  - 統一されたエラーレスポンス形式
  - 検証: エラーレスポンスが仕様通りの形式

## Phase 7: CosmosDB対応

- [ ] **UserRepositoryの更新**
  - `src/database/repositories/user.repository.ts`を更新
  - 2FA関連フィールドのCRUD操作サポート
  - `updateTwoFactorSetup(userId: string, data: Partial<User>)` メソッド追加
  - 検証: リポジトリが2FAフィールドを正しく管理する

- [ ] **使用済みトークンの管理（オプション: CosmosDB使用）**
  - `src/database/repositories/used-token.repository.ts`を作成（オプション）
  - CosmosDBでTTL（60秒）を設定した使用済みトークン管理
  - または、インメモリキャッシュ（Setまたはmap）を使用
  - 検証: 使用済みトークンが正しく追跡される

## Phase 8: フロントエンド対応（参考）

フロントエンド実装は別タスクですが、バックエンドAPIが対応すべき項目：

- [ ] **2FAセットアップ画面用のAPIレスポンス**
  - QRコードのdata URL
  - シークレットキーのテキスト
  - 発行者名とアカウント名
  - 検証: フロントエンドが必要な情報を取得できる

- [ ] **2FAログイン画面用のAPIレスポンス**
  - TOTP検証エラー時の残り試行回数
  - ロックアウト時のロック解除時刻
  - 検証: フロントエンドがユーザーに適切な情報を表示できる

## Phase 9: テスト

- [ ] **TOTPServiceのユニットテスト**
  - `totp.service.spec.ts`を作成
  - 秘密鍵生成、QRコード生成、TOTP検証のテスト
  - 検証: すべてのテストが成功する

- [ ] **2FA認証フローのE2Eテスト**
  - `test/2fa.e2e-spec.ts`を作成
  - セットアップフローの完全テスト
  - ログインフローの完全テスト
  - エラーケースのテスト（無効なコード、レート制限等）
  - 検証: E2Eテストが成功する

- [ ] **レート制限のテスト**
  - 5回連続失敗でロックアウト
  - ロックアウト解除のテスト
  - 検証: レート制限が正しく動作する

- [ ] **Replay Attack防止のテスト**
  - 同じTOTPコードの再利用テスト
  - 検証: 使用済みコードが拒否される

## Phase 10: ドキュメントとデプロイ準備

- [ ] **READMEの更新**
  - `application/backend/README.md`を更新
  - 2FAセットアップ手順を追加
  - 環境変数の説明を追加
  - Google Authenticatorの使い方を追加
  - 検証: READMEが明確で新しい開発者が理解できる

- [ ] **マイグレーション計画**
  - 既存ユーザーへの対応方法をドキュメント化
  - 次回ログイン時に2FAセットアップ強制
  - 検証: マイグレーション計画が明確

- [ ] **環境変数の設定確認**
  - `TOTP_ENCRYPTION_KEY`の生成方法をドキュメント化
  - 本番環境での環境変数設定を確認
  - 検証: すべての必要な環境変数が設定されている

- [ ] **統合テストと検証**
  - ローカル環境で完全な2FAフローをテスト
  - Google Authenticatorでの実機テスト
  - エラーケースの確認
  - 検証: すべての機能が正常に動作する

## Dependencies

- **Phase 2** はPhase 1に依存
- **Phase 3** はPhase 2に依存
- **Phase 4** はPhase 3に依存
- **Phase 5-6** はPhase 4に依存
- **Phase 9** はPhase 1-8に依存
- **Phase 10** はPhase 1-9に依存

## Parallel Work Opportunities

- Phase 1のタスク（依存パッケージ、環境変数、エンティティ拡張）は並行可能
- Phase 2のTOTPServiceとレート制限サービスは並行可能
- Phase 5（Swagger）とPhase 6（エラーハンドリング）は部分的に並行可能
- Phase 9のテストタスクは並行可能

## Estimated Effort

- **Phase 1-2**: 1日
- **Phase 3-4**: 1.5日
- **Phase 5-7**: 0.5日
- **Phase 8-10**: 1日

**合計**: 約4日（バックエンドのみ）

## Notes

- バックアップコード（リカバリーコード）は将来の拡張として別変更で実装
- 2FAは必須のため、無効化機能は含めない
- テスト環境でのバイパス機能を含める（`TOTP_BYPASS_FOR_TESTING`）
