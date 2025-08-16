// バックグラウンドスクリプト
// 拡張機能のライフサイクル管理やイベントリスナーの設定を行います

// インストール時の処理
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  // デフォルトの設定を保存
  chrome.storage.sync.set({ isActive: false });
});

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 他のコンポーネントからのメッセージを処理
  if (request.action === 'log') {
    console.log('Message from content script:', request.message);
  }
  return true;
});
