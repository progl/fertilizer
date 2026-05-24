// ============================================================================
// КОНСТАНТЫ И КОНФИГУРАЦИЯ
// ============================================================================

const ELEMENTS = ['nh4', 'no3', 'nh2', 'p', 'k', 'ca', 'mg', 's', 'cl', 'fe', 'zn', 'cu', 'mn', 'mo', 'b', 'co', 'si'];
const MACRO_MOL_ELEMENTS = ['P', 'K', 'Ca', 'Mg', 'S', 'Cl', 'NH4', 'NO3', 'NH2', 'N'];
const MICRO_EL_LC = ['fe', 'zn', 'cu', 'mn', 'mo', 'b', 'co', 'si'];
const MACRO_EL_LC = ['nh4', 'no3', 'nh2', 'p', 'k', 'ca', 'mg', 's'];

const MOLARS = {
    N: 14.007, NO3: 14.007, NH4: 14.007, NH2: 14.007,
    P: 30.974, K: 39.098, Ca: 40.078, Mg: 24.305,
    S: 32.06, Cl: 35.45, Fe: 55.845, Mn: 54.938,
    B: 10.81, Zn: 65.38, Cu: 63.546, Mo: 95.95,
    Co: 58.933, Si: 28.085
};

const CATION_DICT = { NH4: 1, K: 1, Ca: 2, Mg: 2 };
const ANION_DICT = { NO3: 1, P: 1, S: 2, Cl: 1 }; // P как H2PO4^- при pH ~6 (заряд 1)

const CONVERSION_FACTORS = {
    K2O_TO_K: 0.83015, P2O5_TO_P: 0.43642, CaO_TO_Ca: 0.71469,
    MgO_TO_Mg: 0.603, SO3_TO_S: 1 / 2.497, ClO_TO_Cl: 0.6889
};

const FIELD_NAMES = {
    name: "name", pk: "pk", search: "search", description: "description", link: "link",
    nh4: "N_NH4", no3: "N_NO3", nh2: "N_NH2", p: "P", k: "K",
    ca: "Ca", mg: "Mg", s: "S", cl: "Cl", fe: "Fe",
    zn: "Zn", cu: "Cu", mn: "Mn", mo: "Mo", b: "B",
    co: "Co", si: "Si", k2o: "K2O", p2o5: "P2O5",
    cao: "CaO", mgo: "MgO", so3: "SO3", cacl: "CaCl",
    clo: "ClO"
};

const ELEMENTS_M = ['N', 'P', 'K', 'Ca', 'Mg', 'S', 'Cl', 'Fe', 'Zn', 'Cu', 'Mn', 'Mo', 'B', 'Co', 'Si'];
const MIN_VALUES = [56, 12, 59, 12, 12, 29, 0, 1, 0.05, 0.01, 0.1, 0.01, 0.1, 0, 0.0];
const RECOMMENDED_VALUES = [136, 53, 253, 144, 43, 138, 10, 2, 0.35, 0.1, 0.5, 0.05, 0.45, 0.05, 0.05];
const MAX_VALUES = [217, 217, 592, 360, 84, 331, 20, 6, 0.5, 0.3, 1, 0.2, 0.95, 0.1, 0.1];

const MIN_RATIOS = [1, 0.2, 1.1, 0.2, 0.2, 0.5];
const RECOMMENDED_RATIOS = [1, 0.3, 1.8, 1, 0.3, 1];
const MAX_RATIOS = [1, 1, 2.7, 1.6, 0.3, 1.5];

// Хелпер для получения перевода (с fallback)
const _t = (key, fallback) => (typeof window !== 'undefined' && window.t) ? window.t(key) : fallback;

// Ионные соотношения для диагностики баланса
// Источники: Hoagland, Florida/Arizona формулы, Ohio State, Science in Hydroponics
// Обновлено: 2024-02 на основе анализа реальных гидропонных формул
const ION_RATIOS = {
    // КАТИОННЫЙ БАЛАНС
    cations: {
        'K:N':   { min: 1.0, rec: 1.4, max: 2.5, warnLowKey: 'diag_warn_k_n_low', warnHighKey: 'diag_warn_k_n_high' },
        'K:Ca':  { min: 0.8, rec: 1.2, max: 2.0, warnLowKey: 'diag_warn_k_ca_low', warnHighKey: 'diag_warn_k_ca_high' },
        'Ca:Mg': { min: 2.0, rec: 3.0, max: 4.0, warnLowKey: 'diag_warn_ca_mg_low', warnHighKey: 'diag_warn_ca_mg_high' },
        'K:Mg':  { min: 3.0, rec: 4.5, max: 7.0, warnLowKey: 'diag_warn_k_mg_low', warnHighKey: 'diag_warn_k_mg_high' },
    },
    // АЗОТНЫЙ БАЛАНС
    nitrogen: {
        'NO3:NH4': { min: 9, rec: 15, max: 99, warnLowKey: 'diag_warn_no3_nh4_low', warnHighKey: 'diag_warn_no3_nh4_high' },
        'N:K':     { min: 0.4, rec: 0.7, max: 1.0, warnLowKey: 'diag_warn_n_k_low', warnHighKey: 'diag_warn_n_k_high' },
        'N:Ca':    { min: 0.5, rec: 0.8, max: 1.1, warnLowKey: 'diag_warn_n_ca_low', warnHighKey: 'diag_warn_n_ca_high' },
    },
    // ФОСФОР И СЕРА
    phosphorus: {
        'N:P':  { min: 2.0, rec: 3.5, max: 7.0, warnLowKey: 'diag_warn_n_p_low', warnHighKey: 'diag_warn_n_p_high' },
        'Ca:P': { min: 2.0, rec: 3.0, max: 6.0, warnLowKey: 'diag_warn_ca_p_low', warnHighKey: 'diag_warn_ca_p_high' },
        'N:S':  { min: 1.0, rec: 2.5, max: 4.0, warnLowKey: 'diag_warn_n_s_low', warnHighKey: 'diag_warn_n_s_high' },
    },
    // МИКРОЭЛЕМЕНТЫ
    micro: {
        'Fe:Mn': { min: 2, rec: 3.5, max: 5, warnLowKey: 'diag_warn_fe_mn_low', warnHighKey: 'diag_warn_fe_mn_high' },
        'Fe:Zn': { min: 5, rec: 15, max: 30, warnLowKey: 'diag_warn_fe_zn_low', warnHighKey: 'diag_warn_fe_zn_high' },
        'Mn:Zn': { min: 1.5, rec: 4, max: 8, warnLowKey: 'diag_warn_mn_zn_low', warnHighKey: 'diag_warn_mn_zn_high' },
        'Zn:Cu': { min: 1.5, rec: 2.0, max: 3.0, warnLowKey: 'diag_warn_zn_cu_low', warnHighKey: 'diag_warn_zn_cu_high' },
    }
};

// Модификаторы лимитов для субстратов
const SUBSTRATE_MODIFIERS = {
    hydro: {}, // базовые значения
    coco: {
        'Ca:Mg': { min: 3.0, rec: 3.5, max: 4.5 }, // больше Ca для буферизации
        'K:Ca':  { min: 0.6, rec: 1.0, max: 1.5 }, // меньше K (кокос удерживает)
    },
    rockwool: {
        'Ca:Mg': { min: 2.5, rec: 3.2, max: 4.2 },
        'NO3:NH4': { min: 12, rec: 20, max: 99 }, // меньше NH4
    }
};

// Текущий субстрат
let currentSubstrate = 'hydro';

// Получить лимиты с учётом субстрата
function getRatioLimitsForSubstrate(ratioName, substrate) {
    // Ищем базовые лимиты
    let baseLimits = null;
    for (const group of Object.values(ION_RATIOS)) {
        if (group[ratioName]) {
            baseLimits = { ...group[ratioName] };
            break;
        }
    }
    if (!baseLimits) return null;

    // Применяем модификатор субстрата если есть
    const mods = SUBSTRATE_MODIFIERS[substrate];
    if (mods && mods[ratioName]) {
        Object.assign(baseLimits, mods[ratioName]);
    }
    return baseLimits;
}

// Ключи для переводов лейблов соотношений
const RATIO_LABEL_KEYS = {
    'K:Ca': 'diag_ratio_k_ca',
    'Ca:Mg': 'diag_ratio_ca_mg',
    'K:Mg': 'diag_ratio_k_mg',
    'NO3:NH4': 'diag_ratio_no3_nh4',
    'N:K': 'diag_ratio_n_k',
    'N:Ca': 'diag_ratio_n_ca',
    'N:P': 'diag_ratio_n_p',
    'Ca:P': 'diag_ratio_ca_p',
    'N:S': 'diag_ratio_n_s',
    'Fe:Mn': 'diag_ratio_fe_mn',
    'Fe:Zn': 'diag_ratio_fe_zn',
    'Mn:Zn': 'diag_ratio_mn_zn',
    'Zn:Cu': 'diag_ratio_zn_cu',
};

// Функция для получения переведённого лейбла
function getRatioLabel(name) {
    const key = RATIO_LABEL_KEYS[name];
    return key ? _t(key, name) : name;
}

// Ключи для групп
const GROUP_META_KEYS = {
    cations:    { icon: 'bi-plus-circle', titleKey: 'diag_group_cations', color: 'primary' },
    nitrogen:   { icon: 'bi-droplet', titleKey: 'diag_group_nitrogen', color: 'success' },
    phosphorus: { icon: 'bi-lightning', titleKey: 'diag_group_phosphorus', color: 'warning' },
    micro:      { icon: 'bi-gem', titleKey: 'diag_group_micro', color: 'info' },
};

// Функция для получения мета-данных группы с переводом
function getGroupMeta(key) {
    const meta = GROUP_META_KEYS[key];
    if (!meta) return null;
    return {
        icon: meta.icon,
        title: _t(meta.titleKey, key),
        color: meta.color
    };
}

// ============================================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================================================

/* eslint-disable camelcase */ // Legacy snake_case variables
/* global LZString */ // External libraries
let ppm = false;
const macroMolOnly = false;
const proverka_by = "all";
let have_moder_fert = false;
let rows_visible = true;
let sum_cations = 0;
let sum_anions = 0;
let previousSumVal;

// ============================================================================
// УТИЛИТЫ
// ============================================================================

const safeParseFloat = (value, defaultValue = 0) => {
    if (typeof value === 'string') value = value.replace(',', '.');
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
};

const formatGramsTruncated = (x) => {
    if (!isFinite(x) || x <= 0) return '0.00';
    const t = Math.floor(x * 100) / 100;
    return (t < 0.01) ? '0.00' : t.toFixed(2);
};

