/**
 * common_profile_fertilizers.js
 * Скрипты для страницы калькулятора удобрений
 */

// Глобальные переменные состояния (объявлены до DOMContentLoaded-обработчиков)
var lastCalculatedRecipe = [];
var allFertOptions = [];

// ============================================================================
// Работа с рецептами и избранным
// ============================================================================

// Обработчики событий, которые нужно инициализировать после загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // === Обработчик переключения ppm/mmol ===
    const inputUnitToggle = document.getElementById('input-unit-toggle');
    const inputString = document.getElementById('input-string');
    if (inputUnitToggle && inputString) {
        const ppmPlaceholder = 'N=100 NO3=90 NH4=9 P=42 K=150 Ca=140 Mg=33 S=103 Fe=2.0 Mn=0.55 B=0.35';
        const mmolPlaceholder = 'N=7.1 NO3=6.4 NH4=0.6 P=1.4 K=3.8 Ca=3.5 Mg=1.4 S=3.2 Fe=0.036 Mn=0.01';

        inputUnitToggle.addEventListener('change', (e) => {
            if (e.target.name === 'input-unit') {
                const isMmol = e.target.value === 'mmol';
                inputString.placeholder = isMmol ? mmolPlaceholder : ppmPlaceholder;
            }
        });
    }

    // === Обработка profile_string из URL ===
    // Если в URL есть profile_string, заполняем input-string и открываем модалку автоподбора
    const urlParams = new URLSearchParams(window.location.search);
    const profileString = urlParams.get('profile_string');
    if (profileString) {
        const inputString = document.getElementById('input-string');
        if (inputString) {
            inputString.value = decodeURIComponent(profileString);
        }
        // Открываем модалку автоподбора после небольшой задержки (чтобы DOM успел загрузиться)
        setTimeout(() => {
            const autoSolveModal = document.getElementById('autoSolveModal');
            if (autoSolveModal && window.bootstrap) {
                const modal = new bootstrap.Modal(autoSolveModal);
                modal.show();
                // Запускаем автоподбор после открытия модалки
                setTimeout(() => {
                    const autoSolveBtn = document.getElementById('auto-solve-btn');
                    if (autoSolveBtn) {
                        autoSolveBtn.click();
                    }
                }, 500);
            }
        }, 300);
    }

    const clearRecipeBtn = document.getElementById('clear-recipe-btn');
    if (clearRecipeBtn) {
        clearRecipeBtn.addEventListener('click', () => {
            // Очистить вывод результата и debug-log
            document.getElementById('result').innerHTML = '';
            document.getElementById('debug-log').textContent = '';
            // Если нужно — сбросить input-строку рецепта:
            // document.getElementById('input-string').value = '';
        });
    }

    const fillRecipeBtn = document.getElementById('fill-recipe-btn');
    if (fillRecipeBtn) {
        fillRecipeBtn.addEventListener('click', () => {
            if (!lastCalculatedRecipe || lastCalculatedRecipe.length === 0) {
                alert('Нет рассчитанного рецепта!');
                return;
            }

            // Удаляем все строки рецепта
            $('.fert > tbody > tr:not(#sum-row):not(#comp-row)').remove();

            // Получаем текущее количество литров (solver считает на 1л)
            const litres = parseFloat($('#litres').val()) || 1;

            // Для каждого из рассчитанных удобрений
            for (const item of lastCalculatedRecipe) {
                // Ищем удобрение в списке .fert-item
                const $fertItem = $('#fert-list .fert-item[data-pk="' + item.id + '"], #fert-list .fert-item[data-id="' + item.id + '"]').first();
                if ($fertItem.length) {
                    const fertData = $fertItem.data();
                    // Умножаем граммы на литры (solver считает на 1л)
                    const gramsForLitres = item.grams * litres;
                    // addFertilizerRow ждёт объект с данными, передаём их и граммы
                    if (typeof window.addFertilizerRow === 'function') {
                        window.addFertilizerRow(fertData, gramsForLitres);
                    } else if (typeof addFertilizerRow === 'function') {
                        addFertilizerRow(fertData, gramsForLitres);
                    }
                } else {
                    console.warn('[Fill] Удобрение не найдено:', item.id, item.fert?.name);
                }
            }

            // Обновить суммы и URL
            if (typeof window.recalculateSums === 'function') {
                window.recalculateSums();
            } else if (typeof recalculateSums === 'function') {
                recalculateSums();
            }
            if (typeof window.updateURL === 'function') {
                window.updateURL();
            } else if (typeof updateURL === 'function') {
                updateURL();
            }

            // Закрыть модалку
            const modal = bootstrap.Modal.getInstance(document.getElementById('autoSolveModal'));
            if (modal) modal.hide();
        });
    }

    // --- Функция автоподбора (можно вызвать извне) ---
    function runAutoSolve(silent = false) {
        const debugLog = document.getElementById('debug-log');
        if (debugLog) debugLog.textContent = '';

        const input = document.getElementById('input-string').value;
        if (!input) {
            if (!silent) alert('Введите искомый профиль!');
            return false;
        }
        const target = parseTargetString(input);
        logToPage('Искомый профиль: ' + JSON.stringify(target));
        lastCalculatedRecipe = [];
        const fertilizers = getFertilizersForCalculation(false);
        if (fertilizers.length === 0) {
            if (!silent) alert('Нет удобрений для расчёта!');
            return false;
        }

        const maxFerts = parseInt(document.getElementById('fert-count')?.value) || 20;
        const results = _solveWithLimit(fertilizers, target, maxFerts);

        const {achieved, error} = calculateAchievedAndError(fertilizers, results, target);

        document.getElementById('result').innerHTML = renderResultHtml(fertilizers, results, achieved, target, error);
        logToPage('Готово.');
        _attachRecipeActions();

        // Активируем кнопку "Применить к таблице"
        const applyBtn = document.getElementById('fill-recipe-btn');
        if (applyBtn && lastCalculatedRecipe && lastCalculatedRecipe.length > 0) {
            applyBtn.disabled = false;
        }
        return true;
    }

    // Экспорт для вызова извне
    window.runAutoSolve = runAutoSolve;

    // --- Обработчик для auto-solve-btn ---
    const autoSolveBtn = document.getElementById('auto-solve-btn');
    if (autoSolveBtn) {
        autoSolveBtn.addEventListener('click', () => {
            runAutoSolve(false);
        });
    }

    // Обработчик «Составить из избранных»
    const autoSolveFavBtn = document.getElementById('auto-solve-fav-btn');
    if (autoSolveFavBtn) {
        autoSolveFavBtn.addEventListener('click', () => {
            document.getElementById('debug-log').textContent = '';
            const input = document.getElementById('input-string').value;
            if (!input) {
                alert('Введите искомый профиль!');
                return;
            }
            const target = parseTargetString(input);
            logToPage('Искомый профиль: ' + JSON.stringify(target));
            lastCalculatedRecipe = [];
            const fertilizers = getFertilizersForCalculation(true);
            if (fertilizers.length === 0) {
                alert('Нет избранных удобрений!');
                return;
            }

            const maxFerts = parseInt(document.getElementById('fert-count')?.value) || 20;
            const results = _solveWithLimit(fertilizers, target, maxFerts);

            const {achieved, error} = calculateAchievedAndError(fertilizers, results, target);

            document.getElementById('result').innerHTML = renderResultHtml(fertilizers, results, achieved, target, error);
            logToPage('Готово.');
            _attachRecipeActions();
            // Активируем кнопку "Применить к таблице"
            const applyBtn = document.getElementById('fill-recipe-btn');
            if (applyBtn && lastCalculatedRecipe && lastCalculatedRecipe.length > 0) {
                applyBtn.disabled = false;
            }
        });
    }

    // Обновить счётчик исключённых удобрений и видимость кнопки
    function _updateExcludedCount() {
        const excluded = getExcludedFerts();
        const btn = document.getElementById('clear-excluded-btn');
        const lbl = document.getElementById('excluded-count-label');
        if (!btn) return;
        if (excluded.length > 0) {
            btn.classList.remove('d-none');
            if (lbl) lbl.textContent = `Исключено: ${excluded.length}`;
        } else {
            btn.classList.add('d-none');
        }
    }

    // Обработчики кнопок ⭐ и ✕ в рецепте (навешиваются после каждого рендера)
    function _attachRecipeActions() {
        const resultEl = document.getElementById('result');
        if (!resultEl) return;

        resultEl.querySelectorAll('.recipe-fav-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.dataset.fertId;
                const nowFav = toggleFavoriteFert(id);
                this.style.color = nowFav ? '#f59e0b' : '#aaa';
                this.textContent = nowFav ? '★' : '☆';
                this.title = nowFav ? 'Убрать из избранного' : 'Добавить в избранное';
            });
        });

        resultEl.querySelectorAll('.recipe-excl-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.dataset.fertId;
                const name = this.dataset.fertName;
                toggleExcludedFert(id);
                _updateExcludedCount();
                // Перезапускаем расчёт без этого удобрения
                const toast = document.createElement('div');
                toast.className = 'alert alert-warning py-1 px-2 mb-2 small';
                toast.textContent = `«${name}» исключено из расчёта. Пересчёт…`;
                resultEl.prepend(toast);
                setTimeout(() => runAutoSolve(true), 200);
            });
        });
    }
    // Кнопка очистки исключённых удобрений
    const clearExclBtn = document.getElementById('clear-excluded-btn');
    if (clearExclBtn) {
        clearExclBtn.addEventListener('click', () => {
            setExcludedFerts([]);
            _updateExcludedCount();
            runAutoSolve(true);
        });
    }

    // При открытии модалки автоподбора - заполняем текущий профиль и счётчик исключённых
    const autoSolveModal = document.getElementById('autoSolveModal');
    if (autoSolveModal) {
        autoSolveModal.addEventListener('show.bs.modal', () => {
            updateCurrentProfileDisplay();
            _updateExcludedCount();
        });
    }

    // При открытии модалки «База удобрений» - показываем исключённые
    const selectFertModal = document.getElementById('selectFertilizerModal');
    if (selectFertModal) {
        selectFertModal.addEventListener('show.bs.modal', () => {
            _renderExcludedBlock();
        });
    }

    // Сбросить все исключения из модала базы удобрений
    const restoreAllBtn = document.getElementById('restore-all-excluded-btn');
    if (restoreAllBtn) {
        restoreAllBtn.addEventListener('click', () => {
            setExcludedFerts([]);
            _updateExcludedCount();
            _renderExcludedBlock();
        });
    }
});

