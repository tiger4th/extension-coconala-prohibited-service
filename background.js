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
    return true;
  }
  
  // コンテンツスクリプトへのメッセージ転送
  if (request.action === 'getOverview' && request.tabId) {
    console.log('Forwarding message to tab:', request.tabId);
    
    // コンテンツスクリプトにメッセージを送信
    chrome.tabs.sendMessage(request.tabId, { action: 'getOverview' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message to content script:', chrome.runtime.lastError);
        sendResponse({
          success: false,
          error: 'コンテンツスクリプトとの通信に失敗しました。ページをリロードしてください。',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // コンテンツスクリプトからのレスポンスをそのまま返す
      if (response) {
        sendResponse(response);
      }
    });
    
    // 非同期レスポンスを有効にする
    return true;
  }
  
  return false;
});
