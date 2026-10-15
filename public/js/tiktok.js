const runBtn = document.getElementById('runBtn');
const status = document.getElementById('status');
const result = document.getElementById('result');
// Google Auth
// const connectGoogleBtn =
//     document.getElementById('connectGoogleBtn');
// const googleAuthStatus =
//     document.getElementById('googleAuthStatus');
// connectGoogleBtn.addEventListener(
//     'click',
//     () => {
//         window.location.href =
//             '/api/auth/google';
//     }
// );
// const params =
//     new URLSearchParams(
//         window.location.search
//     );
// const googleAuth =
//     params.get('googleAuth');
// if (googleAuth === 'success') {
//     googleAuthStatus.textContent =
//         'Đã kết nối Google thành công.';
// }
// if (googleAuth === 'error') {
//     googleAuthStatus.textContent =
//         'Kết nối Google thất bại.';
// }
// Google sheet
const googleSheetUrlInput = document.getElementById('googleSheetUrl');
const validateGoogleSheetBtn = document.getElementById('validateGoogleSheetBtn');
const exportGoogleSheetBtn = document.getElementById('exportGoogleSheetBtn');
const googleSheetStatus = document.getElementById('googleSheetStatus');
let googleSheetValidated = false;
let discoveryCompleted = false;
let currentPlatform = null;
let currentJobId = null;

function updateExportButton() {
    exportGoogleSheetBtn.disabled = !googleSheetValidated || !discoveryCompleted;
}
validateGoogleSheetBtn.addEventListener('click', async () => {
    const spreadsheetUrl = googleSheetUrlInput.value.trim();
    googleSheetValidated = false;
    exportGoogleSheetBtn.disabled = true;
    if (!spreadsheetUrl) {
        googleSheetStatus.textContent = 'Vui lòng nhập URL Google Sheet.';
        return;
    }
    googleSheetStatus.textContent = 'Đang kiểm tra Google Sheet...';
    try {
        const response = await fetch(
            // '/api/google-sheets/validate',
            '/api/google-service-account/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    spreadsheetUrl
                })
            });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(
                // result.error ||
                // 'Không thể kiểm tra Google Sheet.'
                result.message || result.error || 'Không thể kiểm tra Google Sheet.');
        }
        googleSheetValidated = true;
        // exportGoogleSheetBtn.disabled = false;
        updateExportButton();
        googleSheetStatus.textContent = `✓ Đã kết nối: ${result.title}`;
    } catch (error) {
        googleSheetStatus.textContent = `✗ ${error.message}`;
    }
});
exportGoogleSheetBtn.addEventListener('click', async () => {
    console.log('EXPORT GOOGLE SHEET CLICKED');
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
        const response = await fetch(
            // '/api/google-sheets/export',
            '/api/google-service-account/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    spreadsheetUrl,
                    platform: currentPlatform,
                    jobId: currentJobId,
                })
            });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(
                // result.error ||
                // 'Export Google Sheet thất bại.'
                result.message || result.error || 'Nhập dữ liệu sang Google Sheet thất bại.');
        }
        googleSheetStatus.textContent = `✓ Đã nhập dữ liệu của ${result.creatorCount} creators vào tab "${result.sheetTitle}"`;
    } catch (error) {
        console.error(error);
        googleSheetStatus.textContent = `✗ ${error.message}`;
    } finally {
        // exportGoogleSheetBtn.disabled = false;
        updateExportButton();
    }
});
// Date settings
const dateOptions = document.getElementById('dateOptions');
const dateModeInputs = document.querySelectorAll('input[name="dateMode"]');
const dateRangeInputs = document.querySelectorAll('input[name="dateRange"]');

function updateDateInputs() {
    const selectedMode = document.querySelector('input[name="dateMode"]:checked').value;
    const enabled = selectedMode === 'custom';
    dateOptions.classList.toggle('disabled', !enabled);
    dateRangeInputs.forEach(input => {
        input.disabled = !enabled;
    });
}
dateModeInputs.forEach(input => {
    input.addEventListener('change', updateDateInputs);
});
updateDateInputs();
// const dateOptions = document.getElementById('dateOptions');
// const dateFromInput = document.getElementById('dateFrom');
// const dateToInput = document.getElementById('dateTo');
// const dateModeInputs = document.querySelectorAll(
//     'input[name="dateMode"]'
// );
// function updateDateInputs() {
//     const selectedMode = document.querySelector(
//         'input[name="dateMode"]:checked'
//     ).value;
//     const isCustom = selectedMode === 'custom';
//     dateFromInput.disabled = !isCustom;
//     dateToInput.disabled = !isCustom;
//     if (!isCustom) {
//         dateFromInput.value = '';
//         dateToInput.value = '';
//     }
// }
// dateModeInputs.forEach(input => {
//     input.addEventListener('change', updateDateInputs);
// });
// // Quan trọng: chạy ngay khi trang load
// updateDateInputs();
// ============================================================
// MIN / MAX VALIDATION
// ============================================================
function sanitize(input) {
    input.value = input.value.replace(/\D/g, '');
}