/**
 * Отрисовать блок исключённых удобрений в модале «База удобрений»
 */
function _renderExcludedBlock() {
    const block = document.getElementById('excluded-ferts-block');
    const list = document.getElementById('excluded-ferts-list');
    if (!block || !list) return;

    const excluded = getExcludedFerts();
    if (excluded.length === 0) {
        block.classList.add('d-none');
        return;
    }

    block.classList.remove('d-none');
    list.innerHTML = '';

    excluded.forEach(id => {
        // Находим имя удобрения из fert-list
        const fertEl = document.querySelector(`#fert-list .fert-item[data-pk="${id}"], #fert-list .fert-item[data-id="${id}"]`);
        const name = fertEl ? (fertEl.querySelector('label .fw-medium')?.textContent?.trim() || id) : id;

        const tag = document.createElement('span');
        tag.className = 'badge bg-danger d-inline-flex align-items-center gap-1';
        tag.style.fontSize = '0.8em';
        tag.innerHTML = `${name} <button class="btn-close btn-close-white p-0" style="font-size:0.6em" title="Вернуть в расчёт" data-restore-id="${id}"></button>`;
        tag.querySelector('button').addEventListener('click', () => {
            toggleExcludedFert(id);
            _renderExcludedBlock();
            _updateExcludedCount();
        });
        list.appendChild(tag);
    });
}

