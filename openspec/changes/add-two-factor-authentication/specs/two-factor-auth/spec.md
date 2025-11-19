# Spec Delta: two-factor-auth

## ADDED Requirements

### Requirement: TOTP秘密鍵の生成と管理

システムはユーザーごとに一意のTOTP秘密鍵を生成し、安全に管理しなければなりません(MUST)。

#### Scenario: TOTP秘密鍵の生成

- **WHEN** ユーザーが初めて2FAセットアップを開始する
- **THEN** システムは暗号学的に安全な乱数生成器を使用してTOTP秘密鍵を生成する
- **AND** 秘密鍵はbase32形式である
- **AND** 秘密鍵の長さは最低26文字（160ビット）以上である

#### Scenario: TOTP秘密鍵の暗号化保存

- **WHEN** TOTP秘密鍵が生成される
- **THEN** システムはAES-256-GCMアルゴリズムで秘密鍵を暗号化する
- **AND** 暗号化キーは環境変数`TOTP_ENCRYPTION_KEY`から取得する
- **AND** 暗号化された秘密鍵をCosmosDBに保存する
- **AND** 平文の秘密鍵はデータベースに保存してはならない

#### Scenario: TOTP秘密鍵の復号化

- **WHEN** システムがTOTP検証のために秘密鍵が必要になる
- **THEN** CosmosDBから暗号化された秘密鍵を取得する
- **AND** 環境変数の暗号化キーを使用して復号化する
- **AND** 復号化した秘密鍵をメモリ上でのみ使用する
- **AND** 復号化した秘密鍵をログに出力してはならない

### Requirement: QRコードの生成と表示

システムは2FAセットアップ用のQRコードを生成しなければなりません(MUST)。

#### Scenario: QRコード生成

- **WHEN** ユーザーが2FAセットアップを開始する
- **THEN** システムはTOTP秘密鍵からQRコードを生成する
- **AND** QRコードは`otpauth://`スキームのURIを含む
- **AND** URIにはアカウント名（ユーザーのメールアドレス）、発行者名、秘密鍵が含まれる
- **AND** QRコードはdata URL形式（`data:image/png;base64,...`）で返される

#### Scenario: QRコード表示

- **WHEN** クライアントがQRコードを受け取る
- **THEN** QRコードを画像として表示する
- **AND** シークレットキーのテキストも表示する（手動入力用）
- **AND** 発行者名とアカウント名を表示する
- **AND** QRコードは一度のみ表示され、再表示はできない

#### Scenario: QRコードの再表示防止

- **WHEN** ユーザーが既に2FAセットアップを完了している
- **THEN** QRコード生成エンドポイントへのアクセスは拒否される
- **AND** エラーメッセージは`2FA setup already completed`

### Requirement: TOTP検証

システムは6桁のTOTPコードを検証しなければなりません(MUST)。

#### Scenario: 正しいTOTPコードの検証成功

- **WHEN** ユーザーが現在有効な6桁のTOTPコードを入力する
- **THEN** システムはユーザーの秘密鍵を復号化する
- **AND** 現在の時刻と秘密鍵を使用してTOTPコードを計算する
- **AND** ユーザー入力と計算されたコードが一致する場合、検証成功とする
- **AND** レスポンスステータスは200 OKである

#### Scenario: 時計のずれを考慮したTOTP検証

- **WHEN** ユーザーのデバイスとサーバーの時計が最大30秒ずれている
- **THEN** システムは±1時間ステップ（±30秒）の範囲でTOTPコードを検証する
- **AND** 前の時間ステップまたは次の時間ステップで生成されたコードも有効とする

#### Scenario: 無効なTOTPコードの検証失敗

- **WHEN** ユーザーが誤った6桁のコードを入力する
- **THEN** システムは検証失敗とする
- **AND** エラーメッセージ`Invalid verification code`を返す
- **AND** レスポンスステータスは401 Unauthorizedである
- **AND** 失敗回数をカウントする

#### Scenario: 期限切れTOTPコードの検証失敗

- **WHEN** ユーザーが60秒以上前のTOTPコードを入力する
- **THEN** システムは検証失敗とする
- **AND** エラーメッセージ`Code expired, please use a new code`を返す

### Requirement: Replay Attack対策

システムは一度使用したTOTPコードの再利用を防止しなければなりません(MUST)。

#### Scenario: 使用済みTOTPコードの拒否

- **WHEN** ユーザーが既に使用したTOTPコードを再度入力する
- **THEN** システムは検証を拒否する
- **AND** エラーメッセージ`Token already used`を返す
- **AND** レスポンスステータスは401 Unauthorizedである

#### Scenario: 使用済みトークンのトラッキング

- **WHEN** TOTP検証が成功する
- **THEN** システムは使用されたトークンをトラッキングする
- **AND** トークンは`userId:token:counter`の形式でキャッシュする
- **AND** トークンは60秒後に自動的に削除される（TTL）