const getElementValue = (id, decimals = 2) => {
    const element = document.querySelector(`#${id}`);
    let value = element ? parseFloat(element.textContent) : 0;
    value = isNaN(value) ? 0 : value;
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

const updateElementText = (selector, value, defaultText = '-') => {
    const el = $(selector);
    if (el.length) el.text(value === 0 || !value ? defaultText : value);
};

/**
 * Расчет плотности раствора на основе концентрации соли
 * @param {number} gl - Граммы на литр концентрата
 * @param {number} purity - Чистота/процент активного вещества
 * @param {number} divisor - Коэффициент для перевода в кмоль
 * @param {number} base - Базовая плотность (обычно ~0.998-0.999)
 * @param {number} k1 - Первый коэффициент
 * @param {number} k2 - Второй коэффициент
 * @returns {number} Плотность раствора в г/мл
 */
const _hpgCalcDensity = (gl, purity, divisor, base, k1, k2) => {
    if (purity === 0) return 0;
    const kmol = gl / (divisor / purity);
    return base + k1 * kmol + k2 * Math.pow(kmol, 2);
};

/**
 * Определение параметров плотности для удобрения по его названию и составу
 * @param {string} name - Название удобрения
 * @param {object} elements - Состав удобрения (ca, k, mg, p, s, etc.)
 * @returns {object} Параметры для расчёта плотности
 */
const getDensityParams = (name, elements = {}) => {
    const nameLower = name.toLowerCase();

    // Кальциевая селитра (CaNO3)
    if (nameLower.includes('кальци') && nameLower.includes('азотно')) {
        return { purity: safeParseFloat(elements.ca) || 19, divisor: 24.4247, base: 0.999, k1: 0.000732, k2: -0.000000113 };
    }

    // Калиевая селитра (KNO3)
    if (nameLower.includes('калие') && nameLower.includes('селитр')) {
        return { purity: safeParseFloat(elements.k) || 38, divisor: 38.6717, base: 0.998, k1: 0.00062, k2: -0.000000114 };
    }

    // Аммиачная селитра (NH4NO3)
    if (nameLower.includes('аммиач') && nameLower.includes('селитр')) {
        return { purity: safeParseFloat(elements.no3) || 17, divisor: 17.4989, base: 0.999, k1: 0.000397, k2: -0.0000000422 };
    }

    // Магниевая селитра (MgNO3)
    if (nameLower.includes('магние') && nameLower.includes('селитр')) {
        return { purity: safeParseFloat(elements.mg) || 9.5, divisor: 16.3874, base: 0.998, k1: 0.000736, k2: -0.000000121 };
    }

    // Хлорид кальция (CaCl2)
    if (nameLower.includes('хлорид') && nameLower.includes('кальц')) {
        return { purity: safeParseFloat(elements.ca) || 27, divisor: 36.1115, base: 0.999, k1: 0.000794, k2: -0.000000151 };
    }

    // Сульфат магния (MgSO4)
    if (nameLower.includes('сульфат') && nameLower.includes('магни')) {
        return { purity: safeParseFloat(elements.mg) || 16, divisor: 20.1923, base: 0.999, k1: 0.00097, k2: -0.000000268 };
    }

    // Монофосфат калия (KH2PO4)
    if (nameLower.includes('монофосфат') || (nameLower.includes('фосфат') && nameLower.includes('калия'))) {
        return { purity: safeParseFloat(elements.p) || 22.7, divisor: 28.7307, base: 0.998, k1: 0.000716, k2: -0.000000399 };
    }

    // Сульфат калия (K2SO4)
    if (nameLower.includes('сульфат') && nameLower.includes('калия')) {
        return { purity: safeParseFloat(elements.k) || 44, divisor: 44.8737, base: 0.998, k1: 0.000814, k2: -0.00000039 };
    }

    // Хелат железа EDTA
    if (nameLower.includes('желез') && nameLower.includes('edta')) {
        return { purity: safeParseFloat(elements.fe) || 13, divisor: 7.692, base: 0.999, k1: 0.0005, k2: -0.0000001 };
    }

    // Хелат железа DTPA
    if (nameLower.includes('желез') && nameLower.includes('dtpa')) {
        return { purity: safeParseFloat(elements.fe) || 11, divisor: 9.091, base: 0.999, k1: 0.0005, k2: -0.0000001 };
    }

    // Хелат железа EDDHA
    if (nameLower.includes('желез') && (nameLower.includes('eddha') || nameLower.includes('эддха'))) {
        return { purity: safeParseFloat(elements.fe) || 6, divisor: 16.667, base: 0.999, k1: 0.0005, k2: -0.0000001 };
    }

    // Сульфат марганца (MnSO4)
    if (nameLower.includes('сульфат') && nameLower.includes('марганц')) {
        return { purity: safeParseFloat(elements.mn) || 32.5, divisor: 1.689, base: 0.999, k1: 0.0006, k2: -0.0000001 };
    }

    // Борная кислота (H3BO3)
    if (nameLower.includes('борн') && nameLower.includes('кислот')) {
        return { purity: safeParseFloat(elements.b) || 17.5, divisor: 0.622, base: 0.999, k1: 0.0003, k2: -0.00000005 };
    }

    // Сульфат цинка (ZnSO4)
    if (nameLower.includes('сульфат') && nameLower.includes('цинк')) {
        return { purity: safeParseFloat(elements.zn) || 22.7, divisor: 2.878, base: 0.999, k1: 0.0007, k2: -0.0000001 };
    }

    // Сульфат меди (CuSO4)
    if (nameLower.includes('сульфат') && nameLower.includes('мед')) {
        return { purity: safeParseFloat(elements.cu) || 25.5, divisor: 2.491, base: 0.999, k1: 0.0008, k2: -0.0000001 };
    }

    // Молибдат натрия (Na2MoO4)
    if (nameLower.includes('молибдат')) {
        return { purity: safeParseFloat(elements.mo) || 39.7, divisor: 1.209, base: 0.999, k1: 0.0005, k2: -0.0000001 };
    }

    // Сульфат кобальта (CoSO4)
    if (nameLower.includes('сульфат') && nameLower.includes('кобальт')) {
        return { purity: safeParseFloat(elements.co) || 21, divisor: 2.809, base: 0.999, k1: 0.0006, k2: -0.0000001 };
    }

    // Силикат (Na2SiO3)
    if (nameLower.includes('силикат')) {
        return { purity: safeParseFloat(elements.si) || 10, divisor: 6.0, base: 0.999, k1: 0.0004, k2: -0.00000008 };
    }

    // Для комплексных удобрений и неопределённых типов используем упрощённую формулу
    return null;
};

/**
 * Расчет плотности концентрата удобрения
 * @param {string} name - Название удобрения
 * @param {object} elements - Состав удобрения
 * @param {number} grams - Граммы удобрения в концентрате
 * @param {number} volume - Объём концентрата в мл
 * @returns {number} Плотность раствора в г/мл
 */
const calculateFertilizerDensity = (name, elements, grams, volume) => {
    const gl = grams / volume * 1000; // г/л
    const params = getDensityParams(name, elements);

    if (params) {
        return _hpgCalcDensity(gl, params.purity, params.divisor, params.base, params.k1, params.k2);
    }

    // Упрощённая формула для комплексных удобрений
    const concentration = grams / volume; // г/мл
    return 1.0 + (concentration * 0.0006);
};

// ============================================================================
// ДИАГНОСТИКА ИОННЫХ СООТНОШЕНИЙ
// ============================================================================

/**
 * Определяет статус соотношения относительно допустимых диапазонов
 * @param {number} value - текущее значение соотношения
 * @param {Object} limits - объект с min, rec, max
 * @returns {string} - 'good', 'warning', 'danger', 'critical', 'neutral'
 */
function getRatioStatus(value, limits) {
    if (value === 0 || !isFinite(value)) return 'neutral';
    if (value < limits.min * 0.7 || value > limits.max * 1.3) return 'critical';
    if (value < limits.min || value > limits.max) return 'danger';
    if (value < limits.rec * 0.9 || value > limits.rec * 1.1) return 'warning';
    return 'good';
}

/**
 * Рассчитывает все ионные соотношения для диагностики
 * @param {Object} sums - объект с суммами элементов (nh4, no3, p, k, ca, mg, s, fe, zn, cu, mn)
 * @returns {Object} - объект со значениями, статусами и метаданными соотношений
 */
function calculateIonRatios(sums) {
    const sumN = (sums.nh4 || 0) + (sums.no3 || 0) + (sums.nh2 || 0);

    // Рассчитываем все соотношения
    const ratioValues = {
        'K:N':     sumN > 0 ? sums.k / sumN : 0,
        'K:Ca':    sums.ca > 0 ? sums.k / sums.ca : 0,
        'Ca:Mg':   sums.mg > 0 ? sums.ca / sums.mg : 0,
        'K:Mg':    sums.mg > 0 ? sums.k / sums.mg : 0,
        'NO3:NH4': sums.nh4 > 0 ? sums.no3 / sums.nh4 : (sums.no3 > 0 ? 99 : 0),
        'N:K':     sums.k > 0 ? sumN / sums.k : 0,
        'N:Ca':    sums.ca > 0 ? sumN / sums.ca : 0,
        'N:P':     sums.p > 0 ? sumN / sums.p : 0,
        'Ca:P':    sums.p > 0 ? sums.ca / sums.p : 0,
        'N:S':     sums.s > 0 ? sumN / sums.s : 0,
        'Fe:Mn':   sums.mn > 0 ? sums.fe / sums.mn : 0,
        'Fe:Zn':   sums.zn > 0 ? sums.fe / sums.zn : 0,
        'Mn:Zn':   sums.zn > 0 ? sums.mn / sums.zn : 0,
        'Zn:Cu':   sums.cu > 0 ? sums.zn / sums.cu : 0,
    };

    const results = {};

    // Проходим по всем группам и соотношениям
    for (const [group, ratios] of Object.entries(ION_RATIOS)) {
        results[group] = {};
        for (const [name] of Object.entries(ratios)) {
            const value = ratioValues[name];
            // Получаем лимиты с учётом текущего субстрата
            const limits = getRatioLimitsForSubstrate(name, currentSubstrate);
            const status = getRatioStatus(value, limits);
            results[group][name] = {
                value: value,
                status: status,
                limits: limits,
                label: getRatioLabel(name),
            };
        }
    }

    return results;
}

/**
 * Собирает список проблем и рекомендаций
 * @param {Object} ratios - результат calculateIonRatios()
 * @returns {Array} - массив объектов {level, text}
 */
function getIssuesAndRecommendations(ratios) {
    const issues = [];

    for (const [, data] of Object.entries(ratios)) {
        for (const [, info] of Object.entries(data)) {
            if (info.status === 'critical' || info.status === 'danger' || info.status === 'warning') {
                // Определяем какое предупреждение показать: низкое или высокое
                const isLow = info.value < (info.limits.rec || info.limits.min);
                const warnKey = isLow ? info.limits.warnLowKey : info.limits.warnHighKey;
                const warnText = warnKey ? _t(warnKey, '') : '';
                if (!warnText) continue; // Пропускаем если нет текста рекомендации
                const level = info.status;
                issues.push({ level, text: `${info.label}: ${warnText}` });
            }
        }
    }

    return issues.slice(0, 5); // Максимум 5 рекомендаций
}

/**
 * Обновляет подсказки лимитов в карточках при смене субстрата
 */
function updateRatioCardHints() {
    const cardRatios = {
        'k_n': 'K:N',
        'k_ca': 'K:Ca',
        'k_mg': 'K:Mg',
        'ca_mg': 'Ca:Mg',
        'no3_nh4': 'NO3:NH4'
    };

    for (const [key, name] of Object.entries(cardRatios)) {
        const card = document.querySelector(`.ratio-card[data-ratio="${key}"]`);
        if (!card) continue;

        const limits = getRatioLimitsForSubstrate(name, currentSubstrate);
        if (!limits) continue;

        // Обновляем data-атрибуты
        card.dataset.min = limits.min;
        card.dataset.max = limits.max;

        // Обновляем подсказку
        const hint = card.querySelector('.ratio-hint');
        if (hint) {
            hint.textContent = `${limits.min}-${limits.max}`;
        }

        // Обновляем tooltip
        const labelKey = RATIO_LABEL_KEYS[name] || name;
        card.dataset.tooltip = `${name} - ${_t(labelKey, name)}\n${_t('diag_recommended', 'Рекомендуемо')}: ${limits.min}-${limits.max}`;
    }
}

/**
 * Обновляет карточку диагностики в DOM (стиль OHPG)
 * @param {Object} ratios - результат calculateIonRatios()
 */
function updateDiagnosticsCard(ratios) {
    // Скрываем placeholder "Введите NPK для анализа баланса"
    const placeholder = document.querySelector('#diagnostics-content > .text-muted.text-center');
    if (placeholder) placeholder.style.display = 'none';

    // Обновляем карточки основных соотношений
    const mainRatios = {
        'k_n': 'K:N',
        'k_ca': 'K:Ca',
        'k_mg': 'K:Mg',
        'ca_mg': 'Ca:Mg',
        'no3_nh4': 'NO3:NH4'
    };

    for (const [key, name] of Object.entries(mainRatios)) {
        const card = document.querySelector(`.ratio-card[data-ratio="${key}"]`);
        if (!card) continue;

        const data = findRatioInGroups(ratios, name);
        if (!data) continue;

        // Обновляем значение
        const input = card.querySelector('input');
        if (input) {
            const valueText = data.value > 0 && isFinite(data.value)
                ? (data.value >= 10 ? data.value.toFixed(1) : data.value.toFixed(2))
                : '';
            input.value = valueText;
        }

        // Обновляем подсветку
        card.classList.remove('ratio-good', 'ratio-warning', 'ratio-danger', 'ratio-critical');
        if (data.status !== 'neutral') {
            card.classList.add(`ratio-${data.status}`);
        }
    }

    // Соотношения уже показанные в карточках — не дублируем
    const RATIOS_IN_CARDS = new Set(['K:N', 'K:Ca', 'K:Mg', 'Ca:Mg', 'NO3:NH4']);

    // Рендерим все группы с соотношениями не из карточек
    updateDetailedGroups(ratios, RATIOS_IN_CARDS);

    // Обновляем рекомендации
    updateRecommendations(ratios);
}

/**
 * Найти соотношение в группах
 */
function findRatioInGroups(ratios, name) {
    for (const groupData of Object.values(ratios)) {
        if (groupData[name]) return groupData[name];
    }
    return null;
}

/**
 * Рендерит все группы соотношений (кроме тех что в карточках) в #diagnostics-content
 */
function updateDetailedGroups(ratios, ratiosInCards) {
    const container = document.getElementById('diagnostics-content');
    if (!container) return;

    // Удаляем старые детальные группы
    container.querySelectorAll('.diag-group-detail').forEach(el => el.remove());

    for (const [groupKey, groupData] of Object.entries(ratios)) {
        const meta = getGroupMeta(groupKey);
        if (!meta) continue;

        // Фильтруем — только соотношения не из карточек с ненулевым значением
        const entries = Object.entries(groupData).filter(
            ([name, data]) => !ratiosInCards.has(name) && data.value && data.value > 0
        );
        if (entries.length === 0) continue;

        const group = document.createElement('div');
        group.className = `diag-group diag-group-detail diag-group-${groupKey} mb-2`;

        let html = `<div class="diag-group-title text-${meta.color}">
            <i class="bi ${meta.icon} me-1"></i>${meta.title}
        </div><div class="diag-items">`;

        for (const [name, data] of entries) {
            const statusClass = `diag-${data.status}`;
            const valueText = data.value >= 10 ? data.value.toFixed(1) : data.value.toFixed(2);
            const rangeText = `${data.limits.min}–${data.limits.max}`;
            const isLow = data.value < data.limits.min;
            const warnKey = isLow ? data.limits.warnLowKey : data.limits.warnHighKey;
            const warnText = warnKey ? _t(warnKey, '') : '';

            html += `<div class="diag-item ${statusClass}" data-warn="${warnText || ''}">
                <span class="diag-label">${name}</span>
                <span class="diag-value">${valueText}</span>
                <span class="diag-range">(${rangeText})</span>
            </div>`;
        }

        html += '</div>';
        group.innerHTML = html;
        container.appendChild(group);

        // Обработчики кликов для подсказок
        group.querySelectorAll('.diag-item[data-warn]').forEach(item => {
            if (!item.dataset.warn) return;
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                const warn = this.dataset.warn;
                if (!warn) return;
                document.querySelectorAll('.diag-tooltip').forEach(t => t.remove());
                const tooltip = document.createElement('div');
                tooltip.className = 'diag-tooltip';
                tooltip.textContent = warn;
                this.appendChild(tooltip);
                setTimeout(() => tooltip.remove(), 3000);
            });
        });
    }
}

/**
 * Обновить рекомендации
 */
function updateRecommendations(ratios) {
    const container = document.getElementById('diagnostics-content');
    if (!container) return;

    // Удаляем старые рекомендации
    let recBlock = container.querySelector('.diag-recommendations');
    if (recBlock) recBlock.remove();

    const issues = getIssuesAndRecommendations(ratios);
    if (issues.length === 0) return;

    recBlock = document.createElement('div');
    recBlock.className = 'diag-recommendations mt-2';
    recBlock.innerHTML = `
        <div class="diag-rec-title"><i class="bi bi-lightbulb me-1"></i>${_t('diag_recommendations', 'Рекомендации')}</div>
        <ul class="diag-rec-list mb-0">
            ${issues.map(i => `<li class="diag-rec-${i.level}">${i.text}</li>`).join('')}
        </ul>
    `;
    container.appendChild(recBlock);
}

/**
 * Обновляет краткий статус диагностики возле имени профиля и в toolbar
 * @param {Object} ratios - результат calculateIonRatios()
 */