/**
 * Получить текущий профиль из строки сумм таблицы
 */
function getCurrentProfile() {
    const profile = {};
    const fields = ['no3', 'nh4', 'nh2', 'p', 'k', 'ca', 'mg', 's', 'cl', 'fe', 'zn', 'cu', 'mn', 'mo', 'b'];
    fields.forEach(f => {
        // id в HTML с дефисом: sum-no3, sum-nh4 и т.д.
        const el = document.getElementById('sum-' + f);
        if (el) {
            const val = parseFloat(el.textContent) || 0;
            if (val > 0) profile[f.toUpperCase()] = val;
        }
    });
    return profile;
}

/**
 * Обновить отображение текущего профиля в модалке автоподбора
 */
function updateCurrentProfileDisplay() {
    const profile = getCurrentProfile();
    const display = document.getElementById('auto-solve-current-profile');
    if (!display) return;

    const parts = [];
    // Макро
    if (profile.NO3) parts.push('NO3=' + profile.NO3.toFixed(0));
    if (profile.NH4) parts.push('NH4=' + profile.NH4.toFixed(0));
    if (profile.P) parts.push('P=' + profile.P.toFixed(0));
    if (profile.K) parts.push('K=' + profile.K.toFixed(0));
    if (profile.CA) parts.push('Ca=' + profile.CA.toFixed(0));
    if (profile.MG) parts.push('Mg=' + profile.MG.toFixed(0));
    if (profile.S) parts.push('S=' + profile.S.toFixed(0));
    if (profile.CL) parts.push('Cl=' + profile.CL.toFixed(0));
    // Микро
    if (profile.FE) parts.push('Fe=' + profile.FE.toFixed(1));
    if (profile.MN) parts.push('Mn=' + profile.MN.toFixed(2));
    if (profile.B) parts.push('B=' + profile.B.toFixed(2));
    if (profile.ZN) parts.push('Zn=' + profile.ZN.toFixed(2));
    if (profile.CU) parts.push('Cu=' + profile.CU.toFixed(3));
    if (profile.MO) parts.push('Mo=' + profile.MO.toFixed(3));

    display.textContent = parts.length > 0 ? parts.join(' ') : '—';
    display.style.cursor = parts.length > 0 ? 'pointer' : 'default';
    display.title = parts.length > 0 ? 'Нажмите чтобы использовать как целевой' : '';

    // Клик по текущему профилю - скопировать в целевой
    display.onclick = parts.length > 0 ? function() {
        document.getElementById('input-string').value = parts.join(' ');
    } : null;
}

// Используем window.currentFertFilter сразу как глобальную переменную
window.currentFertFilter = 'all'; // или 'favorites', 'moderation'

$('#copy-recipe-fert-ids').on('click', () => {
    // Собираем id всех удобрений из текущего рецепта
    const ids = [];
    // Берём все строки с удобрениями (исключая суммирующие и сравнения)
    $('.fert > tbody > tr:not(#sum-row):not(#comp-row)').each(function () {
        // id удобрения лежит в data-pk у .fertilizer-name (см. addFertilizerRow)
        const fertId = $(this).find('.fertilizer-name').data('pk');
        if (fertId !== undefined && fertId !== null && fertId !== "") {
            ids.push(fertId);
        }
    });
    const idsStr = ids.join(',');
    if (idsStr) {
        navigator.clipboard.writeText(idsStr).then(() => {
            alert('ID скопированы: ' + idsStr);
        });
    } else {
        alert('Нет удобрений в рецепте');
    }
});

$('#show-favorites-btn').on('click', () => {
    window.currentFertFilter = 'favorites';
    const favs = getFavoriteFerts();
    const onlyFavs = allFertOptions.filter(opt => favs.includes(String(opt.value)));
    sortAndRebuildFertilizerSelect(onlyFavs); // rebuild только с избранными
    $('#show-favorites-btn').hide();
    $('#show-all-btn').show();
});

$('#show-all-btn').on('click', () => {
    window.currentFertFilter = 'all';
    sortAndRebuildFertilizerSelect(); // rebuild со всеми
    $('#show-all-btn').hide();
    $('#show-favorites-btn').show();
});

function getFavoriteFerts() {
    try {
        const arr = JSON.parse(localStorage.getItem('favoriteFerts') || '[]');
        // Преобразуем все элементы к строке и убираем пустые
        return arr.flatMap(x => String(x).split(',')).map(x => x.trim()).filter(x => x);
    } catch (_e) {
        return [];
    }
}

function setFavoriteFerts(arr) {
    // Сохраняем только уникальные id, как строки
    arr = arr.flatMap(x => String(x).split(',')).map(x => x.trim()).filter(x => x);
    arr = Array.from(new Set(arr));
    localStorage.setItem('favoriteFerts', JSON.stringify(arr));
}

function getExcludedFerts() {
    try {
        const arr = JSON.parse(localStorage.getItem('excludedFerts') || '[]');
        return arr.map(x => String(x).trim()).filter(x => x);
    } catch (_e) {
        return [];
    }
}

function setExcludedFerts(arr) {
    arr = arr.map(x => String(x).trim()).filter(x => x);
    arr = Array.from(new Set(arr));
    localStorage.setItem('excludedFerts', JSON.stringify(arr));
}

function toggleExcludedFert(id) {
    const excluded = getExcludedFerts();
    const sid = String(id);
    const idx = excluded.indexOf(sid);
    if (idx >= 0) {
        excluded.splice(idx, 1);
    } else {
        excluded.push(sid);
    }
    setExcludedFerts(excluded);
    return idx < 0; // true = теперь исключён
}

