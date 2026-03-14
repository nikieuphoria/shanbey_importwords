let wfdListTotal = [];

// 接收 content.js 发过来的数据
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background收到消息:', request.type);
  
  if (request.type === "saveWords") {
    downloadJsonData(request.data, "scallop_word_list.json");
    sendResponse({success: true});

  } else if (request.type === "saveWordsDetail") {
    downloadJsonData(request.data, "scallop_word_detail_list.json");
    sendResponse({success: true});

  } else if (request.type === "wfdListToJson") {
    downloadJsonData(wfdListTotal, "alpaca_wfd_list.json");
    sendResponse({success: true});
  } else if (request.type === "wfdListAdd") {
    wfdListTotal = wfdListTotal.concat(request.data);
    sendResponse({success: true});
  }
  
  return true; // 保持消息通道开放
});

function downloadJsonData(data, fileName) {
  console.log('准备下载:', fileName, '数据长度:', Array.isArray(data) ? data.length : typeof data);
  
  // 把数据转成 JSON 字符串
  const jsonStr = JSON.stringify(data, null, 2);
  
  // 创建 data URL
  const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr);
  
  try {
    // 使用 chrome.downloads API
    if (chrome.downloads && chrome.downloads.download) {
      chrome.downloads.download({
        url: dataUrl,
        filename: fileName,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('下载失败:', chrome.runtime.lastError);
          // fallback to content script
          fallbackDownload(data, fileName);
        } else {
          console.log('下载开始，ID:', downloadId);
        }
      });
    } else {
      console.log('downloads API不可用，使用fallback');
      fallbackDownload(data, fileName);
    }
  } catch (error) {
    console.error('下载异常:', error);
    fallbackDownload(data, fileName);
  }
}

function fallbackDownload(data, fileName) {
  // 发送回content script进行下载
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "fallbackDownload",
        data: data,
        filename: fileName
      });
    }
  });
}
