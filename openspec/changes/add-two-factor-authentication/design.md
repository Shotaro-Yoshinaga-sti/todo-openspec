# Design: Two-Factor Authentication (TOTP)

## Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Frontend   │  HTTPS  │   NestJS     │  Query  │  CosmosDB   │
│  (Next.js)  │◄───────►│   Backend    │◄───────►│  Users      │
└─────────────┘         └──────────────┘         │  (encrypted │
      │                        │                  │  totpSecret)│
      │                        │                  └─────────────┘
      │                 ┌──────▼──────┐
      │                 │   otplib    │
      │                 │  (TOTP Gen) │
      │                 └─────────────┘
      │
      ▼
┌─────────────────┐
│ Google Auth App │
│ (User's Phone)  │
└─────────────────┘
```

## TOTP (Time-based One-Time Password) 仕組み

### アルゴリズム

TOTPはRFC 6238で定義された標準アルゴリズム：

```
TOTP = HOTP(K, T)

where:
  K = 秘密鍵 (Secret Key)
  T = floor(現在時刻 / 時間ステップ)
  HOTP = HMAC-based One-Time Password (RFC 4226)
```

**具体的な計算**:
1. 現在のUNIXタイムスタンプを取得（秒）
2. タイムステップ（30秒）で割る → カウンター値
3. 秘密鍵とカウンター値でHMAC-SHA1を計算
4. HMACの結果から6桁の数字を抽出

**特徴**:
- サーバーとクライアント（Google Authenticator）が同じ秘密鍵を共有
- 両方が現在時刻を使って同じコードを生成
- 30秒ごとにコードが変わる
- 時計のずれを考慮して前後1ステップ（±30秒）も許容

## 認証フロー

### 初回ログイン（2FAセットアップ）

```
User                Frontend           Backend             CosmosDB        Google Auth App
 │                    │                   │                   │                  │
 │  1. Login Button   │                   │                   │                  │
 ├──────────────────►│                   │                   │                  │
 │                    │  2. OAuth Start   │                   │                  │
 │                    ├──────────────────►│                   │                  │
 │                    │                   │  3. Google OAuth  │                  │
 │◄───────────────────┴───────────────────┤                   │                  │
 │  4. Authenticate at Google             │                   │                  │
 ├────────────────────────────────────────►                   │                  │
 │  5. Callback + User Info               │                   │                  │
 ├────────────────────┬───────────────────►                   │                  │
 │                    │                   │  6. Check 2FA     │                  │
 │                    │                   ├──────────────────►│                  │
 │                    │                   │  twoFactorSetupComplete = false     │
 │                    │                   │◄──────────────────┤                  │
 │                    │  7. Redirect to   │                   │                  │
 │                    │  2FA Setup        │                   │                  │
 │                    │◄──────────────────┤                   │                  │
 │  8. Setup Screen   │                   │                   │                  │
 │◄───────────────────┤                   │                   │                  │
 │                    │  9. Request QR    │                   │                  │
 │                    ├──────────────────►│                   │                  │
 │                    │                   │ 10. Generate      │                  │
 │                    │                   │  Secret + QR      │                  │
 │                    │                   │ 11. Encrypt &     │                  │
 │                    │                   │  Save Secret      │                  │
 │                    │                   ├──────────────────►│                  │
 │                    │ 12. Return QR     │                   │                  │
 │                    │◄──────────────────┤                   │                  │
 │ 13. Display QR     │                   │                   │                  │
 │◄───────────────────┤                   │                   │                  │
 │ 14. Scan QR Code   │                   │                   │                  │
 ├────────────────────┴───────────────────┴───────────────────┴─────────────────►│
 │ 15. Generate TOTP (every 30s)                                                 │
 │◄──────────────────────────────────────────────────────────────────────────────┤
 │ 16. Enter Code     │                   │                   │                  │
 ├───────────────────►│                   │                   │                  │
 │                    │ 17. Verify TOTP   │                   │                  │
 │                    ├──────────────────►│                   │                  │
 │                    │                   │ 18. Decrypt       │                  │
 │                    │                   │  Secret           │                  │
 │                    │                   │◄──────────────────┤                  │
 │                    │                   │ 19. Verify Code   │                  │
 │                    │                   │  (otplib)         │                  │
 │                    │                   │ 20. Mark Setup    │                  │
 │                    │                   │  Complete         │                  │
 │                    │                   ├──────────────────►│                  │
 │                    │ 21. Issue JWT     │                   │                  │
 │                    │◄──────────────────┤                   │                  │
 │ 22. Logged In      │                   │                   │                  │
 │◄───────────────────┤                   │                   │                  │
```

### 2回目以降のログイン（2FA検証のみ）

```
User                Frontend           Backend             CosmosDB        Google Auth App
 │                    │                   │                   │                  │
 │  1. Login          │                   │                   │                  │
 ├──────────────────►│                   │                   │                  │
 │  2. OAuth Flow (simplified)            │                   │                  │
 ├────────────────────┴───────────────────┤                   │                  │
 │  3. OAuth Success  │                   │                   │                  │
 ├────────────────────┬───────────────────►                   │                  │
 │                    │                   │  4. Check 2FA     │                  │
 │                    │                   ├──────────────────►│                  │
 │                    │                   │  twoFactorSetupComplete = true      │
 │                    │                   │◄──────────────────┤                  │
 │                    │  5. Redirect to   │                   │                  │
 │                    │  TOTP Input       │                   │                  │
 │                    │◄──────────────────┤                   │                  │
 │  6. TOTP Screen    │                   │                   │                  │
 │◄───────────────────┤                   │                   │                  │
 │  7. Get Code from App                                      │                  │
 ├────────────────────┴───────────────────┴───────────────────┴─────────────────►│
 │◄──────────────────────────────────────────────────────────────────────────────┤
 │  8. Enter Code     │                   │                   │                  │
 ├───────────────────►│                   │                   │                  │
 │                    │  9. Verify TOTP   │                   │                  │
 │                    ├──────────────────►│                   │                  │
 │                    │                   │ 10. Get Secret    │                  │
 │                    │                   ├──────────────────►│                  │
 │                    │                   │ 11. Decrypt       │                  │
 │                    │                   │◄──────────────────┤                  │
 │                    │                   │ 12. Verify Code   │                  │
 │                    │                   │ 13. Check Replay  │                  │
 │                    │                   │ 14. Issue JWT     │                  │
 │                    │◄──────────────────┤                   │                  │
 │ 15. Logged In      │                   │                   │                  │
 │◄───────────────────┤                   │                   │                  │
```

## Data Model

### User Entity (Extended)

```typescript
export class User {
  // Existing fields
  id: string;
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: Date;
  updatedAt: Date;

  // NEW: 2FA fields
  totpSecret?: string;            // Encrypted TOTP secret (base32)
  twoFactorEnabled: boolean;      // Always true (mandatory)
  twoFactorSetupComplete: boolean; // Setup completed flag
  totpSetupDate?: Date;           // When 2FA was setup
  totpLastVerified?: Date;        // Last successful verification

  // Future: Backup codes
  // backupCodes?: string[];      // Hashed backup codes
}
```

### TOTP Secret Encryption

```typescript
// Encryption (AES-256-GCM)
const encryptSecret = (secret: string, key: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

// Decryption
const decryptSecret = (encryptedData: string, key: string): string => {
  const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

## TOTP Implementation

### Secret Generation

```typescript
import { authenticator } from 'otplib';

// Generate a base32 secret (Google Authenticator compatible)
const secret = authenticator.generateSecret(); // e.g., "JBSWY3DPEHPK3PXP"
```

### QR Code Generation

```typescript
import { toDataURL } from 'qrcode';

const generateQRCode = async (user: User, secret: string): Promise<string> => {
  const otpauthUrl = authenticator.keyuri(
    user.email,                    // Account name
    'TODO App',                    // Issuer (from env: TOTP_ISSUER)
    secret
  );
  // otpauthUrl example:
  // "otpauth://totp/TODO%20App:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=TODO%20App"

  const qrCodeDataUrl = await toDataURL(otpauthUrl);
  return qrCodeDataUrl; // data:image/png;base64,iVBORw0KG...
};
```

### TOTP Verification

```typescript
import { authenticator } from 'otplib';

// Configure
authenticator.options = {
  window: 1,  // Accept ±1 time step (±30s)
};

// Verify
const isValid = authenticator.verify({
  token: userInputCode,  // 6-digit code from user
  secret: decryptedSecret,
});

// With time-based check (current counter)
const currentToken = authenticator.generate(decryptedSecret);
```

### Replay Attack Prevention

使用済みTOTPコードのトラッキング：

```typescript
// Option 1: In-memory cache (simple, but lost on restart)
const usedTokens = new Set<string>(); // Format: "userId:token:counter"

// Option 2: CosmosDB (persistent)
interface UsedToken {
  id: string;         // userId:token:counter
  userId: string;
  token: string;
  counter: number;    // Time step counter
  usedAt: Date;
  ttl: number;        // CosmosDB TTL (60 seconds)
}

// Check before verification
const tokenKey = `${userId}:${token}:${currentCounter}`;
if (usedTokens.has(tokenKey)) {
  throw new Error('Token already used');
}

// After successful verification
usedTokens.add(tokenKey);

// Cleanup old tokens (optional if using CosmosDB TTL)
setTimeout(() => usedTokens.delete(tokenKey), 60000);
```

## Security Considerations

### 1. Secret Key Security

**生成**:
- 暗号学的に安全な乱数生成器を使用（`crypto.randomBytes`）
- 十分な長さ（160ビット以上、base32で26文字以上）

**保存**:
- 暗号化必須（AES-256-GCM）
- 暗号化キーは環境変数で管理
- データベースに平文で保存しない

**転送**:
- HTTPS必須
- QRコードは一度だけ表示（セットアップ時）
- シークレットキーのテキスト表示も一度のみ

### 2. Rate Limiting

```typescript
// Rate limiting configuration
interface RateLimitConfig {
  maxAttempts: 5;           // 5回まで試行可能
  windowSeconds: 300;       // 5分間
  lockoutDuration: 1800;    // ロックアウト30分
}

// Implementation (pseudocode)
const attempts = await getAttempts(userId, windowSeconds);
if (attempts >= maxAttempts) {
  if (isLockedOut(userId)) {
    throw new TooManyAttemptsException('Account temporarily locked');
  }
  lockAccount(userId, lockoutDuration);
  throw new TooManyAttemptsException('Too many failed attempts');
}

// Increment on failure
await incrementAttempts(userId);

// Reset on success
await resetAttempts(userId);
```

### 3. Time Synchronization

**問題**: サーバーとユーザーデバイスの時計がずれる可能性

**解決策**:
- `window` パラメータで±30秒の許容範囲を設定
- システム時計をNTPで同期（サーバー側）
- ユーザーにデバイスの時計確認を促す（エラー時）

### 4. Backup Strategy

現在の実装では含めないが、将来の拡張：

```typescript
// Generate 10 backup codes (8-character alphanumeric)
const generateBackupCodes = (): string[] => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
};

// Hash before storage
const hashedCodes = codes.map(code => bcrypt.hashSync(code, 10));

// Verify backup code
const verifyBackupCode = (inputCode: string, hashedCodes: string[]): boolean => {
  for (const hash of hashedCodes) {
    if (bcrypt.compareSync(inputCode, hash)) {
      // Remove used code
      removeBackupCode(hash);
      return true;
    }
  }
  return false;
};
```

## API Design

### Endpoints

```typescript
// 1. Setup Initiation
POST /api/auth/2fa/setup
Request: { } (authenticated, temporary token)
Response: {
  success: true,
  data: {
    qrCode: "data:image/png;base64,...",
    secret: "JBSWY3DPEHPK3PXP",  // For manual entry
    issuer: "TODO App",
    account: "user@example.com"
  }
}

// 2. Setup Verification
POST /api/auth/2fa/verify-setup
Request: {
  token: "123456"  // 6-digit TOTP code
}
Response: {
  success: true,
  message: "2FA setup completed"
}

// 3. Login TOTP Verification
POST /api/auth/2fa/verify
Request: {
  token: "123456",
  tempAuthToken: "temp-jwt-token"  // Temporary token from OAuth
}
Response: {
  success: true,
  data: {
    accessToken: "jwt-access-token",  // Full JWT token
    user: { /* user info */ }
  }
}

// 4. Check 2FA Status
GET /api/auth/2fa/status
Response: {
  success: true,
  data: {
    enabled: true,
    setupComplete: true,
    setupDate: "2024-01-15T10:30:00Z"
  }
}
```

### Error Responses

```typescript
// Invalid TOTP code
{
  success: false,
  error: {
    code: "INVALID_TOTP",
    message: "Invalid verification code",
    statusCode: 401,
    remainingAttempts: 3  // Optional
  }
}

// Too many attempts
{
  success: false,
  error: {
    code: "TOO_MANY_ATTEMPTS",
    message: "Account temporarily locked due to too many failed attempts",
    statusCode: 429,
    lockoutUntil: "2024-01-15T11:00:00Z"
  }
}

// Setup not complete
{
  success: false,
  error: {
    code: "2FA_SETUP_REQUIRED",
    message: "Two-factor authentication setup is required",
    statusCode: 403,
    setupUrl: "/auth/2fa/setup"
  }
}
```

## Frontend Integration

### 2FA Setup Flow

```typescript
// 1. Initiate setup
const { qrCode, secret } = await fetch('/api/auth/2fa/setup', {
  method: 'POST',
  headers: { Authorization: `Bearer ${tempToken}` }
}).then(r => r.json());

// 2. Display QR code
<Image src={qrCode} alt="Scan this QR code" />
<p>Or manually enter: {secret}</p>

// 3. User scans QR code with Google Authenticator

// 4. User enters 6-digit code
const verifyResponse = await fetch('/api/auth/2fa/verify-setup', {
  method: 'POST',
  headers: { Authorization: `Bearer ${tempToken}` },
  body: JSON.stringify({ token: userInput })
});

// 5. Setup complete, redirect to app
```

### 2FA Login Flow

```typescript
// After Google OAuth success
const { requiresTwoFactor, tempToken } = oauthResponse;

if (requiresTwoFactor) {
  // Show TOTP input screen
  const totpCode = await showTotpInputModal();

  // Verify TOTP
  const { accessToken } = await fetch('/api/auth/2fa/verify', {
    method: 'POST',
    body: JSON.stringify({ token: totpCode, tempAuthToken: tempToken })
  }).then(r => r.json());

  // Store full access token
  localStorage.setItem('jwt_token', accessToken);
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('TOTP Service', () => {
  it('should generate a valid TOTP secret', () => {
    const secret = totpService.generateSecret();
    expect(secret).toMatch(/^[A-Z2-7]{16,}$/); // Base32 format
  });

  it('should verify a valid TOTP code', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const token = authenticator.generate(secret);
    const isValid = totpService.verify(token, secret);
    expect(isValid).toBe(true);
  });

  it('should reject an invalid TOTP code', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const isValid = totpService.verify('000000', secret);
    expect(isValid).toBe(false);
  });

  it('should encrypt and decrypt secret correctly', () => {
    const original = 'JBSWY3DPEHPK3PXP';
    const encrypted = totpService.encryptSecret(original);
    const decrypted = totpService.decryptSecret(encrypted);
    expect(decrypted).toBe(original);
  });
});
```

### Integration Tests

```typescript
describe('2FA Setup Flow', () => {
  it('should complete 2FA setup successfully', async () => {
    // 1. OAuth login
    const tempToken = await authenticateWithGoogle();

    // 2. Initiate setup
    const { secret, qrCode } = await request(app)
      .post('/api/auth/2fa/setup')
      .set('Authorization', `Bearer ${tempToken}`)
      .expect(200);

    // 3. Generate TOTP code
    const token = authenticator.generate(secret);

    // 4. Verify setup
    await request(app)
      .post('/api/auth/2fa/verify-setup')
      .set('Authorization', `Bearer ${tempToken}`)
      .send({ token })
      .expect(200);

    // 5. Check user's 2FA status
    const user = await userRepository.findById(userId);
    expect(user.twoFactorSetupComplete).toBe(true);
  });
});
```

### Manual Testing

1. **セットアップテスト**
   - Google OAuth認証
   - QRコード表示確認
   - Google Authenticatorでスキャン
   - 生成されたコードで検証成功

2. **ログインテスト**
   - Google OAuth認証
   - TOTP入力画面表示
   - 正しいコード入力で成功
   - 誤ったコード入力で失敗

3. **セキュリティテスト**
   - 5回失敗でロックアウト
   - 同じコードの再利用不可
   - 暗号化されたシークレットの確認（CosmosDB）

## Deployment Considerations

### Environment Variables

```bash
# Required
TOTP_ENCRYPTION_KEY=64-character-hex-string  # 256-bit key
TOTP_ISSUER="TODO App"

# Optional (with defaults)
TOTP_WINDOW=1
TOTP_MAX_ATTEMPTS=5
TOTP_LOCKOUT_DURATION=1800

# For testing only
TOTP_BYPASS_FOR_TESTING=false  # Set to true in dev environment
```

### Database Migration

既存ユーザーへの対応：

```typescript
// Migration script
async function migrate2FA() {
  const users = await userRepository.findAll();

  for (const user of users) {
    user.twoFactorEnabled = true;
    user.twoFactorSetupComplete = false;  // Require setup on next login
    await userRepository.update(user);
  }

  console.log(`Migrated ${users.length} users to require 2FA`);
}
```

## Performance Impact

| Operation | Latency | Notes |
|-----------|---------|-------|
| Secret Generation | <10ms | One-time per user |
| QR Code Generation | 50-100ms | One-time per user |
| Encryption | <5ms | One-time per user |
| Decryption | <5ms | Every login |
| TOTP Verification | <1ms | HMAC computation (fast) |
| Rate Limit Check | <10ms | CosmosDB query |

**Total overhead per login**: ~20-30ms (negligible)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| User loses device | High | Implement backup codes (Phase 2) |
| Time drift | Medium | Use window=1 for ±30s tolerance |
| Secret key leak | Critical | Encryption at rest, HTTPS in transit |
| Rate limit bypass | Medium | Server-side validation, IP-based throttling |
| Replay attacks | Medium | Track used tokens with TTL |

---

**Implementation Priority**: High (Security-critical feature)
**Dependencies**: `add-user-authentication` must be completed first
**Estimated Effort**: 3-5 days (backend + frontend)