function toggleFavoriteFert(id) {
    const favs = getFavoriteFerts();
    const sid = String(id);
    const idx = favs.indexOf(sid);
    if (idx >= 0) {
        favs.splice(idx, 1);
    } else {
        favs.push(sid);
    }
    setFavoriteFerts(favs);
    return idx < 0; // true = теперь в избранном
}

function getFertilizersForCalculation(onlyFavoritesForced = false) {
    const onlyFavorites = (onlyFavoritesForced === true) ? true : !!(document.getElementById('auto-solve-fav-only') && document.getElementById('auto-solve-fav-only').checked);
    const onlyMono = !!(document.getElementById('auto-solve-mono-only') && document.getElementById('auto-solve-mono-only').checked);
    const excludedIds = getExcludedFerts();
    const fertilizers = [];
    // Берём удобрения из списка .fert-item в модалке выбора
    $('#fert-list .fert-item').each(function () {
        const $el = $(this);
        const val = String($el.data('pk') || $el.data('id'));
        if (!val) return;
        // Пропускаем исключённые удобрения
        if (excludedIds.includes(val)) return;
        if (onlyFavorites) {
            const favIds = getFavoriteFerts();
            if (!favIds.includes(val)) return;
        }
        const fert = {
            name: $el.find('label .fw-medium').text().trim() || $el.data('name'),
            id: val,
            composition: {
                // Все ключи в UPPERCASE для соответствия с target
                NH4: parseFloat($el.data('nh4')) || 0,
                NO3: parseFloat($el.data('no3')) || 0,
                NH2: parseFloat($el.data('nh2')) || 0,
                P: parseFloat($el.data('p')) || 0,
                K: parseFloat($el.data('k')) || 0,
                CA: parseFloat($el.data('ca')) || 0,
                MG: parseFloat($el.data('mg')) || 0,
                S: parseFloat($el.data('s')) || 0,
                CL: parseFloat($el.data('cl')) || 0,
                FE: parseFloat($el.data('fe')) || 0,
                ZN: parseFloat($el.data('zn')) || 0,
                CU: parseFloat($el.data('cu')) || 0,
                MN: parseFloat($el.data('mn')) || 0,
                MO: parseFloat($el.data('mo')) || 0,
                B: parseFloat($el.data('b')) || 0,
                CO: parseFloat($el.data('co')) || 0,
                SI: parseFloat($el.data('si')) || 0,
            }
        };

        // Фильтр моно-солей: только удобрения с 1-3 ненулевыми элементами
        if (onlyMono) {
            const nonZeroCount = Object.values(fert.composition).filter(v => v > 0).length;
            if (nonZeroCount > 3) return; // пропускаем комплексы
        }

        fertilizers.push(fert);
    });
    return fertilizers;
}

function sortAndRebuildFertilizerSelect(options) {
    const favs = getFavoriteFerts();
    const arr = options || allFertOptions;
    const sorted = arr.slice().sort((a, b) => {
        const aFav = favs.includes(String(a.value));
        const bFav = favs.includes(String(b.value));
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return a.text.localeCompare(b.text, 'ru');
    });
    const $sel = $('#fertilizer-select');
    $sel.empty();

    // Добавляем пустой option только если НЕ в режиме multiple
    if (!$sel.attr('multiple')) {
        $sel.append('<option value="">Выберите удобрение</option>');
    }

    sorted.forEach((opt) => {
        const $option = $('<option></option>')
            .attr('value', opt.value)
            .text(opt.text);
        for (const k in opt.dataAttrs) {
            $option.attr(k, opt.dataAttrs[k]);
        }
        $sel.append($option);
    });
    $sel.val(null);
    $sel.select2('destroy');
    $sel.select2({
        templateResult: function (data) {
            if (!data.id) return data.text;
            const favs = getFavoriteFerts();
            const isFav = favs.includes(String(data.id));
            const star = isFav ? '★' : '☆';
            const color = isFav ? 'gold' : '#aaa';
            return $(
                '<span class="fert-star" data-id="' + data.id + '" style="cursor:pointer;color:' + color + ';font-size:16px;user-select:none;">' + star + '</span> <span>' + data.text.replace(/^★|^☆/, '').trim() + '</span>'
            );
        },
        templateSelection: function (data) {
            if (!data.id) return data.text;
            const favs = getFavoriteFerts();
            const isFav = favs.includes(String(data.id));
            const star = isFav ? '★' : '☆';
            return star + ' ' + data.text.replace(/^★|^☆/, '').trim();
        },
        width: '100%'
    });
}

// Сохраняем все опции один раз при загрузке
$(document).ready(() => {
    $('#fertilizer-select option').each(function () {
        const $opt = $(this);
        const value = $opt.val();
        if (value === "") return; // пропуск пустой опции
        const text = $opt.text().replace(/^★|^☆/, '').trim();
        const dataAttrs = {};
        $.each(this.attributes, function () {
            if (this.name.startsWith('data-')) {
                // data-pk => pk, data-name => name
                dataAttrs[this.name] = this.value;
            }
        });
        allFertOptions.push({
            value,
            text,
            dataAttrs
        });
    });
    // Экспортируем в window для обработчиков, использующих window.allFertOptions
    window.allFertOptions = allFertOptions;
    sortAndRebuildFertilizerSelect();
});

// Клик по звезде
$(document).on('mouseup', '.select2-results__options .fert-star', function (e) {
    const id = String($(this).data('id'));
    let favs = getFavoriteFerts();
    if (favs.includes(id)) {
        favs = favs.filter(x => x !== id);
    } else {
        favs.push(id);
    }
    setFavoriteFerts(favs);

    // --- ВАЖНО: rebuild по текущему фильтру ---
    if (window.currentFertFilter === 'favorites') {
        const onlyFavs = allFertOptions.filter(opt => getFavoriteFerts().includes(String(opt.value)));
        sortAndRebuildFertilizerSelect(onlyFavs);
    } else if (window.currentFertFilter === 'moderation') {
        const onlyModer = allFertOptions.filter(opt => opt.dataAttrs && opt.dataAttrs['data-moderated'] === "False");
        sortAndRebuildFertilizerSelect(onlyModer);
    } else {
        sortAndRebuildFertilizerSelect();
    }
    e.stopPropagation();
    e.preventDefault();
});

