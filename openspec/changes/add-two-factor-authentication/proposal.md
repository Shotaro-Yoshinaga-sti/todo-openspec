# Change Proposal: Add Two-Factor Authentication

## Why

現在、TODOアプリには認証機能が実装されていません。エンジニア向けのタスク管理アプリとして、以下のセキュリティ要件を満たす必要があります：

1. **ユーザー認証**: Google OAuth を使用した安全なユーザー認証
2. **データ分離**: ユーザーごとにTODOデータを完全に分離
3. **セキュリティ強化**: 二要素認証(TOTP)による追加のセキュリティレイヤー

Google OAuth単独では、Googleアカウントが侵害された場合やセッショントークンが漏洩した場合のリスクが残ります。TOTP二要素認証を追加することで、以下を実現します：

- **アカウント乗っ取り防止**: 認証情報漏洩時の追加防御層
- **業界標準のセキュリティ**: エンジニア向けアプリとしての期待に応える
- **セッション保護**: トークン漏洩時のリスク軽減

## What Changes

### 認証システムの全体構成

**Google OAuth認証 + TOTP二要素認証**の組み合わせで実装：

```
1. Google OAuth認証（第一要素）
   ↓
2. 2FAセットアップ確認
   - 未設定 → セットアップ画面へ
   - 設定済 → TOTP検証画面へ
   ↓
3. TOTP検証（第二要素）
   ↓
4. JWTトークン発行
   ↓
5. 認証完了
```

### 新規機能

#### 1. Google OAuth認証
- NestJS Passportを使用したGoogle OAuth2.0連携
- ユーザープロフィール情報の取得と保存
- 初回ログイン時のユーザー自動作成

#### 2. TOTP二要素認証
- `otplib`を使用したTOTP生成・検証
- QRコードとシークレットキーの提供
- 30秒時間ウィンドウ、1ステップ許容

#### 3. ユーザー管理
- ユーザーエンティティの作成
- TOTP秘密鍵の暗号化保存
- ユーザーごとのTODOデータ分離

#### 4. セキュリティ機能
- JWTトークンベースのセッション管理
- レート制限（5回/5分）
- 秘密鍵のAES-256-GCM暗号化

### 新規APIエンドポイント

**OAuth認証**:
- `GET /api/auth/google` - Google OAuth開始
- `GET /api/auth/google/callback` - OAuth コールバック
- `POST /api/auth/logout` - ログアウト

**2FA セットアップ**:
- `POST /api/auth/2fa/setup` - 2FAセットアップ開始
- `POST /api/auth/2fa/verify-setup` - セットアップ検証
- `GET /api/auth/2fa/status` - 2FA状態確認

**2FA ログイン**:
- `POST /api/auth/2fa/verify` - TOTP検証

**ユーザー管理**:
- `GET /api/users/me` - 現在のユーザー情報取得
- `PUT /api/users/me` - ユーザー情報更新

### データモデル

#### User エンティティ
```typescript
{
  id: string;                    // UUID
  email: string;                 // Google アカウントメール
  name: string;                  // 表示名
  googleId: string;              // Google ユーザーID
  totpSecret: string;            // TOTP秘密鍵（暗号化）
  twoFactorEnabled: boolean;     // 2FA有効フラグ
  twoFactorSetupComplete: boolean; // セットアップ完了フラグ
  createdAt: Date;
  updatedAt: Date;
}
```

### 既存機能への影響

**TODO API**:
- 全エンドポイントにJWT認証ガードを追加
- TODO エンティティに`userId`フィールド追加
- ユーザーごとのデータフィルタリング

### 環境変数の追加

```
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

# JWT
JWT_SECRET=
JWT_EXPIRATION=7d

# TOTP
TOTP_ENCRYPTION_KEY=
TOTP_ISSUER="TODO App"
TOTP_WINDOW=1
TOTP_MAX_ATTEMPTS=5
TOTP_LOCKOUT_DURATION=1800
```

## Impact

### 新規追加される仕様

- `specs/user-auth/spec.md` - 認証フロー全体
- `specs/user-management/spec.md` - ユーザー管理
- `specs/two-factor-auth/spec.md` - TOTP二要素認証

### 変更される仕様

- `specs/todo-api/spec.md` - 全エンドポイントに認証要件を追加

### 影響を受けるコード

**新規作成**:
- `application/backend/src/modules/auth/` - 認証モジュール
- `application/backend/src/modules/users/` - ユーザー管理モジュール
- `application/backend/src/common/guards/jwt-auth.guard.ts`
- `application/backend/src/common/guards/totp-verified.guard.ts`
- `application/backend/src/common/decorators/current-user.decorator.ts`

**変更**:
- `application/backend/src/modules/todos/entities/todo.entity.ts` - userId追加
- `application/backend/src/modules/todos/todos.controller.ts` - 認証ガード追加
- `application/backend/src/modules/todos/todos.service.ts` - ユーザーフィルタリング追加

**依存関係追加**:
- `@nestjs/passport`
- `passport`
- `passport-google-oauth20`
- `@nestjs/jwt`
- `otplib`
- `qrcode`

### フロントエンドへの影響

- Google OAuthログインボタン
- 2FAセットアップ画面（QRコード表示）
- 2FAログイン画面（TOTP入力）
- ユーザープロフィール表示
- 認証状態管理

### 破壊的変更

- **既存のTODOデータ**: 既存TODOは最初にログインしたユーザーに紐付ける必要がある
- **API認証**: 全TODO APIエンドポイントが認証必須になる

## Success Criteria

**Google OAuth認証**:
- ユーザーはGoogleアカウントでログインできる
- 初回ログイン時、ユーザーレコードが自動作成される
- OAuth成功後、一時トークンが発行される

**TOTP二要素認証**:
- 初回ログイン後、2FAセットアップが必須
- QRコードをスキャンしてAuthenticatorアプリに登録できる
- 正しいTOTPコードで認証成功する
- 誤ったコードで認証が拒否される
- 5回連続失敗でアカウントが一時ロックされる

**セキュリティ**:
- TOTP秘密鍵が暗号化されてCosmosDBに保存される
- 使用済みTOTPコードは再利用できない
- JWTトークンは2FA検証後のみ発行される

**TODO API統合**:
- 全TODO APIエンドポイントが認証を要求する
- ユーザーは自分のTODOのみアクセスできる
- 他ユーザーのTODOは取得・変更できない

**ドキュメント**:
- Swagger UIで全エンドポイントがドキュメント化される
- 認証フローが明確に説明される

## Open Questions

1. **既存TODOデータの移行**
   - 認証実装前に作成されたTODOをどのユーザーに紐付けるか？
   - **提案**: 最初にログインしたユーザーに全て紐付ける

2. **2FA必須化のタイミング**
   - 初回実装から必須にするか、オプションから開始するか？
   - **提案**: 最初から必須（セキュリティ優先）

3. **バックアップコード**
   - 初期実装に含めるか？
   - **提案**: Phase 2で実装（まずTOTPのみ）

4. **テスト環境での2FA**
   - 開発・テスト時に2FAをバイパスする仕組みが必要か？
   - **提案**: 環境変数`TOTP_BYPASS_FOR_TESTING=true`でバイパス可能

## Dependencies

なし（新規機能）

## Related Changes

- 将来の拡張: バックアップコード、WebAuthn対応
