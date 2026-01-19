'use client';

import { useState } from 'react';

export default function Header() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 開発環境かどうかを判定
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleDevButtonClick = async () => {
    setLoading(true);
    setMessage('');

    try {
      // ここで特定のエンドポイントを呼び出す
      // 例: GET /api/debug または POST /api/test-data
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/debug`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`成功: ${JSON.stringify(data)}`);
      } else {
        setMessage(`エラー: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setMessage(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">TODO App</h1>

        <div className="flex items-center gap-4">
          {/* 開発時のみ表示されるボタン */}
          {isDevelopment && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDevButtonClick}
                disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '処理中...' : '🔧 Dev: API呼び出し'}
              </button>
              {message && (
                <span className="text-sm text-yellow-300 max-w-md truncate">
                  {message}
                </span>
              )}
            </div>
          )}

          <nav>
            <ul className="flex gap-4">
              <li>
                <a href="/" className="hover:text-gray-300 transition-colors">
                  ホーム
                </a>
              </li>
              <li>
                <a href="/about" className="hover:text-gray-300 transition-colors">
                  About
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
