// ===================== 工具函数 =====================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 词性缩写 + 常见UI噪音黑名单
const NOISE_BLACKLIST = new Set([
    'adj', 'adv', 'n', 'v', 'vt', 'vi', 'prep', 'conj', 'pron',
    'abbr', 'int', 'num', 'art', 'det', 'aux', 'modal', 'pl',
    'ios', 'android', 'app', 'web', 'api', 'ui', 'ux',
    'ok', 'yes', 'no', 'log', 'id', 'px', 'en', 'cn',
    'next', 'prev', 'page', 'more', 'add', 'edit', 'del',
    'new', 'old', 'top', 'hot', 'vip', 'pro',
]);

function isRealWord(word) {
    const lower = word.toLowerCase();
    if (NOISE_BLACKLIST.has(lower)) return false;
    if (word.length < 3) return false;
    if (/^\d+$/.test(word)) return false;
    if (/^[A-Z]{2,}$/.test(word)) return false; // 全大写缩写
    if (/[^a-zA-Z\-']/.test(word)) return false;
    return true;
}

// ===================== 抓取当前页单词 =====================

function scrapeCurrentPage() {
    const words = [];
    const seen = new Set();

    // 策略1：精准选择器（Shanbay常见DOM结构）
    const primarySelectors = [
        '.word-item-content .wd',
        '.vocabulary-item .word',
        '.word-list-item .word-en',
        '.book-word-item .en',
        '[data-word]',
    ];

    for (const selector of primarySelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 3) {
            console.log('[扇贝爬虫] 命中选择器:', selector, elements.length);
            elements.forEach(el => {
                const word = (el.dataset.word || el.textContent).trim().split(/\s+/)[0];
                if (word && isRealWord(word) && !seen.has(word.toLowerCase())) {
                    seen.add(word.toLowerCase());
                    words.push({ word, meaning: '', phonetic: '' });
                }
            });
            return words;
        }
    }

    // 策略2：列表容器扫行
    const listContainerSelectors = [
        '.word-list', '.vocabulary-list', '.book-detail-list',
        '[class*="wordList"]', '[class*="word-list"]',
    ];

    for (const selector of listContainerSelectors) {
        const container = document.querySelector(selector);
        if (container) {
            const rows = container.querySelectorAll('li, .item, [class*="item"]');
            if (rows.length > 3) {
                console.log('[扇贝爬虫] 命中容器:', selector, rows.length);
                rows.forEach(row => {
                    const text = row.textContent.trim();
                    const match = text.match(/^([a-zA-Z][a-zA-Z\-']{2,})/);
                    if (match && isRealWord(match[1]) && !seen.has(match[1].toLowerCase())) {
                        seen.add(match[1].toLowerCase());
                        words.push({ word: match[1], meaning: '', phonetic: '' });
                    }
                });
                if (words.length > 3) return words;
            }
        }
    }

    // 策略3：Fallback 全页扫描，严格过滤
    console.log('[扇贝爬虫] 使用fallback全页扫描');
    const allText = document.body.innerText;
    const matches = allText.match(/\b[a-z][a-zA-Z\-']{2,24}\b/g) || [];
    [...new Set(matches)]
        .filter(w => isRealWord(w))
        .slice(0, 500)
        .forEach(word => {
            if (!seen.has(word.toLowerCase())) {
                seen.add(word.toLowerCase());
                words.push({ word, meaning: '', phonetic: '' });
            }
        });

    return words;
}

// ===================== 翻页逻辑 =====================

async function goToNextPage() {
    // Ant Design 分页（Shanbay主要用这套）
    const antNextSelectors = [
        'li.ant-pagination-next:not(.ant-pagination-disabled) button',
        'li.ant-pagination-next:not(.ant-pagination-disabled)',
        '.ant-pagination-next:not(.ant-pagination-disabled)',
    ];
    for (const sel of antNextSelectors) {
        const btn = document.querySelector(sel);
        if (btn) {
            console.log('[扇贝爬虫] 点击 Ant Design 下一页');
            btn.click();
            return true;
        }
    }

    // 通用下一页按钮
    const genericSelectors = [
        'button.next-page', 'a.next-page',
        '[class*="nextPage"]:not([disabled])',
        '[class*="next-page"]:not([disabled])',
    ];
    for (const sel of genericSelectors) {
        const btn = document.querySelector(sel);
        if (btn && !btn.disabled) {
            console.log('[扇贝爬虫] 点击通用下一页');
            btn.click();
            return true;
        }
    }

    // 文字匹配兜底
    const allBtns = [...document.querySelectorAll('button, a, li')];
    const nextBtn = allBtns.find(el => {
        const text = el.textContent.trim();
        return (text === '下一页' || text === 'Next' || text === '>') &&
               !el.disabled &&
               !el.classList.contains('disabled') &&
               !el.closest('[disabled]');
    });
    if (nextBtn) {
        console.log('[扇贝爬虫] 通过文字匹配点击下一页');
        nextBtn.click();
        return true;
    }

    return false;
}

// ===================== 主流程 =====================

async function startScallopCrawl() {
    console.log('[扇贝爬虫] 开始执行...');

    if (!window.location.href.includes('web.shanbay.com')) {
        alert('请在扇贝单词页面使用此功能');
        return;
    }

    const allWords = [];
    const seenGlobal = new Set();
    let pageNum = 1;
    const MAX_PAGES = 100;

    while (pageNum <= MAX_PAGES) {
        console.log('[扇贝爬虫] 正在抓取第', pageNum, '页...');

        const pageWords = scrapeCurrentPage();
        let newCount = 0;
        pageWords.forEach(item => {
            const key = item.word.toLowerCase();
            if (!seenGlobal.has(key)) {
                seenGlobal.add(key);
                allWords.push(item);
                newCount++;
            }
        });

        console.log('[扇贝爬虫] 第', pageNum, '页新增', newCount, '个，累计', allWords.length, '个');

        if (newCount === 0 && pageNum > 1) {
            console.log('[扇贝爬虫] 没有新词，停止翻页');
            break;
        }

        const hasNext = await goToNextPage();
        if (!hasNext) {
            console.log('[扇贝爬虫] 已到最后一页');
            break;
        }

        await sleep(2000);
        pageNum++;
    }

    console.log('[扇贝爬虫] 抓取完成，共', allWords.length, '个单词');

    if (allWords.length > 0) {
        chrome.runtime.sendMessage({ type: "saveWords", data: allWords }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('[扇贝爬虫] 发送失败:', chrome.runtime.lastError);
            } else {
                alert('✅ 抓取完成！共 ' + allWords.length + ' 个单词（' + pageNum + ' 页）');
            }
        });
    } else {
        alert('⚠️ 未能抓取到单词，请确认在单词列表页面，并刷新后重试');
    }
}

// ===================== 文件读取 =====================

function handleFileInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                chrome.runtime.sendMessage({ type: "saveWordsDetail", data });
            } catch (error) {
                alert('文件格式错误: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ===================== Fallback 下载 =====================

function downloadFile(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===================== 消息监听 =====================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[扇贝爬虫] 收到消息:', request.action || request.type);

    if (request.action === "startExecution") {
        startScallopCrawl();
        sendResponse({ status: "started" });
    } else if (request.action === "readLocalFile") {
        handleFileInput();
        sendResponse({ status: "file_input_ready" });
    } else if (request.action === "PteWfdStart") {
        sendResponse({ status: "pte_not_implemented" });
    } else if (request.type === "fallbackDownload") {
        downloadFile(request.data, request.filename);
        sendResponse({ status: "download_started" });
    }

    return true;
});

console.log('[扇贝爬虫] Content Script 已加载');