function updateDiagStatusBadge(ratios) {
    const badge = $('#diagStatusBadge');
    const toolbarBadge = $('#diag-status-badge');

    // Подсчитываем статусы
    let good = 0, warning = 0, danger = 0, critical = 0;

    for (const groupData of Object.values(ratios)) {
        for (const info of Object.values(groupData)) {
            if (info.value === 0 || !isFinite(info.value)) continue; // Пропускаем neutral
            switch (info.status) {
                case 'good': good++; break;
                case 'warning': warning++; break;
                case 'danger': danger++; break;
                case 'critical': critical++; break;
            }
        }
    }

    // Формируем HTML с иконками
    let html = '';
    if (good > 0) html += `<span class="text-success" title="В норме"><i class="bi bi-check-circle-fill"></i>${good}</span> `;
    if (warning > 0) html += `<span class="text-warning" title="На границе"><i class="bi bi-exclamation-circle-fill"></i>${warning}</span> `;
    if (danger > 0) html += `<span class="text-danger" title="Выход за пределы"><i class="bi bi-x-circle-fill"></i>${danger}</span> `;
    if (critical > 0) html += `<span style="color:#ce1371" title="Критично"><i class="bi bi-exclamation-triangle-fill"></i>${critical}</span> `;

    if (badge.length) badge.html(html.trim());

    // Обновляем бейдж в toolbar
    if (toolbarBadge.length) {
        const total = good + warning + danger + critical;
        if (total === 0) {
            toolbarBadge.removeClass('bg-success bg-warning bg-danger').addClass('bg-secondary').text('—');
        } else if (critical > 0 || danger > 0) {
            toolbarBadge.removeClass('bg-secondary bg-success bg-warning').addClass('bg-danger').text(critical + danger);
        } else if (warning > 0) {
            toolbarBadge.removeClass('bg-secondary bg-success bg-danger').addClass('bg-warning').text(warning);
        } else {
            toolbarBadge.removeClass('bg-secondary bg-warning bg-danger').addClass('bg-success').text(good);
        }
    }
}

// ============================================================================
// АНТАГОНИЗМЫ (панель предупреждений)
// ============================================================================

/**
 * Проверка антагонизмов и вывод предупреждений
 * @param {Object} sums - объект с суммами элементов
 */
function checkAntagonisms(sums) {
    const warnings = [];

    // Ca:Mg (норма 2-3.5 для гидро, берём из ION_RATIOS)
    const caMgLimits = ION_RATIOS.cations['Ca:Mg'];
    if (sums.mg > 0) {
        const ca_mg = sums.ca / sums.mg;
        if (ca_mg < caMgLimits.min) {
            warnings.push({
                text: `Ca:Mg = ${ca_mg.toFixed(2)} (${_t('diag_low', 'низкое')}, ${_t('diag_norm', 'норма')} ${caMgLimits.min}-${caMgLimits.max})`,
                level: 'high'
            });
        } else if (ca_mg > caMgLimits.max) {
            warnings.push({
                text: `Ca:Mg = ${ca_mg.toFixed(2)} (${_t('diag_high', 'высокое')}, ${_t('diag_norm', 'норма')} ${caMgLimits.min}-${caMgLimits.max})`,
                level: 'high'
            });
        }
    }

    // K:Ca
    const kCaLimits = ION_RATIOS.cations['K:Ca'];
    if (sums.ca > 0) {
        const k_ca = sums.k / sums.ca;
        if (k_ca < kCaLimits.min) {
            warnings.push({
                text: `K:Ca = ${k_ca.toFixed(2)} (${_t('diag_low', 'низкое')}, ${_t('diag_norm', 'норма')} ${kCaLimits.min}-${kCaLimits.max})`,
                level: 'high'
            });
        } else if (k_ca > kCaLimits.max) {
            warnings.push({
                text: `K:Ca = ${k_ca.toFixed(2)} (${_t('diag_high', 'высокое')}, ${_t('diag_norm', 'норма')} ${kCaLimits.min}-${kCaLimits.max})`,
                level: 'high'
            });
        }
    }

    // Mg:K (норма >= 0.14, что соответствует K:Mg <= 7)
    const kMgLimits = ION_RATIOS.cations['K:Mg'];
    if (sums.k > 0) {
        const mg_k = sums.mg / sums.k;
        const mg_k_min = 1 / kMgLimits.max; // K:Mg max=7 -> Mg:K min=0.14
        if (mg_k < mg_k_min) {
            warnings.push({
                text: `Mg:K = ${mg_k.toFixed(2)} (${_t('diag_low', 'низкое')}, ${_t('diag_min', 'минимум')} ${mg_k_min.toFixed(2)})`,
                level: 'high'
            });
        }
    }

    // P - многоуровневые предупреждения
    if (sums.p > 50) {
        warnings.push({text: `P = ${sums.p} (${_t('diag_critical', 'критично высокий')})`, level: 'critical'});
    } else if (sums.p > 40) {
        warnings.push({text: `P = ${sums.p} (${_t('diag_high', 'высокий')})`, level: 'high'});
    } else if (sums.p > 35) {
        warnings.push({text: `P = ${sums.p} (${_t('diag_elevated', 'повышенный')})`, level: 'warn'});
    }

    // updateAntagonismPanel(warnings); // Отключено - используем диагностику в стиле OHPG
}

/**
 * Обновление панели антагонизмов
 * @param {Array} warnings - массив предупреждений {text, level}
 */
function _updateAntagonismPanel(warnings) {
    let panel = document.getElementById('antagonism-panel');

    if (warnings.length === 0) {
        if (panel) panel.classList.remove('visible');
        return;
    }

    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'antagonism-panel';
        panel.className = 'antagonism-panel';
        // Вставляем после карточки диагностики
        const diagCard = document.getElementById('card-diagnostics');
        if (diagCard && diagCard.parentNode) {
            diagCard.parentNode.insertBefore(panel, diagCard.nextSibling);
        } else {
            document.body.appendChild(panel);
        }
    }

    // Определить максимальный уровень для стиля панели
    const hasCritical = warnings.some(w => w.level === 'critical');
    const hasHigh = warnings.some(w => w.level === 'high');
    panel.className = 'antagonism-panel visible';
    if (hasCritical) panel.classList.add('level-critical');
    else if (hasHigh) panel.classList.add('level-high');
    else panel.classList.add('level-warn');

    panel.innerHTML = `
        <div class="antagonism-header">
            <i class="bi bi-exclamation-triangle"></i> ${_t('ui_check_ratios', 'Проверьте соотношения')}
        </div>
        <ul class="antagonism-list">
            ${warnings.map(w => `<li class="level-${w.level}">${w.text}</li>`).join('')}
        </ul>
    `;
}

// ============================================================================
// РАСЧЕТ ЦВЕТА ДЛЯ ИНДИКАЦИИ
// ============================================================================

/* eslint-disable max-params */ // Legacy function signature
function calculateTextColor(value, element, recommended_v, min_v, max_v, pr_type) {
    const startColor = [210, 180, 0];
    const middleColor = [0, 128, 0];
    const endColor = [128, 0, 0];

    const elementIndex = ELEMENTS_M.indexOf(element);
    const middleValue = recommended_v[elementIndex];

    let position;
    if (value <= middleValue) {
        position = (value - min_v[elementIndex]) / (middleValue - min_v[elementIndex]);
    } else {
        position = (value - middleValue) / (max_v[elementIndex] - middleValue);
    }

    const intermediateColor = [];
    for (let i = 0; i < 3; i++) {
        if (value <= middleValue) {
            intermediateColor[i] = Math.round(startColor[i] + (middleColor[i] - startColor[i]) * position);
        } else {
            intermediateColor[i] = Math.round(middleColor[i] + (endColor[i] - middleColor[i]) * position);
        }
    }

    const isMicro = ['Cl', 'Fe', 'Zn', 'Cu', 'Mn', 'Mo', 'B', 'Co', 'Si'].includes(element);
    if (isMicro || pr_type === "gramm") {
        if (value <= min_v[elementIndex] || value >= max_v[elementIndex]) {
            return {
                color: `rgb(${intermediateColor[0]}, ${intermediateColor[1]}, ${intermediateColor[2]})`,
                backgroundColor: `rgba(206, 19, 113, 0.66)`
            };
        }
    }

    return {
        color: `rgb(${intermediateColor[0]}, ${intermediateColor[1]}, ${intermediateColor[2]})`,
        backgroundColor: 'rgba(56,218,47,0.2)'
    };
}

// ============================================================================
// РАСЧЕТ EC
// ============================================================================

/* global MM */ // MM определён в calc_hpg.js
/* eslint-disable max-params */ // Legacy function signatures
function calcEC(nh4_ppm, nh2_ppm, no3_ppm, p_ppm, k_ppm, ca_ppm, mg_ppm, s_ppm, cl_ppm) {
    console.debug("=== Начало расчёта EC ===");

    const params = { nh4_ppm, nh2_ppm, no3_ppm, p_ppm, k_ppm, ca_ppm, mg_ppm, s_ppm, cl_ppm };
    Object.keys(params).forEach(key => { params[key] = safeParseFloat(params[key]); });

    const m = new MM();
    const a = params.nh4_ppm * m.Ca * m.Mg * m.K * m.S * m.Cl;
    const b = params.nh2_ppm * m.Ca * m.Mg * m.K * m.S * m.Cl;
    const c = params.no3_ppm * m.Ca * m.Mg * m.K * m.S * m.Cl;
    const d = params.p_ppm * m.N * m.Ca * m.Mg * m.K * m.Cl;
    const e = params.k_ppm * m.N * m.Ca * m.Mg * m.S * m.Cl;
    const f = params.ca_ppm * m.N * m.Mg * m.K * m.S * m.Cl;
    const g = params.mg_ppm * m.N * m.Ca * m.K * m.S * m.Cl;
    const h = params.s_ppm * m.N * m.Ca * m.Mg * m.K * m.Cl;
    const i = params.cl_ppm * m.N * m.Ca * m.Mg * m.K * m.S;
    const base = m.N * m.Ca * m.Mg * m.K * m.S * m.Cl;

    if (base === 0 || Object.values(params).every(v => v === 0)) {
        console.warn("Все концентрации равны 0. EC = 0");
        return 0;
    }

    const empiricalFactor = 0.067;
    const ec = (empiricalFactor * (a + b + c + d + e + f + g + h + i + 2 * base)) / base;
    console.debug("=== Итоговый EC:", ec.toFixed(2), "===");
    return ec;
}

function calcECold(nh4, ca, mg, k) {
    const a = nh4 * MM.Ca * MM.Mg * MM.K;
    const b = ca * MM.N * MM.Mg * MM.K;
    const c = mg * MM.N * MM.Ca * MM.K;
    const d = k * MM.N * MM.Ca * MM.Mg;
    const e = MM.N * MM.Ca * MM.Mg * MM.K;
    const f = MM.N * MM.Ca * MM.Mg * MM.K;

    if (f === 0 || (nh4 === 0 && ca === 0 && mg === 0 && k === 0)) return 0;
    return 0.095 * (a + 2 * b + 2 * c + d + 2 * e) / f;
}

// ============================================================================
// EC ION (ДЕБАЙ–ХЮККЕЛЬ), PH CALC, ОСМОТИЧЕСКОЕ ДАВЛЕНИЕ, ИОННАЯ АКТИВНОСТЬ
// ============================================================================

/**
 * Рассчитать EC по методу Дебая–Хюккеля из сумм элементов (ppm).
 * sums: { no3, p, s, nh4, k, ca, mg, fe, cl } — в ppm
 */
function calcECIonFert(sums) {
    const IONS = {
        no3:   { mm: 14.007, z: 1, lam: 71.42,  r: 0.300 },
        h2po4: { mm: 30.974, z: 1, lam: 33.00,  r: 0.400 },
        so4:   { mm: 32.06,  z: 2, lam: 79.80,  r: 0.400 },
        nh4:   { mm: 14.007, z: 1, lam: 73.50,  r: 0.250 },
        k:     { mm: 39.098, z: 1, lam: 73.50,  r: 0.300 },
        ca:    { mm: 40.078, z: 2, lam: 119.00, r: 0.600 },
        mg:    { mm: 24.305, z: 2, lam: 106.12, r: 0.800 },
        fe:    { mm: 55.845, z: 2, lam: 108.00, r: 0.600 },
        cl:    { mm: 35.453, z: 1, lam: 76.35,  r: 0.300 },
    };
    const C = {
        no3:   safeParseFloat(sums.no3)   / IONS.no3.mm   / 1000,
        h2po4: safeParseFloat(sums.p)     / IONS.h2po4.mm / 1000,
        so4:   safeParseFloat(sums.s)     / IONS.so4.mm   / 1000,
        nh4:   safeParseFloat(sums.nh4)   / IONS.nh4.mm   / 1000,
        k:     safeParseFloat(sums.k)     / IONS.k.mm     / 1000,
        ca:    safeParseFloat(sums.ca)    / IONS.ca.mm    / 1000,
        mg:    safeParseFloat(sums.mg)    / IONS.mg.mm    / 1000,
        fe:    safeParseFloat(sums.fe)    / IONS.fe.mm    / 1000,
        cl:    safeParseFloat(sums.cl)    / IONS.cl.mm    / 1000,
    };
    const I = 0.5 * Object.entries(IONS).reduce((sum, [ion, p]) => sum + C[ion] * p.z * p.z, 0);
    if (I < 1e-9) return 0;
    const sqrtI = Math.sqrt(I);
    const A = 0.5091;
    const B = 0.328;
    let ecSum = 0;
    for (const [ion, p] of Object.entries(IONS)) {
        const logGamma = -A * p.z * p.z * sqrtI / (1 + B * p.r * sqrtI);
        const gamma = Math.pow(10, logGamma);
        ecSum += p.lam * p.z * gamma * C[ion];
    }
    return Math.round(ecSum * 100) / 100;
}

/**
 * Оценочный pH раствора по соотношению NH4/NO3 (без учёта кислот).
 * Точность ±0.3–0.5 pH единиц. Только ориентир.
 */
function calcPHFert(sums) {
    const no3 = safeParseFloat(sums.no3);
    const nh4 = safeParseFloat(sums.nh4);
    const totalN = no3 + nh4;
    if (totalN < 0.1) return 0;
    const nh4Frac = nh4 / totalN;
    const ph = 6.5 - 2.0 * nh4Frac;
    return Math.round(Math.max(3.5, Math.min(8.5, ph)) * 10) / 10;
}

/**
 * Осмотическое давление: π ≈ 0.36 × EC (бар).
 * Уровни: <0.5 низкое, 0.5-0.9 норма, 0.9-1.3 допустимо, 1.3-1.8 стресс, 1.8-2.5 сильный, >2.5 критично
 */
function calcOsmoticFert(ec) {
    const value = Math.round(ec * 0.36 * 100) / 100;
    const LEVELS = [
        { max: 0.5,      key: 'low',      label: '↓ Низкое',          color: '#0d6efd' },
        { max: 0.9,      key: 'normal',   label: '✓ Норма',            color: '#198754' },
        { max: 1.3,      key: 'caution',  label: '○ Допустимо',        color: '#20c997' },
        { max: 1.8,      key: 'stress',   label: '⚠ Стресс',           color: '#ffc107' },
        { max: 2.5,      key: 'severe',   label: '⚠⚠ Сильный стресс',  color: '#fd7e14' },
        { max: Infinity, key: 'critical', label: '✗ Критично',         color: '#dc3545' },
    ];
    const level = LEVELS.find(l => value < l.max) || LEVELS[LEVELS.length - 1];
    return { value, key: level.key, label: level.label, color: level.color };
}

