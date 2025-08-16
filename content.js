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
      result.push({
        title: 'サービスタイトル',
        content: 'サービスタイトルは取得できませんでした。ページに存在するのに取得できない場合はココナラの仕様変更の可能性があります。作者の<a href="https://github.com/tiger4th/extension-coconala-prohibited-service" target="_blank" style="color: #0066cc; text-decoration: underline;">GitHub</a>または<a href="https://coconala.com/users/167331" target="_blank" style="color: #0066cc; text-decoration: underline;">ココナラ</a>までご連絡ください。',
        type: 'error'
      });
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
      result.push({
        title: 'タイトル補足説明',
        content: 'タイトル補足説明は取得できませんでした。ページに存在するのに取得できない場合はココナラの仕様変更の可能性があります。作者の<a href="https://github.com/tiger4th/extension-coconala-prohibited-service" target="_blank" style="color: #0066cc; text-decoration: underline;">GitHub</a>または<a href="https://coconala.com/users/167331" target="_blank" style="color: #0066cc; text-decoration: underline;">ココナラ</a>までご連絡ください。',
        type: 'error'
      });
    }
    
    // コンテンツテキストを取得（複数ある可能性があるためquerySelectorAllを使用）
    const contentElements = document.querySelectorAll('.c-contentsFreeText_text');
    
    if (contentElements.length > 0) {
      // 複数の要素がある場合は、それぞれを個別のセクションとして追加
      contentElements.forEach((element, index) => {
        const content = element.textContent.trim();
        if (content) {
          // 最初の要素は「サービス内容」、2つ目は「購入にあたってのお願い」、他は番号付き
          let title = 'サービス内容';
          if (contentElements.length > 1) {
            title = index === 0 ? 'サービス内容' : 
                   index === 1 ? '購入にあたってのお願い' : 
                   `サービス内容 ${index + 1}`;
          }
            
          result.push({
            title: title,
            content: content,
            type: 'content'
          });
        }
      });
    } else {
      console.warn('No elements with class .c-contentsFreeText_text found');
      result.push({
        title: 'サービス内容',
        content: 'サービス内容は取得できませんでした。ページに存在するのに取得できない場合はココナラの仕様変更の可能性があります。作者の<a href="https://github.com/tiger4th/extension-coconala-prohibited-service" target="_blank" style="color: #0066cc; text-decoration: underline;">GitHub</a>または<a href="https://coconala.com/users/167331" target="_blank" style="color: #0066cc; text-decoration: underline;">ココナラ</a>までご連絡ください。',
        type: 'error'
      });
    }
    
    // オプションを取得
    const optionElements = document.querySelectorAll('.c-serviceOptionItem_name');
    
    if (optionElements.length > 0) {
      optionElements.forEach((element, index) => {
        const content = element.textContent.trim();
        if (content) {
          const title = optionElements.length > 1
            ? `オプション ${index + 1}`
            : 'オプション';
            
          result.push({
            title: title,
            content: content,
            type: 'option'
          });
        }
      });
    } else {
      console.log('No elements with class .c-serviceOptionItem_name found');
      // オプションは必須ではないので、エラーではなく情報として表示
      result.push({
        title: 'オプション',
        content: 'オプションはありません。',
        type: 'info'
      });
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
        content: '判定中にエラーが発生しました。後でもう一度お試しください。アクセス集中の場合、しばらくご利用いただけない場合があります。',
        type: 'error'
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error in getOverviewText:', error);
    return 'エラーが発生しました: ' + error.message;
  }
}

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('コンテンツスクリプトでメッセージを受信:', request);

  if (request.action === 'getOverview') {
    console.log('getOverviewリクエストを受信');
    
    // 非同期処理を実行
    (async () => {
      try {
        const result = await getOverviewText();
        console.log('レスポンスを送信:', result);
        
        // 結果を返す（'すべてのテキスト'は除外）
        if (typeof sendResponse === 'function') {
          const filteredResult = Array.isArray(result) 
            ? result.filter(item => item.title !== 'すべてのテキスト')
            : [{
                title: '結果',
                content: result,
                type: 'default'
              }];
          
          sendResponse({ 
            success: true, 
            result: filteredResult,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('getOverviewでエラー:', error);
        if (typeof sendResponse === 'function') {
          sendResponse({ 
            success: false, 
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    })();
    
    // 非同期レスポンスを有効にする
    return true;
  }
  
  
  return false;
});

console.log('Content script initialization complete');
