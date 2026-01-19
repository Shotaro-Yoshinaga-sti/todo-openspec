export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">TODO リスト</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <p className="text-lg mb-4">
          エンジニア向けTODOリストアプリケーションへようこそ！
        </p>

        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
          <h2 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            開発モード
          </h2>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            現在、開発モードで実行中です。ヘッダーに開発用ボタンが表示されています。
            このボタンは本番環境では表示されません。
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-lg mb-2">機能：</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>開発時のみ表示される API 呼び出しボタン</li>
            <li>環境変数による動作制御</li>
            <li>レスポンシブデザイン</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
