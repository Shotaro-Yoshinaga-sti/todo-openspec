# Design: Add Two-Factor Authentication

## Context

エンジニア向けTODOリストアプリケーションに、Google OAuth認証とTOTP二要素認証を実装します。現在、認証機能は未実装であり、全てのAPIエンドポイントは認証なしでアクセス可能です。

**制約条件**:
- 個人利用レベル（数百件のTODO想定）
- Azure無料枠・低コスト運用
- CosmosDBを使用
- NestJSバックエンド、Next.jsフロントエンド

## Goals / Non-Goals

**Goals**:
- セキュアなGoogle OAuth認証
- 強力な二要素認証（TOTP）
- ユーザーごとのデータ完全分離
- 使いやすい認証フロー
- 低コストでの運用

**Non-Goals**:
- SMS認証（コスト高）
- 複数の認証プロバイダー（Google以外）
- バックアップコード（Phase 2で実装）
- WebAuthn/FIDO2（将来実装）

## Decisions

### 1. 認証アーキテクチャ: Google OAuth + TOTP

**決定**: 第一要素にGoogle OAuth、第二要素にTOTPを使用

```
┌─────────────────────────────────────────────────────────┐
│                    認証フロー全体                         │
└─────────────────────────────────────────────────────────┘

Step 1: Google OAuth認証
  ユーザー → Google OAuth同意画面 → コールバック
  ↓
  一時トークン発行（2FA未完了）

Step 2: 2FA状態確認
  IF twoFactorSetupComplete == false:
    → 2FAセットアップ画面
  ELSE:
    → TOTP検証画面

Step 3a: 2FAセットアップ（初回のみ）
  - TOTP秘密鍵生成
  - QRコード表示
  - ユーザーがAuthenticatorアプリでスキャン
  - テストコード入力で検証
  - セットアップ完了フラグ設定

Step 3b: TOTP検証（2回目以降）
  - ユーザーがAuthenticatorアプリからコード入力
  - バックエンドでコード検証
  - 成功 → JWTトークン発行

Step 4: 完全な認証完了
  - 長期有効なJWTトークン発行
  - ユーザーセッション確立
```

**理由**:
- Google OAuthで認証の手間を最小化
- TOTPで追加のセキュリティレイヤー
- Authenticatorアプリはエンジニアなら既に使用している
- SMSより低コスト（無料）

**代替案**:
- ❌ **メール/パスワード + TOTP**: パスワード管理の手間、セキュリティリスク
- ❌ **SMS 2FA**: コスト高、個人プロジェクトに不適
- ❌ **OAuth のみ**: セキュリティ不足

### 2. セッション管理: JWT (Stateless)

**決定**: JWTトークンでステートレスなセッション管理

```typescript
// JWTペイロード
interface JwtPayload {
  sub: string;           // userId
  email: string;
  twoFactorVerified: boolean;  // 2FA検証済みフラグ
  iat: number;
  exp: number;
}
```

**トークン種別**:
- **一時トークン**: OAuth認証後、2FA未完了（有効期限: 10分）
- **本トークン**: 2FA検証後（有効期限: 7日）

**理由**:
- ステートレス（Redisなど不要）でコスト削減
- スケーラブル（将来の拡張性）
- NestJSのJWT統合が優れている

**代替案**:
- ❌ **セッションストア（Redis）**: コスト増、個人プロジェクトには過剰
- ❌ **Cookie-based session**: スケールしづらい

### 3. TOTP実装: otplib + QRコード

**決定**: `otplib`ライブラリと`qrcode`でTOTP実装

```typescript
// TOTP設定
const TOTP_CONFIG = {
  algorithm: 'sha1',
  digits: 6,
  period: 30,        // 30秒ごとに更新
  window: 1,         // 前後1ステップ許容（時計のずれ対応）
};

// セットアップフロー
1. 秘密鍵生成: authenticator.generateSecret()
2. QRコード生成: qrcode.toDataURL(otpauthUrl)
3. 検証: authenticator.verify({ token, secret })
```

**理由**:
- 業界標準のライブラリ
- Google Authenticator、Authy、Microsoft Authenticatorと互換性
- シンプルなAPI

**代替案**:
- ❌ **speakeasy**: 機能過多、複雑
- ❌ **自作**: セキュリティリスク、RFC準拠が難しい

### 4. 秘密鍵の暗号化: AES-256-GCM

**決定**: TOTP秘密鍵をAES-256-GCMで暗号化してCosmosDBに保存

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

class EncryptionService {
  encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      iv: iv.toString('hex'),
      encryptedData: encrypted.toString('hex'),
      authTag: authTag.toString('hex'),
    });
  }
}
```

**理由**:
- AES-256-GCMは業界標準の暗号化方式
- 認証タグで改ざん検知
- Node.js標準ライブラリで実装可能（追加依存なし）

**代替案**:
- ❌ **平文保存**: セキュリティリスク大
- ❌ **AES-CBC**: 認証タグなし、改ざん検知不可

### 5. レート制限: メモリベース（初期）

**決定**: 初期はメモリベースのレート制限、将来的にRedis検討

```typescript
class RateLimiterService {
  private attempts = new Map<string, number>();
  private lockouts = new Map<string, Date>();

