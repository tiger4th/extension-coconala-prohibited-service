// コンテンツスクリプトが読み込まれたことを確認
console.log('Content script loaded on:', window.location.href);

// グローバルに公開する関数
window.getOverviewText = async function() {
  try {
    const result = [];
    const isEditPage = window.location.href.includes('/mypage/services/');
    
    if (isEditPage) {
      // 編集ページ用のセレクタ
      const titleElement = document.querySelector('#ServiceOverview');
      const overviewElement = document.querySelector('#ServiceCatchphrase');
      const serviceHeadElement = document.querySelector('#ServiceHead');
      const serviceBodyElement = document.querySelector('#ServiceBody');
      
      // サービスタイトルを取得
      if (titleElement) {
        result.push({
          title: 'サービスタイトル',
          content: titleElement.value.trim() + 'ます',
          type: 'title'
        });
      } else {
        result.push({
          title: 'サービスタイトル',
          content: 'サービスタイトルを取得できませんでした。ページに存在するのに取得できない場合はココナラの仕様変更の可能性があります。作者に<a href="https://github.com/tiger4th/extension-coconala-prohibited-service" target="_blank" style="color: #0066cc; text-decoration: underline;">GitHub</a>または<a href="https://coconala.com/users/167331" target="_blank" style="color: #0066cc; text-decoration: underline;">ココナラ</a>でご連絡ください。',
          type: 'error'
        });
      }
      
      // タイトル補足説明を取得
      if (overviewElement) {
        result.push({
          title: 'タイトル補足説明',
          content: overviewElement.value.trim(),
          type: 'overview'
        });
      } else {
        result.push({
          title: 'タイトル補足説明',
          content: 'タイトル補足説明を取得できませんでした。ページに存在するのに取得できない場合はココナラの仕様変更の可能性があります。作者に<a href="https://github.com/tiger4th/extension-coconala-prohibited-service" target="_blank" style="color: #0066cc; text-decoration: underline;">GitHub</a>または<a href="https://coconala.com/users/167331" target="_blank" style="color: #0066cc; text-decoration: underline;">ココナラ</a>でご連絡ください。',
          type: 'error'
        });
      }
      
      // サービス内容を取得
      if (serviceHeadElement) {
        result.push({
          title: 'サービス内容',
          content: serviceHeadElement.value.trim(),
          type: 'content'
        });
      } else {
        result.push({
          title: 'サービス内容',
          content: 'サービス内容を取得できませんでした。ページに存在するのに取得できない場合はココナラの仕様変更の可能性があります。作者に<a href="https://github.com/tiger4th/extension-coconala-prohibited-service" target="_blank" style="color: #0066cc; text-decoration: underline;">GitHub</a>または<a href="https://coconala.com/users/167331" target="_blank" style="color: #0066cc; text-decoration: underline;">ココナラ</a>でご連絡ください。',
          type: 'error'
        });
      }
      
      // 購入にあたってのお願いを取得
      if (serviceBodyElement) {
        result.push({
          title: '購入にあたってのお願い',
          content: serviceBodyElement.value.trim(),
          type: 'content'
        });
      } else {
        result.push({
          title: '購入にあたってのお願い',
          content: '購入にあたってのお願いを取得できませんでした。ページに存在するのに取得できない場合はココナラの仕様変更の可能性があります。作者に<a href="https://github.com/tiger4th/extension-coconala-prohibited-service" target="_blank" style="color: #0066cc; text-decoration: underline;">GitHub</a>または<a href="https://coconala.com/users/167331" target="_blank" style="color: #0066cc; text-decoration: underline;">ココナラ</a>でご連絡ください。',
          type: 'error'
        });
      }
      
      // オプションを取得
      const optionElements = document.querySelectorAll('#optionArea textarea');
      if (optionElements.length > 0) {
        optionElements.forEach((element, index) => {
          const content = element.value.trim();
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
      }

      // Q&Aセクションを取得
      const faqQuestions = [];
      const faqAnswers = [];
      
      // すべてのテキストエリアを取得
      const allTextareas = document.querySelectorAll('textarea[id^="Faq"][id$="Question"], textarea[id^="Faq"][id$="Answer"]');
      
      // 質問と回答を分類
      allTextareas.forEach(textarea => {
        const id = textarea.id;
        const isQuestion = id.endsWith('Question');
        const faqNumber = id.match(/Faq(\d*)/)[1] || ''; // 数字部分を取得（Faq1Question → 1, FaqQuestion → ''）
        
        if (isQuestion) {
          faqQuestions[faqNumber] = textarea.value.trim();
        } else {
          faqAnswers[faqNumber] = textarea.value.trim();
        }
      });
      
      // Q&Aを結果に追加
      Object.entries(faqQuestions).forEach(([number, question]) => {
        if (question) {
          const answer = faqAnswers[number] || '';
          const qNumber = number ? parseInt(number) + 1 : 1; // 数値に変換して1ベースに
          result.push({
            title: `Q${qNumber}: ${question}`,
            content: answer,
            type: 'qa'
          });
        }
      });
    } else {
      // すべての「もっと見る」ボタン内のaタグをクリックして隠れた要素を表示
      const clickReadMoreButtons = async () => {
        const buttons = document.querySelectorAll('.c-contentsCollapse_readMore a');
        for (const button of buttons) {
          if (button.offsetParent !== null) { // 表示されているボタンのみ対象
            const clickEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true
            });
            button.dispatchEvent(clickEvent);
            console.log('Clicked "もっと見る" link');
          }
        }
      };
      
      // 同期処理を待機するために即時実行関数を使用
      await (async () => {
        await clickReadMoreButtons();
        // コンテンツが展開されるのを待つ
        await new Promise(resolve => setTimeout(resolve, 100));
      })();

      // Q&Aセクションの「もっと見る」ボタンをクリック
      const clickQuestionReadMore = async () => {
        const readMoreButtons = document.querySelectorAll('.c-question_readMore');
        for (const button of readMoreButtons) {
          if (button.offsetParent !== null) { // 表示されているボタンのみ対象
            const clickEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true
            });
            button.dispatchEvent(clickEvent);
            console.log('Clicked Q&A "もっと見る" link');
          }
        }
      };

      // 同期処理を待機
      await (async () => {
        await clickQuestionReadMore();
        // コンテンツが展開されるのを待つ
        await new Promise(resolve => setTimeout(resolve, 100));
      })();
      
      // 通常の表示ページ用のセレクタ（既存のコード）
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
          content: 'サービスタイルを取得できませんでした。ページに存在するのに取得できない場合はココナラの仕様変更の可能性があります。作者に<a href="https://github.com/tiger4th/extension-coconala-prohibited-service" target="_blank" style="color: #0066cc; text-decoration: underline;">GitHub</a>または<a href="https://coconala.com/users/167331" target="_blank" style="color: #0066cc; text-decoration: underline;">ココナラ</a>でご連絡ください。',
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
          content: 'タイトル補足説明を取得できませんでした。ページに存在するのに取得できない場合はココナラの仕様変更の可能性があります。作者に<a href="https://github.com/tiger4th/extension-coconala-prohibited-service" target="_blank" style="color: #0066cc; text-decoration: underline;">GitHub</a>または<a href="https://coconala.com/users/167331" target="_blank" style="color: #0066cc; text-decoration: underline;">ココナラ</a>でご連絡ください。',
          type: 'error'
        });
      }
      
      // コンテンツテキストを取得（複数ある可能性があるためquerySelectorAllを使用）
      const contentElements = document.querySelectorAll('.c-contentsFreeText_text');
      
      if (contentElements.length > 0) {
        contentElements.forEach((element, index) => {
          const content = element.textContent.trim();
          if (content) {
            let title = index === 0 ? 'サービス内容' : 
                       index === 1 ? '購入にあたってのお願い' : 
                       `サービス内容 ${index + 1}`;
                        
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
          content: 'サービス内容を取得できませんでした。ページに存在するのに取得できない場合はココナラの仕様変更の可能性があります。作者に<a href="https://github.com/tiger4th/extension-coconala-prohibited-service" target="_blank" style="color: #0066cc; text-decoration: underline;">GitHub</a>または<a href="https://coconala.com/users/167331" target="_blank" style="color: #0066cc; text-decoration: underline;">ココナラ</a>でご連絡ください。',
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
      }

      // Q&Aセクションを取得
      const questionElements = document.querySelectorAll('.c-question');
      if (questionElements.length > 0) {
        questionElements.forEach((questionElement, index) => {
          // .c-question_readMore 要素を除外して質問テキストを取得
          const questionText = Array.from(questionElement.childNodes)
            .filter(node => !(node.nodeType === Node.ELEMENT_NODE && node.classList.contains('c-question_readMore')))
            .map(node => node.textContent)
            .join('')
            .trim();
          
          const answerElement = questionElement.nextElementSibling;
          let answerText = '';
          
          // 次の要素がc-answerクラスを持っているか確認
          if (answerElement && answerElement.classList.contains('c-answer')) {
            answerText = answerElement.textContent.trim();
          }
          
          if (questionText) {
            result.push({
              title: `Q${index + 1}: ${questionText}`,
              content: answerText || '',
              type: 'qa'
            });
          }
        });
      }
    }
    
    // 結果が空の場合はメッセージを返す
    if (result.length === 0) {
      return 'タイトルとサービス内容が見つかりませんでした';
    }
    
    // すべてのテキストを結合
    let combinedText = '';
    result.forEach(item => {
      if (item.content) {
        combinedText += `# ${item.title}\n${item.content}\n\n`;
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
      const apiUrl = 'https://tiger4th.com/api/extension-coconala-prohibited-service/';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: `content=${encodeURIComponent(combinedText)}`
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status} ${response.statusText} ${text ? '- ' + text : ''}`);
      }
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
