// コンテンツスクリプトが読み込まれたことを確認
console.log('Content script loaded on:', window.location.href);

// グローバルに公開する関数
window.getOverviewText = function() {
  try {
    console.log('Looking for elements...');
    const overviewElement = document.querySelector('.c-heading_overview');
    const contentElement = document.querySelector('.c-contentsFreeText_text');
    
    let result = [];
    
    // 概要テキストを取得
    if (overviewElement) {
      result.push({
        title: 'サービスタイトル',
        content: overviewElement.textContent.trim()
      });
    } else {
      console.warn('No element with class .c-heading_overview found');
      // 代替セレクタを試す
      const alternativeElement = document.querySelector('.service-detail__overview, .service-overview');
      if (alternativeElement) {
        console.log('Found alternative overview element:', alternativeElement);
        result.push({
          title: 'サービスタイトル',
          content: alternativeElement.textContent.trim()
        });
      }
    }
    
    // コンテンツテキストを取得（複数ある可能性があるためquerySelectorAllを使用）
    const contentElements = document.querySelectorAll('.c-contentsFreeText_text');
    
    if (contentElements.length > 0) {
      // 複数の要素がある場合は、それぞれを個別のセクションとして追加
      contentElements.forEach((element, index) => {
        const content = element.textContent.trim();
        if (content) {
          // 複数ある場合は番号を付与
          const title = contentElements.length > 1 
            ? `サービス内容 ${index + 1}` 
            : 'サービス内容';
            
          result.push({
            title: title,
            content: content
          });
        }
      });
    } else {
      console.warn('No elements with class .c-contentsFreeText_text found');
    }
    
    // 結果が空の場合はメッセージを返す
    if (result.length === 0) {
      return 'タイトルとサービス内容が見つかりませんでした';
    }
    
    return result;
  } catch (error) {
    console.error('Error in getOverviewText:', error);
    return 'エラーが発生しました: ' + error.message;
  }
}

// ポップアップからのメッセージをリッスン
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Message received in content script:', request);
  
  if (request.action === 'getOverview') {
    console.log('getOverview request received');
    try {
      const result = window.getOverviewText ? window.getOverviewText() : 'getOverviewText関数が見つかりません';
      console.log('Sending result:', result);
      
      // 結果が配列の場合はそのまま、それ以外はエラーとして扱う
      const isSuccess = Array.isArray(result);
      
      sendResponse({ 
        success: isSuccess,
        result: isSuccess ? result : [],
        error: isSuccess ? null : result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in message handler:', error);
      sendResponse({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    return true; // 非同期レスポンスのために必要
  }
  
  if (request.action === 'toggle') {
    if (request.isActive) {
      console.log('Extension activated');
    } else {
      console.log('Extension deactivated');
    }
  }
  return true;
});

console.log('Content script initialization complete');
