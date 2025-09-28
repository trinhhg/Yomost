document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let settings = {
        modes: {
            'Mặc định': {
                pairs: [{ find: '', replace: '', matchCase: false, wholeWord: false }]
            }
        },
        activeMode: 'Mặc định',
        chapterKeywords: ['Chương', 'Chapter', 'Phần', 'Hồi']
    };

    // --- DOM ELEMENTS ---
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Settings Tab
    const modeSelect = document.getElementById('mode-select');
    const addModeBtn = document.getElementById('add-mode-btn');
    const copyModeBtn = document.getElementById('copy-mode-btn');
    const renameModeBtn = document.getElementById('rename-mode-btn');
    const deleteModeBtn = document.getElementById('delete-mode-btn');
    const importSettingsBtn = document.getElementById('import-settings-btn');
    const importFileInput = document.getElementById('import-file-input');
    const exportSettingsBtn = document.getElementById('export-settings-btn');
    const addPairBtn = document.getElementById('add-pair-btn');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const pairsContainer = document.getElementById('replace-pairs-container');
    const chapterKeywordInput = document.getElementById('chapter-keyword-input');
    const addKeywordBtn = document.getElementById('add-keyword-btn');
    const keywordsListContainer = document.getElementById('chapter-keywords-list');

    // Replace Tab
    const replaceInput = document.getElementById('replace-input');
    const replaceInputWordCount = document.getElementById('replace-input-word-count');
    const replaceOutputWordCount = document.getElementById('replace-output-word-count');
    const replaceBtn = document.getElementById('replace-btn');
    const replaceOutput = document.getElementById('replace-output');
    const copyOutputBtn = document.getElementById('copy-output-btn');

    // Split Tab
    const splitButtonsContainer = document.getElementById('split-buttons-container');
    const splitIoContainer = document.getElementById('split-io-container');

    // --- INITIALIZATION ---
    loadSettings();
    updateUI();
    setupEventListeners();
    createSplitButtons();

    // --- CORE FUNCTIONS ---

    function updateUI() {
        updateModeSelect();
        renderCurrentModeSettings();
        renderChapterKeywords();
    }

    function switchTab(targetTabId) {
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(targetTabId)?.classList.add('active');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === targetTabId);
        });
    }

    function saveSettings() {
        localStorage.setItem('textToolSettings', JSON.stringify(settings));
    }

    function loadSettings() {
        const saved = localStorage.getItem('textToolSettings');
        if (saved) {
            const loadedSettings = JSON.parse(saved);
             // Basic validation and migration for old structure
            if (loadedSettings.modes) {
                Object.values(loadedSettings.modes).forEach(mode => {
                    if (mode.pairs) {
                        mode.pairs.forEach(pair => {
                            if (pair.matchCase === undefined) pair.matchCase = false;
                            if (pair.wholeWord === undefined) pair.wholeWord = false;
                        });
                    }
                });
                settings = loadedSettings;
            }
        }
    }

    // --- SETTINGS TAB FUNCTIONS ---
    function updateModeSelect() {
        modeSelect.innerHTML = '';
        Object.keys(settings.modes).forEach(modeName => {
            const option = document.createElement('option');
            option.value = modeName;
            option.textContent = modeName;
            option.selected = (modeName === settings.activeMode);
            modeSelect.appendChild(option);
        });
    }

    function renderCurrentModeSettings() {
        const mode = settings.modes[settings.activeMode];
        if (!mode) return;

        pairsContainer.innerHTML = '';
        mode.pairs.forEach(pair => {
            const pairElement = createPairElement(pair);
            pairsContainer.appendChild(pairElement);
        });
    }

    function createPairElement({ find = '', replace = '', matchCase = false, wholeWord = false }) {
        const div = document.createElement('div');
        div.className = 'replace-pair';
        div.innerHTML = `
            <div class="pair-inputs">
                <input type="text" class="find-input" placeholder="Tìm" value="${find.replace(/"/g, '&quot;')}">
                <input type="text" class="replace-input" placeholder="Thay thế" value="${replace.replace(/"/g, '&quot;')}">
            </div>
            <div class="pair-options">
                <div class="pair-checkboxes">
                    <label><input type="checkbox" class="match-case-cb" ${matchCase ? 'checked' : ''}> Match Case</label>
                    <label><input type="checkbox" class="whole-word-cb" ${wholeWord ? 'checked' : ''}> Find Whole Word Only</label>
                </div>
                <button class="pair-delete-btn">Xóa</button>
            </div>
        `;
        div.querySelector('.pair-delete-btn').addEventListener('click', () => div.remove());
        return div;
    }
    
    function saveSettingsFromUI() {
        const currentMode = settings.modes[settings.activeMode];
        if (!currentMode) return;
        
        const newPairs = [];
        document.querySelectorAll('#replace-pairs-container .replace-pair').forEach(pairEl => {
            newPairs.push({
                find: pairEl.querySelector('.find-input').value,
                replace: pairEl.querySelector('.replace-input').value,
                matchCase: pairEl.querySelector('.match-case-cb').checked,
                wholeWord: pairEl.querySelector('.whole-word-cb').checked,
            });
        });
        currentMode.pairs = newPairs;
        saveSettings();
        alert('Đã lưu cài đặt cho chế độ: ' + settings.activeMode);
    }

    function renderChapterKeywords() {
        keywordsListContainer.innerHTML = '';
        settings.chapterKeywords.forEach(keyword => {
            const tag = document.createElement('div');
            tag.className = 'keyword-tag';
            tag.innerHTML = `
                <span>${keyword}</span>
                <button class="delete-keyword-btn" data-keyword="${keyword}">×</button>
            `;
            keywordsListContainer.appendChild(tag);
        });
    }

    // --- REPLACE TAB FUNCTIONS ---
    function handleReplace() {
        const mode = settings.modes[settings.activeMode];
        const inputText = replaceInput.value;
        if (!mode || !inputText) return;
        
        const resultHTML = performReplacement(inputText, mode.pairs);
        replaceOutput.innerHTML = resultHTML;
        replaceOutputWordCount.textContent = `Số từ: ${countWords(replaceOutput.innerText)}`;
        replaceInput.value = '';
        replaceInputWordCount.textContent = 'Số từ: 0';
    }

    // --- SPLIT TAB FUNCTIONS ---
    function createSplitButtons() {
        for (let i = 2; i <= 10; i++) {
            const button = document.createElement('button');
            button.className = 'btn';
            button.textContent = `Chia ${i}`;
            button.dataset.splits = i;
            splitButtonsContainer.appendChild(button);
        }
    }

    function handleSplit(e) {
        const button = e.target.closest('.btn[data-splits]');
        if (!button) return;

        // Active button state
        splitButtonsContainer.querySelectorAll('.btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const numSplits = parseInt(button.dataset.splits, 10);
        
        // Generate UI for splitting
        splitIoContainer.innerHTML = '';
        const sourceBox = createSplitBox('source', 0);
        splitIoContainer.appendChild(sourceBox);

        for (let i = 1; i <= numSplits; i++) {
            const resultBox = createSplitBox('result', i);
            splitIoContainer.appendChild(resultBox);
        }

        const sourceTextarea = sourceBox.querySelector('textarea');
        sourceTextarea.focus();

        sourceTextarea.addEventListener('input', () => {
            const text = sourceTextarea.value;
            const results = splitChapter(text, numSplits, settings.chapterKeywords);
            
            for (let i = 1; i <= numSplits; i++) {
                const resultTextarea = splitIoContainer.querySelector(`#split-output-${i}`);
                const resultWordCount = splitIoContainer.querySelector(`#split-word-count-${i}`);
                const content = results[i-1] || '';
                resultTextarea.value = content;
                resultWordCount.textContent = `Số từ: ${countWords(content)}`;
            }
        });
    }

    function createSplitBox(type, index) {
        const box = document.createElement('div');
        box.className = 'split-box';
        const isSource = type === 'source';
        const id = isSource ? 'split-input' : `split-output-${index}`;
        const placeholder = isSource ? 'Nhập văn bản gốc tại đây...' : `Kết quả ${index}`;

        box.innerHTML = `
            <textarea id="${id}" placeholder="${placeholder}" ${isSource ? '' : 'readonly'}></textarea>
            <div class="word-counter" id="split-word-count-${index}">Số từ: 0</div>
            ${!isSource ? `<button class="btn btn-full-width copy-split-btn" data-index="${index}">Sao chép ${index}</button>` : ''}
        `;
        
        if (isSource) {
            box.querySelector('textarea').addEventListener('input', (e) => {
                box.querySelector('.word-counter').textContent = `Số từ: ${countWords(e.target.value)}`;
            });
        }
        return box;
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        tabs.forEach(tab => tab.addEventListener('click', (e) => switchTab(e.target.dataset.tab)));
        
        // Settings: Mode management
        modeSelect.addEventListener('change', (e) => {
            settings.activeMode = e.target.value;
            renderCurrentModeSettings();
        });
        addModeBtn.addEventListener('click', () => {
            const name = prompt('Nhập tên chế độ mới:', 'Chế độ mới');
            if (name && !settings.modes[name]) {
                settings.modes[name] = { pairs: [{ find: '', replace: '', matchCase: false, wholeWord: false }] };
                settings.activeMode = name;
                saveSettings();
                updateUI();
            } else if (name) { alert('Tên chế độ đã tồn tại!'); }
        });
        copyModeBtn.addEventListener('click', () => {
            const newName = prompt('Nhập tên cho chế độ sao chép:', `${settings.activeMode} (sao chép)`);
            if (newName && !settings.modes[newName]) {
                settings.modes[newName] = JSON.parse(JSON.stringify(settings.modes[settings.activeMode]));
                settings.activeMode = newName;
                saveSettings();
                updateUI();
            } else if (newName) { alert('Tên chế độ đã tồn tại!'); }
        });
        renameModeBtn.addEventListener('click', () => {
            const oldName = settings.activeMode;
            const newName = prompt('Nhập tên mới:', oldName);
            if (newName && newName !== oldName && !settings.modes[newName]) {
                settings.modes[newName] = settings.modes[oldName];
                delete settings.modes[oldName];
                settings.activeMode = newName;
                saveSettings();
                updateUI();
            } else if (newName) { alert('Tên mới không hợp lệ hoặc đã tồn tại.'); }
        });
        deleteModeBtn.addEventListener('click', () => {
            if (Object.keys(settings.modes).length <= 1) { alert('Không thể xóa chế độ cuối cùng.'); return; }
            if (confirm(`Bạn có chắc muốn xóa chế độ "${settings.activeMode}"?`)) {
                delete settings.modes[settings.activeMode];
                settings.activeMode = Object.keys(settings.modes)[0];
                saveSettings();
                updateUI();
            }
        });

        // Settings: IO & Saving
        exportSettingsBtn.addEventListener('click', () => {
            const dataStr = JSON.stringify(settings, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `settings_${settings.activeMode}.json`;
            link.click();
            URL.revokeObjectURL(url);
        });
        importSettingsBtn.addEventListener('click', () => importFileInput.click());
        importFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (imported.modes && imported.activeMode) {
                        settings = imported;
                        saveSettings();
                        loadSettings(); // Re-load to apply migrations/validations
                        updateUI();
                        alert('Nhập cài đặt thành công!');
                    } else { alert('Tệp cài đặt không hợp lệ.'); }
                } catch (error) { alert('Lỗi khi đọc tệp JSON.'); }
            };
            reader.readAsText(file);
            event.target.value = ''; // Reset input
        });

        // Settings: Pair & Keyword management
        addPairBtn.addEventListener('click', () => {
            pairsContainer.insertBefore(createPairElement({}), pairsContainer.firstChild);
        });
        saveSettingsBtn.addEventListener('click', saveSettingsFromUI);
        
        addKeywordBtn.addEventListener('click', () => {
            const newKeyword = chapterKeywordInput.value.trim();
            if (newKeyword && !settings.chapterKeywords.includes(newKeyword)) {
                settings.chapterKeywords.push(newKeyword);
                saveSettings();
                renderChapterKeywords();
                chapterKeywordInput.value = '';
            }
        });
        keywordsListContainer.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-keyword-btn');
            if (deleteBtn) {
                const keywordToRemove = deleteBtn.dataset.keyword;
                settings.chapterKeywords = settings.chapterKeywords.filter(k => k !== keywordToRemove);
                saveSettings();
                renderChapterKeywords();
            }
        });

        // Replace Tab
        replaceInput.addEventListener('input', () => {
            replaceInputWordCount.textContent = `Số từ: ${countWords(replaceInput.value)}`;
        });
        replaceBtn.addEventListener('click', handleReplace);
        copyOutputBtn.addEventListener('click', (e) => {
            copyToClipboard(replaceOutput.innerText, e.target);
        });

        // Split Tab
        splitButtonsContainer.addEventListener('click', handleSplit);
        splitIoContainer.addEventListener('click', (e) => {
            const copyBtn = e.target.closest('.copy-split-btn');
            if (copyBtn) {
                const index = copyBtn.dataset.index;
                const textarea = document.getElementById(`split-output-${index}`);
                if (textarea) copyToClipboard(textarea.value, copyBtn);
            }
        });
    }
});
