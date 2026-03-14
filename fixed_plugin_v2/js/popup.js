document.addEventListener('DOMContentLoaded', function() {
    
    // 扇贝单词表爬取
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', async () => {
            console.log('开始爬取单词表');
            try {
                const tabs = await chrome.tabs.query({active: true, currentWindow: true});
                if (tabs[0]) {
                    await chrome.tabs.sendMessage(tabs[0].id, {action: "startExecution"});
                    console.log("已发送开始爬取指令");
                } else {
                    alert("请先打开扇贝单词页面");
                }
            } catch (error) {
                console.error("发送消息失败:", error);
                alert("请确保在扇贝单词页面使用此功能");
            }
        });
    }

    // 扇贝单词详情爬取
    const getDetailBtn = document.getElementById('getDetailBtn');
    if (getDetailBtn) {
        getDetailBtn.addEventListener('click', async () => {
            console.log('开始爬取单词详情');
            try {
                const tabs = await chrome.tabs.query({active: true, currentWindow: true});
                if (tabs[0]) {
                    await chrome.tabs.sendMessage(tabs[0].id, {action: "readLocalFile"});
                    console.log("已发送爬取详情指令");
                }
            } catch (error) {
                console.error("发送消息失败:", error);
                alert("请确保在扇贝单词页面使用此功能");
            }
        });
    }

    // PTE WFD爬取
    const pteWfdBtn = document.getElementById('PteWfd');
    if (pteWfdBtn) {
        pteWfdBtn.addEventListener('click', async () => {
            console.log('开始爬取PTE WFD');
            try {
                const tabs = await chrome.tabs.query({active: true, currentWindow: true});
                if (tabs[0]) {
                    await chrome.tabs.sendMessage(tabs[0].id, {action: "PteWfdStart"});
                    console.log("已发送PTE WFD爬取指令");
                }
            } catch (error) {
                console.error("发送消息失败:", error);
                alert("请确保在羊驼PTE页面使用此功能");
            }
        });
    }
});
