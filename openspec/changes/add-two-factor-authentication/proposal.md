# Change Proposal: Add Two-Factor Authentication (TOTP)

## Why

現在、Google OAuth認証の実装が進行中ですが、単一要素認証（Google OAuth のみ）では以下のセキュリティリスクがあります：

1. **アカウント乗っ取りリスク**: Googleアカウントが侵害された場合、TODOアプリへの不正アクセスも許可される
2. **セッション盗聴**: JWTトークンが漏洩した場合、攻撃者が認証済みユーザーとして振る舞える
3. **セキュリティ基準の不足**: 個人情報を扱うアプリケーションとして二要素認証は業界標準
4. **エンジニア向けアプリとしての要求**: ターゲットユーザーはセキュリティ意識の高いエンジニアであり、2FAは期待される機能

エンジニア向けTODOリストアプリとして、TOTP（Time-based One-Time Password）を使用した二要素認証を**必須**で実装し、セキュリティを強化します。

## What Changes

### TOTP二要素認証の実装

- **TOTP秘密鍵の管理**
  - ユーザーごとに一意のTOTP秘密鍵を生成
  - QRコードとシークレットキーの両方を提供
  - 秘密鍵は暗号化してCosmosDBに保存

- **TOTP検証**
  - `otplib`ライブラリを使用してTOTP生成と検証
  - 30秒の時間ウィンドウ
  - 1ステップの時間差を許容（時計のずれ対応）

- **2FA セットアッププロセス**
  - 初回ログイン後、2FA設定が必須
  - QRコードを表示（Google Authenticator等でスキャン）
  - バックアップキーの表示と保存を促す
  - 検証コード入力で設定完了

### Userエンティティの拡張

- **2FA関連フィールドの追加**
  - `totpSecret`: TOTP秘密鍵（暗号化）
  - `twoFactorEnabled`: 2FA有効/無効フラグ（常にtrue、必須のため）
  - `twoFactorSetupComplete`: セットアップ完了フラグ
  - `backupCodes`: バックアップコードのハッシュ配列（オプション、将来実装）

### 認証フローの変更

**現在のフロー（OAuth のみ）**:
```
1. Google OAuth認証 → 2. JWTトークン発行 → 3. ログイン完了
```

**新しいフロー（OAuth + 2FA）**:
```
1. Google OAuth認証
2. 2FAセットアップ確認
   - 未設定 → 2FA セットアップ画面へ
   - 設定済 → TOTP検証画面へ
3. TOTP検証
   - 成功 → JWTトークン発行 → ログイン完了
   - 失敗 → エラー表示、再試行可能
```

### 新規APIエンドポイント

**2FA セットアップ**:
- `POST /api/auth/2fa/setup` - 2FAセットアップ開始（QRコード生成）
- `POST /api/auth/2fa/verify-setup` - セットアップ時のTOTP検証
- `POST /api/auth/2fa/complete-setup` - 2FAセットアップ完了

**2FA ログイン**:
- `POST /api/auth/2fa/verify` - ログイン時のTOTP検証
- `GET /api/auth/2fa/status` - 2FA設定状態の確認

**2FA 管理（将来実装）**:
- `POST /api/auth/2fa/disable` - 2FA無効化（管理者のみ、またはバックアップコード必須）
- `POST /api/auth/2fa/regenerate` - 秘密鍵の再生成

### セキュリティ強化

- **秘密鍵の暗号化**
  - AES-256-GCMで暗号化してCosmosDBに保存
  - 暗号化キーは環境変数`TOTP_ENCRYPTION_KEY`で管理

- **レート制限**
  - TOTP検証に失敗回数制限（5回/5分）
  - 連続失敗でアカウント一時ロック（30分）

- **検証コードの使い捨て**
  - 一度使用したTOTPコードは再利用不可（Replay Attack対策）
  - 使用済みコードをキャッシュ（Redis または CosmosDB）

- **セッション管理の強化**
  - 2FA検証前は一時トークン（短時間有効）のみ発行
  - 2FA検証後に本トークン発行

### 環境変数の追加

- `TOTP_ENCRYPTION_KEY`: TOTP秘密鍵の暗号化キー（256ビット）
- `TOTP_ISSUER`: TOTP発行者名（アプリ名、例: "TODO App"）
- `TOTP_WINDOW`: 時間ウィンドウ（デフォルト: 1）
- `TOTP_MAX_ATTEMPTS`: 最大試行回数（デフォルト: 5）
- `TOTP_LOCKOUT_DURATION`: ロックアウト時間（秒、デフォルト: 1800）

