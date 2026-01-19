# two-factor-auth Specification Delta

## ADDED Requirements

### Requirement: TOTP二要素認証セットアップ

システムはTOTP（Time-based One-Time Password）二要素認証のセットアップ機能を提供しなければなりません(MUST)。

#### Scenario: 2FAセットアップ開始

- **WHEN** 認証済みユーザーがPOST /api/auth/2fa/setupをリクエストする
- **AND** twoFactorSetupCompleteがfalseである
- **THEN** システムは新しいTOTP秘密鍵を生成する
- **AND** QRコード用のotpauthURLを生成する
- **AND** QRコードのData URLを返す
- **AND** 秘密鍵（テキスト）を返す（手動入力用）
- **AND** レスポンスステータスは200 OKである

#### Scenario: 既に2FAセットアップ済みの場合のエラー

- **WHEN** ユーザーがPOST /api/auth/2fa/setupをリクエストする
- **AND** twoFactorSetupCompleteがtrueである
- **THEN** システムは400 Bad Requestエラーを返す
- **AND** エラーメッセージは"Two-factor authentication is already set up"である

#### Scenario: 2FAセットアップ検証

- **WHEN** ユーザーがPOST /api/auth/2fa/verify-setupでTOTPコードを送信する
- **AND** コードが生成された秘密鍵と一致する
- **THEN** システムはTOTPコードを検証する
- **AND** 検証成功時、秘密鍵をAES-256-GCMで暗号化する
- **AND** 暗号化された秘密鍵をCosmosDBに保存する
- **AND** twoFactorSetupCompleteをtrueに設定する
- **AND** twoFactorEnabledをtrueに設定する
- **AND** 本JWTトークン（有効期限7日）を発行する

#### Scenario: 2FAセットアップ検証失敗

- **WHEN** ユーザーがPOST /api/auth/2fa/verify-setupで誤ったTOTPコードを送信する
- **THEN** システムは400 Bad Requestエラーを返す
- **AND** エラーメッセージは"Invalid verification code"である
- **AND** セットアップは完了しない

### Requirement: TOTPログイン検証

システムはログイン時のTOTP検証機能を提供しなければなりません(MUST)。

#### Scenario: TOTP検証成功

- **WHEN** 認証済みユーザー（一時トークン）がPOST /api/auth/2fa/verifyでTOTPコードを送信する
- **AND** twoFactorSetupCompleteがtrueである
- **AND** コードが保存された秘密鍵と一致する
- **THEN** システムはCosmosDBから暗号化された秘密鍵を取得する
- **AND** 秘密鍵を復号化する
- **AND** TOTPコードを検証する
- **AND** 検証成功時、本JWTトークン（有効期限7日）を発行する
- **AND** レスポンスステータスは200 OKである

#### Scenario: TOTP検証失敗

- **WHEN** ユーザーがPOST /api/auth/2fa/verifyで誤ったTOTPコードを送信する
- **THEN** システムは400 Bad Requestエラーを返す
- **AND** エラーメッセージは"Invalid verification code"である
- **AND** 失敗回数がインクリメントされる

#### Scenario: 2FAセットアップ未完了でのTOTP検証エラー

- **WHEN** ユーザーがPOST /api/auth/2fa/verifyをリクエストする
- **AND** twoFactorSetupCompleteがfalseである
- **THEN** システムは400 Bad Requestエラーを返す
- **AND** エラーメッセージは"Two-factor authentication is not set up"である

### Requirement: TOTP設定

システムはTOTPを以下の設定で生成・検証しなければなりません(MUST)。

#### Scenario: TOTP設定の検証

- **WHEN** TOTPコードが生成または検証される
- **THEN** 以下の設定が使用される:
  - アルゴリズム: SHA1
  - 桁数: 6桁
  - 時間ウィンドウ: 30秒
  - 許容ウィンドウ: 1ステップ（前後30秒許容）
  - 発行者: "TODO App"（環境変数で設定可能）

#### Scenario: QRコード生成

