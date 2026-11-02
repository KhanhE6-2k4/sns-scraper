const runBtn = document.getElementById('runBtn');
const status = document.getElementById('status');
const result = document.getElementById('result');
// ============================================================
// GOOGLE SHEETS
// ============================================================
const googleSheetUrlInput = document.getElementById('googleSheetUrl');
const validateGoogleSheetBtn = document.getElementById('validateGoogleSheetBtn');
const exportGoogleSheetBtn = document.getElementById('exportGoogleSheetBtn');
const googleSheetStatus = document.getElementById('googleSheetStatus');
let googleSheetValidated = false;
let discoveryCompleted = false;
let currentPlatform = null;
let currentJobId = null;

function updateExportButton() {
    if (exportGoogleSheetBtn) {
        exportGoogleSheetBtn.disabled = !googleSheetValidated || !discoveryCompleted;
    }
}
if (googleSheetUrlInput && validateGoogleSheetBtn && exportGoogleSheetBtn && googleSheetStatus) {
    validateGoogleSheetBtn.addEventListener('click', async () => {
        const spreadsheetUrl = googleSheetUrlInput.value.trim();
        googleSheetValidated = false;
        updateExportButton();
        if (!spreadsheetUrl) {
            googleSheetStatus.textContent = 'Vui lòng nhập URL Google Sheet.';
            return;
        }
        googleSheetStatus.textContent = 'Đang kiểm tra Google Sheet...';
        validateGoogleSheetBtn.disabled = true;
        try {
            const response = await fetch('/api/google-service-account/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    spreadsheetUrl,
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || data.error || 'Không thể kiểm tra Google Sheet.');
            }
            googleSheetValidated = true;
            updateExportButton();
            googleSheetStatus.textContent = `✓ Đã kết nối: ${data.title}`;
        } catch (error) {
            googleSheetStatus.textContent = `✗ ${error.message}`;
        } finally {
            validateGoogleSheetBtn.disabled = false;
        }
    });
    exportGoogleSheetBtn.addEventListener('click', async () => {
        const spreadsheetUrl = googleSheetUrlInput.value.trim();
        if (!googleSheetValidated) {
            googleSheetStatus.textContent = 'Vui lòng kiểm tra Google Sheet trước.';
            return;
        }
        if (!spreadsheetUrl) {
            googleSheetStatus.textContent = 'Vui lòng nhập URL Google Sheet.';
            return;
        }
        exportGoogleSheetBtn.disabled = true;
        googleSheetStatus.textContent = 'Đang nhập dữ liệu sang Google Sheet...';
        try {
            const response = await fetch('/api/google-service-account/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    spreadsheetUrl,
                    platform: currentPlatform,
                    jobId: currentJobId,
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || data.error || 'Nhập dữ liệu sang Google Sheet thất bại.');
            }
            googleSheetStatus.textContent = `✓ Đã nhập dữ liệu của ${data.creatorCount} ${pluralize(data.creatorCount, 'creator')} vào tab "${data.sheetTitle}"${data.skippedCount ? ` (bỏ qua ${data.skippedCount} ${pluralize(data.skippedCount, 'creator')} đã có)` : ''}`;
        } catch (error) {
            console.error(error);
            googleSheetStatus.textContent = `✗ ${error.message}`;
        } finally {
            updateExportButton();
        }
    });
}
// ============================================================
// RANGE VALIDATION
// ============================================================
function sanitize(input) {
    input.value = input.value.replace(/\D/g, '');
}

function setupRangeInputs(minId, maxId) {
    const minInput = document.getElementById(minId);
    const maxInput = document.getElementById(maxId);
    if (!minInput || !maxInput) {
        return () => true;
    }
    const error = document.createElement('div');
    error.className = 'range-error';
    maxInput.parentElement.appendChild(error);

    function validate() {
        error.textContent = '';
        // Cho phép bỏ trống min hoặc max.
        if (minInput.value === '' || maxInput.value === '') {
            return true;
        }
        const min = Number(minInput.value);
        const max = Number(maxInput.value);
        if (max < min) {
            error.textContent = 'Giá trị tối đa phải lớn hơn hoặc bằng giá trị tối thiểu.';
            return false;
        }
        return true;
    }
    minInput.addEventListener('input', () => {
        sanitize(minInput);
        validate();
    });
    maxInput.addEventListener('input', () => {
        sanitize(maxInput);
        validate();
    });
    return validate;
}
const validateAverageLikes = setupRangeInputs('minAverageLikes', 'maxAverageLikes');
// ============================================================
// FILTER TOGGLE
// ============================================================
function setupFilterToggle(name, optionsId) {
    const options = document.getElementById(optionsId);
    const radios = document.querySelectorAll(`input[name="${name}"]`);
    if (!options) return;

    function update() {
        const selected = document.querySelector(`input[name="${name}"]:checked`);
        const enabled = selected?.value === 'yes';
        options.querySelectorAll('input').forEach(input => {
            input.disabled = !enabled;
            if (!enabled) {
                input.value = '';
            }
        });
    }
    radios.forEach(radio => {
        radio.addEventListener('change', update);
    });
    update();
}
setupFilterToggle('filterAverageLikes', 'averageLikesOptions');
// ============================================================
// HELPERS
// ============================================================
function getCheckedValue(name, fallback = '') {
    return document.querySelector(`input[name="${name}"]:checked`)?.value ?? fallback;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[char]);
}