## Impact

### 新規追加される仕様

- `specs/two-factor-auth/` - TOTP二要素認証の要件とシナリオ

### 変更される仕様

- `specs/user-auth/` - 認証フローに2FA検証ステップを追加
  - OAuth認証成功後、2FAセットアップまたは検証が必須
  - JWTトークン発行は2FA検証後のみ

- `specs/user-management/` - Userエンティティに2FA関連フィールドを追加
  - `totpSecret`, `twoFactorEnabled`, `twoFactorSetupComplete` フィールド

### 影響を受けるコード

- `application/backend/src/modules/auth/`
  - `auth.service.ts` - 2FA検証ロジック追加
  - `auth.controller.ts` - 2FA関連エンドポイント追加
  - `strategies/jwt.strategy.ts` - 2FA検証状態の確認

- `application/backend/src/modules/users/`
  - `entities/user.entity.ts` - 2FA関連フィールド追加
  - `users.service.ts` - TOTP秘密鍵の生成・暗号化ロジック

- `application/backend/src/common/`
  - `guards/totp-verified.guard.ts` - 新規作成（2FA検証済みガード）
  - `decorators/totp-verified.decorator.ts` - 新規作成

- `application/backend/package.json`
  - 依存関係追加: `otplib`, `qrcode`, `crypto-js` または `@nestjs/cryptography`

### フロントエンドへの影響

- **2FAセットアップ画面の追加**
  - QRコード表示
  - シークレットキー表示（手動入力用）
  - 検証コード入力フォーム
  - バックアップキー表示（将来実装）

- **2FAログイン画面の追加**
  - TOTP検証コード入力フォーム
  - エラーメッセージ表示
  - 残り試行回数の表示（オプション）

- **認証フローの変更**
  - Google OAuth認証後、2FA画面へリダイレクト
  - 2FA検証成功後にJWTトークン取得

### 開発環境への影響

- Google Authenticatorまたは類似アプリ（Authy、Microsoft Authenticator等）が必要
- テスト用のTOTP検証ツールまたはモックが必要

### 互換性

- **破壊的変更**: 既存ユーザーは次回ログイン時に2FAセットアップが必須
- 既存のJWTトークンは引き続き有効（有効期限まで）
- 新規ログインは2FA検証必須

### パフォーマンスへの影響

- TOTP検証: 軽量な計算（HMACベース）、パフォーマンス影響は最小限
- 暗号化/復号化: 秘密鍵の暗号化は初回セットアップ時のみ
- レート制限: Redisまたは CosmosDB でカウンター管理（軽量）

## Success Criteria

- ユーザーはGoogle OAuth認証後、2FAセットアップが必須
- QRコードをスキャンしてGoogle Authenticatorに登録できる
- 正しいTOTPコードで認証に成功する
- 誤ったTOTPコードで認証が拒否される
- 5回連続失敗でアカウントが一時ロックされる
- 2FA検証なしではJWTトークンが発行されない
- 既に使用したTOTPコードは再利用できない
- 秘密鍵がCosmosDBに暗号化されて保存される
- Swagger UIで2FA関連エンドポイントがドキュメント化される

## Open Questions

1. **バックアップコード（リカバリーコード）の実装**
   - 初期実装に含めるか、後から追加するか？
   - **決定**: 将来実装（Phase 2）。まずTOTPのみ実装

2. **複数デバイスでの2FA**
   - 同じ秘密鍵を複数デバイスで使用可能にする？
   - **決定**: 可能（QRコードとシークレットキーを提供）

3. **2FA無効化の方法**
   - 管理者権限が必要か、ユーザー自身で可能か？
   - **決定**: 2FA必須のため、基本的に無効化不可。緊急時は管理者介入

4. **テスト環境での2FA**
   - テスト環境で2FAをバイパスする仕組みが必要か？
   - **決定**: 環境変数`TOTP_BYPASS_FOR_TESTING=true`でバイパス可能（開発環境のみ）

## Dependencies

- **前提条件**: `add-user-authentication` 変更が完了している必要がある
  - Google OAuth認証
  - Userエンティティ
  - JWTトークン管理

## Related Changes

- `add-user-authentication`: 基本的な認証機能（前提条件）
- 将来の拡張: バックアップコード、SMS認証（オプション）、WebAuthn（FIDO2）