- **WHEN** 2FAセットアップ時にQRコードが生成される
- **THEN** QRコードは以下の形式のotpauthURLを含む:
  - `otpauth://totp/TODO App:<email>?secret=<secret>&issuer=TODO App`
- **AND** QRコードはData URL形式（image/png, base64）で返される

### Requirement: レート制限

システムはTOTP検証に対してレート制限を適用しなければなりません(MUST)。

#### Scenario: 連続失敗のカウント

- **WHEN** ユーザーがTOTP検証に失敗する
- **THEN** システムは失敗回数をインクリメントする
- **AND** 失敗回数は5分間保持される

#### Scenario: 最大試行回数超過でのアカウントロック

- **WHEN** ユーザーが5回連続でTOTP検証に失敗する
- **THEN** システムはアカウントを30分間ロックする
- **AND** 429 Too Many Requestsエラーを返す
- **AND** エラーメッセージは"Too many failed attempts. Account locked for 30 minutes"である

#### Scenario: ロックアウト中のアクセス拒否

- **WHEN** ロックアウト中のユーザーがTOTP検証を試みる
- **THEN** システムは429 Too Many Requestsエラーを返す
- **AND** エラーメッセージにロックアウト解除までの残り時間を含む

#### Scenario: 検証成功時の失敗カウントリセット

- **WHEN** ユーザーがTOTP検証に成功する
- **THEN** システムは失敗回数をリセットする
- **AND** ロックアウトがあれば解除する

### Requirement: TOTP秘密鍵の暗号化

システムはTOTP秘密鍵を暗号化して保存しなければなりません(MUST)。

#### Scenario: 秘密鍵の暗号化

- **WHEN** TOTP秘密鍵が保存される
- **THEN** システムはAES-256-GCMで暗号化する
- **AND** 16バイトのランダムなIV（初期化ベクトル）を生成する
- **AND** 認証タグを含める
- **AND** 暗号化データはJSON形式で保存される: `{iv, encryptedData, authTag}`

#### Scenario: 秘密鍵の復号化

- **WHEN** TOTP検証時に秘密鍵が必要になる
- **THEN** システムはCosmosDBから暗号化データを取得する
- **AND** AES-256-GCMで復号化する
- **AND** 認証タグを検証する
- **AND** 改ざんが検出された場合はエラーを返す

#### Scenario: 暗号化キーの管理

- **WHEN** システムが起動する
- **THEN** 環境変数TOTP_ENCRYPTION_KEYから256ビットの暗号化キーを読み込む
- **AND** キーが設定されていない場合はエラーで起動を中止する

### Requirement: 2FA状態確認

システムは現在の2FA設定状態を確認する機能を提供しなければなりません(MUST)。

#### Scenario: 2FA状態の取得

- **WHEN** 認証済みユーザーがGET /api/auth/2fa/statusをリクエストする
- **THEN** システムは以下の情報を返す:
  - `twoFactorEnabled`: boolean
  - `twoFactorSetupComplete`: boolean
- **AND** レスポンスステータスは200 OKである

#### Scenario: 未認証ユーザーの2FA状態取得拒否

- **WHEN** 未認証ユーザーがGET /api/auth/2fa/statusをリクエストする
- **THEN** システムは401 Unauthorizedエラーを返す

### Requirement: 使用済みTOTPコードの再利用防止

システムは一度使用したTOTPコードの再利用を防止しなければなりません(MUST)。

#### Scenario: TOTPコードの使い捨て

- **WHEN** ユーザーがTOTPコードで検証に成功する
- **THEN** システムはそのコードを使用済みとしてマークする
- **AND** 使用済みコードは60秒間キャッシュされる

#### Scenario: 使用済みTOTPコードの再利用拒否

- **WHEN** ユーザーが既に使用したTOTPコードで再度検証を試みる
- **AND** コードがまだ有効期限内である
- **THEN** システムは400 Bad Requestエラーを返す
- **AND** エラーメッセージは"Code has already been used"である