/**
 * Ионная активность Ca²⁺ и Mg²⁺ (Дебай–Хюккель).
 */
function calcIonActivityFert(sums) {
    const IONS = {
        no3:   { mm: 14.007, z: 1, r: 0.300 },
        h2po4: { mm: 30.974, z: 1, r: 0.400 },
        so4:   { mm: 32.06,  z: 2, r: 0.400 },
        nh4:   { mm: 14.007, z: 1, r: 0.250 },
        k:     { mm: 39.098, z: 1, r: 0.300 },
        ca:    { mm: 40.078, z: 2, r: 0.600 },
        mg:    { mm: 24.305, z: 2, r: 0.800 },
        fe:    { mm: 55.845, z: 2, r: 0.600 },
        cl:    { mm: 35.453, z: 1, r: 0.300 },
    };
    const C = {
        no3:   safeParseFloat(sums.no3) / IONS.no3.mm   / 1000,
        h2po4: safeParseFloat(sums.p)   / IONS.h2po4.mm / 1000,
        so4:   safeParseFloat(sums.s)   / IONS.so4.mm   / 1000,
        nh4:   safeParseFloat(sums.nh4) / IONS.nh4.mm   / 1000,
        k:     safeParseFloat(sums.k)   / IONS.k.mm     / 1000,
        ca:    safeParseFloat(sums.ca)  / IONS.ca.mm    / 1000,
        mg:    safeParseFloat(sums.mg)  / IONS.mg.mm    / 1000,
        fe:    safeParseFloat(sums.fe)  / IONS.fe.mm    / 1000,
        cl:    safeParseFloat(sums.cl)  / IONS.cl.mm    / 1000,
    };
    const I = 0.5 * Object.entries(IONS).reduce((sum, [ion, p]) => sum + C[ion] * p.z * p.z, 0);
    const caCurrent = safeParseFloat(sums.ca);
    const mgCurrent = safeParseFloat(sums.mg);
    if (I < 1e-9) return { ca_gamma: 1, mg_gamma: 1, ca_active: caCurrent, mg_active: mgCurrent };
    const sqrtI = Math.sqrt(I);
    const A = 0.5091;
    const B = 0.328;
    const gammaCa = Math.round(Math.pow(10, -A * 4 * sqrtI / (1 + B * IONS.ca.r * sqrtI)) * 1000) / 1000;
    const gammaMg = Math.round(Math.pow(10, -A * 4 * sqrtI / (1 + B * IONS.mg.r * sqrtI)) * 1000) / 1000;
    return {
        ca_gamma:  gammaCa,
        mg_gamma:  gammaMg,
        ca_active: Math.round(gammaCa * caCurrent * 10) / 10,
        mg_active: Math.round(gammaMg * mgCurrent * 10) / 10,
    };
}

// ============================================================================
// МАТРИЦА СООТНОШЕНИЙ
// ============================================================================

// Маппинг ячеек матрицы на соотношения из ION_RATIOS
const MATRIX_RATIO_MAP = {
    // Прямые соотношения
    'm-K-N': 'K:N',
    'm-K-Ca': 'K:Ca',
    'm-K-Mg': 'K:Mg',
    'm-Ca-Mg': 'Ca:Mg',
    'm-N-K': 'N:K',
    'm-N-Ca': 'N:Ca',
    'm-N-P': 'N:P',
    'm-N-S': 'N:S',
    'm-Ca-P': 'Ca:P',
    // Обратные соотношения (для подсветки)
    'm-Ca-K': 'K:Ca', // Ca:K использует лимиты K:Ca
    'm-Mg-K': 'K:Mg', // Mg:K использует лимиты K:Mg
    'm-Mg-Ca': 'Ca:Mg', // Mg:Ca использует лимиты Ca:Mg
};

// Получить лимиты из ION_RATIOS
function getMatrixRatioLimits(ratioName) {
    for (const group of Object.values(ION_RATIOS)) {
        if (group[ratioName]) return group[ratioName];
    }
    return null;
}

function updateMatrixFromSumRow(sumN, sumP, sumK, sumCa, sumMg, sumS) {
    const values = { N: sumN, P: sumP, K: sumK, Ca: sumCa, Mg: sumMg, S: sumS };
    const elements = ['N', 'P', 'K', 'Ca', 'Mg', 'S'];

    // Заполняем все ячейки матрицы
    elements.forEach(row => {
        elements.forEach(col => {
            const cellId = `m-${row}-${col}`;
            const $cell = $(`#${cellId}`);
            if (!$cell.length) return;

            const rowVal = values[row] || 0;
            const colVal = values[col] || 0;
            const ratio = rowVal > 0 ? colVal / rowVal : 0;
            $cell.text(ratio > 0 ? ratio.toFixed(2) : '-');

            // Подсветка через RatioColors если доступен
            if (window.RatioColors && (proverka_by === 'ratio' || proverka_by === 'all')) {
                const ratioName = MATRIX_RATIO_MAP[cellId];
                if (ratioName && ratio > 0) {
                    const limits = getMatrixRatioLimits(ratioName);
                    if (limits) {
                        // После изменения формулы на col/row, прямые соотношения нужно инвертировать
                        // m-Ca-K показывает K/Ca, лимиты K:Ca → прямое значение
                        // m-K-Ca показывает Ca/K, лимиты K:Ca → нужно инвертировать
                        const isDirect = cellId === 'm-Ca-K' || cellId === 'm-Mg-K' || cellId === 'm-Mg-Ca';
                        const checkValue = isDirect ? ratio : (1 / ratio);
                        const colorResult = window.RatioColors.calculateRatioColor(checkValue, limits);
                        $cell.css({
                            'color': colorResult.color,
                            'background-color': colorResult.backgroundColor
                        });
                        return;
                    }
                }
            }

            // Fallback - старая логика
            if (row === col) {
                $cell.css({ 'color': '', 'background-color': '' });
            }
        });
    });
}

// ============================================================================
// РАСЧЕТ ВОДНОГО РАСТВОРА
// ============================================================================

function calculateWater() {
    const volumeA = safeParseFloat($('#tara-a').val());
    const volumeB = safeParseFloat($('#tara-b').val());
    const volumeMicro = safeParseFloat($('#tara-micro').val()) || 1000;
    const litres = safeParseFloat($('#litres').val());
    const microEnabled = $('#conc-micro-enabled').is(':checked');
    const fixedVolumes = $('#fixed-conc-volumes').is(':checked');

    // Целевые литры для расчёта "добавлять на литр"
    // Фикс: А/Б на 100л, Микро на 1000л
    // Без фикса: всё на litres
    const targetLitresAB = fixedVolumes ? 100 : litres;
    const targetLitresMicro = fixedVolumes ? 1000 : litres;

    // Обновляем label
    const label = document.getElementById('conc-litres-label');
    if (label) {
        if (fixedVolumes) {
            label.innerHTML = '<span style="color: #059669;">А/Б на 100л, Микро на 1000л</span>';
        } else {
            label.textContent = litres > 0 ? `на ${Math.round(litres)}л` : '';
        }
    }

    let totalFertilizerA = 0, totalFertilizerB = 0, totalFertilizerMicro = 0;
    const fertilizersA = [], fertilizersB = [], fertilizersMicro = [];

    // Проверка: является ли удобрение "только микро" (нет макро, есть микро)
    const isMicroOnly = (elements) => {
        const hasMacro = MACRO_EL_LC.some(el => (elements[el] || 0) > 0);
        const hasMicro = MICRO_EL_LC.some(el => (elements[el] || 0) > 0);
        return !hasMacro && hasMicro;
    };

    // Коэффициенты пересчёта граммов под целевые литры
    // Граммы в таблице введены на `litres`, пересчитываем на targetLitres
    const scaleAB = (litres > 0) ? (targetLitresAB / litres) : 1;
    const scaleMicro = (litres > 0) ? (targetLitresMicro / litres) : 1;

    $('.grams-input').each(function() {
        const gramsInput = safeParseFloat($(this).val());
        if (gramsInput <= 0) return;

        const row = $(this).closest('tr');
        const bottle = row.find('.bottle').attr('data-elem');
        const fertilizerName = row.find('.f-name').text();

        // Собираем состав удобрения (все элементы)
        const elements = {};
        ELEMENTS.forEach(el => {
            const elemCell = row.find(`.element.${el}`);
            if (elemCell.length) {
                elements[el] = safeParseFloat(elemCell.attr('data-elem'));
            }
        });

        // Если галка Микро включена и удобрение - только микро → в Микро
        if (microEnabled && isMicroOnly(elements)) {
            const grams = gramsInput * scaleMicro;
            totalFertilizerMicro += grams;
            fertilizersMicro.push({ name: fertilizerName, grams, elements });
        } else if (bottle === 'A') {
            const grams = gramsInput * scaleAB;
            totalFertilizerA += grams;
            fertilizersA.push({ name: fertilizerName, grams, elements });
        } else if (bottle === 'B') {
            const grams = gramsInput * scaleAB;
            totalFertilizerB += grams;
            fertilizersB.push({ name: fertilizerName, grams, elements });
        }
    });

    // Рассчитываем сколько мл концентрата добавлять на 1 литр
    // При фиксе: А/Б на 100л → добавлять tara/100 мл/л
    const amountToAddA = (totalFertilizerA > 0 && targetLitresAB > 0) ? (volumeA / targetLitresAB).toFixed(2) : '-';
    const amountToAddB = (totalFertilizerB > 0 && targetLitresAB > 0) ? (volumeB / targetLitresAB).toFixed(2) : '-';

    // Рассчитываем общую плотность концентратов (соли + вода)
    // Плотность = (масса_солей + масса_воды) / объём
    // Приближённо: ρ ≈ масса_солей/объём + ρ_воды
    const WATER_DENSITY = 0.998; // г/мл при комнатной температуре
    const densityA = (volumeA > 0) ? (totalFertilizerA / volumeA + WATER_DENSITY).toFixed(3) : '-';
    const densityB = (volumeB > 0) ? (totalFertilizerB / volumeB + WATER_DENSITY).toFixed(3) : '-';

    $('#amountToAddA').text(amountToAddA !== '-' ? amountToAddA + ' мл' : '-');
    $('#amountToAddB').text(amountToAddB !== '-' ? amountToAddB + ' мл' : '-');
    $('#densityA').text(densityA);
    $('#densityB').text(densityB);
    updateElementText('#totalA', totalFertilizerA.toFixed(2) + ' г');
    updateElementText('#totalB', totalFertilizerB.toFixed(2) + ' г');

    // Генерируем HTML для списков солей
    const generateSaltList = (fertilizers, volume) => {
        if (fertilizers.length === 0) {
            return '<div class="text-muted small text-center py-2">—</div>';
        }
        return fertilizers.map(fert => {
            const _density = calculateFertilizerDensity(fert.name, fert.elements || {}, fert.grams, volume);
            return `<div class="conc-list-item">
                <span class="conc-salt-name">${fert.name}</span>
                <span class="conc-salt-grams">${fert.grams.toFixed(2)} г</span>
            </div>`;
        }).join('');
    };

    // Заполняем новые контейнеры
    $('#conc-list-a').html(generateSaltList(fertilizersA, volumeA));
    $('#conc-list-b').html(generateSaltList(fertilizersB, volumeB));

    // Микроэлементы (всегда на 1000л, добавлять volumeMicro/1000 мл/л)
    $('#conc-list-micro').html(generateSaltList(fertilizersMicro, volumeMicro));
    updateElementText('#totalMicro', totalFertilizerMicro.toFixed(2) + ' г');
    const amountToAddMicro = (totalFertilizerMicro > 0 && volumeMicro > 0) ? (volumeMicro / targetLitresMicro).toFixed(2) : '-';
    $('#amountToAddMicro').text(amountToAddMicro !== '-' ? amountToAddMicro + ' мл' : '-');

    // Старый формат для совместимости
    const allFertilizers = [
        ...fertilizersA.map(f => ({ ...f, bottle: 'A' })),
        ...fertilizersB.map(f => ({ ...f, bottle: 'B' }))
    ];

    const compactOutput = allFertilizers.length > 0
        ? allFertilizers.map((fert, idx) => {
            const colorClass = fert.bottle === 'A' ? 'concentrate-item-a' : 'concentrate-item-b';
            const labelClass = fert.bottle === 'A' ? 'concentrate-label-a' : 'concentrate-label-b';
            const bottleLabel = fert.bottle === 'A' ? 'А' : 'Б';
            const badgeClass = fert.bottle === 'A' ? 'bg-primary' : 'bg-danger';

            const volume = fert.bottle === 'A' ? volumeA : volumeB;
            const density = calculateFertilizerDensity(fert.name, fert.elements || {}, fert.grams, volume);

            return `
                <div class="concentrate-list-item ${colorClass}">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="conc-check-${idx}">
                        <label class="form-check-label d-flex justify-content-between align-items-center w-100" for="conc-check-${idx}">
                            <span class="concentrate-item-text">
                                <span class="${labelClass}">●</span> ${fert.name}
                            </span>
                            <span class="concentrate-item-grams">
                                <span class="badge ${badgeClass}">${bottleLabel}</span>
                                ${fert.grams.toFixed(4)} г <span class="text-muted small">(ρ: ${density.toFixed(3)} г/мл)</span>
                            </span>
                        </label>
                    </div>
                </div>`;
        }).join('')
        : '<div class="text-muted text-center py-3">Нет удобрений для добавления</div>';

    $('#water-output').html(compactOutput);
}

// ============================================================================
// ОБНОВЛЕНИЕ ПЛОТНОСТИ В ТАБЛИЦЕ
// ============================================================================

/**
 * Обновляет отображение плотности для простых солей в таблице
 */