// Добавление в избранное по id (список через запятую/пробел, с валидацией)
$('#add-fav-btn').on('click', () => {
    const raw = ($('#add-fav-id').val() || '').trim();
    if (!raw) return;
    const inputIds = raw.split(/[\s,]+/).map(x => x.trim()).filter(Boolean);
    if (inputIds.length === 0) return;

    let favs = getFavoriteFerts();
    let existingIds = [];
    if (window.allFertOptions && Array.isArray(window.allFertOptions)) {
        existingIds = window.allFertOptions.map(opt => String(opt.value));
    } else {
        $('#fertilizer-select option').each(function () {
            const v = $(this).val();
            if (v) existingIds.push(String(v));
        });
    }
    existingIds = Array.from(new Set(existingIds));

    const toAdd = [];
    const already = [];
    const notFound = [];

    inputIds.forEach(id => {
        const sid = String(id);
        if (!existingIds.includes(sid)) {
            notFound.push(sid);
            return;
        }
        if (favs.includes(sid)) already.push(sid); else toAdd.push(sid);
    });

    if (toAdd.length) {
        favs = favs.concat(toAdd);
        setFavoriteFerts(favs);
        if (window.currentFertFilter === 'favorites') {
            const onlyFavs = window.allFertOptions ? window.allFertOptions.filter(opt => getFavoriteFerts().includes(String(opt.value))) : [];
            sortAndRebuildFertilizerSelect(onlyFavs);
        } else if (window.currentFertFilter === 'moderation') {
            const onlyModer = window.allFertOptions ? window.allFertOptions.filter(opt => opt.dataAttrs && opt.dataAttrs['data-moderated'] === 'False') : [];
            sortAndRebuildFertilizerSelect(onlyModer);
        } else {
            sortAndRebuildFertilizerSelect();
        }
    }

    const parts = [];
    if (toAdd.length) parts.push('Добавлено: ' + toAdd.join(', '));
    if (already.length) parts.push('Уже были: ' + already.join(', '));
    if (notFound.length) parts.push('Не найдены: ' + notFound.join(', '));
    alert(parts.join('\n') || 'Нечего добавлять');
});

// ============================================================================
// Solver для автоподбора рецепта
// ============================================================================

const ERROR_WEIGHTS = {
    S: 0.01, // наименее важна - используется для баланса
    // Микроэлементы - высокий приоритет
    ZN: 50, // цинк важен
    CU: 50, // медь важна
    MO: 50, // молибден важен
    MN: 20, // марганец
    FE: 20, // железо
    B: 20, // бор
    // Макро
    P: 10, // фосфор
    CA: 5, // кальций
    MG: 5, // магний
    // остальные элементы по 1 (default)
};

function logToPage(msg) {
    const logDiv = document.getElementById('debug-log');
    logDiv.textContent += msg + '\n';
}

/**
 * Двухпроходный солвер:
 * 1. Решаем с ВСЕМИ удобрениями → находим оптимальные граммы
 * 2. Оставляем топ-maxFerts по дозировке
 * 3. Пересчитываем только с оставшимися → корректные граммы для ограниченного набора
 *
 * Это устраняет ошибку старого алгоритма, который обнулял удобрения
 * без повторного решения.
 */
function _solveWithLimit(fertilizers, target, maxFerts) {
    // Шаг 1: решаем без ограничений
    const model1 = buildSolverModel(fertilizers, target);
    const results1 = solver.Solve(model1);
    logToPage(`Шаг 1: решение по всем удобрениям (${fertilizers.length})`);

    if (!maxFerts || maxFerts >= fertilizers.length) {
        return results1;
    }

    // Шаг 2: выбираем топ-N по дозировке
    const limited1 = limitResultsByMaxFerts(results1, fertilizers, maxFerts);
    const usedIds = new Set(
        fertilizers
            .filter(f => (limited1[f.id] || 0) > 1e-9)
            .map(f => f.id)
    );

    if (usedIds.size === 0) return results1;

    const fertSubset = fertilizers.filter(f => usedIds.has(f.id));
    logToPage(`Шаг 2: пересчёт с ${fertSubset.length} удобрениями`);

    // Шаг 3: пересчитываем только с выбранными
    const model2 = buildSolverModel(fertSubset, target);
    const results2 = solver.Solve(model2);

    // Объединяем (остальные = 0)
    const final = {};
    fertilizers.forEach(f => { final[f.id] = 0; });
    fertSubset.forEach(f => { final[f.id] = results2[f.id] || 0; });

    logToPage(`Шаг 3: готово`);
    return final;
}

function _getCombinations(arr, k) {
    const results = [];

    function helper(start, comb) {
        if (comb.length === k) {
            results.push(comb.slice());
            return;
        }
        for (let i = start; i < arr.length; i++) {
            comb.push(arr[i]);
            helper(i + 1, comb);
            comb.pop();
        }
    }

    helper(0, []);
    return results;
}

const _MACRO_ELEMENTS = ['NH4', 'NO3', 'NH2', 'P', 'K', 'Ca', 'Mg', 'S', 'Cl'];
const _MICRO_ELEMENTS = ['Fe', 'Zn', 'Cu', 'Mn', 'Mo', 'B', 'Co', 'Si'];

/**
 * Ограничение результатов по максимальному количеству удобрений
 * Оставляем только maxFerts удобрений с наибольшей дозировкой
 */
