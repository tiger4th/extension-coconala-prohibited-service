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
  const actionButton = document.getElementById('actionButton');
  const statusDiv = document.getElementById('status');
  const urlStatusDiv = document.getElementById('urlStatus');
  
  // Check if current URL is a Coconala service page
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs || tabs.length === 0) {
      console.error('No active tab found');
      urlStatusDiv.textContent = 'アクティブなタブが見つかりません';
      urlStatusDiv.style.color = '#f44336';
      return;
    }

    const url = tabs[0]?.url || '';
    console.log('Current URL:', url);
    
    const isCoconalaService = url.startsWith('https://coconala.com/services/');
    
    if (isCoconalaService) {
      urlStatusDiv.textContent = 'Coconalaサービスページを表示中です';
      urlStatusDiv.style.color = '#4CAF50';
      
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
          
          // コンテンツスクリプトにメッセージを送信
          console.log('Sending message to content script...');
          chrome.tabs.sendMessage(tabs[0].id, {action: 'getOverview'}, function(response) {
            console.log('Response from content script:', response);
            
            if (chrome.runtime.lastError) {
              console.error('Error in sendMessage:', chrome.runtime.lastError);
              showError(`コンテンツスクリプトとの通信エラー: ${chrome.runtime.lastError.message}\n1. ページをリロードしてください\n2. それでもダメな場合は、拡張機能を再読み込みしてください`);
              return;
            }
            
            if (!response) {
              console.error('No response from content script');
              showError('コンテンツスクリプトからの応答がありません\nページをリロードしてみてください');
              return;
            }
          
          // Create a container for the results
          const resultsContainer = document.createElement('div');
          resultsContainer.className = 'results-container';
          
          if (response.success && Array.isArray(response.result) && response.result.length > 0) {
            response.result.forEach(item => {
              const section = document.createElement('div');
              section.className = 'result-section';
              // タイプに応じたスタイルを適用するため、data-type属性を追加
              section.setAttribute('data-type', item.type || 'default');
              section.innerHTML = `
                <h3>${item.title}</h3>
                <div class="result-content">${item.content || '内容がありません'}</div>
              `;
              resultsContainer.appendChild(section);
              
              // Add a separator between sections
              if (item !== response.result[response.result.length - 1]) {
                const separator = document.createElement('div');
                separator.className = 'separator';
                resultsContainer.appendChild(separator);
              }
            });
          } else {
            // Fallback for error cases
            const errorSection = document.createElement('div');
            errorSection.className = 'error-section';
            errorSection.textContent = response.error || '情報を取得できませんでした';
            resultsContainer.appendChild(errorSection);
          }
          
          // Insert after the URL status
          urlStatusDiv.after(resultsContainer);
          });
        });
      } catch (error) {
        console.error('Error in content script check:', error);
        showError(`エラーが発生しました: ${error.message}\nページをリロードしてみてください`);
      }
    } else {
      urlStatusDiv.textContent = 'Coconalaサービスページではありません';
      urlStatusDiv.style.color = '#f44336';
    }
  });

  // Load saved state
  chrome.storage.sync.get(['isActive'], function(result) {
    const isActive = result.isActive || false;
    updateButtonState(isActive);
  });

  // Toggle state on button click
  actionButton.addEventListener('click', function() {
    chrome.storage.sync.get(['isActive'], function(result) {
      const newState = !(result.isActive || false);
      updateButtonState(newState);
      
      // Save state
      chrome.storage.sync.set({ isActive: newState });
      
      // Send message to content script
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'toggle', isActive: newState});
      });
    });
  });

  function updateButtonState(isActive) {
    if (isActive) {
      actionButton.textContent = 'Deactivate';
      actionButton.style.backgroundColor = '#f44336';
      statusDiv.textContent = 'Extension is active';
    } else {
      actionButton.textContent = 'Activate';
      actionButton.style.backgroundColor = '#4CAF50';
      statusDiv.textContent = 'Extension is inactive';
    }
  }
});