### Requirement: レート制限

システムはTOTP検証の試行回数を制限しなければなりません(MUST)。

#### Scenario: レート制限内のTOTP検証

- **WHEN** ユーザーが5分間に5回未満のTOTP検証を試行する
- **THEN** システムは検証を実行する
- **AND** 残り試行回数をレスポンスに含める（オプション）

#### Scenario: レート制限超過によるアカウントロック

- **WHEN** ユーザーが5分間に5回TOTP検証に失敗する
- **THEN** システムはアカウントを30分間ロックする
- **AND** エラーメッセージ`Account temporarily locked due to too many failed attempts`を返す
- **AND** レスポンスステータスは429 Too Many Requestsである
- **AND** ロックアウト解除時刻を返す

#### Scenario: ロックアウト中のTOTP検証拒否

- **WHEN** ロックアウトされたユーザーがTOTP検証を試行する
- **THEN** システムは検証を拒否する
- **AND** エラーメッセージ`Account locked until <timestamp>`を返す
- **AND** レスポンスステータスは429 Too Many Requestsである

#### Scenario: ロックアウト解除

- **WHEN** ロックアウト時間が経過する
- **THEN** システムは自動的にアカウントのロックを解除する
- **AND** 失敗回数をリセットする
- **AND** ユーザーは再度TOTP検証を試行できる

#### Scenario: 検証成功時の失敗回数リセット

- **WHEN** TOTP検証が成功する
- **THEN** システムは失敗回数カウンターをリセットする
- **AND** ロックアウト状態を解除する

### Requirement: 2FAセットアップフロー

システムは初回ログイン時に2FAセットアップを強制しなければなりません(MUST)。

#### Scenario: 初回ログイン時の2FAセットアップ強制

- **WHEN** ユーザーがGoogle OAuth認証に成功する
- **AND** ユーザーの`twoFactorSetupComplete`がfalseである
- **THEN** システムは一時トークン（短時間有効）を発行する
- **AND** 2FAセットアップページへのリダイレクトURLを返す
- **AND** 完全なJWTトークンは発行しない

#### Scenario: 2FAセットアップ開始

- **WHEN** ユーザーが一時トークンを持って2FAセットアップを開始する
- **THEN** システムはTOTP秘密鍵を生成する
- **AND** 秘密鍵を暗号化してCosmosDBに保存する
- **AND** QRコードとシークレットキーを返す

#### Scenario: 2FAセットアップ検証

- **WHEN** ユーザーがQRコードをスキャンして生成されたTOTPコードを入力する
- **THEN** システムはTOTPコードを検証する
- **AND** 検証成功時、`twoFactorSetupComplete`をtrueに更新する
- **AND** `totpSetupDate`を現在時刻に設定する
- **AND** セットアップ完了メッセージを返す

#### Scenario: 2FAセットアップ未完了でのログイン拒否

- **WHEN** ユーザーが2FAセットアップを完了せずにログインを試みる
- **THEN** システムはログインを拒否する
- **AND** エラーメッセージ`2FA setup required`を返す
- **AND** レスポンスステータスは403 Forbiddenである
- **AND** セットアップページへのリダイレクトURLを含める

### Requirement: 2FAログインフロー

システムは2回目以降のログイン時に2FA検証を要求しなければなりません(MUST)。

#### Scenario: 2FAセットアップ完了ユーザーのログイン

- **WHEN** ユーザーがGoogle OAuth認証に成功する
- **AND** ユーザーの`twoFactorSetupComplete`がtrueである
- **THEN** システムは一時トークンを発行する
- **AND** TOTP検証ページへのリダイレクトURLを返す
- **AND** 完全なJWTトークンは発行しない

#### Scenario: ログイン時のTOTP検証成功

- **WHEN** ユーザーが一時トークンと正しいTOTPコードを送信する
- **THEN** システムはTOTPコードを検証する
- **AND** 検証成功時、完全なJWTトークンを発行する
- **AND** `totpLastVerified`を現在時刻に更新する
- **AND** ユーザー情報とトークンを返す

#### Scenario: ログイン時のTOTP検証失敗

- **WHEN** ユーザーが一時トークンと誤ったTOTPコードを送信する
- **THEN** システムはTOTP検証を拒否する
- **AND** エラーメッセージと残り試行回数を返す
- **AND** 完全なJWTトークンは発行しない

### Requirement: 一時トークン管理

システムは2FA検証前の一時トークンを発行しなければなりません(MUST)。

#### Scenario: 一時トークンの発行

- **WHEN** ユーザーがGoogle OAuth認証に成功する
- **THEN** システムは有効期限5分の一時トークンを発行する
- **AND** 一時トークンのペイロードには`userId`と`requiresTwoFactor: true`が含まれる
- **AND** 一時トークンではTODO APIへのアクセスは不可

