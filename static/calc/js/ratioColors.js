/**
 * Общий модуль подсветки соотношений
 * Используется в OHPG v2 и Fertilizer калькуляторах
 */

// Цвета для градиента
const COLORS = {
    low: [59, 130, 246],      // синий - ниже нормы
    good: [34, 197, 94],      // зелёный - норма
    warning: [234, 179, 8],   // жёлтый - на границе
    high: [239, 68, 68],      // красный - выше нормы
    critical: [206, 19, 113], // розовый - критично
};

// Непрозрачные фоновые цвета для матрицы (рассчитаны для белого фона)
const BG_COLORS = {
    low: '#e2ecfe',       // светло-синий
    good: '#e9f9ef',      // светло-зелёный
    warning: '#fdf6d7',   // светло-жёлтый
    high: '#fde3e3',      // светло-красный
    critical: '#f5d0e3',  // светло-розовый
};

/**
 * Рассчитать цвет подсветки для значения относительно лимитов
 * @param {number} value - текущее значение
 * @param {Object} limits - { min, rec, max }
 * @returns {Object} - { color, backgroundColor, status }
 */
function calculateRatioColor(value, limits) {
    if (!limits || value === 0 || value === null || value === undefined) {
        return {
            color: 'inherit',
            backgroundColor: 'transparent',
            status: 'neutral'
        };
    }

    const { min, rec, max } = limits;

    // Критично низко (< 70% от min)
    if (value < min * 0.7) {
        return {
            color: `rgb(${COLORS.critical.join(',')})`,
            backgroundColor: BG_COLORS.critical,
            status: 'critical'
        };
    }

    // Низко (< min)
    if (value < min) {
        const position = (value - min * 0.7) / (min - min * 0.7);
        const color = interpolateColor(COLORS.critical, COLORS.low, position);
        return {
            color: `rgb(${color.join(',')})`,
            backgroundColor: BG_COLORS.low,
            status: 'danger'
        };
    }

    // Ниже рекомендуемого (min <= value < rec)
    if (value < rec) {
        const position = (value - min) / (rec - min);
        const color = interpolateColor(COLORS.warning, COLORS.good, position);
        return {
            color: `rgb(${color.join(',')})`,
            backgroundColor: BG_COLORS.good,
            status: value < rec * 0.9 ? 'warning' : 'good'
        };
    }

    // В норме (rec <= value <= max)
    if (value <= max) {
        const position = (value - rec) / (max - rec);
        const color = interpolateColor(COLORS.good, COLORS.warning, position);
        return {
            color: `rgb(${color.join(',')})`,
            backgroundColor: BG_COLORS.good,
            status: value > max * 0.9 ? 'warning' : 'good'
        };
    }

    // Выше max но < 130%
    if (value < max * 1.3) {
        const position = (value - max) / (max * 0.3);
        const color = interpolateColor(COLORS.warning, COLORS.high, position);
        return {
            color: `rgb(${color.join(',')})`,
            backgroundColor: BG_COLORS.high,
            status: 'danger'
        };
    }

    // Критично высоко (>= 130% от max)
    return {
        color: `rgb(${COLORS.critical.join(',')})`,
        backgroundColor: BG_COLORS.critical,
        status: 'critical'
    };
}

/**
 * Интерполяция между двумя цветами
 */
function interpolateColor(color1, color2, position) {
    position = Math.max(0, Math.min(1, position));
    return [
        Math.round(color1[0] + (color2[0] - color1[0]) * position),
        Math.round(color1[1] + (color2[1] - color1[1]) * position),
        Math.round(color1[2] + (color2[2] - color1[2]) * position),
    ];
}

/**
 * Рассчитать цвет для матрицы соотношений (упрощённый вариант)
 * @param {number} value - значение соотношения
 * @param {number} min - минимум
 * @param {number} rec - рекомендуемое
 * @param {number} max - максимум
 * @returns {Object} - { color, backgroundColor }
 */
function calculateMatrixCellColor(value, min, rec, max) {
    return calculateRatioColor(value, { min, rec, max });
}

/**
 * Применить цвет к элементу
 * @param {HTMLElement} element - DOM элемент
 * @param {Object} colorResult - результат calculateRatioColor
 */
function applyColorToElement(element, colorResult) {
    if (!element || !colorResult) return;
    element.style.color = colorResult.color;
    element.style.backgroundColor = colorResult.backgroundColor;
}

/**
 * CSS класс для статуса
 * @param {string} status - 'good', 'warning', 'danger', 'critical', 'neutral'
 * @returns {string} - CSS класс
 */
function getStatusClass(status) {
    const classes = {
        good: 'ratio-status-good',
        warning: 'ratio-status-warning',
        danger: 'ratio-status-danger',
        critical: 'ratio-status-critical',
        neutral: 'ratio-status-neutral',
    };
    return classes[status] || '';
}

// Экспорт для legacy (non-ES6) скриптов
if (typeof window !== 'undefined') {
    window.RatioColors = {
        calculateRatioColor,
        calculateMatrixCellColor,
        applyColorToElement,
        getStatusClass,
        COLORS,
    };
}

