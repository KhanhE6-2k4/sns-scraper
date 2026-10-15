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
            googleSheetStatus.textContent = `✓ Đã nhập dữ liệu của ${data.creatorCount} creators vào tab "${data.sheetTitle}"`;
        } catch (error) {
            console.error(error);
            googleSheetStatus.textContent = `✗ ${error.message}`;
        } finally {
            updateExportButton();
        }
    });
}
// ============================================================
// DATE RANGE
// ============================================================
const dateOptions = document.getElementById('dateOptions');
const dateModeInputs = document.querySelectorAll('input[name="dateMode"]');
const dateRangeInputs = document.querySelectorAll('input[name="dateRange"]');

function updateDateInputs() {
    const selectedMode = document.querySelector('input[name="dateMode"]:checked');
    const enabled = selectedMode?.value === 'custom';
    dateOptions?.classList.toggle('disabled', !enabled);
    dateRangeInputs.forEach(input => {
        input.disabled = !enabled;
    });
}
dateModeInputs.forEach(input => {
    input.addEventListener('change', updateDateInputs);
});
updateDateInputs();
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
// ============================================================
// START THREADS DISCOVERY
// ============================================================
runBtn.addEventListener('click', async () => {
    discoveryCompleted = false;
    currentPlatform = null;
    currentJobId = null;
    updateExportButton();
    // --------------------------------------------------------
    // SEARCH TYPE
    // --------------------------------------------------------
    const searchType = getCheckedValue('searchType', 'keyword');
    // --------------------------------------------------------
    // KEYWORDS / HASHTAGS
    // --------------------------------------------------------
    const queries = document.getElementById('keywords').value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    if (queries.length === 0) {
        alert('Vui lòng nhập ít nhất một từ khóa hoặc hashtag.');
        return;
    }
    // --------------------------------------------------------
    // LIMIT
    // --------------------------------------------------------
    const limit = Number(document.getElementById('limit').value);
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
        alert('Số lượng bài đăng phải là số nguyên từ 1 đến 500.');
        return;
    }
    // --------------------------------------------------------
    // VERIFIED
    // --------------------------------------------------------
    const verifiedSelection = getCheckedValue('filterVerified', 'any');
    const verifiedFilter = verifiedSelection === 'not_verified' ? 'not-verified' : verifiedSelection;
    // --------------------------------------------------------
    // SORT BY
    // --------------------------------------------------------
    // Backend ánh xạ relevance -> top, latest -> recent.
    const sortBy = getCheckedValue('sort', 'relevance');
    // --------------------------------------------------------
    // DATE RANGE
    // --------------------------------------------------------
    const dateMode = getCheckedValue('dateMode', 'all');
    const dateRange = dateMode === 'custom' ? getCheckedValue('dateRange', '1d') : undefined;
    // --------------------------------------------------------
    // BUILD REQUEST
    // --------------------------------------------------------
    // Không gửi followers/likes/videoCount vì Threads Actor
    // không trả về các dữ liệu này.
    const payload = {
        platform: 'threads',
        queries,
        searchType,
        limit,
        sortBy,
        verifiedFilter,
    };
    // Không gửi dateRange nếu chọn "Tất cả".
    if (dateRange) {
        payload.dateRange = dateRange;
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
            throw new Error(data.error || data.message || 'Threads discovery thất bại.');
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
                <strong>${Number(data.count ?? 0)}</strong>
                bài đăng từ
                <strong>${Number(data.creatorCount ?? 0)}</strong>
                creators
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