#### Scenario: 一時トークンの検証

- **WHEN** クライアントが一時トークンを使用して2FA関連エンドポイントにアクセスする
- **THEN** システムは一時トークンの署名を検証する
- **AND** 一時トークンの有効期限を確認する
- **AND** `requiresTwoFactor`フラグを確認する
- **AND** すべて有効な場合、リクエストを処理する

#### Scenario: 一時トークンの有効期限切れ

- **WHEN** 一時トークンの有効期限（5分）が切れる
- **THEN** システムは一時トークンを拒否する
- **AND** エラーメッセージ`Temporary token expired, please login again`を返す
- **AND** レスポンスステータスは401 Unauthorizedである

#### Scenario: 一時トークンでのTODO APIアクセス拒否

- **WHEN** ユーザーが一時トークンを使用してTODO APIにアクセスする
- **THEN** システムはアクセスを拒否する
- **AND** エラーメッセージ`2FA verification required`を返す
- **AND** レスポンスステータスは403 Forbiddenである

### Requirement: 2FA状態の確認

システムはユーザーの2FA設定状態を確認するエンドポイントを提供しなければなりません(MUST)。

#### Scenario: 2FA状態の取得

- **WHEN** 認証済みユーザーがGET /api/auth/2fa/statusをリクエストする
- **THEN** システムは以下の情報を返す:
  ```json
  {
    "success": true,
    "data": {
      "enabled": true,
      "setupComplete": true,
      "setupDate": "2024-01-15T10:30:00Z",
      "lastVerified": "2024-01-20T08:15:00Z"
    }
  }
  ```
- **AND** レスポンスステータスは200 OK

#### Scenario: 未認証ユーザーの2FA状態確認拒否

- **WHEN** 未認証ユーザーがGET /api/auth/2fa/statusをリクエストする
- **THEN** システムは401 Unauthorizedを返す

### Requirement: エラーハンドリング

システムは2FA関連のエラーを統一された形式で返さなければなりません(MUST)。

#### Scenario: 無効なTOTPコードエラー

- **WHEN** TOTP検証が失敗する
- **THEN** システムは以下の形式でエラーを返す:
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_TOTP",
      "message": "Invalid verification code",
      "statusCode": 401,
      "remainingAttempts": 3
    }
  }
  ```

#### Scenario: レート制限エラー

- **WHEN** ユーザーがレート制限に達する
- **THEN** システムは以下の形式でエラーを返す:
  ```json
  {
    "success": false,
    "error": {
      "code": "TOO_MANY_ATTEMPTS",
      "message": "Account temporarily locked due to too many failed attempts",
      "statusCode": 429,
      "lockoutUntil": "2024-01-15T11:00:00Z"
    }
  }
  ```

#### Scenario: 2FAセットアップ必須エラー

- **WHEN** ユーザーが2FAセットアップを完了していない
- **THEN** システムは以下の形式でエラーを返す:
  ```json
  {
    "success": false,
    "error": {
      "code": "2FA_SETUP_REQUIRED",
      "message": "Two-factor authentication setup is required",
      "statusCode": 403,
      "setupUrl": "/api/auth/2fa/setup"
    }
  }
  ```

### Requirement: テスト環境でのバイパス

システムは開発環境でのテストを容易にするため、2FAをバイパスする機能を提供しなければなりません(MUST)。

#### Scenario: テスト環境での2FAバイパス

- **WHEN** 環境変数`TOTP_BYPASS_FOR_TESTING`がtrueに設定されている
- **AND** `NODE_ENV`が`development`または`test`である
- **THEN** システムは任意のTOTPコード（例: `000000`）を受け入れる
- **AND** バイパスが有効であることをログに記録する

#### Scenario: 本番環境での2FAバイパス無効化

- **WHEN** 環境変数`NODE_ENV`が`production`である
- **THEN** `TOTP_BYPASS_FOR_TESTING`の値に関わらず、バイパスは無効である
- **AND** すべてのTOTP検証が正常に実行される

### Requirement: Swagger API ドキュメント

システムは2FA関連エンドポイントをSwagger UIでドキュメント化しなければなりません(MUST)。

#### Scenario: Swagger UIでの2FAエンドポイント表示

- **WHEN** 開発者がSwagger UI（/api/docs）にアクセスする
- **THEN** 2FA関連エンドポイントが`2FA`タグでグループ化されて表示される
- **AND** 各エンドポイントの説明、リクエスト形式、レスポンス形式が明記される
- **AND** 認証が必要なエンドポイントには鍵アイコンが表示される

#### Scenario: 2FAフローのドキュメント

- **WHEN** 開発者がSwagger UIで2FA関連のドキュメントを参照する
- **THEN** セットアップフローとログインフローの説明が含まれる
- **AND** QRコードのサンプルレスポンスが表示される
- **AND** エラーレスポンスの例が表示される