function updateFertilizerDensitiesInTable() {
    const volumeA = safeParseFloat($('#tara-a').val());
    const volumeB = safeParseFloat($('#tara-b').val());

    $('.fert > tbody > tr:not(#sum-row)').each(function() {
        const row = $(this);
        const densitySpan = row.find('.fert-density');

        // Если нет span плотности, значит это комплексное удобрение - пропускаем
        if (!densitySpan.length) return;

        const grams = safeParseFloat(row.find('.grams-input').val());
        const bottle = row.find('.bottle').attr('data-elem');
        const name = row.find('.f-name').text();
        const volume = bottle === 'A' ? volumeA : volumeB;

        if (grams === 0 || volume === 0) {
            densitySpan.text('');
            return;
        }

        // Собираем состав удобрения
        const elements = {};
        ELEMENTS.forEach(el => {
            const elemCell = row.find(`.element.${el}`);
            if (elemCell.length) {
                elements[el] = safeParseFloat(elemCell.attr('data-elem'));
            }
        });

        // Рассчитываем плотность
        const density = calculateFertilizerDensity(name, elements, grams, volume);
        densitySpan.text(`(ρ: ${density.toFixed(3)} г/мл)`);
    });
}

// ============================================================================
// ОБНОВЛЕНИЕ ПРОФИЛЯ
// ============================================================================

function updateProfileString() {
    const elements = [
        { id: 'sum-no3', name: 'NO3' }, { id: 'sum-nh4', name: 'NH4' },
        { id: 'sum-nh2', name: 'NH2' }, { id: 'sum-p', name: 'P' },
        { id: 'sum-k', name: 'K' }, { id: 'sum-ca', name: 'Ca' },
        { id: 'sum-mg', name: 'Mg' }, { id: 'sum-s', name: 'S' },
        { id: 'sum-cl', name: 'Cl' }, { id: 'sum-fe', name: 'Fe' },
        { id: 'sum-mn', name: 'Mn' }, { id: 'sum-b', name: 'B' },
        { id: 'sum-zn', name: 'Zn' }, { id: 'sum-cu', name: 'Cu' },
        { id: 'sum-mo', name: 'Mo' }, { id: 'sum-co', name: 'Co' },
        { id: 'sum-si', name: 'Si' }
    ];

    const no3 = getElementValue('sum-no3');
    const nh4 = getElementValue('sum-nh4');
    const nh2 = getElementValue('sum-nh2');
    const totalN = Math.round((no3 + nh4 + nh2) * 100) / 100;
    const totalN_NH2 = Math.round((no3 + nh4) * 100) / 100;

    let profileString = `N=${totalN_NH2}`;
    let profileString2 = `N=${totalN}`;

    elements.forEach(({ id, name }) => {
        const value = getElementValue(id);
        if (name !== 'NH2') profileString += ` ${name}=${value}`;
        profileString2 += ` ${name}=${value}`;
    });

    $("#id_profile_string").text(profileString2);
    $("[name=profile_string]").val(profileString);
}

// ============================================================================
// DOCUMENT TITLE
// ============================================================================

/**
 * Обновить title страницы с информацией о рецепте
 */
function updateDocumentTitle() {
    // Если title передан в URL (из shortlink) - используем его
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('title')) {
        const urlTitle = decodeURIComponent(urlParams.get('title'));
        document.title = urlTitle + ' - Fertilizer';
        return;
    }

    // Если загружен профиль - используем его имя + NPK
    if (window.__LOADED_PROFILE__ && window.__LOADED_PROFILE__.name) {
        const n = Math.round(safeParseFloat($('#sum-nh4').text()) + safeParseFloat($('#sum-no3').text()));
        const p = Math.round(safeParseFloat($('#sum-p').text()));
        const k = Math.round(safeParseFloat($('#sum-k').text()));
        document.title = window.__LOADED_PROFILE__.name + ` NPK: ${n}-${p}-${k} - Fertilizer`;
        return;
    }

    const rows = $('.fert > tbody > tr:not(#sum-row):not(#comp-row)');
    const count = rows.length;

    if (count === 0) {
        document.title = 'Fertilizer - ' + _t('fert_calculator', 'Калькулятор');
    } else if (count <= 2) {
        // Показываем названия удобрений
        const names = [];
        rows.each(function() {
            const name = $(this).find('.fertilizer-name').text().trim();
            if (name) names.push(name);
        });
        document.title = names.join(', ') + ' - Fertilizer';
    } else {
        // Показываем профиль N-P-K-Ca-Mg
        const n = Math.round(safeParseFloat($('#sum-nh4').text()) + safeParseFloat($('#sum-no3').text()));
        const p = Math.round(safeParseFloat($('#sum-p').text()));
        const k = Math.round(safeParseFloat($('#sum-k').text()));
        const ca = Math.round(safeParseFloat($('#sum-ca').text()));
        const mg = Math.round(safeParseFloat($('#sum-mg').text()));
        document.title = `N${n} P${p} K${k} Ca${ca} Mg${mg} - Fertilizer`;
    }
}

// ============================================================================
// URL И QR
// ============================================================================

function updateURL() {
    const paramsObject = { data: [] };

    $('.fert > tbody > tr:not(#sum-row)').each(function() {
        const row = $(this);
        // Отключённые удобрения не включаем в ссылку
        if (row.hasClass('fert-row-disabled')) return;
        const fertilizerId = row.find('.fertilizer-name').data('pk');
        const grams = row.find('.grams-input').val();
        const litres = $("#litres").val();
        paramsObject.data.push({ f: fertilizerId, g: grams, l: litres });
    });

    updateProfileString();
    const encodedParams = LZString.compressToEncodedURIComponent(JSON.stringify(paramsObject));
    const currentParams = new URLSearchParams(window.location.search);
    const urlParams = new URLSearchParams();
    urlParams.set('params', encodedParams);
    // Сохраняем title если был передан из shortlink или загружен профиль
    if (currentParams.has('title')) {
        urlParams.set('title', currentParams.get('title'));
    } else if (window.__LOADED_PROFILE__ && window.__LOADED_PROFILE__.name) {
        urlParams.set('title', window.__LOADED_PROFILE__.name);
    }

    if (!have_moder_fert) {
        const newURL = window.location.pathname + '?' + urlParams.toString();
        window.history.replaceState(null, '', newURL);
    }

    // QR-код может упасть если URL слишком длинный
    try {
        $('#qrcode').empty().qrcode({
            text: "https://ponics.online" + (have_moder_fert ? '' : window.location.pathname + '?' + urlParams.toString()),
            width: 200,
            height: 200
        });
    } catch (_e) {
        console.warn('[updateURL] QR code generation failed (URL too long):', _e.message);
        $('#qrcode').empty().html('<div class="text-muted small text-center p-2">QR недоступен<br><small>URL слишком длинный</small></div>');
    }

    updateDisplayedURL();

    if (have_moder_fert) {
        $('#current-url').text('на модерации есть удобрения - ожидайте');
        $("#copy-button").addClass("d-none");
    } else {
        $("#copy-button").removeClass("d-none");
    }

    // Обновить title страницы
    updateDocumentTitle();
}

function loadTableFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    // Hash-ссылка (#p=<lz>&t=<title>) — для standalone GitHub Pages,
    // где серверный shortlink недоступен. Если ?params= в query нет,
    // подкладываем сжатые данные из hash.
    if (!urlParams.has('params') && window.location.hash.startsWith('#p=')) {
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        if (hashParams.has('p')) urlParams.set('params', hashParams.get('p'));
        if (hashParams.has('t') && !urlParams.has('title')) urlParams.set('title', hashParams.get('t'));
    }
    console.log('[loadTableFromURL] Начало загрузки, params:', urlParams.get('params'));
    $('.fert > tbody > tr:not(#sum-row):not(#comp-row)').remove();

    if (urlParams.has('params')) {
        const encodedParams = urlParams.get('params');
        console.log('[loadTableFromURL] encodedParams:', encodedParams);
        try {
            // Пробуем новый URL-safe формат, затем fallback на старый Base64
            let decompressed = LZString.decompressFromEncodedURIComponent(encodedParams);
            if (!decompressed) {
                // Fallback: старый Base64 формат (для обратной совместимости)
                // Заменяем пробелы на + (URL декодирует + как пробел)
                const fixedParams = encodedParams.replace(/ /g, '+');
                decompressed = LZString.decompressFromBase64(fixedParams);
            }
            console.log('[loadTableFromURL] decompressed:', decompressed);
            if (!decompressed) {
                console.error('[loadTableFromURL] Не удалось декодировать params');
                return;
            }
            let decodedParams = JSON.parse(decompressed);
            console.log('[loadTableFromURL] decodedParams:', decodedParams);

            // Если decodedParams это URL строка (ошибка в старых shortlinks) - извлекаем params
            if (typeof decodedParams === 'string' && decodedParams.includes('params=')) {
                console.log('[loadTableFromURL] Detected URL string, extracting params...');
                try {
                    const urlObj = new URL(decodedParams);
                    const innerParams = urlObj.searchParams.get('params');
                    if (innerParams) {
                        const innerDecompressed = LZString.decompressFromEncodedURIComponent(innerParams);
                        if (innerDecompressed) {
                            decodedParams = JSON.parse(innerDecompressed);
                            console.log('[loadTableFromURL] Extracted from URL:', decodedParams);
                        }
                    }
                } catch (urlErr) {
                    console.error('[loadTableFromURL] Failed to extract from URL:', urlErr);
                }
            }

            if (decodedParams && decodedParams.data && decodedParams.data.length > 0) {
                console.log('[loadTableFromURL] Найдено удобрений:', decodedParams.data.length);
                decodedParams.data.forEach((params, idx) => {
                    console.log(`[loadTableFromURL] [${idx}] Обработка удобрения f=${params.f}, g=${params.g}`);
                    let selectedFertilizer = $(`#fert-list .fert-item[data-id="${params.f}"]`);
                    console.log(`[loadTableFromURL] [${idx}] Найден fert-item:`, selectedFertilizer.length > 0);
                    if (selectedFertilizer.length) {
                        // Проверяем замену для удалённых удобрений
                        const fertData = selectedFertilizer.data();
                        console.log(`[loadTableFromURL] [${idx}] fertData:`, fertData);
                        // jQuery нормализует data-атрибуты в camelCase: data-is-deleted -> isDeleted
                        const isDeleted = fertData.isDeleted === true || fertData.isDeleted === 'true';
                        const replacementId = fertData.replacementId;
                        console.log(`[loadTableFromURL] [${idx}] isDeleted=${isDeleted}, replacementId=${replacementId}`);

                        if (isDeleted && replacementId) {
                            // Используем замену вместо удалённого удобрения
                            const replacement = $(`#fert-list .fert-item[data-id="${replacementId}"]`);
                            console.log(`[loadTableFromURL] [${idx}] Замена найдена:`, replacement.length > 0);
                            if (replacement.length) {
                                console.log(`[loadTableFromURL] Замена удобрения ${params.f} на ${replacementId}`);
                                selectedFertilizer = replacement;
                            }
                        }

                        console.log(`[loadTableFromURL] [${idx}] Добавляем в таблицу:`, selectedFertilizer.data());
                        $("#litres").val(params.l);
                        addFertilizerRow(selectedFertilizer.data(), params.g, !!params.d);
                    } else {
                        console.warn(`[loadTableFromURL] Удобрение ${params.f} не найдено в списке`);
                    }
                });
            } else {
                console.warn('[loadTableFromURL] Нет данных в decodedParams.data');
            }
        } catch (_e) {
            console.error('[loadTableFromURL] Ошибка при загрузке рецепта из URL:', _e);
        }
        recalculateSums();
        updateURL();
        // Обновить масштабирование таблицы после загрузки из URL
        setTimeout(() => {
            if (typeof window.updateFitModeHeight === 'function') {
                window.updateFitModeHeight();
            }
        }, 300);
        // Дополнительный вызов для надёжности
        setTimeout(() => {
            if (typeof window.updateFitModeHeight === 'function') {
                window.updateFitModeHeight();
            }
        }, 800);
    } else if (urlParams.has('fert')) {
        // Обработка параметра ?fert=ID (ссылка из поиска)
        const fertId = urlParams.get('fert');
        console.log('[loadTableFromURL] Загрузка удобрения по ID:', fertId);

        const selectedFertilizer = $(`#fert-list .fert-item[data-id="${fertId}"], #fert-list .fert-item[data-pk="${fertId}"]`).first();
        if (selectedFertilizer.length) {
            addFertilizerRow(selectedFertilizer.data(), 1);
            recalculateSums();
            updateURL();
        } else {
            console.warn(`[loadTableFromURL] Удобрение ${fertId} не найдено`);
            // Показать сообщение пользователю
            alert(_t('fert_not_found', 'Удобрение не найдено или ещё не прошло модерацию'));
            updateDocumentTitle();
        }
    } else {
        console.log('[loadTableFromURL] Нет параметра params в URL');
        // Обновить title для пустой страницы
        updateDocumentTitle();
    }
}

/**
 * Загрузка удобрений из массива данных (для загрузки из профиля)
 * @param {Array} fertilizers - массив [{f: id, g: grams, l: litres}, ...]
 * @param {number} litres - литры раствора
 */
function loadFertilizersFromData(fertilizers, litres) {
    console.log('[loadFertilizersFromData] Загрузка удобрений:', fertilizers, 'litres:', litres);

    // Очищаем таблицу
    $('.fert > tbody > tr:not(#sum-row):not(#comp-row)').remove();

    // Устанавливаем литры
    if (litres) {
        $("#litres").val(litres);
    }

    if (!fertilizers || !fertilizers.length) {
        console.warn('[loadFertilizersFromData] Нет удобрений для загрузки');
        recalculateSums();
        return;
    }

    fertilizers.forEach((params, idx) => {
        console.log(`[loadFertilizersFromData] [${idx}] Обработка удобрения f=${params.f}, g=${params.g}`);
        let selectedFertilizer = $(`#fert-list .fert-item[data-id="${params.f}"], #fert-list .fert-item[data-pk="${params.f}"]`).first();

        if (selectedFertilizer.length) {
            const fertData = selectedFertilizer.data();
            const isDeleted = fertData.isDeleted === true || fertData.isDeleted === 'true';
            const replacementId = fertData.replacementId;

            if (isDeleted && replacementId) {
                const replacement = $(`#fert-list .fert-item[data-id="${replacementId}"]`);
                if (replacement.length) {
                    console.log(`[loadFertilizersFromData] Замена удобрения ${params.f} на ${replacementId}`);
                    selectedFertilizer = replacement;
                }
            }

            addFertilizerRow(selectedFertilizer.data(), params.g, !!params.d);
        } else {
            console.warn(`[loadFertilizersFromData] Удобрение ${params.f} не найдено в списке`);
        }
    });

    recalculateSums();
    updateURL();

    // Обновить масштабирование таблицы после загрузки
    setTimeout(() => {
        if (typeof window.updateFitModeHeight === 'function') {
            window.updateFitModeHeight();
        }
    }, 100);
}

