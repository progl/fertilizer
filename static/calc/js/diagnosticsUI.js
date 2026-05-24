/**
 * Общий модуль UI диагностики соотношений
 * Используется в OHPG v2 и Fertilizer калькуляторах
 *
 * Зависимости: ION_RATIOS, getRatioStatus, calculateIonRatios должны быть определены в вызывающем скрипте
 */

// ============================================================================
// РЕНДЕРИНГ UI
// ============================================================================

/**
 * Форматирование значения соотношения
 */
function formatRatioValue(value) {
    if (!value || value === 0 || !isFinite(value)) return '—';
    return value >= 10 ? value.toFixed(1) : value.toFixed(2);
}

/**
 * Найти данные соотношения в результатах
 */
function findRatioData(ratios, ratioName) {
    for (const groupData of Object.values(ratios)) {
        if (groupData[ratioName]) return groupData[ratioName];
    }
    return null;
}

/**
 * Рендер диагностики в стиле OHPG (компактные карточки)
 * @param {Object} ratios - результат calculateIonRatios()
 * @param {HTMLElement} container - DOM элемент для рендера
 * @param {Object} options - { editable: false }
 */
function renderDiagnosticsOHPG(ratios, container, options = {}) {
    const { editable = false } = options;

    if (!container) return;

    // Проверяем есть ли данные
    const hasData = Object.values(ratios).some(group =>
        Object.values(group).some(r => r.value > 0)
    );

    if (!hasData) {
        container.innerHTML = `
            <div class="diag-empty">
                <i class="bi bi-calculator"></i> Введите данные для анализа
            </div>`;
        return;
    }

    let html = '<div class="diag-ratio-cards">';

    // Основные соотношения
    const mainRatios = ['K:N', 'K:Ca', 'K:Mg', 'Ca:Mg', 'NO3:NH4'];

    for (const ratioName of mainRatios) {
        const data = findRatioData(ratios, ratioName);
        if (!data) continue;

        const statusClass = `ratio-${data.status}`;
        const valueText = formatRatioValue(data.value);
        const rangeText = `${data.limits.min}-${data.limits.max}`;
        const ratioKey = ratioName.toLowerCase().replace(':', '_');

        if (editable) {
            html += `
            <div class="param-card ratio-card ${statusClass}" data-ratio="${ratioKey}">
                <label>${ratioName}</label>
                <input type="number" data-field="ratio_${ratioKey}" value="${valueText !== '—' ? valueText : ''}" step="0.01">
                <span class="ratio-hint">${rangeText}</span>
            </div>`;
        } else {
            html += `
            <div class="param-card ratio-card ${statusClass}" data-ratio="${ratioKey}">
                <label>${ratioName}</label>
                <span class="ratio-value">${valueText}</span>
                <span class="ratio-hint">${rangeText}</span>
            </div>`;
        }
    }

    html += '</div>';
    container.innerHTML = html;
}

/**
 * Обновить badge статуса
 */
function renderDiagStatusBadge(ratios, badgeElement) {
    if (!badgeElement) return;

    let good = 0, warning = 0, danger = 0, critical = 0;

    for (const groupData of Object.values(ratios)) {
        for (const info of Object.values(groupData)) {
            if (info.value === 0 || !isFinite(info.value)) continue;
            switch (info.status) {
                case 'good': good++; break;
                case 'warning': warning++; break;
                case 'danger': danger++; break;
                case 'critical': critical++; break;
            }
        }
    }

    let html = '';
    if (good > 0) html += `<span class="text-success"><i class="bi bi-check-circle-fill"></i>${good}</span> `;
    if (warning > 0) html += `<span class="text-warning"><i class="bi bi-exclamation-circle-fill"></i>${warning}</span> `;
    if (danger > 0) html += `<span class="text-danger"><i class="bi bi-x-circle-fill"></i>${danger}</span> `;
    if (critical > 0) html += `<span style="color:#ce1371"><i class="bi bi-exclamation-triangle-fill"></i>${critical}</span> `;

    badgeElement.innerHTML = html;
}

// ============================================================================
// EXPORTS
// ============================================================================

// Экспорт для глобального использования
if (typeof window !== 'undefined') {
    window.DiagnosticsUI = {
        formatRatioValue,
        findRatioData,
        renderDiagnosticsOHPG,
        renderDiagStatusBadge,
    };
}