  checkAttempt(userId: string): boolean {
    const locked = this.lockouts.get(userId);
    if (locked && locked > new Date()) {
      throw new TooManyAttemptsException();
    }

    const count = this.attempts.get(userId) || 0;
    if (count >= TOTP_MAX_ATTEMPTS) {
      this.lockouts.set(userId, new Date(Date.now() + LOCKOUT_DURATION));
      this.attempts.delete(userId);
      throw new TooManyAttemptsException();
    }

    this.attempts.set(userId, count + 1);
    return true;
  }
}
```

**理由**:
- シンプル、追加インフラ不要
- 個人利用レベルでは十分
- 必要に応じてRedisに移行可能

**代替案**:
- ❌ **Redis**: コスト増、インフラ複雑化
- ❌ **レート制限なし**: セキュリティリスク

### 6. ユーザーデータモデル: CosmosDB

**決定**: CosmosDBにUserエンティティを作成、partitionKeyは`userId`

```typescript
@Entity('users')
export class User {
  @PartitionKey()
  id: string;                    // UUID

  email: string;
  name: string;
  googleId: string;              // unique index

  // TOTP関連
  totpSecret: string;            // 暗号化済み
  twoFactorEnabled: boolean;
  twoFactorSetupComplete: boolean;

  createdAt: Date;
  updatedAt: Date;
}
```

**インデックス**:
- `googleId`: unique index（OAuth検索用）
- `email`: index（メール検索用）

**理由**:
- CosmosDBの既存インフラ利用
- partitionKeyでクエリ効率化
- ユーザー数は少ない想定（低コスト）

### 7. TODO データモデル拡張

**決定**: TODO エンティティに`userId`を追加、partitionKeyは維持

```typescript
@Entity('todos')
export class Todo {
  @PartitionKey()
  id: string;                    // UUID

  userId: string;                // 新規追加

  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

**インデックス**:
- `userId`: index（ユーザーごとのクエリ用）

**理由**:
- 既存のpartitionKey設計を変更しない
- userIdでフィルタリング可能

## Risks / Trade-offs

### リスク1: Google OAuth依存

**リスク**: Googleサービス障害時にログインできない

**緩和策**:
- 将来的に他のOAuthプロバイダー追加を検討（GitHub、Microsoft）
- 現時点では許容（個人プロジェクト）

### リスク2: TOTP秘密鍵の紛失

**リスク**: ユーザーがAuthenticatorアプリを紛失した場合、ログイン不可

**緩和策**:
- Phase 2でバックアップコード実装
- 管理者による手動リセット機能（緊急時）

### リスク3: レート制限のメモリベース

**リスク**: サーバー再起動でレート制限がリセットされる

**緩和策**:
- 初期は許容（低リスク）
- 必要に応じてRedis/CosmosDB移行

### トレードオフ1: ステートレス vs ステートフル

**選択**: ステートレス（JWT）

- ✅ インフラコスト削減
- ✅ スケーラブル
- ⚠️ トークン無効化が困難（有効期限まで有効）

**判断**: 個人プロジェクトかつ低コスト優先のため、ステートレスを選択

### トレードオフ2: 2FA必須 vs オプション

**選択**: 2FA必須

- ✅ セキュリティ強化
- ⚠️ 初回ログイン時の手間

**判断**: エンジニア向けアプリのため、2FA必須でも許容範囲

## Migration Plan

**Phase 1: 基本認証（Google OAuth + TOTP）**:
1. ユーザー管理モジュール作成
2. Google OAuth統合
3. TOTP二要素認証実装
4. JWT認証ガード追加
5. TODO APIに認証要件追加
6. 既存TODOデータ移行（最初のユーザーに紐付け）

**Phase 2: セキュリティ強化（将来）**:
1. バックアップコード実装
2. レート制限のRedis移行
3. WebAuthn対応検討

**Phase 3: UX改善（将来）**:
1. 複数OAuthプロバイダー対応
2. "Remember this device"機能
3. セキュリティイベントログ

**ロールバック**:
- 認証モジュール削除
- TODO APIから認証ガード除去
- TODOテーブルからuserId削除（または無視）

## Open Questions

1. **既存TODOの移行方法**
   - 最初にログインしたユーザーに全て紐付ける
   - 移行スクリプトで手動割り当て
   - → **決定**: 最初のユーザーに自動紐付け

2. **開発環境での2FAバイパス**
   - 環境変数でバイパス可能にする？
   - → **決定**: `TOTP_BYPASS_FOR_TESTING=true`で可能

3. **CosmosDBパーティションキー設計**
   - Userは`userId`、TODOは既存の`id`維持
   - → **決定**: 既存設計を変更しない

4. **JWTトークンの有効期限**
   - 一時トークン: 10分
   - 本トークン: 7日
   - → **決定**: 上記で確定