function updateDisplayedURL() {
    const currentURL = window.location.href;
    $('#current-url').text(currentURL);
    $("#id_original_url").val(currentURL);
}

function copyURLToClipboard() {
    const url = window.location.href;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            // Показать feedback
            const btn = document.getElementById("copy-button");
            if (btn) {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class="bi bi-check"></i>';
                btn.classList.add('btn-success');
                btn.classList.remove('btn-outline-secondary');
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.classList.remove('btn-success');
                    btn.classList.add('btn-outline-secondary');
                }, 1500);
            }
        }).catch(err => {
            console.error('Ошибка копирования:', err);
            fallbackCopy(url);
        });
    } else {
        fallbackCopy(url);
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand("copy");
    } catch (err) {
        console.error('Fallback copy failed:', err);
    }
    document.body.removeChild(textArea);
}

// ============================================================================
// ПЕРЕСЧЕТ СУММ
// ============================================================================

function recalculateSums() {
    have_moder_fert = false;
    const litres = safeParseFloat($("#litres").val());

    let sumConcentration = 0;
    const sums = {};
    ELEMENTS.forEach(el => {
        sums[el] = 0;
    });

    $('.fert > tbody > tr:not(#sum-row):not(#comp-row)').each(function() {
        const row = $(this);
        const isDisabled = row.hasClass('fert-row-disabled');
        const gi = row.find('input.grams-input');
        let gramsPrecise = isDisabled ? 0 : safeParseFloat(gi.data('precise-grams'));

        if (!isFinite(gramsPrecise)) {
            gramsPrecise = safeParseFloat(gi.val());
            gi.data('precise-grams', gramsPrecise);
            gi.data('base-grams', gramsPrecise / Math.max(0.1, litres));
        }

        $('#fert-list .fert-item').each(function() {
            const isModerated = $(this).data('moderated') === "True";
            if (!have_moder_fert && !isModerated) {
                have_moder_fert = isModerated;
            }
        });

        sumConcentration += gramsPrecise;

        row.find('.element').each(function() {
            const element = $(this);
            const elementValue = safeParseFloat(element.data('elem'));
            const multiplier = (gramsPrecise / litres) * elementValue > 0
                ? ((gramsPrecise / litres) * elementValue * 10).toFixed(2)
                : "-";
            element.text(multiplier);
        });

        ELEMENTS.forEach(el => {
            sums[el] += safeParseFloat(row.find(`.element.${el}`).text());
        });
    });

    const ecNew = calcEC(sums.nh4, sums.nh2, sums.no3, sums.ca, sums.mg, sums.k, sums.s, sums.cl).toFixed(3);
    const ecOld = calcECold(sums.nh4, sums.ca, sums.mg, sums.k).toFixed(3);

    $('#current-ec').val(ecNew);
    $('#old-current-ec').val(ecOld);
    $('#ec-display').text(String(ecOld).replace('.', ','));
    $('#ec-input').val(ecOld);

    const sumN = sums.nh4 + sums.no3 + sums.nh2;
    console.debug('NH4/NO3/NH2 sums:', { nh4: sums.nh4, no3: sums.no3, nh2: sums.nh2, sumN });

    // Обновляем NPK соотношение (N-P₂O₅-K₂O)
    const p2o5 = sums.p / CONVERSION_FACTORS.P2O5_TO_P; // P → P₂O₅
    const k2o = sums.k / CONVERSION_FACTORS.K2O_TO_K; // K → K₂O
    const npkRatio = `${sumN.toFixed(1)}-${p2o5.toFixed(1)}-${k2o.toFixed(1)}`;
    $('#npk-ratio').text(npkRatio);

    updateMatrixFromSumRow(sumN, sums.p, sums.k, sums.ca, sums.mg, sums.s);

    // Мини-матрица
    try {
        const rKN = sumN ? (sums.k / sumN) : NaN;
        const rKCa = sums.ca ? (sums.k / sums.ca) : NaN;
        const rKMg = sums.mg ? (sums.k / sums.mg) : NaN;

        $('#mini-KN, #mini-KN-top').text(isFinite(rKN) ? rKN.toFixed(2) : '—');
        $('#mini-KCa, #mini-KCa-top').text(isFinite(rKCa) ? rKCa.toFixed(2) : '—');
        $('#mini-KMg, #mini-KMg-top').text(isFinite(rKMg) ? rKMg.toFixed(2) : '—');

        const applyMiniColors = (el, val, ratioName) => {
            if (!isFinite(val)) {
                $(el).css({ 'color': '', 'background-color': '' });
                return;
            }
            try {
                // Ищем лимиты для конкретного соотношения в ION_RATIOS
                let limits = null;
                for (const group of Object.values(ION_RATIOS)) {
                    if (group[ratioName]) { limits = group[ratioName]; break; }
                }
                if (limits && window.RatioColors) {
                    const c = window.RatioColors.calculateRatioColor(val, limits);
                    $(el).css({ 'color': c.color, 'background-color': c.backgroundColor });
                }
            } catch(_) { /* graceful */ } // eslint-disable-line no-unused-vars
        };

        applyMiniColors('#mini-KN', rKN, 'K:N');
        applyMiniColors('#mini-KCa', rKCa, 'K:Ca');
        applyMiniColors('#mini-KMg', rKMg, 'K:Mg');
        applyMiniColors('#mini-KN-top', rKN, 'K:N');
        applyMiniColors('#mini-KCa-top', rKCa, 'K:Ca');
        applyMiniColors('#mini-KMg-top', rKMg, 'K:Mg');
    } catch (_) { /* graceful */ } // eslint-disable-line no-unused-vars

    // NH4:NO3 ratio
    const ratio = sums.no3 ? (sums.nh4 / sums.no3) : NaN;
    if (isFinite(ratio)) {
        $('#n-ratio').text(ratio.toFixed(2));
        const inv = ratio !== 0 ? (1 / ratio) : NaN;
        $('#n-ratio-k').text(isFinite(inv) ? ('1 к ' + inv.toFixed(0)) : '—');
    } else {
        $('#n-ratio').text('—');
        $('#n-ratio-k').text('—');
    }

    $('#sum-concentration').val(sumConcentration.toFixed(2));

    // Обновление сумм элементов
    sum_cations = 0;
    sum_anions = 0;

    ELEMENTS_M.forEach((element) => {
        const sum = element === 'N' ? sumN : sums[element.toLowerCase()];

        if (element === 'N') {
            const colors = (proverka_by === 'gramm' || proverka_by === 'all')
                ? calculateTextColor(sum, element, RECOMMENDED_VALUES, MIN_VALUES, MAX_VALUES, "gramm")
                : { color: 'rgb(0, 0, 0)', backgroundColor: 'rgb(250, 250, 250)' };

            // Устанавливаем значения и цвета для NH4, NO3, NH2
            ['nh4', 'no3', 'nh2'].forEach(n => {
                const value = sums[n] || 0;
                let displayValue = value;
                // Конвертируем в ммоль если включен режим ppm (ммоль)
                if (ppm && value > 0) {
                    const molarKey = n.toUpperCase();
                    if (MOLARS[molarKey]) {
                        displayValue = value / MOLARS[molarKey];
                    }
                }
                $(`#sum-${n}`).text(value === 0 ? '-' : displayValue.toFixed(2));
                $(`#sum-${n}`).css({ 'color': colors.color, 'background-color': colors.backgroundColor });
            });

            // Добавляем заряды форм азота
            if (sums.nh4 > 0) {
                const nh4_mols = sums.nh4 / MOLARS.NH4;
                sum_cations += nh4_mols * CATION_DICT.NH4; // NH4+ заряд +1
            }
            if (sums.no3 > 0) {
                const no3_mols = sums.no3 / MOLARS.NO3;
                sum_anions += no3_mols * ANION_DICT.NO3; // NO3- заряд -1
            }
            // NH2 (мочевина) - нейтральна, не учитываем
        } else {
            const elemLower = element.toLowerCase();
            if (sum === 0 || !sum) {
                $(`#sum-${elemLower}`).text("-");
            } else {
                const mols = sum / MOLARS[element];

                if (CATION_DICT[element] !== undefined) {
                    sum_cations += mols * CATION_DICT[element];
                } else if (ANION_DICT[element] !== undefined) {
                    sum_anions += mols * ANION_DICT[element];
                }

                const displayValue = (ppm || (macroMolOnly && MACRO_MOL_ELEMENTS.includes(element)))
                    ? mols.toFixed(2)
                    : sum.toFixed(2);

                $(`#sum-${elemLower}`).text(displayValue);
            }

            const colors = (proverka_by === 'gramm' || proverka_by === 'all')
                ? calculateTextColor(sum, element, RECOMMENDED_VALUES, MIN_VALUES, MAX_VALUES, "gramm")
                : { color: 'rgb(0, 0, 0)', backgroundColor: 'rgb(250, 250, 250)' };

            $(`#sum-${elemLower}`).css({ 'color': colors.color, 'background-color': colors.backgroundColor });
        }
    });

    $('#n_comon').text(`N=${(
        safeParseFloat($('#sum-no3').text()) +
        safeParseFloat($('#sum-nh2').text()) +
        safeParseFloat($('#sum-nh4').text())
    ).toFixed(2)}`);

    calculateNPK();
    calculateWater();
    updateFertilizerDensitiesInTable();

    $('#sum-cations').text((isFinite(sum_cations) ? sum_cations : 0).toFixed(2));
    $('#sum-anions').text((isFinite(sum_anions) ? sum_anions : 0).toFixed(2));

    // ECion / PHcalc / Осмотическое давление / Ионная активность
    try {
        const ecIon = calcECIonFert(sums);
        const phCalc = calcPHFert(sums);
        const osmotic = calcOsmoticFert(ecIon);
        const ionAct = calcIonActivityFert(sums);

        $('#fert-ec-ion').text(ecIon > 0 ? ecIon.toFixed(2) : '—');
        $('#fert-ph-calc').text(phCalc > 0 ? phCalc.toFixed(1) : '—');
        $('#fert-osmotic').text(osmotic.value > 0 ? osmotic.value.toFixed(2) + ' бар' : '—')
            .css('color', osmotic.color);

        // Ионная активность в diagnostics_card (data-field=...)
        document.querySelectorAll('[data-field="ca_gamma"]').forEach(el => { el.textContent = ionAct.ca_gamma.toFixed(3); });
        document.querySelectorAll('[data-field="mg_gamma"]').forEach(el => { el.textContent = ionAct.mg_gamma.toFixed(3); });
        document.querySelectorAll('[data-field="ca_active"]').forEach(el => { el.textContent = ionAct.ca_active.toFixed(1); });
        document.querySelectorAll('[data-field="mg_active"]').forEach(el => { el.textContent = ionAct.mg_active.toFixed(1); });

        // Значки Ca/Mg активности
        function setActivityBadge(id, value, optMin, optMax, warnMin, critMin) {
            const el = document.getElementById(id);
            if (!el) return;
            if (value >= optMin && value <= optMax) { el.textContent = '✓'; el.setAttribute('data-level', 'ok'); }
            else if (value >= warnMin) { el.textContent = '⚠'; el.setAttribute('data-level', 'warn'); }
            else if (value >= critMin) { el.textContent = '⚠⚠'; el.setAttribute('data-level', 'warn'); }
            else { el.textContent = '✗'; el.setAttribute('data-level', 'crit'); }
        }
        setActivityBadge('ca-activity-badge', ionAct.ca_active, 80, 120, 60, 40);
        setActivityBadge('mg-activity-badge', ionAct.mg_active, 20, 40, 15, 12);
    } catch (_e) {
        console.warn('[recalculateSums] ECion/PHcalc/osmotic error:', _e);
    }

    // Диагностика ионных соотношений
    const ionRatios = calculateIonRatios(sums);
    updateDiagnosticsCard(ionRatios);
    updateDiagStatusBadge(ionRatios);

    // Панель антагонизмов (предупреждения о критичных соотношениях)
    checkAntagonisms(sums);

    // Обновляем высоту контейнера в режиме фит
    if (typeof window.updateFitModeHeight === 'function') {
        window.updateFitModeHeight();
    }

    // Обновляем цвета ИТОГО в вертикальной таблице
    updateVerticalTableColors();
}

/**
 * Обновляет цвета ячеек ИТОГО в вертикальной таблице
 * (синхронизирует с подсветкой горизонтальной таблицы)
 */
function updateVerticalTableColors() {
    const verticalTotals = document.querySelectorAll('.fert-v-total[data-element]');
    if (!verticalTotals.length) return;

    verticalTotals.forEach(cell => {
        const elem = cell.dataset.element;
        // Копируем стили из горизонтальной таблицы
        const horizontalCell = document.querySelector(`#sum-${elem}`);
        if (horizontalCell) {
            cell.style.color = horizontalCell.style.color || '';
            cell.style.backgroundColor = horizontalCell.style.backgroundColor || '';
        }
    });
}

// ============================================================================
// ДОБАВЛЕНИЕ СТРОКИ УДОБРЕНИЯ
// ============================================================================