function limitResultsByMaxFerts(results, fertilizers, maxFerts) {
    if (!maxFerts || maxFerts <= 0) return results;

    // Собираем удобрения с их дозировками
    const fertDosages = fertilizers
        .map(f => ({ id: f.id, grams: results[f.id] || 0 }))
        .filter(f => f.grams > 1e-9)
        .sort((a, b) => b.grams - a.grams);

    // Если удобрений меньше лимита - возвращаем как есть
    if (fertDosages.length <= maxFerts) return results;

    // Оставляем только топ N
    const topFerts = new Set(fertDosages.slice(0, maxFerts).map(f => f.id));

    // Обнуляем остальные
    const limitedResults = { ...results };
    fertilizers.forEach(f => {
        if (!topFerts.has(f.id)) {
            limitedResults[f.id] = 0;
        }
    });

    return limitedResults;
}

// --- Сборка модели ---
function buildSolverModel(fertilizers, target) {
    // Нормализуем ключи target к uppercase (composition удобрений в uppercase)
    const normalizedTarget = {};
    for (const key in target) {
        normalizedTarget[key.toUpperCase()] = target[key];
    }
    target = normalizedTarget;

    const model = {
        optimize: "sumError",
        opType: "min",
        constraints: {},
        variables: {},
    };

    // Переменные — массы всех удобрений (с ограничением >= 0)
    for (const fert of fertilizers) {
        const varObj = {};
        for (const elem in fert.composition) {
            varObj[elem] = fert.composition[elem] * 10;
        }
        varObj.sumError = 0; // не влияет на целевую функцию
        // Добавляем constraint для неотрицательности
        varObj['fert_' + fert.id] = 1;
        model.variables[fert.id] = varObj;
        model.constraints['fert_' + fert.id] = {min: 0};
    }

    // Для каждого элемента добавляем две переменные-погрешности: error_plus и error_minus
    // Если есть NO3/NH4/NH2, то N избыточен (N = NO3 + NH4 + NH2)
    const hasNitrateForms = 'NO3' in target || 'NH4' in target || 'NH2' in target;
    const skipN = hasNitrateForms;

    for (const elem in target) {
        // Пропускаем N если уже есть формы азота
        if (elem === 'N' && skipN) continue;

        // Если N задан без NO3/NH4 — трактуем его как NO3
        // (удобрения содержат NH4/NO3, а не N)
        const solverElem = (elem === 'N' && !hasNitrateForms) ? 'NO3' : elem;

        const errorPlus = solverElem + "_plus";
        const errorMinus = solverElem + "_minus";

        // Используем вес для элемента, если есть, иначе 1
        const weight = ERROR_WEIGHTS[solverElem.toUpperCase()] || 1;
        model.variables[errorPlus] = {[solverElem]: 1, sumError: weight, min: 0};
        model.variables[errorMinus] = {[solverElem]: -1, sumError: weight, min: 0};
        model.constraints[solverElem] = {equal: target[elem]};
    }

    return model;
}

// --- Подсчёт результата и ошибки ---
function calculateAchievedAndError(fertilizers, results, target) {
    // Нормализуем ключи target к uppercase
    const normalizedTarget = {};
    for (const key in target) {
        normalizedTarget[key.toUpperCase()] = target[key];
    }
    target = normalizedTarget;

    // Всегда считаем NO3/NH4 для корректного отображения N
    const elemsToCompute = new Set(Object.keys(target));
    if ('N' in target && !('NO3' in target)) elemsToCompute.add('NO3');
    if ('N' in target && !('NH4' in target)) elemsToCompute.add('NH4');

    const achieved = {};
    let error = 0;
    for (const elem of elemsToCompute) {
        achieved[elem] = 0;
        for (const fert of fertilizers) {
            const grams = results[fert.id] || 0;
            // Микроэлементы требуют очень малых дозировок (0.0001г и меньше)
            // Используем порог 1e-9 вместо 0.001
            if (grams > 1e-9) {
                // composition уже в PPM/грамм (data-атрибуты содержат проценты * 10)
                achieved[elem] += grams * (fert.composition[elem] || 0);
            }
        }
        // Ошибку считаем только для элементов из target (не для вспомогательных NO3/NH4)
        if (elem in target) {
            error += Math.pow((achieved[elem] - target[elem]), 2);
        }
    }
    return {achieved, error};
}

