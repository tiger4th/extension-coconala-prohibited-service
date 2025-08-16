// コンテンツスクリプトが読み込まれたことを確認
console.log('Content script loaded on:', window.location.href);

// グローバルに公開する関数
window.getOverviewText = async function() {
  try {
    const result = [];
    
    // タイトルを取得
    const titleElement = document.querySelector('.c-overview_overview');
    const overviewElement = document.querySelector('.c-overview_text');
    
    // タイトルを取得
    if (titleElement) {
      result.push({
        title: 'サービスタイトル',
        content: titleElement.textContent.trim(),
        type: 'title'
      });
    } else {
      console.log('No element with class .c-overview_overview found');
    }
    
    // 概要テキストを取得
    if (overviewElement) {
      result.push({
        title: 'タイトル補足説明',
        content: overviewElement.textContent.trim(),
        type: 'overview'
      });
    } else {
      console.log('No element with class .c-overview_text found');
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
            content: content,
            type: 'content'
          });
        }
      });
    } else {
      console.warn('No elements with class .c-contentsFreeText_text found');
    }
    
    // サービスオプションを取得
    const optionElements = document.querySelectorAll('.c-serviceOptionItem_name');
    
    if (optionElements.length > 0) {
      optionElements.forEach((element, index) => {
        const content = element.textContent.trim();
        if (content) {
          const title = optionElements.length > 1
            ? `オプション ${index + 1}`
            : 'サービスオプション';
            
          result.push({
            title: title,
            content: content,
            type: 'option'
          });
        }
      });
    } else {
      console.log('No elements with class .c-serviceOptionItem_name found');
    }
    
    // 結果が空の場合はメッセージを返す
    if (result.length === 0) {
      return 'タイトルとサービス内容が見つかりませんでした';
    }
    
    // すべてのテキストを結合
    let combinedText = '';
    result.forEach(item => {
      if (item.content) {
        combinedText += `${item.title}\n${item.content}\n\n`;
      }
    });
    
    // 結合したテキストを追加
    result.push({
      title: 'すべてのテキスト',
      content: combinedText.trim(),
      type: 'combined'
    });
    
    // APIにリクエストを送信
    try {
      const apiUrl = `https://tiger4th.com/api/extension-coconala-prohibited-service/?content=${encodeURIComponent(combinedText)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.status === 'success' && data.response) {
        // APIのレスポンスを先頭に追加
        result.unshift({
          title: 'AI判定結果',
          content: data.response,
          type: 'ai-analysis'
        });
      }
    } catch (error) {
      console.error('API request failed:', error);
      result.unshift({
        title: 'AI判定エラー',
        content: '判定中にエラーが発生しました。後でもう一度お試しください。',
        type: 'error'
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error in getOverviewText:', error);
    return 'エラーが発生しました: ' + error.message;
  }
}

// ポップアップからのメッセージをリッスン
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);

  if (request.action === 'getOverview') {
    console.log('getOverview request received');
    
    // 非同期で処理を実行
    (async () => {
      try {
        const result = await getOverviewText();
        console.log('Sending response:', result);
        sendResponse({ 
          success: true, 
          result: result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error in getOverview:', error);
        sendResponse({ 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    })();
    
    // 非同期レスポンスを有効にする
    return true;
  }
  
  if (request.action === 'toggle') {
    console.log(`Extension ${request.isActive ? 'activated' : 'deactivated'}`);
    return true;
  }
  
  return false;
});

console.log('Content script initialization complete');