function addFertilizerRow(fertilizer, grams = 0, disabled = false) {
    const newRow = $(`<tr class="f-${fertilizer.pk}${disabled ? ' fert-row-disabled' : ''}">`);

    let firstRow = `<td class="fertilizer-name" data-pk="${fertilizer.pk}">`;
    firstRow += '<div class="d-flex align-items-center justify-content-between gap-2">';
    firstRow += '<div class="d-flex align-items-center gap-2">';
    firstRow += `<input type="checkbox" class="fert-include-cb" title="Включить/исключить из расчёта"${disabled ? '' : ' checked'} style="width:14px;height:14px;cursor:pointer;accent-color:#22c55e;flex-shrink:0;">`;

    if (fertilizer.link) {
        firstRow += `<a class="f-name" rel="nofollow" target="_blank" href="${fertilizer.link}">${fertilizer.name}</a>`;
    } else {
        firstRow += `<span class="f-name">${fertilizer.name}</span>`;
    }

    // Добавляем span для плотности (только для простых солей)
    const elements = {};
    ELEMENTS.forEach(el => {
        elements[el] = fertilizer[el] || 0;
    });
    const isSimpleSalt = fertilizer.name && getDensityParams(fertilizer.name, elements) !== null;
    if (isSimpleSalt) {
        firstRow += `<span class="fert-density text-muted small ms-1" style="font-size: 0.85em;"></span>`;
    }

    if (fertilizer.link2) {
        firstRow += `<a href="${fertilizer.link2}" title="Редактировать в админке" data-bs-toggle="tooltip"><i class="bi bi-pencil"></i></a>`;
    }

    if (fertilizer.moderated === "False") {
        // Формируем data-атрибуты для формы редактирования
        const editAttrs = Object.entries(fertilizer)
            .filter(([_k, v]) => v !== null && v !== undefined && v !== '')
            .map(([k, v]) => `data-${k.toLowerCase()}="${String(v).replace(/"/g, '&quot;')}"`)
            .join(' ');
        firstRow += `<a href="#" class="edit-fert text-danger" title="Редактировать" data-bs-toggle="tooltip" ${editAttrs}><i class="bi bi-pencil"></i></a>`;
    }

    if (fertilizer.description && fertilizer.description !== '') {
        firstRow += `<a class="ms-1 fertilizer-name-desc" data-pk="${fertilizer.pk}" href="#" title="Описание" data-bs-toggle="tooltip">
            <i class="bi bi-info-circle"></i></a>
            <p id="description-toggle-${fertilizer.pk}" class="description-toggle d-none" data-bs-toggle="popover" data-trigger="hover"
               style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${fertilizer.description.replace(/\\u000A|\n/g, '<br>')}</p>`;
    }

    // Проверяем, есть ли в избранном
    let favorites = [];
    try {
        favorites = JSON.parse(localStorage.getItem('favoriteFerts') || '[]');
    } catch (_e) {
        favorites = [];
    }
    const isFavorite = favorites.includes(String(fertilizer.pk));
    const starIcon = isFavorite ? 'bi-star-fill' : 'bi-star';
    const starClass = isFavorite ? 'btn-warning' : 'btn-outline-warning';

    firstRow += '</div>';
    firstRow += '<div class="d-flex align-items-center gap-2">';
    firstRow += `<span class="bottle badge bg-primary badge-bottle" data-elem="${fertilizer.bottle}" title="Бутылка" data-bs-toggle="tooltip">${fertilizer.bottle}</span>`;
    firstRow += `<button class="btn btn-sm ${starClass} fav-star-btn" data-fert-id="${fertilizer.pk}" title="Добавить в избранное" data-bs-toggle="tooltip" aria-label="Избранное"><i class="bi ${starIcon}"></i></button>`;
    firstRow += '<button class="btn btn-sm btn-outline-danger delete-button" title="Удалить" data-bs-toggle="tooltip" aria-label="Удалить"><i class="bi bi-trash"></i></button>';
    firstRow += '</div></div></td>';

    newRow.append(firstRow);

    // Создаём ячейку с граммами и кнопками +/-
    const gramsCell = `
        <td>
            <div class="d-flex align-items-center justify-content-center gap-1">
                <button class="btn btn-sm btn-outline-secondary px-1 py-0 grams-decrease" title="Уменьшить на 0.01">
                    <i class="bi bi-dash"></i>
                </button>
                <input type="number" name="grams" style="width: 70px; text-align: center;" value="${grams}" step="0.01" data-id="${fertilizer.id}" class="grams-input form-control form-control-sm">
                <button class="btn btn-sm btn-outline-secondary px-1 py-0 grams-increase" title="Увеличить на 0.01">
                    <i class="bi bi-plus"></i>
                </button>
            </div>
        </td>`;
    newRow.append(gramsCell);

    ELEMENTS.forEach(el => {
        newRow.append(`<td class="element ${el}" data-elem="${fertilizer[el]}">${fertilizer[el]}</td>`);
    });

    newRow.find('.grams-input').on('input', handleGramsInputChange);
    newRow.find('.grams-input').on('change', handleGramsInputChange);
    newRow.find('.fert-include-cb').on('change', function() {
        const row = $(this).closest('tr');
        row.toggleClass('fert-row-disabled', !this.checked);
        recalculateSums();
        updateURL();
    });
    newRow.find('.delete-button').on('click', handleDeleteButtonClick);
    newRow.find('.fav-star-btn').on('click', handleFavoriteToggle);
    newRow.find('.fertilizer-name-desc').on('click', function(e) {
        e.preventDefault();
        $(`#description-toggle-${$(this).data('pk')}`).toggleClass('d-none');
    });

    // Обработчики для кнопок +/- граммов
    newRow.find('.grams-increase').on('click', function() {
        const input = $(this).siblings('.grams-input');
        const currentValue = safeParseFloat(input.val());
        const newValue = currentValue + 0.01;
        const litres = Math.max(0.1, safeParseFloat($('#litres').val(), 1));
        input.val(newValue.toFixed(2));
        input.data('precise-grams', newValue);
        input.data('base-grams', newValue / litres);
        input.trigger('input');
    });

    newRow.find('.grams-decrease').on('click', function() {
        const input = $(this).siblings('.grams-input');
        const currentValue = safeParseFloat(input.val());
        const newValue = Math.max(0, currentValue - 0.01);
        const litres = Math.max(0.1, safeParseFloat($('#litres').val(), 1));
        input.val(newValue.toFixed(2));
        input.data('precise-grams', newValue);
        input.data('base-grams', newValue / litres);
        input.trigger('input');
    });

    const _initLitres = Math.max(0.1, safeParseFloat($('#litres').val(), 1));
    const _initGrams = parseFloat(grams) || 0;
    newRow.find('.grams-input').data('precise-grams', _initGrams).data('base-grams', _initGrams / _initLitres);
    $('.fert > tbody').append(newRow);

    try {
        if (window.bootstrap && bootstrap.Tooltip) {
            newRow[0].querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
                new bootstrap.Tooltip(el); // eslint-disable-line no-new
            });
        }
    } catch(_) { /* graceful */ } // eslint-disable-line no-unused-vars
}

// ============================================================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// ============================================================================

function handleGramsInputChange() {
    if ($(this).hasClass("grams-input")) {
        const v = safeParseFloat($(this).val());
        $(this).data("saved-val", $(this).val());
        if (!isNaN(v)) {
            const litres = Math.max(0.1, safeParseFloat($('#litres').val(), 1));
            $(this).data('precise-grams', v);
            $(this).data('base-grams', v / litres);
        }
    }
    recalculateSums();
    updateURL();
    parseAndCompare();
}

function handleDeleteButtonClick(e) {
    e.preventDefault();
    $(this).closest('tr').remove();
    recalculateSums();
    updateURL();
}

function handleFavoriteToggle(e) {
    e.preventDefault();
    const fertId = $(this).data('fert-id');
    if (!fertId) return;

    // Получаем текущий список избранного
    let favorites = [];
    try {
        favorites = JSON.parse(localStorage.getItem('favoriteFerts') || '[]');
    } catch (_e) {
        favorites = [];
    }

    const fertIdStr = String(fertId);
    const index = favorites.indexOf(fertIdStr);

    if (index > -1) {
        // Удаляем из избранного
        favorites.splice(index, 1);
        $(this).find('i').removeClass('bi-star-fill').addClass('bi-star');
        $(this).removeClass('btn-warning').addClass('btn-outline-warning');
    } else {
        // Добавляем в избранное
        favorites.push(fertIdStr);
        $(this).find('i').removeClass('bi-star').addClass('bi-star-fill');
        $(this).removeClass('btn-outline-warning').addClass('btn-warning');
    }

    // Сохраняем
    localStorage.setItem('favoriteFerts', JSON.stringify(favorites));
}

function selectAllFertilizers() {
    $('#fert-list .fert-item').each(function() {
        const selectedFertilizerId = $(this).data('id');
        if (selectedFertilizerId) {
            const selectedFertilizer = $(`#fert-list .fert-item[data-id="${selectedFertilizerId}"]`);
            addFertilizerRow(selectedFertilizer.data(), 0);
        }
    });
    recalculateSums();
    updateURL();
}

function deSelectAllFertilizers() {
    $('.fert > tbody > tr:not(#sum-row):not(#comp-row)').remove();
    recalculateSums();
    updateURL();
}

function handleSumConcentrationChange() {
    let currentSumVal = safeParseFloat($('#sum-concentration').val());
    const minThreshold = 0.0000001;

    if (previousSumVal === 0 && currentSumVal === 0) return;
    if (previousSumVal === 0) previousSumVal = currentSumVal;
    if (currentSumVal === 0) currentSumVal = previousSumVal;

    let adjustmentFactor = currentSumVal / previousSumVal;

    if (adjustmentFactor < minThreshold) {
        console.warn(`Current sum concentration is below threshold ${minThreshold}`);
        adjustmentFactor = 1;
    }

    $('.grams-input').each(function() {
        const prevPrecise = safeParseFloat($(this).data('precise-grams'), safeParseFloat($(this).val()));
        const newPrecise = prevPrecise * adjustmentFactor;
        $(this).data('precise-grams', newPrecise);
        $(this).val(formatGramsTruncated(newPrecise));
    });

    previousSumVal = currentSumVal;
    handleGramsInputChange();
}

// ============================================================================
// NPK РАСЧЕТ
// ============================================================================

function calculateNPK() {
    const nitrogen =
        safeParseFloat($('#sum-nh4').text()) +
        safeParseFloat($('#sum-no3').text()) +
        safeParseFloat($('#sum-nh2').text());

    const phosphorus = safeParseFloat($('#sum-p').text());
    const potassium = safeParseFloat($('#sum-k').text());

    const phosphorusOxide = (phosphorus * 2.29 / 10).toFixed(1);
    const potassiumOxide = (potassium * 1.2 / 10).toFixed(1);
    const roundedNitrogen = (nitrogen / 10).toFixed(1);

    const npkResult = `NPK: ${roundedNitrogen}-${phosphorusOxide}-${potassiumOxide}`;

    $('#npk-output').html(npkResult);
    const npkInline = $('#npk-inline');
    if (npkInline.length) npkInline.text(npkResult);
}

// ============================================================================
// СРАВНЕНИЕ ПРОФИЛЕЙ
// ============================================================================

function parseAndCompare() {
    const inputString = $('#input-string').val();

    if (!inputString) {
        $('#comp-row').addClass('d-none');
        return;
    }

    $('#comp-row').removeClass('d-none');
    const pattern = /(\w+)=([0-9.]+)/g;
    let match;

    while ((match = pattern.exec(inputString)) !== null) {
        const element = match[1];
        const value = parseFloat(match[2]);
        const cell = $(`#comp-${element.toLowerCase()}`);

        if (cell.length) {
            cell.text(value.toFixed(2));
            compareValues(element, value);
        }
    }
}

function compareValues(element, value) {
    const l_element = element.toLowerCase();
    const sumCell = $(`#sum-${l_element}`);

    if (sumCell.length) {
        const sumValue = safeParseFloat(sumCell.text());
        const inputCell = $(`#comp-${l_element}`);
        const difference = value - sumValue;
        let percentageDifference = (difference / sumValue) * 100;

        if (percentageDifference > 0.1 && percentageDifference < 90) {
            percentageDifference += 10;
        }

        inputCell.css('backgroundColor', getDifferenceColor(percentageDifference));
    }
}

function getDifferenceColor(percentageDifference) {
    if (percentageDifference === 0) return '';
    const alpha = Math.min(Math.abs(percentageDifference) / 100, 1);
    return `rgba(${percentageDifference > 0 ? '255, 99, 71' : '255, 0, 0'}, ${alpha})`;
}

// ============================================================================
// РЕДАКТИРОВАНИЕ УДОБРЕНИЙ
// ============================================================================

function updateOriginalFields() {
    const conversions = [
        { from: 'K2O', to: 'K', factor: CONVERSION_FACTORS.K2O_TO_K },
        { from: 'P2O5', to: 'P', factor: CONVERSION_FACTORS.P2O5_TO_P },
        { from: 'CaO', to: 'Ca', factor: CONVERSION_FACTORS.CaO_TO_Ca },
        { from: 'MgO', to: 'Mg', factor: CONVERSION_FACTORS.MgO_TO_Mg },
        { from: 'SO3', to: 'S', factor: CONVERSION_FACTORS.SO3_TO_S },
        { from: 'ClO', to: 'Cl', factor: CONVERSION_FACTORS.ClO_TO_Cl }
    ];

    conversions.forEach(({ from, to, factor }) => {
        const value = safeParseFloat($(`#form-edit_plant_fert #id_${from}`).val());
        if (!isNaN(value)) {
            $(`#form-edit_plant_fert #id_${to}`).val((value * factor).toFixed(4));
        }
    });
}

function updateComputedFields() {
    const conversions = [
        { from: 'K', to: 'K2O', factor: 1 / CONVERSION_FACTORS.K2O_TO_K },
        { from: 'P', to: 'P2O5', factor: 1 / CONVERSION_FACTORS.P2O5_TO_P },
        { from: 'Ca', to: 'CaO', factor: 1 / CONVERSION_FACTORS.CaO_TO_Ca },
        { from: 'Mg', to: 'MgO', factor: 1 / CONVERSION_FACTORS.MgO_TO_Mg },
        { from: 'S', to: 'SO3', factor: 1 / CONVERSION_FACTORS.SO3_TO_S },
        { from: 'Cl', to: 'ClO', factor: 1 / CONVERSION_FACTORS.ClO_TO_Cl }
    ];

    conversions.forEach(({ from, to, factor }) => {
        const value = safeParseFloat($(`#form-edit_plant_fert #id_${from}`).val());
        if (!isNaN(value)) {
            $(`#form-edit_plant_fert #id_${to}`).val((value * factor).toFixed(4));
        }
    });
}

function add_form_events() {
    $("#form-edit_plant_fert").on('submit', function(event) {
        event.preventDefault();
        const formData = $(this).serialize();

        $.ajax({
            type: "POST",
            url: $(this).attr("action"),
            data: formData,
            dataType: "json",
            success: function(response) {
                display_msg("Успешно", false);
                const row = $(`.f-${response.pk}`);
                const mgrams = safeParseFloat(row.find('.grams-input').val()) * 100;

                row.find('.f-name').text(response.name);

                ELEMENTS.forEach(el => {
                    const fieldName = FIELD_NAMES[el];
                    const value = safeParseFloat(response[fieldName]);
                    row.find(`.element.${el}`).text((value * mgrams).toFixed(2));
                    row.find(`.element.${el}`).attr("data-elem", value.toFixed(2));
                });

                // Обновляем data-атрибуты на кнопке редактирования
                const editBtn = row.find('.edit-fert');
                if (editBtn.length) {
                    editBtn.data('name', response.name);
                    editBtn.data('link', response.link || '');
                    for (const [key, fieldName] of Object.entries(FIELD_NAMES)) {
                        if (response[fieldName] !== undefined) {
                            editBtn.data(key, response[fieldName]);
                        }
                    }
                }

                // Обновляем fert-item в списке
                const fertItem = $(`#fert-list .fert-item[data-id="${response.pk}"]`);
                if (fertItem.length) {
                    fertItem.data('name', response.name);
                    fertItem.find('.fert-name').text(response.name);
                    for (const [key, fieldName] of Object.entries(FIELD_NAMES)) {
                        if (response[fieldName] !== undefined) {
                            fertItem.data(key, response[fieldName]);
                        }
                    }
                }

                recalculateSums();
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.errors : "Произошла ошибка при обработке формы.";
                display_msg(errorMessage, true);
            }
        });
    });
}

