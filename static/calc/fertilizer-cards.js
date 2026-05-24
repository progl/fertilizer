/**
 * Интерфейс удобрений - 3 режима: таблица, вертикальная таблица, карточки
 * Версия: 2.3.0 (добавлен вертикальный режим)
 */

(function () {
    'use strict';

    // Хелпер для i18n (использует глобальную функцию если доступна)
    const _t = (key, fallback) => (typeof window.t === 'function') ? window.t(key) : fallback;

    // Глобальные переменные
    let currentMode = 'table'; // 'table' или 'vertical'
    const VIEW_MODES = ['table', 'vertical']; // Порядок переключения
    let debounceTimer = null; // Таймер для debounce
    let _dndDraggedRow = null; // Модульный state для drag-and-drop
    let _dndBound = false;     // Флаг — делегирование уже навешано на tbody

    /**
     * Инициализация
     */
    function init() {
        console.log('[FERT-VIEW] Инициализация v2.5.0');

        // Определяем режим по умолчанию
        const savedMode = localStorage.getItem('fert-view-mode');
        const isMobile = window.innerWidth <= 768;
        const isTWA = window.__TWA_MODE__ === true;

        // TWA режим: по умолчанию vertical (если нет сохраненного)
        if (isTWA && !savedMode) {
            currentMode = 'vertical';
        } else {
            currentMode = savedMode || 'table';
        }

        // Валидация сохраненного режима
        if (!VIEW_MODES.includes(currentMode)) {
            currentMode = 'table';
        }

        setViewMode(currentMode);
        bindModeToggle();

        // Рендерим нужный вид
        if (currentMode === 'vertical') {
            renderVerticalTable();
        }

        // Слушаем изменения в таблице
        observeTableChanges();

        // Drag & Drop для горизонтальной таблицы
        bindTableRowDragDrop();
    }

    /**
     * Установка режима просмотра
     */
    function setViewMode(mode) {
        console.log('[FERT-VIEW] setViewMode:', mode);
        currentMode = mode;
        localStorage.setItem('fert-view-mode', mode);

        const body = document.body;
        // Удаляем ВСЕ классы режимов (включая старые)
        body.classList.remove('mode-table', 'mode-vertical', 'mode-cards',
                              'view-mode-table', 'view-mode-cards', 'view-mode-vertical');
        body.classList.add(`mode-${mode}`);
        console.log('[FERT-VIEW] body classes:', body.className);

        // Обновляем кнопку
        updateToggleButton(mode);

        // Рендерим нужный вид
        if (mode === 'vertical') {
            renderVerticalTable();
        }
    }

    /**
     * Привязка переключателя режимов
     */
    function bindModeToggle() {
        const toggleBtn = document.getElementById('view-mode-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                // Циклическое переключение: table → vertical → table
                const currentIndex = VIEW_MODES.indexOf(currentMode);
                const nextIndex = (currentIndex + 1) % VIEW_MODES.length;
                const newMode = VIEW_MODES[nextIndex];
                setViewMode(newMode);
            });
        }
    }

    /**
     * Обновление текста и иконки на кнопке переключателя
     * Показывает СЛЕДУЮЩИЙ режим (куда переключится при клике)
     */
    function updateToggleButton(currentModeVal) {
        const toggleBtn = document.getElementById('view-mode-toggle-btn');
        if (!toggleBtn) return;

        const icon = toggleBtn.querySelector('i');

        // Определяем следующий режим (для иконки)
        const currentIndex = VIEW_MODES.indexOf(currentModeVal);
        const nextIndex = (currentIndex + 1) % VIEW_MODES.length;
        const nextMode = VIEW_MODES[nextIndex];

        const modeIcons = {
            table: 'bi bi-table',
            vertical: 'bi bi-arrows-vertical'
        };

        // Меняем только иконку, текст всегда "Вид"
        if (icon) icon.className = modeIcons[nextMode] || modeIcons.table;
    }

    /**
     * Наблюдение за изменениями в таблице
     */
    function observeTableChanges() {
        // Наблюдаем за tbody таблицы
        const tbody = document.querySelector('.fert tbody');
        if (!tbody) return;

        const observer = new MutationObserver(() => {
            // Debounce: отменяем предыдущий таймер
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }

            if (currentMode === 'vertical') {
                // Обновляем вертикальную таблицу
                debounceTimer = setTimeout(() => {
                    renderVerticalTable();
                    debounceTimer = null;
                }, 100);
            } else {
                // Горизонтальная таблица — добавляем ручки к новым строкам
                debounceTimer = setTimeout(() => {
                    const tbody2 = document.querySelector('table.fert tbody');
                    if (tbody2) {
                        tbody2.querySelectorAll('tr').forEach(row => {
                            if (row.id === 'sum-row' || !row.querySelector('.fertilizer-name')) return;
                            _dndEnsureHandle(row);
                        });
                    }
                    debounceTimer = null;
                }, 150);
            }
        });

        observer.observe(tbody, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    /**
     * Рендеринг вертикальной таблицы (элементы - строки, удобрения - колонки)
     */
    function renderVerticalTable() {
        const container = document.getElementById('fertilizer-vertical-container');
        if (!container) {
            console.warn('[FERT-VIEW] Контейнер vertical не найден');
            return;
        }

        const fertRows = getFertilizerRows();

        if (fertRows.length === 0) {
            container.innerHTML = `
                <div class="fertilizer-vertical-empty">
                    <div class="text-muted text-center py-4">${_t('fert_no_fertilizers', 'Нет удобрений в рецепте')}</div>
                </div>
            `;
            return;
        }

        // Собираем данные удобрений
        const fertilizers = fertRows.map(row => {
            const fertNameCell = row.querySelector('.fertilizer-name');
            const pk = fertNameCell?.dataset.pk || '';
            const name = row.querySelector('.f-name')?.textContent.trim() || _t('fert_fertilizer', 'Удобрение');
            const gramsInput = row.querySelector('.grams-input');
            const grams = gramsInput ? (parseFloat(gramsInput.value) || 0) : 0;

            // Извлекаем все элементы
            const elements = {};
            const elemList = ['nh4', 'no3', 'p', 'k', 'ca', 'mg', 's', 'cl', 'fe', 'mn', 'b', 'zn', 'cu', 'mo', 'co', 'si'];
            elemList.forEach(elem => {
                const cell = row.querySelector(`.element.${elem}`);
                if (cell) {
                    const val = parseFloat(cell.textContent) || 0;
                    if (val > 0) elements[elem] = val;
                }
            });

            // Проверяем избранное (класс btn-warning означает что в избранном)
            const isFavorite = row.querySelector('.fav-star-btn.btn-warning') !== null;

            // Проверяем включено/выключено (из горизонтальной таблицы)
            const isDisabled = row.classList.contains('fert-row-disabled');

            // Вычисляем NPK
            const n = (elements.nh4 || 0) + (elements.no3 || 0);
            const p = elements.p || 0;
            const k = elements.k || 0;
            const npk = `${n.toFixed(1)}—${p.toFixed(1)}—${k.toFixed(1)}`;

            return { pk, name, grams, elements, isFavorite, isDisabled, npk, _row: row };
        });

        // Собираем все уникальные элементы
        const allElements = new Set();
        fertilizers.forEach(f => {
            Object.keys(f.elements).forEach(e => allElements.add(e));
        });

        // Порядок элементов
        const elemOrder = ['nh4', 'no3', 'p', 'k', 'ca', 'mg', 's', 'cl', 'fe', 'mn', 'b', 'zn', 'cu', 'mo', 'co', 'si'];
        const sortedElements = elemOrder.filter(e => allElements.has(e));

        // Получаем итоговые суммы
        const sums = getCurrentSums();

        // Генерируем HTML
        const isCompact = localStorage.getItem('fert-vertical-compact') === 'true';
        const compactClass = isCompact ? 'fert-v-compact' : '';

        // Обновляем иконку кнопки в тулбаре
        const toolbarToggle = document.getElementById('fert-v-width-toggle-toolbar');
        if (toolbarToggle) {
            const icon = toolbarToggle.querySelector('i');
            if (icon) {
                icon.className = isCompact ? 'bi bi-arrows-expand' : 'bi bi-arrows-collapse';
            }
        }

        // Проверяем сохранённое состояние sticky для каждой колонки отдельно
        // По умолчанию обе закреплены (если нет записи или 'true')
        const sticky1Val = localStorage.getItem('fert-v-sticky-1');
        const sticky2Val = localStorage.getItem('fert-v-sticky-2');
        const sticky1 = sticky1Val === null || sticky1Val === 'true';
        const sticky2 = sticky2Val === null || sticky2Val === 'true';
        const stickyClass1 = sticky1 ? 'sticky-col-1' : '';
        const stickyClass2 = sticky2 ? 'sticky-col-2' : '';
        const lockIcon1 = sticky1 ? 'bi-lock-fill' : 'bi-unlock';
        const lockIcon2 = sticky2 ? 'bi-lock-fill' : 'bi-unlock';
        const lockClass1 = sticky1 ? 'locked' : '';
        const lockClass2 = sticky2 ? 'locked' : '';

        let html = `<table class="table table-sm table-bordered fert-vertical-table ${compactClass} ${stickyClass1} ${stickyClass2}">`;

        // Заголовок: Элемент | ИТОГО | Удобрение1 | Удобрение2 | ...
        html += '<thead><tr>';
        html += `<th class="fert-v-element-header">Эл. <i class="bi ${lockIcon1} fert-sticky-toggle-1 ${lockClass1}" title="Закрепить колонку"></i></th>`;
        html += `<th class="fert-v-total-header">ИТОГО <i class="bi ${lockIcon2} fert-sticky-toggle-2 ${lockClass2}" title="Закрепить колонку"></i></th>`;

        // Восстанавливаем сохраненные ширины колонок
        const savedWidths = JSON.parse(localStorage.getItem('fert-v-col-widths') || '{}');

        fertilizers.forEach((f, idx) => {
            const favClass = f.isFavorite ? 'text-warning' : 'text-muted';
            const favIcon = f.isFavorite ? 'bi-star-fill' : 'bi-star';
            const savedWidth = savedWidths[f.pk];
            const widthStyle = savedWidth ? ` style="width: ${savedWidth}px"` : '';
            const disabledClass = f.isDisabled ? ' fert-v-col-disabled' : '';
            html += `<th class="fert-v-fert-header${disabledClass}" title="${f.name}" draggable="true" data-fert-idx="${idx}" data-pk="${f.pk}"${widthStyle}>
                <div class="fert-v-header-row">
                    <span class="fert-v-drag-handle">⋮⋮</span>
                    <div class="fert-v-actions">
                        <label class="fert-v-toggle-label m-0" title="${f.isDisabled ? 'Включить в расчёт' : 'Выключить из расчёта'}">
                            <input type="checkbox" class="fert-v-include-cb" data-pk="${f.pk}"${f.isDisabled ? '' : ' checked'} style="cursor:pointer">
                        </label>
                        <button type="button" class="btn btn-link btn-sm fert-v-fav-btn ${favClass}" data-pk="${f.pk}" title="Избранное">
                            <i class="bi ${favIcon}"></i>
                        </button>
                        <button type="button" class="btn btn-link btn-sm fert-v-delete-btn" data-pk="${f.pk}" title="Удалить">
                            <i class="bi bi-x-lg text-danger"></i>
                        </button>
                    </div>
                </div>
                <div class="fert-v-name">${f.name}</div>
                <div class="fert-v-npk">NPK: ${f.npk}</div>
                <div class="fert-v-grams">
                    <input type="text" inputmode="decimal" class="form-control form-control-sm fert-v-grams-input"
                           data-pk="${f.pk}" value="${f.grams.toFixed(2)}">
                </div>
            </th>`;
        });
        html += '</tr></thead>';

        // Строки элементов
        html += '<tbody>';

        // Макро элементы
        const macroElems = ['nh4', 'no3', 'p', 'k', 'ca', 'mg', 's', 'cl'].filter(e => sortedElements.includes(e));
        const microElems = ['fe', 'mn', 'b', 'zn', 'cu', 'mo', 'co', 'si'].filter(e => sortedElements.includes(e));

        // Разделитель макро
        if (macroElems.length > 0) {
            macroElems.forEach(elem => {
                html += renderVerticalRow(elem, fertilizers, sums, false);
            });
        }

        // Разделитель микро
        if (microElems.length > 0) {
            html += '<tr class="fert-v-separator"><td colspan="' + (fertilizers.length + 2) + '"><small class="text-muted">' + _t('fert_microelements', 'Микроэлементы') + '</small></td></tr>';
            microElems.forEach(elem => {
                html += renderVerticalRow(elem, fertilizers, sums, true);
            });
        }

        html += '</tbody></table>';

        container.innerHTML = html;

        // Привязываем события к input'ам
        bindVerticalEvents(container);
    }

    /**
     * Рендеринг одной строки вертикальной таблицы
     */
    function renderVerticalRow(elem, fertilizers, sums, isMicro) {
        const elemNames = {
            'nh4': 'NH₄', 'no3': 'NO₃', 'p': 'P', 'k': 'K', 'ca': 'Ca', 'mg': 'Mg', 's': 'S', 'cl': 'Cl',
            'fe': 'Fe', 'mn': 'Mn', 'b': 'B', 'zn': 'Zn', 'cu': 'Cu', 'mo': 'Mo', 'co': 'Co', 'si': 'Si'
        };

        const total = sums[elem.toUpperCase()] || 0;

        let html = `<tr class="fert-v-row ${isMicro ? 'fert-v-micro' : 'fert-v-macro'}">`;
        html += `<td class="fert-v-element-name">${elemNames[elem] || elem}</td>`;

        // Итого - сразу после элемента (с data-element для подсветки)
        const totalDisplay = isMicro ? total.toFixed(3) : total.toFixed(1);
        html += `<td class="fert-v-total" data-element="${elem}">${totalDisplay}</td>`;

        // Значения по удобрениям
        fertilizers.forEach(f => {
            const val = f.elements[elem] || 0;
            if (val > 0) {
                const display = isMicro ? val.toFixed(3) : val.toFixed(1);
                html += `<td class="fert-v-value">${display}</td>`;
            } else {
                html += '<td class="fert-v-empty">-</td>';
            }
        });

        html += '</tr>';

        return html;
    }

    /**
     * Сокращение названия
     */
    function truncateName(name, maxLen) {
        if (name.length <= maxLen) return name;
        return name.substring(0, maxLen - 1) + '…';
    }

    /**
     * Привязка событий для вертикальной таблицы
     */
    function bindVerticalEvents(container) {
        // Обработчики ввода граммов
        container.querySelectorAll('.fert-v-grams-input').forEach(input => {
            input.addEventListener('change', function() {
                const pk = this.dataset.pk;
                const newValue = parseFloat(this.value) || 0;

                // Находим соответствующий input в основной таблице
                const tableInput = document.querySelector(`.fert tbody tr .fertilizer-name[data-pk="${pk}"]`)
                    ?.closest('tr')?.querySelector('.grams-input');

                if (tableInput) {
                    tableInput.value = newValue.toFixed(4);
                    tableInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });

        // Обработчики чекбоксов вкл/выкл в вертикальном виде
        container.querySelectorAll('.fert-v-include-cb').forEach(cb => {
            cb.addEventListener('change', function(e) {
                e.stopPropagation();
                const pk = this.dataset.pk;
                const tableRow = document.querySelector(`.fert tbody tr .fertilizer-name[data-pk="${pk}"]`)?.closest('tr');
                if (tableRow) {
                    const tableCb = tableRow.querySelector('.fert-include-cb');
                    if (tableCb) {
                        tableCb.checked = this.checked;
                        tableCb.dispatchEvent(new Event('change'));
                    } else {
                        tableRow.classList.toggle('fert-row-disabled', !this.checked);
                        if (typeof recalculateSums === 'function') recalculateSums();
                    }
                }
                setTimeout(() => renderVerticalTable(), 100);
            });
        });

        // Обработчики кнопок удаления
        container.querySelectorAll('.fert-v-delete-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const pk = this.dataset.pk;

                // Находим кнопку удаления в основной таблице и кликаем по ней
                const tableDeleteBtn = document.querySelector(`.fert tbody tr .fertilizer-name[data-pk="${pk}"]`)
                    ?.closest('tr')?.querySelector('.delete-button');

                if (tableDeleteBtn) {
                    tableDeleteBtn.click();
                    // Перерисовываем через небольшую задержку
                    setTimeout(() => renderVerticalTable(), 100);
                }
            });
        });

        // Обработчики кнопок избранного
        container.querySelectorAll('.fert-v-fav-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const pk = this.dataset.pk;

                // Находим кнопку избранного в основной таблице и кликаем по ней
                const tableFavBtn = document.querySelector(`.fert tbody tr .fertilizer-name[data-pk="${pk}"]`)
                    ?.closest('tr')?.querySelector('.fav-star-btn');

                if (tableFavBtn) {
                    tableFavBtn.click();
                    // Перерисовываем через небольшую задержку
                    setTimeout(() => renderVerticalTable(), 300);
                }
            });
        });

        // Кнопка переключения ширины - теперь в тулбаре
        const widthToggle = document.getElementById('fert-v-width-toggle-toolbar');
        if (widthToggle && !widthToggle.dataset.bound) {
            widthToggle.dataset.bound = 'true';
            widthToggle.addEventListener('click', function() {
                const table = container.querySelector('.fert-vertical-table');
                if (table) {
                    const isCompact = table.classList.toggle('fert-v-compact');
                    localStorage.setItem('fert-vertical-compact', isCompact);
                    const icon = this.querySelector('i');
                    icon.className = isCompact ? 'bi bi-arrows-expand' : 'bi bi-arrows-collapse';
                }
            });
        }

        // Кнопки закрепления колонок (замочки) - раздельно для каждой колонки
        const stickyToggle1 = container.querySelector('.fert-sticky-toggle-1');
        const stickyToggle2 = container.querySelector('.fert-sticky-toggle-2');

        if (stickyToggle1) {
            stickyToggle1.addEventListener('click', function(e) {
                e.stopPropagation();
                const table = container.querySelector('.fert-vertical-table');
                if (table) {
                    const isSticky = table.classList.toggle('sticky-col-1');
                    localStorage.setItem('fert-v-sticky-1', isSticky ? 'true' : 'false');
                    this.classList.toggle('locked', isSticky);
                    this.classList.toggle('bi-lock-fill', isSticky);
                    this.classList.toggle('bi-unlock', !isSticky);
                }
            });
        }

        if (stickyToggle2) {
            stickyToggle2.addEventListener('click', function(e) {
                e.stopPropagation();
                const table = container.querySelector('.fert-vertical-table');
                if (table) {
                    const isSticky = table.classList.toggle('sticky-col-2');
                    localStorage.setItem('fert-v-sticky-2', isSticky ? 'true' : 'false');
                    this.classList.toggle('locked', isSticky);
                    this.classList.toggle('bi-lock-fill', isSticky);
                    this.classList.toggle('bi-unlock', !isSticky);
                }
            });
        }

        // Drag & Drop для колонок - живое перемещение
        let draggedTh = null;

        container.querySelectorAll('.fert-v-fert-header[draggable="true"]').forEach(th => {
            th.addEventListener('dragstart', function(e) {
                draggedTh = this;
                this.classList.add('fert-v-dragging');
                e.dataTransfer.effectAllowed = 'move';
                // Нужно для Firefox
                e.dataTransfer.setData('text/plain', '');
            });

            th.addEventListener('dragend', function() {
                this.classList.remove('fert-v-dragging');
                draggedTh = null;
                // Синхронизируем с основной таблицей
                syncMainTableOrder();
            });

            th.addEventListener('dragover', function(e) {
                e.preventDefault();
                if (!draggedTh || this === draggedTh) return;

                const headerRow = this.parentNode;
                const allHeaders = Array.from(headerRow.querySelectorAll('.fert-v-fert-header'));
                const draggedIndex = allHeaders.indexOf(draggedTh);
                const targetIndex = allHeaders.indexOf(this);

                if (draggedIndex < targetIndex) {
                    this.after(draggedTh);
                } else {
                    this.before(draggedTh);
                }

                // Перемещаем соответствующие ячейки в tbody
                moveTableColumns(draggedIndex, targetIndex);
            });
        });

        // ResizeObserver для сохранения ширин колонок при ручном изменении
        if (typeof ResizeObserver !== 'undefined') {
            const resizeObserver = new ResizeObserver(entries => {
                const widths = JSON.parse(localStorage.getItem('fert-v-col-widths') || '{}');
                let changed = false;
                entries.forEach(entry => {
                    const th = entry.target;
                    const pk = th.dataset.pk;
                    if (pk) {
                        const newWidth = Math.round(entry.contentRect.width);
                        if (widths[pk] !== newWidth) {
                            widths[pk] = newWidth;
                            changed = true;
                        }
                    }
                });
                if (changed) {
                    localStorage.setItem('fert-v-col-widths', JSON.stringify(widths));
                }
            });

            container.querySelectorAll('.fert-v-fert-header[data-pk]').forEach(th => {
                resizeObserver.observe(th);
            });
        }
    }

    /**
     * Перемещает ячейки колонок в tbody при drag
     */
    function moveTableColumns(fromIdx, toIdx) {
        const table = document.querySelector('.fert-vertical-table');
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr:not(.fert-v-separator)');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            // +1 потому что первая ячейка - название элемента
            const fromCell = cells[fromIdx + 1];
            const toCell = cells[toIdx + 1];

            if (fromCell && toCell) {
                if (fromIdx < toIdx) {
                    toCell.after(fromCell);
                } else {
                    toCell.before(fromCell);
                }
            }
        });
    }

    /**
     * Синхронизирует порядок строк в основной таблице после drag & drop
     */
    function syncMainTableOrder() {
        const verticalHeaders = document.querySelectorAll('.fert-v-fert-header[data-pk]');
        const mainTbody = document.querySelector('table.fert tbody');
        if (!mainTbody || verticalHeaders.length === 0) return;

        // Получаем порядок pk из вертикальной таблицы
        const newOrder = Array.from(verticalHeaders).map(th => th.dataset.pk);

        // Сортируем строки основной таблицы
        const rows = Array.from(mainTbody.querySelectorAll('tr'));
        const rowMap = {};
        rows.forEach(row => {
            const pk = row.querySelector('.fertilizer-name')?.dataset.pk;
            if (pk) rowMap[pk] = row;
        });

        // Перестраиваем tbody
        newOrder.forEach(pk => {
            if (rowMap[pk]) {
                mainTbody.appendChild(rowMap[pk]);
            }
        });
    }

    /**
     * Drag & Drop для строк горизонтальной таблицы.
     * draggable=true ставится ТОЛЬКО на span.table-drag-handle — это обходит
     * конфликт с input/checkbox/ссылками внутри строки.
     * Обработчики через event delegation на tbody (один раз, флаг _dndBound).
     */
    function bindTableRowDragDrop() {
        const tbody = document.querySelector('table.fert tbody');
        if (!tbody) return;

        // Добавляем ручки к уже существующим строкам
        tbody.querySelectorAll('tr').forEach(row => {
            if (row.id === 'sum-row' || !row.querySelector('.fertilizer-name')) return;
            _dndEnsureHandle(row);
        });

        // Делегирование вешаем только один раз
        if (_dndBound) return;
        _dndBound = true;

        // dragstart срабатывает только на ручке
        tbody.addEventListener('dragstart', function(e) {
            if (!e.target.classList.contains('table-drag-handle')) return;
            const row = e.target.closest('tr');
            if (!row || row.id === 'sum-row') return;
            _dndDraggedRow = row;
            row.classList.add('dragging-row');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', row.dataset.pk || '');
        });

        tbody.addEventListener('dragend', function() {
            if (_dndDraggedRow) {
                _dndDraggedRow.classList.remove('dragging-row');
                _dndDraggedRow = null;
            }
            tbody.querySelectorAll('tr').forEach(r => r.classList.remove('drag-over-row'));
            if (currentMode === 'vertical') renderVerticalTable();
            if (typeof updateURL === 'function') updateURL();
        });

        tbody.addEventListener('dragover', function(e) {
            if (!_dndDraggedRow) return;
            e.preventDefault();
            const row = e.target.closest('tr');
            if (!row || row === _dndDraggedRow || row.id === 'sum-row') return;
            e.dataTransfer.dropEffect = 'move';

            // Определяем позицию по Y: верхняя/нижняя половина строки
            const rect = row.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (e.clientY < midY) {
                row.before(_dndDraggedRow);
            } else {
                row.after(_dndDraggedRow);
            }
        });

        tbody.addEventListener('dragenter', function(e) {
            if (!_dndDraggedRow) return;
            e.preventDefault();
            const row = e.target.closest('tr');
            if (row && row !== _dndDraggedRow && row.id !== 'sum-row') {
                tbody.querySelectorAll('tr').forEach(r => r.classList.remove('drag-over-row'));
                row.classList.add('drag-over-row');
            }
        });

        tbody.addEventListener('dragleave', function(e) {
            if (!tbody.contains(e.relatedTarget)) {
                tbody.querySelectorAll('tr').forEach(r => r.classList.remove('drag-over-row'));
            }
        });
    }

    /**
     * Добавляет span.table-drag-handle с draggable=true к строке, если его ещё нет.
     * draggable НЕ ставится на <tr> — это ломает чекбоксы и ссылки.
     */
    function _dndEnsureHandle(row) {
        const firstCell = row.querySelector('td:first-child');
        if (firstCell && !firstCell.querySelector('.table-drag-handle')) {
            const handle = document.createElement('span');
            handle.className = 'table-drag-handle';
            handle.setAttribute('draggable', 'true');
            handle.innerHTML = '⠿';
            handle.title = 'Перетащить';
            firstCell.insertBefore(handle, firstCell.firstChild);
        }
    }

    /**
     * Получение текущих итоговых сумм из sum-row таблицы (ppm/г)
     * Возвращает объект с ключами в ВЕРХНЕМ регистре: { NH4, NO3, P, K, CA, ... }
     */
    function getCurrentSums() {
        const ids = ['nh4', 'no3', 'nh2', 'p', 'k', 'ca', 'mg', 's', 'cl', 'fe', 'zn', 'cu', 'mn', 'mo', 'b', 'co', 'si'];
        const result = {};
        ids.forEach(id => {
            const el = document.getElementById('sum-' + id);
            const val = el ? parseFloat(el.textContent) : 0;
            result[id.toUpperCase()] = isNaN(val) ? 0 : val;
        });
        return result;
    }

    /**
     * Получение строк удобрений из таблицы
     */
    function getFertilizerRows() {
        return Array.from(document.querySelectorAll('.fert tbody tr')).filter(tr => {
            return tr.querySelector('.fertilizer-name') !== null;
        });
    }

    // Инициализация при загрузке
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ==========================================
    // Zoom слайдер для всех режимов (таблица, вертикальная, карточки)
    // ==========================================
    let zoomSliderInitialized = false;

    function initZoomSlider() {
        const slider = document.getElementById('fert-zoom-slider');
        const valueDisplay = document.getElementById('fert-zoom-value');
        const decreaseBtn = document.getElementById('fert-zoom-decrease');
        const increaseBtn = document.getElementById('fert-zoom-increase');

        if (!slider) return;

        // Не добавлять обработчики повторно
        if (zoomSliderInitialized) {
            // Но применить zoom к текущему режиму
            applyZoomToCurrentMode(slider.value);
            return;
        }
        zoomSliderInitialized = true;

        // Загрузить сохранённое значение
        const savedZoom = localStorage.getItem('fert-view-zoom') || '100';
        slider.value = savedZoom;
        applyZoomToCurrentMode(savedZoom);

        slider.addEventListener('input', function() {
            applyZoomToCurrentMode(this.value);
        });

        slider.addEventListener('change', function() {
            localStorage.setItem('fert-view-zoom', this.value);
        });

        // Кнопки +/-
        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                const step = parseInt(slider.step) || 5;
                const min = parseInt(slider.min) || 60;
                const newVal = Math.max(min, parseInt(slider.value) - step);
                slider.value = newVal;
                applyZoomToCurrentMode(newVal);
                localStorage.setItem('fert-view-zoom', newVal);
            });
        }

        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => {
                const step = parseInt(slider.step) || 5;
                const max = parseInt(slider.max) || 140;
                const newVal = Math.min(max, parseInt(slider.value) + step);
                slider.value = newVal;
                applyZoomToCurrentMode(newVal);
                localStorage.setItem('fert-view-zoom', newVal);
            });
        }
    }

    function applyZoomToCurrentMode(value) {
        const zoomValue = value / 100;
        const valueDisplay = document.getElementById('fert-zoom-value');

        const verticalContainer = document.getElementById('fertilizer-vertical-container');
        const tableContainer = document.querySelector('.fert-table-view .table-responsive');
        const tableView = document.querySelector('.fert-table-view');

        [verticalContainer, tableContainer].forEach(el => {
            if (el) { el.style.zoom = ''; el.style.transform = ''; el.style.width = ''; }
        });
        if (tableView) tableView.style.height = '';

        let activeContainer = null;
        if (currentMode === 'vertical' && verticalContainer) {
            activeContainer = verticalContainer;
        } else if (currentMode === 'table' && tableContainer) {
            activeContainer = tableContainer;
        }

        if (activeContainer) {
            // CSS zoom лучше работает с drag&drop чем transform: scale()
            activeContainer.style.zoom = zoomValue;

            // Для таблицы - корректируем высоту контейнера с учётом zoom
            if (currentMode === 'table' && tableView && zoomValue !== 1) {
                // Даём браузеру время применить zoom, затем корректируем высоту
                setTimeout(() => {
                    const table = tableContainer.querySelector('.table.fert');
                    if (table) {
                        const realHeight = table.offsetHeight * zoomValue;
                        tableView.style.height = realHeight + 'px';
                    }
                }, 50);
            }
        }

        if (valueDisplay) {
            valueDisplay.textContent = value + '%';
        }
    }

    function updateCardsControlsVisibility() {
        const zoomControls = document.querySelectorAll('.fert-zoom-control');
        const isDesktop = window.innerWidth >= 992;

        zoomControls.forEach(el => {
            el.style.display = isDesktop ? 'flex' : 'none';
        });

        const slider = document.getElementById('fert-zoom-slider');
        if (slider) applyZoomToCurrentMode(slider.value);
    }

    // Перехватываем setViewMode для обновления zoom/controls
    const _origSetViewMode = setViewMode;
    setViewMode = function(mode) {
        _origSetViewMode(mode);
        initZoomSlider();
        updateCardsControlsVisibility();
    };

    // Инициализация zoom при загрузке страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initZoomSlider();
            updateCardsControlsVisibility();
        });
    } else {
        initZoomSlider();
        updateCardsControlsVisibility();
    }

    window.FertilizerCards = {
        renderVertical: renderVerticalTable,
        setMode: setViewMode,
        getMode: () => currentMode
    };

})();
