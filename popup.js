// Helper function to show error messages
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.color = '#f44336';
  errorDiv.style.margin = '10px 0';
  errorDiv.style.padding = '8px';
  errorDiv.style.border = '1px solid #ffcdd2';
  errorDiv.style.borderRadius = '4px';
  errorDiv.style.backgroundColor = '#ffebee';
  document.body.appendChild(errorDiv);
}

document.addEventListener('DOMContentLoaded', function() {
  // Check if current URL is a Coconala service page
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs || tabs.length === 0) {
      console.error('No active tab found');
      showError('アクティブなタブが見つかりません');
      return;
    }

    const url = tabs[0]?.url || '';
    console.log('Current URL:', url);
    
    const isCoconalaService = url.startsWith('https://coconala.com/services/') || url.includes('coconala.com/mypage/services/');
    
    if (isCoconalaService) {
      // コンテンツスクリプトが読み込まれているか確認
      console.log('Injecting content script...');
      try {
        // まずcontent_scriptsが読み込まれているか確認するために、タブの状態を取得
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          function: () => {
            console.log('Content script check:', typeof getOverviewText);
            return typeof getOverviewText;
          }
        }, (results) => {
          if (chrome.runtime.lastError) {
            console.error('Content script injection error:', chrome.runtime.lastError);
            showError(`コンテンツスクリプトの読み込みに失敗しました: ${chrome.runtime.lastError.message}\nページをリロードしてみてください。`);
            return;
          }
          
          console.log('Content script check result:', results);
          
          // 結果表示エリアをクリア
          const resultsContainer = document.getElementById('results');
          resultsContainer.innerHTML = '';
          
          // ローディング表示を追加
          const loadingDiv = document.createElement('div');
          loadingDiv.className = 'loading-container';
          loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <p>AIによる分析中です...</p>
          `;
          resultsContainer.appendChild(loadingDiv);
          
          // アクティブなタブを取得
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            
            if (!tab) {
              console.error('No active tab found');
              displayError('アクティブなタブが見つかりません');
              return;
            }
            
            console.log('Sending message to tab:', tab.id);
            
            // ポップアップが閉じられても処理を続行できるようにbackground.jsに処理を移譲
            chrome.runtime.sendMessage({
              action: 'getOverview',
              tabId: tab.id
            }, (response) => {
              // 接続エラーの場合
              if (chrome.runtime.lastError) {
                console.error('メッセージ送信エラー:', chrome.runtime.lastError);
                showError('データの取得中にエラーが発生しました。ページをリロードしてもう一度お試しください。');
                return;
              }
              
              console.log('コンテンツスクリプトからのレスポンス:', response);
              
              // ローディング表示を削除
              const loadingElement = document.querySelector('.loading-container');
              if (loadingElement) {
                loadingElement.remove();
              }
              
              if (!response) {
                showError('コンテンツスクリプトからの応答がありません');
                return;
              }
              
              if (response.success && Array.isArray(response.result)) {
                response.result.forEach((item, index) => {
                  if (!item || !item.title) return;
                  
                  const section = document.createElement('div');
                  section.className = 'result-section';
                  section.setAttribute('data-type', item.type || 'default');
                  
                  // Check for AI judgment result and apply appropriate background color
                  if (item.title === 'AI判定結果' && item.content) {
                    if (item.content.includes('禁止事項に該当する\n')) {
                      section.style.backgroundColor = '#ffebee'; // Light red
                      section.style.borderLeft = '4px solid #f44336'; // Red border
                    } else if (item.content.includes('禁止事項に該当しない\n')) {
                      section.style.backgroundColor = '#e3f2fd'; // Light blue
                      section.style.borderLeft = '4px solid #2196f3'; // Blue border
                    }
                    section.style.padding = '10px';
                    section.style.marginBottom = '10px';
                    section.style.borderRadius = '4px';
                  }
                  
                  section.innerHTML = `
                    <h3>${item.title}</h3>
                    <div class="result-content">${item.content || '内容がありません'}</div>
                    ${item.title === 'AI判定結果' ? 
                      '<div style="margin-top: 10px; font-size: 12px; color: #666; padding: 8px; background-color: #f5f5f5; border-radius: 4px;">' +
                      'AIは間違えることがあります。結果は参考としてご利用ください。出品禁止サービスの詳細は' +
                      '<a href="https://coconala-support.zendesk.com/hc/ja/articles/9517249749017" target="_blank" style="color: #1976d2; text-decoration: none;">こちら</a>' +
                      '</div>' : ''}
                  `;
                  resultsContainer.appendChild(section);
                  
                  // 最後の要素以外に区切り線を追加
                  if (index < response.result.length - 1) {
                    const separator = document.createElement('div');
                    separator.className = 'separator';
                    resultsContainer.appendChild(separator);
                  }
                });
              } else {
                // エラーケースの処理
                const errorSection = document.createElement('div');
                errorSection.className = 'error-section';
                errorSection.textContent = response ? (response.error || '情報を取得できませんでした') : 'サーバーからの応答がありません';
                resultsContainer.appendChild(errorSection);
              }
              
              // 結果を表示
              if (resultsContainer) {
                const container = document.querySelector('.container');
                if (container) {
                  container.appendChild(resultsContainer);
                } else {
                  document.body.appendChild(resultsContainer);
                }
              }
            });
          });
        });
      } catch (error) {
        console.error('Error in content script check:', error);
        displayError('エラーが発生しました: ' + error.message);
        showError(`エラーが発生しました: ${error.message}\nページをリロードしてみてください`);
      }
    } else {
      showError('ココナラのサービスページまたはサービスの出品・編集ページを表示してから実行してください。');
    }
  });

});