function display_msg(errorMessage, error = false) {
    const target = error ? "#form-error" : "#form-success";
    $(`#edit_plant_fert ${target}`).text(errorMessage);
}

function add_edit_listener() {
    // Используем делегирование событий для динамически добавленных элементов
    $(document).on('click', '.edit-fert', function(e) {
        e.preventDefault();
        $("#edit_plant_fert #form-error, #edit_plant_fert #form-success").text("");

        const fertilizer = $(this).data();
        $("#form-edit_plant_fert").attr("action", `/calc/fert-new/${fertilizer.pk}/`);

        // Сначала очищаем все поля формы
        $('#form-edit_plant_fert input').val('');

        for (const key in fertilizer) {
            if (Object.prototype.hasOwnProperty.call(fertilizer, key)) {
                let value = fertilizer[key];
                if (value !== null && value !== undefined && value !== "None" && value !== '') {
                    const fieldName = FIELD_NAMES[key];
                    if (fieldName) {
                        const item = $(`#form-edit_plant_fert #id_${fieldName}`);
                        value = String(value).replace(',', '.');
                        // Для поля name очищаем HTML теги
                        if (fieldName === 'name') {
                            value = value.replace(/<[^>]*>/g, '').trim();
                        } else {
                            // 4 знака после запятой (соответствует step="0.0001" в форме)
                            value = !isNaN(parseFloat(value)) ? parseFloat(value).toFixed(4) : value;
                        }
                        item.val(value);
                    }
                }
            }
        }
        $("#edit_plant_fert").modal('show');
    });
}

// ============================================================================
// TOGGLE ФУНКЦИИ
// ============================================================================

function toggleTableVisibility(element) {
    if (element && element.preventDefault) {
        element.preventDefault();
    }

    const $btn = $('#toggleButon');
    const $icon = $btn.find('i');
    const $text = $btn.find('span');

    if (rows_visible) {
        // Скрываем строки удобрений
        $('table.fert tr:not(.sum-row)').hide();
        rows_visible = false;
        // Меняем иконку и текст на "показать"
        $icon.removeClass('bi-eye-slash').addClass('bi-eye');
        $text.text('Показать удобрения');
        $btn.attr('title', 'Показать таблицу удобрений');
    } else {
        // Показываем строки удобрений
        $('table.fert tr').show();
        rows_visible = true;
        // Меняем иконку и текст на "скрыть"
        $icon.removeClass('bi-eye').addClass('bi-eye-slash');
        $text.text('Скрыть удобрения');
        $btn.attr('title', 'Скрыть таблицу удобрений');
    }
}

function bindFertilizerSelectHandler() {
    $('#fertilizer-select').on('change', function() {
        // Этот обработчик оставлен для обратной совместимости со старым Select2
        // Основная логика добавления теперь в fert-item checkbox
        const selectedFertilizerId = $(this).val();
        if (!selectedFertilizerId) return;

        const fertItem = $(`#fert-list .fert-item[data-id="${selectedFertilizerId}"]`);
        let selectedFertilizer = fertItem.data();

        // Проверяем замену для удалённых удобрений
        const isDeleted = selectedFertilizer.isDeleted === true || selectedFertilizer.isDeleted === 'true';
        const replacementId = selectedFertilizer.replacementId;

        if (isDeleted && replacementId) {
            const replacement = $(`#fert-list .fert-item[data-id="${replacementId}"]`);
            if (replacement.length) {
                console.log(`Замена удобрения ${selectedFertilizerId} на ${replacementId}`);
                selectedFertilizer = replacement.data();
            }
        }

        const existingRow = $(`.f-${selectedFertilizer.pk}`);

        if (existingRow.length > 0) {
            console.warn(`Удобрение ${selectedFertilizer.name} уже добавлено`);
        } else {
            addFertilizerRow(selectedFertilizer, 0);
            recalculateSums();
            updateURL();
        }
    });
}

/**
 * Корректировка граммов удобрений по целевому EC
 * @param {number} targetEC - Желаемое значение EC
 */
function adjustGramsByTargetEC(targetEC) {
    const currentEC = safeParseFloat($('#old-current-ec').val());

    if (currentEC === 0 || !isFinite(currentEC)) {
        console.warn('Невозможно скорректировать граммы: текущий EC равен 0 или некорректен');
        return;
    }

    if (targetEC < 0) {
        console.warn('Целевой EC не может быть отрицательным');
        return;
    }

    const scaleFactor = targetEC / currentEC;

    console.debug(`Корректировка граммов: текущий EC=${currentEC}, целевой EC=${targetEC}, коэффициент=${scaleFactor.toFixed(3)}`);

    // Масштабируем все граммы
    $('input.grams-input').each(function() {
        const currentPrecise = safeParseFloat($(this).data('precise-grams'), safeParseFloat($(this).val()));
        const newPrecise = currentPrecise * scaleFactor;
        const displayVal = formatGramsTruncated(newPrecise);

        $(this).val(displayVal);
        $(this).data('precise-grams', newPrecise);
    });

    // Пересчитываем суммы и обновляем URL
    recalculateSums();
    updateURL();
}

// Экспорт функций в window для внешнего доступа
window.addFertilizerRow = addFertilizerRow;
window.recalculateSums = recalculateSums;
window.updateURL = updateURL;
window._t = _t;
window.loadFertilizersFromData = loadFertilizersFromData;

// ============================================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================================

$(document).ready(() => {
    $('#fertilizer-select').select2({
        width: 'resolve',
        placeholder: 'Выберите удобрение'
    });

    $('.fert > tbody > tr:not(#sum-row):not(#comp-row) input.grams-input').on('input', function() {
        handleGramsInputChange.call(this);
        updateURL();
    });

    $('.fert > tbody > tr:not(#sum-row):not(#comp-row) input.grams-input').on('change', function() {
        handleGramsInputChange.call(this);
        updateURL();
    });

    $('.fert > tbody > tr:not(#sum-row):not(#comp-row) button.delete-button').on('click', function() {
        $(this).closest('tr').remove();
        handleDeleteButtonClick.call(this);
        updateURL();
    });

    bindFertilizerSelectHandler();
    loadTableFromURL();

    $('input').each(function() {
        $(this).data('saved-val', $(this).val());
    }).on('focus', function() {
        $(this).data('saved-val', $(this).val());
    });

    $('.fertilizer-name').click(function() {
        $(`description-toggle-${$(this).data('pk')}`).toggle();
    });

    $('#select-all-button').on('click', selectAllFertilizers);
    $('#de-select-all-button').on('click', deSelectAllFertilizers);
    $("#copy-button").on("click", copyURLToClipboard);
    $("#toggleButon").on('click', toggleTableVisibility);
    $('#sum-concentration').on('change', handleSumConcentrationChange);
    $('.zoom-controls button').on('click', handleSumConcentrationChange);
    $('#tara-a, #tara-b, #tara-micro, #conc-micro-enabled, #fixed-conc-volumes').on('change', calculateWater);

    // Обработчики для кнопок EC
    $('#ec-increase').on('click', () => {
        const currentEC = safeParseFloat($('#ec-input').val());
        const newEC = currentEC + 0.01;
        adjustGramsByTargetEC(newEC);
    });

    $('#ec-decrease').on('click', () => {
        const currentEC = safeParseFloat($('#ec-input').val());
        const newEC = Math.max(0, currentEC - 0.01);
        adjustGramsByTargetEC(newEC);
    });

    $('#ec-input').on('change', function() {
        const newEC = safeParseFloat($(this).val());
        if (newEC >= 0) {
            adjustGramsByTargetEC(newEC);
        }
    });

    // Обработчики для кнопок литров
    $('#litres-increase').on('click', () => {
        const currentLitres = safeParseFloat($('#litres').val());
        const newLitres = currentLitres + 0.1;
        $('#litres').val(newLitres.toFixed(1)).trigger('input');
    });

    $('#litres-decrease').on('click', () => {
        const currentLitres = safeParseFloat($('#litres').val());
        const newLitres = Math.max(0.1, currentLitres - 0.1);
        $('#litres').val(newLitres.toFixed(1)).trigger('input');
    });

    $("#grams_ppm").on("click", function() {
        ppm = !ppm;
        $(this).text(ppm ? 'мМмоль' : 'ppm');
        recalculateSums();
    });

    $("#litres").on('input', function() {
        const currentVal = safeParseFloat($(this).val());
        if (currentVal === 0) return;

        $('input.grams-input').each(function() {
            let baseGrams = safeParseFloat($(this).data('base-grams'));
            if (!isFinite(baseGrams)) {
                // Нет базы — вычислить из precise-grams и предыдущих литров
                const prevPrecise = safeParseFloat($(this).data('precise-grams'), safeParseFloat($(this).val()));
                const prevLitres = safeParseFloat($('#litres').data("saved-val"), currentVal);
                baseGrams = prevPrecise / Math.max(0.1, prevLitres);
                $(this).data('base-grams', baseGrams);
            }
            const newPrecise = baseGrams * currentVal;
            const displayVal = formatGramsTruncated(newPrecise);

            $('#itog').text(`Итого на ${currentVal} л`);
            $(this).val(displayVal);
            $(this).data('precise-grams', newPrecise);
            // base-grams не трогаем — это эталон на 1л
        });

        $('#litres').data("saved-val", currentVal);
        handleGramsInputChange();
    });

    add_edit_listener();
    add_form_events();

    // Делегирование событий для автопересчёта элемент ↔ оксид
    $(document).on('input', '#form-edit_plant_fert #id_K, #form-edit_plant_fert #id_P, #form-edit_plant_fert #id_Ca, #form-edit_plant_fert #id_Mg, #form-edit_plant_fert #id_S, #form-edit_plant_fert #id_Cl',
        updateComputedFields);

    $(document).on('input', '#form-edit_plant_fert #id_K2O, #form-edit_plant_fert #id_P2O5, #form-edit_plant_fert #id_CaO, #form-edit_plant_fert #id_MgO, #form-edit_plant_fert #id_SO3, #form-edit_plant_fert #id_ClO',
        updateOriginalFields);

    previousSumVal = safeParseFloat($('#sum-concentration').val());

    const toggleConcentrates = document.getElementById('toggle-concentrates');
    if (toggleConcentrates) {
        toggleConcentrates.addEventListener('click', () => {
            const outputOuter = document.getElementById('water-output-outer');
            const arrow = document.getElementById('arrow');

            if (outputOuter.style.display === 'none') {
                outputOuter.style.display = 'block';
                arrow.textContent = '▲';
            } else {
                outputOuter.style.display = 'none';
                arrow.textContent = '▼';
            }
        });
    }

    // Обработчик для показа/скрытия QR кода
    const toggleQrButton = document.getElementById('toggle-qr-button');
    if (toggleQrButton) {
        toggleQrButton.addEventListener('click', () => {
            const qrcodeContainer = document.getElementById('qrcode-container');
            if (qrcodeContainer) {
                qrcodeContainer.classList.toggle('d-none');
            }
        });
    }

    window.toggleBlockById = function(id) {
        try {
            const el = document.getElementById(id);
            if (!el) return;
            const collapse = bootstrap.Collapse.getOrCreateInstance(el, { toggle: false });
            collapse.toggle();
        } catch (_) { // eslint-disable-line no-unused-vars
            const el = document.getElementById(id);
            if (el) el.classList.toggle('show');
        }
    };

    (function() {
        const updateArrow = (id, expanded) => {
            document.querySelectorAll(`.toggle-arrow[data-target="${id}"]`)
                .forEach(a => {
                    a.textContent = expanded ? '▲' : '▼';
                });
        };

        document.addEventListener('shown.bs.collapse', (ev) => {
            if (ev.target && ev.target.id) updateArrow(ev.target.id, true);
        });

        document.addEventListener('hidden.bs.collapse', (ev) => {
            if (ev.target && ev.target.id) updateArrow(ev.target.id, false);
        });
    })();

    document.getElementById('toggle-text').addEventListener('click', () => {
        document.querySelectorAll('a.f-name').forEach(link => {
            const words = link.textContent.split(' ');

            if (link.dataset.collapsed === 'true') {
                link.textContent = link.dataset.fullText;
                link.dataset.collapsed = 'false';
            } else {
                link.dataset.fullText = link.textContent;
                for (let i = 0; i < words.length; i++) {
                    const firstWord = words[i].trim().toLowerCase();
                    if (firstWord !== '' && firstWord !== '\n') {
                        link.textContent = firstWord;
                        break;
                    }
                }
                link.dataset.collapsed = 'true';
            }
        });
    });

    // Поиск в модалке блокировки элементов
    const blockingSearch = document.getElementById('blocking-search');
    if (blockingSearch) {
        blockingSearch.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            const items = document.querySelectorAll('#blocking-content .blocking-item');
            items.forEach(item => {
                const el = item.dataset.el || '';
                const text = item.textContent.toLowerCase();
                const matches = !query || el.includes(query) || text.includes(query);
                item.style.display = matches ? '' : 'none';
            });
        });
    }

    // Кнопка статуса диагностики - скролл к блоку
    const diagBtn = document.getElementById('diag-status-btn');
    if (diagBtn) {
        diagBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const diagBlock = document.getElementById('card-diagnostics');
            if (diagBlock) {
                diagBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // Переключатель субстрата
    const substrateSelect = document.getElementById('diag-substrate-select');
    if (substrateSelect) {
        substrateSelect.addEventListener('change', function() {
            currentSubstrate = this.value;
            updateRatioCardHints(); // обновляем подсказки лимитов
            recalculateSums(); // пересчитываем диагностику
        });
    }

    // Делаем матрицу и карточки ratio readonly (не редактируемые в Fertilizer)
    document.querySelectorAll('#ratio-matrix .matrix-input, .ratio-card input').forEach(input => {
        input.readOnly = true;
        input.style.pointerEvents = 'none';
    });

    // Скрываем старую панель антагонизмов (используем диагностику в стиле OHPG)
    const oldPanel = document.getElementById('antagonism-panel');
    if (oldPanel) oldPanel.style.display = 'none';

    console.debug(`Initialized at ${new Date().toLocaleString()}`);
});