// Thêm "s" cho danh từ tiếng Anh khi số lượng khác 1 (0 videos, 1 video, 2 videos).
function pluralize(count, word) {
    return Number(count) === 1 ? word : `${word}s`;
}
// ============================================================
// START INSTAGRAM DISCOVERY
// ============================================================
runBtn.addEventListener('click', async () => {
    discoveryCompleted = false;
    currentPlatform = null;
    currentJobId = null;
    updateExportButton();
    // --------------------------------------------------------
    // INSTAGRAM COOKIES
    // --------------------------------------------------------
    const cookies = document.getElementById('instagramCookies').value.trim();
    if (!cookies) {
        alert('Vui lòng nhập Instagram cookies.');
        return;
    }
    // --------------------------------------------------------
    // SEARCH TYPE
    // --------------------------------------------------------
    const searchType = getCheckedValue('searchType', 'keyword');
    // --------------------------------------------------------
    // KEYWORDS
    // --------------------------------------------------------
    const queries = document.getElementById('keywords').value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    if (queries.length === 0) {
        alert('Vui lòng nhập ít nhất một từ khóa.');
        return;
    }
    // --------------------------------------------------------
    // LIMIT
    // --------------------------------------------------------
    const limit = Number(document.getElementById('limit').value);
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
        alert('Số lượng profile tối đa mỗi truy vấn phải là số nguyên từ 1 đến 500.');
        return;
    }
    // --------------------------------------------------------
    // VERIFIED
    // --------------------------------------------------------
    const verifiedSelection = getCheckedValue('filterVerified', 'any');
    const verifiedFilter = verifiedSelection === 'not_verified' ? 'not-verified' : verifiedSelection;
    // --------------------------------------------------------
    // AVERAGE LIKES FILTER
    // --------------------------------------------------------
    const isFilteredByAverageLikes = getCheckedValue('filterAverageLikes', 'no') === 'yes';
    if (isFilteredByAverageLikes && !validateAverageLikes()) {
        return;
    }
    const minAverageLikesText = document.getElementById('minAverageLikes').value.trim();
    const maxAverageLikesText = document.getElementById('maxAverageLikes').value.trim();
    // --------------------------------------------------------
    // BUILD REQUEST
    // --------------------------------------------------------
    // Không gửi likes/videoCount/dateRange vì Instagram Actor
    // không trả về hoặc không hỗ trợ các dữ liệu này.
    const payload = {
        platform: 'instagram',
        queries,
        searchType,
        limit,
        verifiedFilter,
        isFilteredByAverageLikes,
        cookies,
    };
    // Chỉ gửi giá trị averageLikes khi người dùng bật bộ lọc
    // và nhập giá trị tương ứng.
    if (isFilteredByAverageLikes) {
        if (minAverageLikesText !== '') {
            payload.minAverageLikes = Number(minAverageLikesText);
        }
        if (maxAverageLikesText !== '') {
            payload.maxAverageLikes = Number(maxAverageLikesText);
        }
    }
    // --------------------------------------------------------
    // CALL API
    // --------------------------------------------------------
    runBtn.disabled = true;
    status.textContent = 'Đang tìm kiếm...';
    result.innerHTML = '';
    try {
        const response = await fetch('/api/discover', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.message || 'Instagram discovery thất bại.');
        }
        if (!data.platform || !data.jobId) {
            throw new Error('Discovery API không trả về platform hoặc jobId.');
        }
        currentPlatform = data.platform;
        currentJobId = data.jobId;
        discoveryCompleted = true;
        updateExportButton();
        status.textContent = 'Hoàn thành!';
        const csvUrl = data.downloads?.csv;
        const jsonUrl = data.downloads?.json;
        result.innerHTML = `
            <div class="summary">
                Tìm thấy
                <strong>${Number(data.creatorCount ?? 0)}</strong>
                ${pluralize(data.creatorCount, 'creator')}!
            </div>

            <div class="download-section">
                <div class="download-title">
                    Kết quả
                </div>

                <div class="download-buttons">
                    ${
                        csvUrl
                            ? `
                                <a
                                    class="download-btn"
                                    href="${escapeHtml(csvUrl)}"
                                    download
                                >
                                    Tải CSV
                                </a>
                            `
                            : ''
                    }

                    ${
                        jsonUrl
                            ? `
                                <a
                                    class="download-btn secondary"
                                    href="${escapeHtml(jsonUrl)}"
                                    download
                                >
                                    Tải JSON
                                </a>
                            `
                            : ''
                    }
                </div>
            </div>
        `;
    } catch (error) {
        console.error(error);
        status.textContent = `Lỗi: ${error.message}`;
    } finally {
        runBtn.disabled = false;
    }
});
