/**
 * Đếm số từ theo chuẩn Microsoft Word (chuỗi ký tự không phải khoảng trắng).
 * @param {string} text - Văn bản cần đếm.
 * @returns {number} Số lượng từ.
 */
function countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    const matches = text.match(/\S+/g);
    return matches ? matches.length : 0;
}

/**
 * Thực hiện thay thế và highlight.
 * @param {string} text - Văn bản gốc.
 * @param {Array<Object>} pairs - Mảng các cặp {find, replace, matchCase, wholeWord}.
 * @returns {string} Chuỗi HTML với highlight và định dạng đoạn.
 */
function performReplacement(text, pairs) {
    let tempText = text;

    pairs.forEach(pair => {
        if (pair.find) {
            try {
                // Escape special regex characters in the 'find' string
                const escapedFind = pair.find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                
                // Add word boundaries if 'wholeWord' is checked
                const findPattern = pair.wholeWord ? `\\b${escapedFind}\\b` : escapedFind;

                const flags = pair.matchCase ? 'g' : 'gi';
                const regex = new RegExp(findPattern, flags);

                // Use a temporary unique placeholder to avoid replacing replacements
                const placeholder = `__HIGHLIGHT_${Math.random().toString(36).substr(2, 9)}__`;
                tempText = tempText.replace(regex, placeholder);
                
                // Now replace placeholders with the final highlighted HTML
                const replacementHTML = `<span class="highlight">${pair.replace}</span>`;
                const placeholderRegex = new RegExp(placeholder, 'g');
                tempText = tempText.replace(placeholderRegex, replacementHTML);

            } catch (e) {
                console.error("Lỗi regex không hợp lệ:", pair.find, e);
            }
        }
    });

    // Format paragraphs: split by one or more empty lines, then wrap each part in <p>
    // Also, convert single newlines within a paragraph to <br>
    return tempText
        .split(/\n\s*\n/)
        .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
        .join('');
}


/**
 * Chia văn bản thành N phần dựa trên số từ, cắt tại ranh giới đoạn.
 * @param {string} text - Văn bản gốc.
 * @param {number} numSplits - Số phần cần chia.
 * @param {Array<string>} chapterKeywords - Danh sách từ khóa nhận diện chương.
 * @returns {Array<string>} Mảng các chuỗi nội dung chương đã chia.
 */
function splitChapter(text, numSplits, chapterKeywords) {
    if (!text.trim() || numSplits <= 0) return [];

    const lines = text.trim().split('\n');
    let firstLine = lines.shift() || '';
    let bodyText = lines.join('\n').trim();

    // 1. Parse Chapter Title
    let chapterBase = "Chương";
    let chapterNumber = "1";
    let chapterSuffix = "";
    
    // Regex improved to handle titles like "Chương 1: Tên chương"
    const keywordRegex = new RegExp(`^(${chapterKeywords.join('|')})\\s*(\\d+)(.*)?$`, 'i');
    const match = firstLine.match(keywordRegex);

    if (match) {
        chapterBase = match[1];
        chapterNumber = match[2];
        chapterSuffix = (match[3] || '').trim(); // Includes colon, space, and title
    } else {
        // If first line is not a recognized chapter, prepend it to the body
        bodyText = `${firstLine}\n${bodyText}`.trim();
        chapterSuffix = ""; // No suffix if title is not recognized
    }

    // 2. Split body into paragraphs and calculate word counts
    const paragraphs = bodyText.split(/\n\s*\n/).filter(p => p.trim() !== '');
    if (paragraphs.length === 0) return [];

    const paraWordCounts = paragraphs.map(p => ({ text: p, count: countWords(p) }));
    const totalWords = paraWordCounts.reduce((sum, p) => sum + p.count, 0);
    const targetWordsPerSplit = totalWords / numSplits;

    // 3. Distribute paragraphs into splits
    const splits = Array.from({ length: numSplits }, () => []);
    let currentSplitIndex = 0;
    let currentSplitWordCount = 0;

    paraWordCounts.forEach(para => {
        // If adding the current paragraph makes this split much larger than the next one would be,
        // and it's not the last split, move to the next split.
        const potentialNextCount = currentSplitWordCount + para.count;
        if (currentSplitIndex < numSplits - 1 && potentialNextCount > targetWordsPerSplit) {
            const diffCurrent = Math.abs(currentSplitWordCount - targetWordsPerSplit);
            const diffNext = Math.abs(potentialNextCount - targetWordsPerSplit);
             // Move to next split if adding the paragraph makes it further from the target
            if (diffNext > diffCurrent && currentSplitWordCount > 0) {
                 currentSplitIndex++;
                 currentSplitWordCount = 0;
            }
        }
        splits[currentSplitIndex].push(para.text);
        currentSplitWordCount += para.count;
    });

    // 4. Format final output with new titles
    return splits.map((paraArray, index) => {
        const newTitle = `${chapterBase} ${chapterNumber}.${index + 1}${chapterSuffix}`;
        const content = paraArray.join('\n\n');
        return `${newTitle}\n\n${content}`;
    });
}

/**
 * Sao chép văn bản vào clipboard và thông báo cho người dùng.
 * @param {string} text - Văn bản cần sao chép.
 * @param {HTMLElement} button - Nút đã được nhấn.
 */
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Đã sao chép!';
        button.classList.add('btn-success');
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('btn-success');
        }, 2000);
    }).catch(err => {
        console.error('Không thể sao chép: ', err);
        alert('Sao chép thất bại!');
    });
}