function renderResultHtml(fertilizers, results, achieved, target, _error) {
    // Нормализуем ключи target к uppercase
    const normalizedTarget = {};
    for (const key in target) {
        normalizedTarget[key.toUpperCase()] = target[key];
    }
    target = normalizedTarget;

    // helper: format number with fixed decimals
    const fmt = (num, digits = 2) => {
        if (typeof num !== 'number' || isNaN(num)) return '—';
        // Убираем -0.00 -> 0.00
        if (Math.abs(num) < Math.pow(10, -digits)) num = 0;
        return num.toFixed(digits);
    };
    const badge = (text, cls = 'bg-secondary') => `<span class="badge ${cls} me-1">${text}</span>`;
    // collect recipe for later fill
    lastCalculatedRecipe = [];
    const recipeBadges = [];
    const favIds = getFavoriteFerts();
    for (const fert of fertilizers) {
        const grams = results[fert.id] || 0;
        // Микроэлементы имеют очень малые дозировки (0.0001г и меньше)
        if (grams > 1e-9) {
            lastCalculatedRecipe.push({id: fert.id, grams: grams, fert: fert});
            // Форматируем граммы - больше знаков для малых значений
            const gramsStr = grams < 0.001 ? grams.toExponential(2) : grams.toFixed(4);
            const isFav = favIds.includes(String(fert.id));
            const safeName = fert.name.replace(/"/g, '&quot;');
            recipeBadges.push(`
                <span class="recipe-fert-item d-inline-flex align-items-center gap-1 me-2 mb-1 border rounded px-1 py-0" style="font-size:0.82em" data-fert-id="${fert.id}">
                    <span class="text-muted">${fert.name}:</span>
                    <span class="badge bg-success">${gramsStr} г</span>
                    <button class="recipe-fav-btn btn btn-link p-0 lh-1 border-0" data-fert-id="${fert.id}" data-fert-name="${safeName}" title="${isFav ? 'Убрать из избранного' : 'Добавить в избранное'}" style="font-size:1em;color:${isFav ? '#f59e0b' : '#aaa'}">${isFav ? '★' : '☆'}</button>
                    <button class="recipe-excl-btn btn btn-link p-0 lh-1 border-0" data-fert-id="${fert.id}" data-fert-name="${safeName}" title="Исключить из расчёта" style="font-size:0.9em;color:#dc3545">✕</button>
                </span>`);
        }
    }
    const maxFerts = document.getElementById('fert-count') ? document.getElementById('fert-count').value : '';
    // build target chips
    const targetChips = Object.keys(target).map(k => badge(`${k}=${target[k]}`, 'bg-primary')).join(' ');

    // table rows for comparison
    let rows = '';
    for (const elem in target) {
        let got;
        if (elem === 'N') {
            got = (achieved['NH4'] || 0) + (achieved['NO3'] || 0);
        } else {
            got = achieved[elem] || 0;
        }
        // convert to ppm for display (как было ранее)
        got = got * 10;
        const tgt = target[elem];
        const diff = got - tgt;
        const percent = tgt !== 0 ? (100 * diff / tgt) : 0;

        // Градация цветов по отклонению:
        // <= 3%: зелёный, 3-10%: жёлтый, 10-30%: красный, >30%: бордовый
        const absPercent = Math.abs(percent);
        let cls, customStyle = '';
        if (absPercent <= 3) {
            cls = 'bg-success';
        } else if (absPercent <= 10) {
            cls = 'bg-warning text-dark';
        } else if (absPercent <= 30) {
            cls = 'bg-danger';
        } else {
            // Бордовый для экстремальных отклонений (>30%)
            cls = '';
            customStyle = 'style="background-color: maroon; color: white;"';
        }

        // Badge для разницы (с epsilon для floating point)
        let diffCls;
        if (Math.abs(diff) < 0.005) {
            diffCls = 'bg-secondary'; // практически ноль
        } else if (diff > 0) {
            diffCls = 'bg-danger'; // перебор
        } else {
            diffCls = 'bg-primary'; // недобор
        }

        // Badge для процента с кастомным стилем если нужно
        const percentBadge = customStyle
            ? `<span class="badge" ${customStyle}>${fmt(percent, 2)}%</span>`
            : badge(fmt(percent, 2) + '%', cls);

        rows += `
            <tr>
                <td class="fw-semibold">${elem}</td>
                <td>${fmt(tgt, 2)}</td>
                <td>${fmt(got, 2)}</td>
                <td>${badge(fmt(diff, 2), diffCls)}</td>
                <td>${percentBadge}</td>
            </tr>`;
    }

    // Качество подбора
    let exactCount = 0, goodCount = 0, totalElem = 0;
    for (const elem in target) {
        let got;
        if (elem === 'N') {
            got = ((achieved['NH4'] || 0) + (achieved['NO3'] || 0)) * 10;
        } else {
            got = (achieved[elem] || 0) * 10;
        }
        const tgt = target[elem];
        if (tgt === 0) continue;
        totalElem++;
        const pct = Math.abs((got - tgt) / tgt * 100);
        if (pct <= 3) exactCount++;
        if (pct <= 10) goodCount++;
    }
    const qualityColor = exactCount === totalElem ? 'bg-success' : goodCount === totalElem ? 'bg-warning text-dark' : 'bg-danger';
    const qualityBadge = `<span class="badge ${qualityColor}" title="Элементов в норме (±3% / ±10%)">${exactCount}/${totalElem} точных, ${goodCount}/${totalElem} приемлемых</span>`;
    const usedFertCount = lastCalculatedRecipe.length;

    // Compose card
    return `
        <div class="card shadow-sm">
            <div class="card-header d-flex flex-wrap align-items-center gap-2">
                <span class="fw-bold">Сравнение</span>
                ${qualityBadge}
                <span class="ms-auto small text-muted">Удобрений в рецепте:</span>
                ${badge(usedFertCount + ' / ' + maxFerts, 'bg-secondary')}
                <span class="vr mx-2 d-none d-sm-inline"></span>
                <span class="small text-muted">Искомый профиль:</span>
                <div class="d-inline-flex flex-wrap gap-1">${targetChips}</div>
            </div>
            <div class="card-body">
                <div class="table-responsive mb-3">
                    <table class="table table-sm table-bordered align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Элемент</th>
                                <th>Целевое</th>
                                <th>Получено</th>
                                <th>Разница</th>
                                <th>Отклонение</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
                <div>
                    <div class="fw-semibold small mb-2">Рецепт</div>
                    <div class="d-flex flex-wrap">${recipeBadges.join('')}</div>
                </div>
            </div>
        </div>`;
}

// Проверяет, выбран ли режим ввода в ммоль
function isInputUnitMmol() {
    const mmolRadio = document.getElementById('input-unit-mmol');
    return mmolRadio && mmolRadio.checked;
}

function parseTargetString(str) {
    const target = {};
    const isMmol = isInputUnitMmol();

    str.split(/\s+/).forEach(pair => {
        const [key, val] = pair.split('=');
        if (key && val) {
            // Приводим ключ к uppercase для регистронезависимости
            const upperKey = key.trim().toUpperCase();
            let value = parseFloat(val.replace(',', '.'));

            // Если ввод в ммоль - конвертируем в ppm (умножаем на молярную массу)
            if (isMmol && value > 0 && typeof MOLARS !== 'undefined') {
                const molarMass = MOLARS[upperKey];
                if (molarMass) {
                    value = value * molarMass;
                }
            }

            target[upperKey] = value;
        }
    });
    return target;
}

// ============================================================================
// Тоггл матрицы (мини/полный)
// ============================================================================
(function () {
    function applyMatrixMode(mode) {
        var mini = mode === 'mini';
        var matrix = document.getElementById('element-matrix');
        var miniBlock = document.getElementById('mini-matrix-inline');
        var toggle = document.getElementById('matrix-mode-toggle');
        if (matrix && miniBlock && toggle) {
            if (mini) {
                matrix.classList.add('d-none');
                miniBlock.classList.remove('d-none');
                toggle.textContent = 'Режим: мини';
                toggle.setAttribute('title', 'Показать полную матрицу');
            } else {
                matrix.classList.remove('d-none');
                miniBlock.classList.add('d-none');
                toggle.textContent = 'Режим: полный';
                toggle.setAttribute('title', 'Показать мини-матрицу (K:N, K:Ca, K:Mg)');
            }
            try {
                if (window.bootstrap && bootstrap.Tooltip) {
                    var tip = bootstrap.Tooltip.getInstance(toggle);
                    if (tip) {
                        tip.dispose();
                    }
                    new bootstrap.Tooltip(toggle);
                }
            } catch (_e) {
            }
        }
    }

    window.applyMatrixMode = applyMatrixMode;
    document.addEventListener('DOMContentLoaded', () => {
        var KEY = 'matrixMode';
        var stored = localStorage.getItem(KEY);
        // По умолчанию теперь режим мини, если состояние не сохранено
        applyMatrixMode(stored === 'full' ? 'full' : 'mini');
        var t = document.getElementById('matrix-mode-toggle');
        if (t) {
            t.addEventListener('click', () => {
                var curr = (localStorage.getItem(KEY) === 'mini') ? 'mini' : 'full';
                var next = curr === 'mini' ? 'full' : 'mini';
                localStorage.setItem(KEY, next);
                applyMatrixMode(next);
            });
        }
    });
})();

// ============================================================================
// Обработчики событий и инициализация
// ============================================================================
$(() => {
    const $tf = $('#toggle-favorites');
    if ($tf.length) {
        $tf.on('click', function () {
            if (typeof sortAndRebuildFertilizerSelect !== 'function') return;
            if (typeof getFavoriteFerts !== 'function') return;
            if (window.currentFertFilter !== 'favorites') {
                window.currentFertFilter = 'favorites';
                const favs = getFavoriteFerts();
                const onlyFavs = window.allFertOptions ? window.allFertOptions.filter(opt => favs.includes(String(opt.value))) : [];
                sortAndRebuildFertilizerSelect(onlyFavs);
                $(this).find('i').removeClass('bi-star').addClass('bi-star-fill');
                $(this).attr('title', 'Показать все').attr('aria-label', 'Показать все');

                // Фильтруем строки таблицы - показываем только избранные
                $('.fert tbody tr:not(#sum-row):not(#comp-row)').each(function() {
                    const fertId = $(this).find('.fertilizer-name').data('pk');
                    if (favs.includes(String(fertId))) {
                        $(this).show();
                    } else {
                        $(this).hide();
                    }
                });
            } else {
                window.currentFertFilter = 'all';
                sortAndRebuildFertilizerSelect();
                $(this).find('i').removeClass('bi-star-fill').addClass('bi-star');
                $(this).attr('title', 'Показать только избранные').attr('aria-label', 'Показать только избранные');

                // Показываем все строки таблицы
                $('.fert tbody tr:not(#sum-row):not(#comp-row)').show();
            }
        });
    }

    // Переключатель ммоль только для макро
    $('#macro_mmol_toggle').on('click', function () {
        if (typeof recalculateSums !== 'function') return;
        if (typeof macroMolOnly === 'undefined') return;
        macroMolOnly = !macroMolOnly;
        $(this).text('ммоль макро: ' + (macroMolOnly ? 'вкл' : 'выкл'));
        recalculateSums();
    });

    // Инициализация тултипов Bootstrap (если доступен bootstrap)
    try {
        if (window.bootstrap && bootstrap.Tooltip) {
            document.querySelectorAll('[data-bs-toggle="tooltip"], [role="button"][title]').forEach((el) => {
                new bootstrap.Tooltip(el);
            });
        }
    } catch (_e) {
    }

    // Тоггл текста на кнопках (по умолчанию текст показан)
    (function () {
        const KEY = 'btnTextVisible';
        const $toggle = $('#toggle-btn-text');

        function apply(show) {
            document.body.classList.toggle('btn-text-hidden', !show);
            if ($toggle.length) {
                $toggle.toggleClass('active', !show);
                const title = show ? 'Скрыть текст на кнопках' : 'Показать текст на кнопках';
                $toggle.attr('title', title).attr('aria-label', title);
                try {
                    if (window.bootstrap && bootstrap.Tooltip) {
                        const tip = bootstrap.Tooltip.getInstance($toggle[0]);
                        if (tip) {
                            tip.dispose();
                        }
                        new bootstrap.Tooltip($toggle[0]);
                    }
                } catch (_e) {
                }
            }
        }

        const stored = localStorage.getItem(KEY);
        let show = (stored === null) ? true : (stored === '1');
        apply(show);
        $toggle.on('click', () => {
            show = !document.body.classList.contains('btn-text-hidden');
            const next = !show; // инвертируем
            localStorage.setItem(KEY, next ? '1' : '0');
            apply(next);
        });
    })();

    // Иконки в верхней панели: пробрасываем клики на существующие кнопки ниже по странице
    const byId = (id) => document.getElementById(id);
    const safeClick = (id) => {
        const el = byId(id);
        if (el) el.click();
    };
    const iconMap = [
        {icon: 'auto-solve-icon', target: 'auto-solve-btn'},
        {icon: 'clear-recipe-icon', target: 'clear-recipe-btn'},
        {icon: 'fill-recipe-icon', target: 'fill-recipe-btn'}
    ];
    iconMap.forEach(m => {
        const btn = byId(m.icon);
        if (btn) {
            btn.addEventListener('click', () => {
                safeClick(m.target);
            });
        }
    });
});