function setupRangeInputs(minId, maxId) {
    const minInput = document.getElementById(minId);
    const maxInput = document.getElementById(maxId);
    const error = document.createElement('div');
    error.className = 'range-error';
    maxInput.parentElement.appendChild(error);

    function validate() {
        error.textContent = '';
        // Cho phép để trống một trong hai giá trị
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
const validateFollowers = setupRangeInputs('minFollowers', 'maxFollowers');
const validateLikes = setupRangeInputs('minLikes', 'maxLikes');
const minVideoCountInput = document.getElementById('minVideoCount');
minVideoCountInput.addEventListener('input', () => {
    sanitize(minVideoCountInput);
});

function setupFilterToggle(name, optionsId) {
    const options = document.getElementById(optionsId);
    const radios = document.querySelectorAll(`input[name="${name}"]`);

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
setupFilterToggle('filterFollowers', 'followersOptions');
setupFilterToggle('filterLikes', 'likesOptions');
setupFilterToggle('filterVideoCount', 'videoCountOptions');

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
// START TIKTOK DISCOVERY
// ============================================================
runBtn.addEventListener('click', async () => {
    discoveryCompleted = false;
    currentPlatform = null;
    currentJobId = null;
    updateExportButton();
    // --------------------------------------------------------
    // SEARCH TYPE
    // --------------------------------------------------------
    const searchType = document.querySelector('input[name="searchType"]:checked').value;
    // --------------------------------------------------------
    // KEYWORDS / HASHTAGS
    // --------------------------------------------------------
    const queries = document.getElementById('keywords').value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    if (queries.length === 0) {
        alert('Vui lòng nhập ít nhất một keyword hoặc hashtag.');
        return;
    }
    // --------------------------------------------------------
    // LIMIT
    // --------------------------------------------------------
    const limit = Number(document.getElementById('limit').value);
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
        alert('Số lượng video phải là số nguyên từ 1 đến 500.');
        return;
    }
    // --------------------------------------------------------
    // SORT
    // --------------------------------------------------------
    const sortBy = document.querySelector('input[name="sort"]:checked').value;
    // --------------------------------------------------------
    // VERIFIED
    // --------------------------------------------------------
    const verifiedSelection = document.querySelector('input[name="filterVerified"]:checked').value;
    const verifiedFilter = verifiedSelection === 'not_verified' ? 'not-verified' : verifiedSelection;
    // --------------------------------------------------------
    // FILTERS
    // --------------------------------------------------------
    const isFilteredByFollowers = document.querySelector('input[name="filterFollowers"]:checked').value === 'yes';
    const isFilteredByLikes = document.querySelector('input[name="filterLikes"]:checked').value === 'yes';
    const isFilteredByVideoCount = document.querySelector('input[name="filterVideoCount"]:checked').value === 'yes';
    if (isFilteredByFollowers && !validateFollowers()) {
        return;
    }
    if (isFilteredByLikes && !validateLikes()) {
        return;
    }
    const minVideoCountText = document.getElementById('minVideoCount').value.trim();
    if (isFilteredByVideoCount && minVideoCountText === '') {
        alert('Vui lòng nhập số lượng video tối thiểu.');
        return;
    }
    // --------------------------------------------------------
    // DATE RANGE
    // --------------------------------------------------------
    const dateMode = document.querySelector('input[name="dateMode"]:checked').value;
    const dateRange = dateMode === 'custom' ? document.querySelector('input[name="dateRange"]:checked').value : undefined;
    // --------------------------------------------------------
    // BUILD PAYLOAD
    // --------------------------------------------------------
    const payload = {
        platform: 'tiktok',
        queries,
        searchType,
        limit,
        sortBy,
        verifiedFilter,
        isFilteredByFollowers,
        isFilteredByLikes,
        isFilteredByVideoCount,
    };
    // Chỉ gửi dateRange khi chọn giới hạn thời gian.
    if (dateRange) {
        payload.dateRange = dateRange;
    }
    // Chỉ gửi giá trị followers khi bật bộ lọc.
    if (isFilteredByFollowers) {
        const minText = document.getElementById('minFollowers').value.trim();
        const maxText = document.getElementById('maxFollowers').value.trim();
        if (minText !== '') {
            payload.minFollowers = Number(minText);
        }
        if (maxText !== '') {
            payload.maxFollowers = Number(maxText);
        }
    }
    // Chỉ gửi giá trị likes khi bật bộ lọc.
    if (isFilteredByLikes) {
        const minText = document.getElementById('minLikes').value.trim();
        const maxText = document.getElementById('maxLikes').value.trim();
        if (minText !== '') {
            payload.minLikes = Number(minText);
        }
        if (maxText !== '') {
            payload.maxLikes = Number(maxText);
        }
    }
    // Chỉ gửi videoCount khi bật bộ lọc.
    if (isFilteredByVideoCount) {
        payload.minVideoCount = Number(minVideoCountText);
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
            throw new Error(data.error || data.message || 'TikTok discovery thất bại.');
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
        console.log('CSV URL:', csvUrl);
        console.log('JSON URL:', jsonUrl);
        result.innerHTML = `
            <div class="summary">
                Tìm thấy
                <strong>${Number(data.count ?? 0)}</strong>
                videos từ
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
