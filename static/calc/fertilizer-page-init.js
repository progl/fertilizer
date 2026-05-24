/**
 * Fertilizer Page Init
 * Вынесено из common_profile_fertilizers.html
 * Инициализация специфичных функций страницы удобрений
 */
(function() {
'use strict';

// Разовая миграция: объединить старый ключ fertFavorites с новым favoriteFerts
(function migrateFavorites() {
    try {
        const oldKey = 'fertFavorites';
        const newKey = 'favoriteFerts';
        const oldData = localStorage.getItem(oldKey);
        if (oldData) {
            const oldArr = JSON.parse(oldData);
            const newArr = JSON.parse(localStorage.getItem(newKey) || '[]');
            const merged = [...new Set([...oldArr, ...newArr])];
            localStorage.setItem(newKey, JSON.stringify(merged));
            localStorage.removeItem(oldKey);
            console.log('[FertFavorites] Migrated from fertFavorites to favoriteFerts:', merged.length, 'items');
        }
    } catch (e) {
        console.warn('[FertFavorites] Migration failed:', e);
    }
})();

// Используем глобальную _t из calc_fert.js или создаём fallback
if (typeof window._t === 'undefined') {
    window._t = (key, fallback) => {
        if (typeof window.t === 'function') {
            const result = window.t(key);
            return (result && result !== key) ? result : (fallback || key);
        }
        return fallback || key;
    };
}
const _t = window._t;
        // Мобильная версия: позволяем zoom и уменьшаем initial-scale чтобы таблица влезала
        (function() {
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                // Удаляем старый viewport
                const oldViewport = document.querySelector('meta[name="viewport"]');
                if (oldViewport) oldViewport.remove();

                // Создаём новый viewport: начальный масштаб 0.6, разрешаем zoom до 3x
                const newViewport = document.createElement('meta');
                newViewport.name = 'viewport';
                newViewport.content = 'width=device-width, initial-scale=0.6, minimum-scale=0.3, maximum-scale=3.0, user-scalable=yes';
                document.head.appendChild(newViewport);
            }
        })();

        // Отмена drag при клике на input (для выделения текста)
        $(document).ready(() => {
            // Отменяем dragstart если клик был на input
            $(document).on('dragstart', '[draggable="true"]', (e) => {
                if ($(e.target).is('input, textarea, select') || $(e.target).closest('input, textarea, select').length) {
                    e.preventDefault();
                    return false;
                }
            });

            // Останавливаем всплытие mousedown для input внутри draggable
            $(document).on('mousedown', '[draggable="true"] input, [draggable="true"] textarea', (e) => {
                e.stopPropagation();
            });
        });

        // Галка "Микро" определяет куда идут микроудобрения:
        // - Включена: в отдельную колонку Микро (В)
        // - Выключена: остаются в А/Б по bottle атрибуту
        // Колонка Микро всегда видна (не скрывается)

        // Обработчики для пунктов меню (дублируют кнопки)
        $(document).ready(() => {
            // Меню "Управление таблицей"
            $('#toggleButon-menu').on('click', (e) => {
                e.preventDefault();
                $('#toggleButon').click();
            });

            $('#toggle-text-menu').on('click', (e) => {
                e.preventDefault();
                $('#toggle-text').click();
            });

            $('#select-all-menu').on('click', (e) => {
                e.preventDefault();
                $('#select-all-button').click();
            });

            $('#de-select-all-menu').on('click', (e) => {
                e.preventDefault();
                $('#de-select-all-button').click();
            });

            // Меню "Инструменты"
            $('#copy-button-menu').on('click', (e) => {
                e.preventDefault();
                $('#copy-button').click();
            });

            $('#grams_ppm_menu').on('click', (e) => {
                e.preventDefault();
                $('#grams_ppm').click();
                // Обновляем текст - просто ppm или ммоль
                const currentText = $('#grams_ppm').text();
                $('#ppm-toggle-text').text(currentText === 'ppm' ? 'ppm' : 'ммоль');
            });

            $('#matrix-mode-toggle-menu').on('click', (e) => {
                e.preventDefault();
                const container = $('#element-matrix-container');
                container.toggleClass('d-none');
                const isVisible = !container.hasClass('d-none');
                localStorage.setItem('matrixVisible', isVisible ? '1' : '0');
                $('#matrix-toggle-text').text(isVisible ? _t('fert_hide_matrix', 'Скрыть матрицу') : _t('fert_show_matrix', 'Показать матрицу'));
            });

            // Восстановление видимости матрицы из localStorage
            if (localStorage.getItem('matrixVisible') === '1') {
                $('#element-matrix-container').removeClass('d-none');
                $('#matrix-toggle-text').text(_t('fert_hide_matrix', 'Скрыть матрицу'));
            }

            // Кнопка закрытия матрицы
            $('#matrix-close-btn').on('click', () => {
                $('#element-matrix-container').addClass('d-none');
                localStorage.setItem('matrixVisible', '0');
                $('#matrix-toggle-text').text(_t('fert_show_matrix', 'Показать матрицу'));
                $('#matrix-toggle-toolbar').removeClass('active');
            });

            // Кнопка матрицы в toolbar (используем делегирование для надёжности)
            console.log('[Matrix] Binding click handler, element found:', $('#matrix-toggle-toolbar').length);
            $(document).on('click', '#matrix-toggle-toolbar', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Matrix] Button clicked');
                const container = $('#element-matrix-container');
                console.log('[Matrix] Container found:', container.length);
                container.toggleClass('d-none');
                const isVisible = !container.hasClass('d-none');
                localStorage.setItem('matrixVisible', isVisible ? '1' : '0');
                $('#matrix-toggle-text').text(isVisible ? _t('fert_hide_matrix', 'Скрыть матрицу') : _t('fert_show_matrix', 'Показать матрицу'));
                $(this).toggleClass('active', isVisible);
            });

            // Обновить состояние кнопки toolbar при загрузке
            if (localStorage.getItem('matrixVisible') === '1') {
                $('#matrix-toggle-toolbar').addClass('active');
            }

            // Кнопка матрицы соотношений в карточке диагностики (#ratio-matrix-btn)
            const ratioMatrixBtn = document.getElementById('ratio-matrix-btn');
            const ratioMatrix = document.getElementById('ratio-matrix');
            const ratioMatrixCloseBtn = document.getElementById('ratio-matrix-close-btn');

            if (ratioMatrixBtn && ratioMatrix) {
                ratioMatrixBtn.addEventListener('click', () => {
                    const isHidden = ratioMatrix.classList.contains('d-none');
                    if (isHidden) {
                        ratioMatrix.classList.remove('d-none');
                        ratioMatrixBtn.classList.add('active');
                    } else {
                        ratioMatrix.classList.add('d-none');
                        ratioMatrixBtn.classList.remove('active');
                    }
                });
            }

            if (ratioMatrixCloseBtn && ratioMatrix) {
                ratioMatrixCloseBtn.addEventListener('click', () => {
                    ratioMatrix.classList.add('d-none');
                    ratioMatrixBtn?.classList.remove('active');
                });
            }

            // NH4/NO3 Ratio Toggle - переключение формата отображения
            (function initNH4RatioToggle() {
                const STORAGE_KEY = 'ohpg_nh4_ratio_format';
                const card = document.getElementById('nh4-ratio-card');
                const toggleBtn = document.getElementById('nh4-ratio-toggle');

                if (!card || !toggleBtn) return;

                function getStoredFormat() {
                    return localStorage.getItem(STORAGE_KEY) || 'ratio';
                }

                function saveFormat(format) {
                    localStorage.setItem(STORAGE_KEY, format);
                }

                function applyFormat(format) {
                    const labelEl = document.getElementById('nh4-ratio-format-label');
                    const hintEl = document.getElementById('nh4-ratio-hint');
                    const ratioWrap = document.getElementById('nh4-ratio-ratio');
                    const percentWrap = document.getElementById('nh4-ratio-percent');

                    card.dataset.format = format;

                    if (labelEl) {
                        labelEl.textContent = format === 'ratio' ? 'NO3:NH4' : 'NH4/NO3';
                    }
                    if (hintEl) {
                        hintEl.textContent = format === 'ratio' ? '5-25' : '4-20%';
                    }
                    if (ratioWrap && percentWrap) {
                        ratioWrap.style.display = format === 'ratio' ? 'block' : 'none';
                        percentWrap.style.display = format === 'ratio' ? 'none' : 'block';
                    }
                }

                function toggleFormat() {
                    const currentFormat = card.dataset.format || 'ratio';
                    const newFormat = currentFormat === 'ratio' ? 'percent' : 'ratio';
                    applyFormat(newFormat);
                    saveFormat(newFormat);
                }

                // Восстанавливаем сохранённый формат
                applyFormat(getStoredFormat());

                // Обработчик клика
                toggleBtn.addEventListener('click', toggleFormat);
            })();

            // Drag & drop для матрицы
            (function() {
                const container = document.getElementById('element-matrix-container');
                const handle = document.getElementById('matrix-drag-handle');
                if (!container || !handle) return;

                let isDragging = false;
                let startX, startY, startRight, startBottom;

                handle.addEventListener('mousedown', startDrag);
                handle.addEventListener('touchstart', startDrag, { passive: false });

                function startDrag(e) {
                    if (e.target.closest('.btn-close')) return;
                    isDragging = true;
                    const rect = container.getBoundingClientRect();
                    startRight = window.innerWidth - rect.right;
                    startBottom = window.innerHeight - rect.bottom;
                    if (e.type === 'touchstart') {
                        startX = e.touches[0].clientX;
                        startY = e.touches[0].clientY;
                    } else {
                        startX = e.clientX;
                        startY = e.clientY;
                    }
                    document.addEventListener('mousemove', drag);
                    document.addEventListener('mouseup', stopDrag);
                    document.addEventListener('touchmove', drag, { passive: false });
                    document.addEventListener('touchend', stopDrag);
                    e.preventDefault();
                }

                function drag(e) {
                    if (!isDragging) return;
                    let clientX, clientY;
                    if (e.type === 'touchmove') {
                        clientX = e.touches[0].clientX;
                        clientY = e.touches[0].clientY;
                    } else {
                        clientX = e.clientX;
                        clientY = e.clientY;
                    }
                    const deltaX = startX - clientX;
                    const deltaY = startY - clientY;
                    let newRight = startRight + deltaX;
                    let newBottom = startBottom + deltaY;
                    // Ограничения
                    newRight = Math.max(0, Math.min(newRight, window.innerWidth - 100));
                    newBottom = Math.max(0, Math.min(newBottom, window.innerHeight - 50));
                    container.style.right = newRight + 'px';
                    container.style.bottom = newBottom + 'px';
                    e.preventDefault();
                }

                function stopDrag() {
                    isDragging = false;
                    document.removeEventListener('mousemove', drag);
                    document.removeEventListener('mouseup', stopDrag);
                    document.removeEventListener('touchmove', drag);
                    document.removeEventListener('touchend', stopDrag);
                    // Сохраняем позицию
                    localStorage.setItem('matrixPos', JSON.stringify({
                        right: container.style.right,
                        bottom: container.style.bottom
                    }));
                }

                // Восстановление позиции
                try {
                    const pos = JSON.parse(localStorage.getItem('matrixPos'));
                    if (pos && pos.right && pos.bottom) {
                        container.style.right = pos.right;
                        container.style.bottom = pos.bottom;
                    }
                } catch(_e) {}
            })();

            $('#copy-recipe-fert-ids-menu').on('click', (e) => {
                e.preventDefault();
                $('#copy-recipe-fert-ids').click();
            });
        });

        // Множественный выбор удобрений в модалке (чекбоксы + фильтры)
        $(document).ready(() => {
            const $modal = $('#selectFertilizerModal');
            const $search = $('#fert-search');
            const $list = $('#fert-list');
            const $counter = $('#fert-counter');
            const $filtersType = $('.fert-filter-type');
            const $filtersBottle = $('.fert-filter-bottle');
            const $filtersOwner = $('.fert-filter-owner');

            let filterType = 'all';
            let filterBottle = 'all';
            let filterOwner = 'all';

            // Избранные удобрения в localStorage
            function getFavorites() {
                try {
                    return JSON.parse(localStorage.getItem('favoriteFerts') || '[]');
                } catch(_e) {
                    return [];
                }
            }

            function saveFavorites(favorites) {
                localStorage.setItem('favoriteFerts', JSON.stringify(favorites));
            }

            function isFavorite(pk) {
                return getFavorites().includes(String(pk));
            }

            function toggleFavorite(pk) {
                const favorites = getFavorites();
                const pkStr = String(pk);
                const idx = favorites.indexOf(pkStr);
                if (idx === -1) {
                    favorites.push(pkStr);
                } else {
                    favorites.splice(idx, 1);
                }
                saveFavorites(favorites);
                updateFavoriteIcons();
                updateCounts();
            }

            // Обновление иконок избранного
            function updateFavoriteIcons() {
                $list.find('.fert-favorite-btn').each(function() {
                    const pk = $(this).data('pk');
                    const $icon = $(this).find('.fert-favorite-icon');
                    if (isFavorite(pk)) {
                        $icon.removeClass('bi-star').addClass('bi-star-fill').css('opacity', 1);
                    } else {
                        $icon.removeClass('bi-star-fill').addClass('bi-star').css('opacity', 0.3);
                    }
                });
            }

            // Обновление счётчиков в бейджиках (учитывает поиск/фильтры)
            function updateCounts() {
                const _favorites = getFavorites();
                const searchText = $search.val().toLowerCase().trim();
                const tokens = searchText ? searchText.split(/\s+/).filter(t => t.length >= 2) : [];
                let allCount = 0;
                let favCount = 0;
                let myCount = 0;
                let moderationCount = 0;

                $list.find('.fert-item').each(function() {
                    const $item = $(this);
                    const pk = $item.data('pk');
                    const name = ($item.data('name') || '').toLowerCase();
                    const isMy = $item.data('is-my') === 1 || $item.data('is-my') === '1';
                    const isModerated = $item.data('moderated') === 1 || $item.data('moderated') === '1';

                    // Учитываем поисковый фильтр
                    const matchesSearch = tokens.length === 0 || tokens.every(t => name.includes(t));
                    if (!matchesSearch) return;

                    allCount++;
                    if (isFavorite(pk)) favCount++;
                    if (isMy) myCount++;
                    if (!isModerated) moderationCount++;
                });

                $('#fert-count-all').text(allCount);
                $('#fert-count-favorites').text(favCount);
                $('#fert-count-my').text(myCount);
                $('#fert-count-moderation').text(moderationCount);
            }

            // Клик по иконке избранного
            $list.on('click', '.fert-favorite-btn', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const pk = $(this).data('pk');
                toggleFavorite(pk);
                filterList();
            });

            // Клик по кнопке удаления "Моего" удобрения
            $list.on('click', '.fert-delete-btn', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const $btn = $(this);
                const pk = $btn.data('pk');
                const $item = $btn.closest('.fert-item');
                const name = $item.find('.fw-medium').text();

                if (!confirm(_t('fert_delete_confirm', 'Удалить удобрение') + ' "' + name + '"?')) {
                    return;
                }

                $.ajax({
                    url: '/calc/del-fert/' + pk + '/',
                    method: 'GET',
                    success: function() {
                        $item.fadeOut(200, function() {
                            $(this).remove();
                            updateCounts();
                            filterList();
                        });
                    },
                    error: function(xhr) {
                        alert(_t('fert_delete_error', 'Ошибка удаления') + ': ' + (xhr.responseText || xhr.statusText));
                    }
                });
            });

            // Клик по кнопке редактирования удобрения (на модерации)
            $list.on('click', '.fert-edit-btn', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const $btn = $(this);
                const pk = $btn.data('pk');
                const $item = $btn.closest('.fert-item');
                const data = $item.data();

                // Переключаемся на вкладку "Создать"
                const createTab = document.getElementById('fert-tab-create');
                if (createTab) {
                    const tab = new bootstrap.Tab(createTab);
                    tab.show();
                }

                // Заполняем форму данными удобрения
                const form = document.getElementById('form-create-fert-inline');
                if (!form) return;

                // Маппинг data-атрибутов на имена полей формы
                const fieldMap = {
                    'name': $item.find('.fw-medium').text(),
                    'N_NH4': data.nh4,
                    'N_NO3': data.no3,
                    'N_NH2': data.nh2,
                    'P': data.p,
                    'K': data.k,
                    'Ca': data.ca,
                    'Mg': data.mg,
                    'S': data.s,
                    'Cl': data.cl,
                    'Fe': data.fe,
                    'Zn': data.zn,
                    'Cu': data.cu,
                    'Mn': data.mn,
                    'Mo': data.mo,
                    'B': data.b,
                    'Co': data.co,
                    'Si': data.si,
                    'K2O': data.k2o,
                    'P2O5': data.p2o5,
                    'CaO': data.cao,
                    'MgO': data.mgo,
                    'SO3': data.so3,
                    'bottle': data.bottle,
                    'link': data.link
                };

                // Заполняем поля
                for (const [fieldName, value] of Object.entries(fieldMap)) {
                    const input = form.querySelector(`[name="${fieldName}"]`);
                    if (input && value !== undefined && value !== null) {
                        input.value = value;
                    }
                }

                // Меняем action формы на редактирование
                form.action = '/calc/fert-new/' + pk + '/';

                // Меняем текст кнопки
                const submitBtn = $modal.find('.fert-footer-create');
                submitBtn.html('<i class="bi bi-check-lg me-1"></i>' + _t('fert_save', 'Сохранить'));
                submitBtn.data('edit-mode', true);
                submitBtn.data('edit-pk', pk);

                // Переключаем кнопки footer
                $modal.find('.fert-footer-select').addClass('d-none');
                submitBtn.removeClass('d-none');
            });

            // Сброс формы в режим создания
            function resetCreateForm() {
                const form = document.getElementById('form-create-fert-inline');
                if (!form) return;

                form.reset();
                form.action = '/calc/fert-new/';

                const submitBtn = $modal.find('.fert-footer-create');
                submitBtn.html('<i class="bi bi-check-lg me-1"></i>' + _t('fert_create', 'Создать'));
                submitBtn.data('edit-mode', false);
                submitBtn.data('edit-pk', null);
            }

            // Сбрасываем форму при переключении на вкладку "Выбрать"
            $modal.on('shown.bs.tab', '#fert-tab-select', () => {
                resetCreateForm();
            });

            // Инициализация при загрузке страницы
            updateFavoriteIcons();
            updateCounts();

            // Функция определения типа удобрения
            function getFertType($item) {
                const d = $item.data();
                const hasMacro = (parseFloat(d.nh4) || 0) + (parseFloat(d.no3) || 0) +
                                 (parseFloat(d.p) || 0) + (parseFloat(d.k) || 0) +
                                 (parseFloat(d.ca) || 0) + (parseFloat(d.mg) || 0) > 0;
                const hasMicro = (parseFloat(d.fe) || 0) + (parseFloat(d.zn) || 0) +
                                 (parseFloat(d.cu) || 0) + (parseFloat(d.mn) || 0) +
                                 (parseFloat(d.b) || 0) > 0;
                if (hasMacro && hasMicro) return 'complex';
                if (hasMicro) return 'micro';
                return 'macro';
            }

            // Функция фильтрации списка
            function filterList() {
                const searchText = $search.val().toLowerCase().trim();
                // Токенизация: разбиваем на слова (минимум 2 символа)
                const tokens = searchText ? searchText.split(/\s+/).filter(t => t.length >= 2) : [];
                let visibleCount = 0;

                $list.find('.fert-item').each(function() {
                    const $item = $(this);
                    const name = $item.data('name') || '';
                    const type = getFertType($item);
                    const bottle = $item.data('bottle');
                    const pk = $item.data('pk');
                    const isMy = $item.data('is-my') === 1 || $item.data('is-my') === '1';
                    const isModerated = $item.data('moderated') === 1 || $item.data('moderated') === '1';

                    // Проверка поиска (все токены должны быть в названии)
                    const matchesSearch = tokens.length === 0 || tokens.every(t => name.includes(t));

                    // Проверка фильтра типа
                    const matchesType = filterType === 'all' ||
                        (filterType === 'macro' && type === 'macro') ||
                        (filterType === 'micro' && type === 'micro') ||
                        (filterType === 'complex' && type === 'complex');

                    // Проверка фильтра бака
                    const matchesBottle = filterBottle === 'all' || filterBottle === bottle;

                    // Проверка фильтра владельца (Все/Избранные/Мои/На модерации)
                    const matchesOwner = filterOwner === 'all' ||
                        (filterOwner === 'favorites' && isFavorite(pk)) ||
                        (filterOwner === 'my' && isMy) ||
                        (filterOwner === 'moderation' && !isModerated);

                    if (matchesSearch && matchesType && matchesBottle && matchesOwner) {
                        $item.removeClass('d-none');
                        visibleCount++;
                    } else {
                        $item.addClass('d-none');
                    }
                });

                $counter.text(_t('fert_shown', 'Показано:') + ' ' + visibleCount);
                updateCounts();
            }

            // Обновление счётчика выбранных
            function updateCounter() {
                const count = $list.find('.fert-checkbox:checked').length;
                $counter.text(_t('fert_selected', 'Выбрано:') + ' ' + count);
                // Обновляем badge в кнопке "Добавить" (TWA режим)
                $('.fert-counter-badge').text(count);
            }

            // Поиск
            $search.on('input', filterList);

            // Фильтры типа
            $filtersType.on('click', function() {
                $filtersType.removeClass('btn-primary active').addClass('btn-outline-secondary');
                $(this).removeClass('btn-outline-secondary').addClass('btn-primary active');
                filterType = $(this).data('filter');
                filterList();
            });

            // Фильтры бака
            $filtersBottle.on('click', function() {
                $filtersBottle.removeClass('btn-primary active').addClass('btn-outline-secondary');
                $(this).removeClass('btn-outline-secondary').addClass('btn-primary active');
                filterBottle = $(this).data('filter');
                filterList();
            });

            // Фильтры владельца (Все/Избранные/Мои/На модерации)
            $filtersOwner.on('click', function() {
                // Сбрасываем все кнопки
                $filtersOwner.each(function() {
                    const $btn = $(this);
                    const filter = $btn.data('filter');
                    if (filter === 'all') {
                        $btn.removeClass('btn-primary active').addClass('btn-outline-secondary');
                    } else if (filter === 'favorites') {
                        $btn.removeClass('btn-success active').addClass('btn-outline-success');
                    } else if (filter === 'my') {
                        $btn.removeClass('btn-danger active').addClass('btn-outline-danger');
                    } else if (filter === 'moderation') {
                        $btn.removeClass('btn-secondary active').addClass('btn-outline-secondary');
                    }
                });
                // Активируем нажатую
                const filter = $(this).data('filter');
                if (filter === 'all') {
                    $(this).removeClass('btn-outline-secondary').addClass('btn-primary active');
                } else if (filter === 'favorites') {
                    $(this).removeClass('btn-outline-success').addClass('btn-success active');
                } else if (filter === 'my') {
                    $(this).removeClass('btn-outline-danger').addClass('btn-danger active');
                } else if (filter === 'moderation') {
                    $(this).removeClass('btn-outline-secondary').addClass('btn-secondary active');
                }
                filterOwner = filter;
                filterList();
            });

            // Клик по строке - переключить чекбокс
            $list.on('click', '.fert-item', function(e) {
                // Если клик по чекбоксу, label (или внутри label) или звёздочке - не дублировать
                // Label сам переключит чекбокс через for attribute
                if ($(e.target).is('input') || $(e.target).closest('label, .fert-favorite-btn').length) return;

                // Переключить чекбокс (одинаково для TWA и обычного режима)
                const $checkbox = $(this).find('.fert-checkbox');
                $checkbox.prop('checked', !$checkbox.prop('checked'));
                updateCounter();
            });

            // Изменение чекбокса
            $list.on('change', '.fert-checkbox', updateCounter);

            // Переключение табов в модалке База удобрений
            $modal.on('shown.bs.tab', '#fert-tab-select, #fert-tab-create', (e) => {
                const isCreateTab = e.target.id === 'fert-tab-create';
                $modal.find('.fert-footer-select').toggleClass('d-none', isCreateTab);
                $modal.find('.fert-footer-create').toggleClass('d-none', !isCreateTab);
            });

            // При открытии модалки - сбросить состояние
            $modal.on('shown.bs.modal', () => {
                // Сбросить на вкладку "Выбрать"
                const selectTab = document.getElementById('fert-tab-select');
                if (selectTab) {
                    const tab = new bootstrap.Tab(selectTab);
                    tab.show();
                }
                // Сбросить кнопки footer
                $modal.find('.fert-footer-select').removeClass('d-none');
                $modal.find('.fert-footer-create').addClass('d-none');

                $search.val('').focus();
                $list.find('.fert-checkbox').prop('checked', false);
                // Сброс фильтров типа
                $filtersType.removeClass('btn-primary active').addClass('btn-outline-secondary');
                $filtersType.filter('[data-filter="all"]').removeClass('btn-outline-secondary').addClass('btn-primary active');
                filterType = 'all';
                // Сброс фильтров бака
                $filtersBottle.removeClass('btn-primary active').addClass('btn-outline-secondary');
                $filtersBottle.filter('[data-filter="all"]').removeClass('btn-outline-secondary').addClass('btn-primary active');
                filterBottle = 'all';
                // Сброс фильтров владельца
                $filtersOwner.each(function() {
                    const $btn = $(this);
                    const filter = $btn.data('filter');
                    if (filter === 'all') {
                        $btn.removeClass('btn-outline-secondary').addClass('btn-primary active');
                    } else if (filter === 'favorites') {
                        $btn.removeClass('btn-success active').addClass('btn-outline-success');
                    } else if (filter === 'my') {
                        $btn.removeClass('btn-danger active').addClass('btn-outline-danger');
                    } else if (filter === 'moderation') {
                        $btn.removeClass('btn-secondary active').addClass('btn-outline-secondary');
                    }
                });
                filterOwner = 'all';
                // Сброс формы создания в режим "Создать"
                resetCreateForm();
                // Обновить иконки избранного и счётчики
                updateFavoriteIcons();
                updateCounts();
                filterList();
                updateCounter();
            });

            // Обработчик кнопки "Добавить выбранные" (footer и header)
            $('#add-selected-fertilizers, #add-selected-fertilizers-header').on('click', () => {
                const $checked = $list.find('.fert-checkbox:checked');

                if ($checked.length === 0) {
                    alert(_t('fert_select_at_least_one', 'Выберите хотя бы одно удобрение'));
                    return;
                }

                // Закрываем модалку
                $modal.modal('hide');

                // Добавляем каждое выбранное удобрение
                setTimeout(() => {
                    $checked.each(function() {
                        const $item = $(this).closest('.fert-item');
                        const fertData = $item.data();
                        const existingRow = $(`.f-${fertData.pk}`);

                        if (existingRow.length > 0) {
                            console.warn(_t('fert_already_added', 'Удобрение уже добавлено'));
                        } else if (typeof window.addFertilizerRow === 'function') {
                                window.addFertilizerRow(fertData, 0);
                            } else if (typeof addFertilizerRow === 'function') {
                                addFertilizerRow(fertData, 0);
                            }
                    });

                    // Пересчитываем суммы и обновляем URL
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
                }, 300);
            });

            // === TWA Toggle-кнопки для фильтров ===
            if (window.__TWA_MODE__) {
                // Toggle для владельца (Все/Избранные/Мои)
                $('.fert-toggle-owner').on('click', function() {
                    const $btn = $(this);
                    const values = $btn.data('values').split(',');
                    const labels = $btn.data('labels').split(',');
                    let current = $btn.data('current');
                    let idx = values.indexOf(current);
                    idx = (idx + 1) % values.length;
                    current = values[idx];
                    $btn.data('current', current);

                    // Обновить текст кнопки
                    const badge = $btn.find('.badge').detach();
                    $btn.text(labels[idx] + ' ');
                    $btn.append(badge);

                    // Применить фильтр через существующие кнопки
                    $(`.fert-filter-owner[data-filter="${current}"]`).click();
                });

                // Toggle для типа (Все/Макро/Микро/Компл)
                $('.fert-toggle-type').on('click', function() {
                    const $btn = $(this);
                    const values = $btn.data('values').split(',');
                    const labels = $btn.data('labels').split(',');
                    let current = $btn.data('current');
                    let idx = values.indexOf(current);
                    idx = (idx + 1) % values.length;
                    current = values[idx];
                    $btn.data('current', current);
                    $btn.text(labels[idx]);

                    // Применить фильтр
                    $(`.fert-filter-type[data-filter="${current}"]`).click();
                });

                // Toggle для бака (A+B/A/B)
                $('.fert-toggle-bottle').on('click', function() {
                    const $btn = $(this);
                    const values = $btn.data('values').split(',');
                    const labels = $btn.data('labels').split(',');
                    let current = $btn.data('current');
                    let idx = values.indexOf(current);
                    idx = (idx + 1) % values.length;
                    current = values[idx];
                    $btn.data('current', current);
                    $btn.text(labels[idx]);

                    // Применить фильтр
                    $(`.fert-filter-bottle[data-filter="${current}"]`).click();
                });

                // Синхронизировать счетчик TWA с основным
                const syncTwaCount = function() {
                    $('#fert-count-all-twa').text($('#fert-count-all').text());
                };
                setInterval(syncTwaCount, 500);
            }
        });

        // Summary panel: кнопки +/- для EC и Литров
        $(document).ready(() => {
            // EC +/-
            $('#ec-increase').on('click', () => {
                const input = $('#ec-input');
                let val = parseFloat(input.val()) || 0;
                val = Math.round((val + 0.1) * 100) / 100;
                input.val(val.toFixed(2)).trigger('change');
            });
            $('#ec-decrease').on('click', () => {
                const input = $('#ec-input');
                let val = parseFloat(input.val()) || 0;
                val = Math.max(0, Math.round((val - 0.1) * 100) / 100);
                input.val(val.toFixed(2)).trigger('change');
            });

            // Литры +/-
            $('#litres-increase').on('click', () => {
                const input = $('#litres');
                let val = parseFloat(input.val()) || 0;
                val = val < 10 ? val + 0.5 : val + 1;
                input.val(val).trigger('change');
            });
            $('#litres-decrease').on('click', () => {
                const input = $('#litres');
                let val = parseFloat(input.val()) || 0;
                val = val <= 10 ? Math.max(0.5, val - 0.5) : Math.max(1, val - 1);
                input.val(val).trigger('change');
            });

            // Поворот иконки при раскрытии summary details
            $('#summary-details').on('show.bs.collapse', () => {
                $('#summary-toggle-btn').attr('aria-expanded', 'true');
            }).on('hide.bs.collapse', () => {
                $('#summary-toggle-btn').attr('aria-expanded', 'false');
            });

            // Клик по солям в концентратах - зачёркивание (налил)
            $(document).on('click', '.conc-list-item', function() {
                $(this).toggleClass('done');
            });
        });

        // Переключение режимов таблица/вертикальная/карточки
        // Управляется из fertilizer-cards.js (v2.4.0)

        // Автоматическое масштабирование таблицы если она не влезает
        (function() {
            const tableView = document.querySelector('.fert-table-view');
            if (!tableView) return;

            // Функция обновления высоты таблицы (автомасштабирование отключено - используется ручной zoom)
            function updateTableFit() {
                // Сбрасываем принудительную высоту - пусть таблица имеет естественную высоту
                document.body.classList.remove('table-fit-active');
                tableView.style.height = '';
                const tableResponsive = tableView.querySelector('.table-responsive');
                if (tableResponsive) {
                    tableResponsive.style.transform = '';
                    tableResponsive.style.overflow = '';
                }
            }

            // Экспортируем функцию для вызова из calc_fert.js
            window.updateFitModeHeight = updateTableFit;

            // Инициализация при загрузке
            setTimeout(updateTableFit, 100);

            // Дополнительная проверка через 500мс (когда таблица точно отрисована)
            setTimeout(updateTableFit, 500);

            // Обновление при resize
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(updateTableFit, 250);
            });

            // Обновление при переключении режима просмотра
            const viewModeButtons = document.querySelectorAll('.view-mode-btn');
            viewModeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    setTimeout(updateTableFit, 100);
                });
            });
        })();

        // === Пресеты готовых профилей ===
        (function initFertilizerPresets() {
            // Данные загружаются из API — никакой статики
            let _cache = null; // {categories: [...], byKey: {...}}
            let currentSubstrate = 'hydro';

            async function _loadPresets() {
                if (_cache) return _cache;
                let data = null;
                try {
                    const resp = await fetch('/calc/api/presets/?grouped=1', { credentials: 'same-origin' });
                    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                    data = await resp.json();
                } catch (apiErr) {
                    // standalone-режим без Django backend — fallback на локальный JSON
                    const resp = await fetch('./data/presets.json');
                    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                    data = await resp.json();
                }
                const byKey = {};
                for (const cat of data.categories) {
                    for (const p of cat.presets) byKey[p.key] = p;
                }
                _cache = { categories: data.categories, byKey };
                return _cache;
            }

            function renderFertPresetTable(substrate) {
                if (!_cache && substrate !== 'community') return;
                currentSubstrate = substrate;
                const isCommunity = substrate === 'community';
                const catData = !isCommunity ? _cache?.categories.find(c => c.key === substrate) : null;
                const isBoostMode = substrate === 'boost';

                // Обновить табы
                document.querySelectorAll('.fert-preset-tab').forEach(tab => {
                    const isActive = tab.dataset.substrate === substrate;
                    tab.classList.toggle('active', isActive);
                    // Сбросить все цвета, потом установить нужный
                    tab.classList.remove('btn-primary', 'btn-warning', 'btn-success', 'btn-info',
                                         'btn-outline-secondary', 'btn-outline-warning',
                                         'btn-outline-success', 'btn-outline-info');
                    if (isActive) {
                        const activeClasses = { hydro: 'btn-primary', coco: 'btn-primary', rockwool: 'btn-primary',
                                                boost: 'btn-warning', classic: 'btn-info', crop: 'btn-success', community: 'btn-primary' };
                        tab.classList.add(activeClasses[substrate] || 'btn-primary');
                    } else {
                        const inactiveClasses = { hydro: 'btn-outline-secondary', coco: 'btn-outline-secondary',
                                                   rockwool: 'btn-outline-secondary', boost: 'btn-outline-warning',
                                                   classic: 'btn-outline-info', crop: 'btn-outline-success', community: 'btn-outline-secondary' };
                        tab.classList.add(inactiveClasses[tab.dataset.substrate] || 'btn-outline-secondary');
                    }
                });

                // Переключить community vs обычный контент
                const presetsContent = document.getElementById('fert-presets-content');
                const communityPane = document.getElementById('fert-community-pane');
                if (isCommunity) {
                    if (presetsContent) presetsContent.style.display = 'none';
                    if (communityPane) communityPane.style.display = 'block';
                    if (typeof loadFertCommunityProfiles === 'function') loadFertCommunityProfiles();
                    return;
                }
                if (presetsContent) presetsContent.style.display = '';
                if (communityPane) communityPane.style.display = 'none';

                // Обновить описание
                const descEl = document.getElementById('fert-preset-mode-description');
                if (descEl && catData) {
                    descEl.innerHTML = `<strong>${catData.name}:</strong> ${catData.desc}`;
                }

                const tbody = document.getElementById('fert-presets-tbody');
                if (tbody) {
                    if (!catData) {
                        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-3">Нет пресетов</td></tr>';
                    } else {
                        tbody.innerHTML = catData.presets.map(preset => {
                            const isBoost = preset.key.startsWith('boost_');
                            const btnClass = isBoost ? 'btn-warning' : 'btn-primary';
                            const n = preset.nutrients;
                            return `
                                <tr>
                                    <td>
                                        <div class="fw-semibold">${preset.name}</div>
                                        <div class="small text-muted">${preset.desc}</div>
                                    </td>
                                    <td>${n.n || '—'}</td>
                                    <td>${n.p || '—'}</td>
                                    <td>${n.k || '—'}</td>
                                    <td>${n.ca || '—'}</td>
                                    <td>${n.mg || '—'}</td>
                                    <td>${n.s || '—'}</td>
                                    <td>
                                        <button class="btn btn-sm ${btnClass} fert-preset-apply-btn" data-preset="${preset.key}">
                                            Выбрать
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('');
                    }
                }

                const microTbody = document.getElementById('fert-presets-micro-tbody');
                const microDetails = document.getElementById('fert-preset-micro-details');
                if (microTbody && microDetails) {
                    if (!isBoostMode && catData) {
                        microDetails.style.display = '';
                        microTbody.innerHTML = catData.presets.map(preset => {
                            const n = preset.nutrients;
                            return `
                                <tr>
                                    <td>${preset.name}</td>
                                    <td>${n.fe || '—'}</td>
                                    <td>${n.mn || '—'}</td>
                                    <td>${n.b || '—'}</td>
                                    <td>${n.zn || '—'}</td>
                                    <td>${n.cu || '—'}</td>
                                    <td>${n.mo || '—'}</td>
                                </tr>
                            `;
                        }).join('');
                    } else {
                        microDetails.style.display = 'none';
                    }
                }
            }

            function applyFertilizerPreset(presetKey) {
                if (!_cache) return;
                const preset = _cache.byKey[presetKey];
                if (!preset) return;

                // Закрыть модалку пресетов
                const presetsModal = bootstrap.Modal.getInstance(document.getElementById('fertilizerPresetsModal'));
                if (presetsModal) presetsModal.hide();

                // Формируем строку профиля для автоподбора
                const n = preset.nutrients;
                const fields = ['n', 'p', 'k', 'ca', 'mg', 's', 'fe', 'mn', 'b', 'zn', 'cu', 'mo'];
                const profileStr = fields
                    .filter(f => n[f] !== undefined && typeof n[f] === 'number')
                    .map(f => `${f.toUpperCase()}=${n[f]}`)
                    .join(' ');

                const inputEl = document.getElementById('input-string');
                if (inputEl) inputEl.value = profileStr;

                setTimeout(() => {
                    const autoModal = new bootstrap.Modal(document.getElementById('autoSolveModal'));
                    autoModal.show();
                }, 300);

                // Трекинг
                const csrfToken = document.cookie.split('; ')
                    .find(row => row.startsWith('csrftoken='))
                    ?.split('=')[1];
                fetch(`/calc/api/presets/${encodeURIComponent(presetKey)}/track/`, {
                    method: 'POST',
                    headers: csrfToken ? {'X-CSRFToken': csrfToken} : {},
                    credentials: 'same-origin',
                }).catch(() => {});
            }

            const modal = document.getElementById('fertilizerPresetsModal');
            if (modal) {
                modal.addEventListener('show.bs.modal', () => {
                    if (_cache) {
                        renderFertPresetTable(currentSubstrate);
                    } else {
                        const tbody = document.getElementById('fert-presets-tbody');
                        if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="text-center py-3"><span class="spinner-border spinner-border-sm"></span></td></tr>';
                        _loadPresets().then(() => {
                            renderFertPresetTable(currentSubstrate);
                        }).catch(err => {
                            if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-3">Ошибка: ${err.message}</td></tr>`;
                        });
                    }
                });

                modal.addEventListener('click', (e) => {
                    const tab = e.target.closest('.fert-preset-tab');
                    if (tab) renderFertPresetTable(tab.dataset.substrate);

                    const applyBtn = e.target.closest('.fert-preset-apply-btn');
                    if (applyBtn) applyFertilizerPreset(applyBtn.dataset.preset);
                });
            }

            // Экспорт для отладки
            window.fertPresets = { renderFertPresetTable, applyFertilizerPreset, get cache() { return _cache; } };
        })();

        // === Разворот колонок концентратов на весь экран ===
        document.querySelectorAll('.conc-expand-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const col = this.dataset.col;
                const colEl = document.getElementById('col-conc-' + col);
                const row = document.getElementById('conc-columns-row');

                if (!colEl || !row) return;

                const isExpanded = row.classList.contains('conc-expanded');
                const isThisExpanded = colEl.classList.contains('conc-col-expanded');

                if (isExpanded && isThisExpanded) {
                    // Свернуть
                    row.classList.remove('conc-expanded');
                    colEl.classList.remove('conc-col-expanded');
                    this.classList.remove('bi-fullscreen-exit');
                    this.classList.add('bi-arrows-fullscreen');
                } else {
                    // Развернуть эту колонку
                    row.classList.add('conc-expanded');
                    document.querySelectorAll('#conc-columns-row > div').forEach(c => {
                        c.classList.remove('conc-col-expanded');
                        const icon = c.querySelector('.conc-expand-btn');
                        if (icon) {
                            icon.classList.remove('bi-fullscreen-exit');
                            icon.classList.add('bi-arrows-fullscreen');
                        }
                    });
                    colEl.classList.add('conc-col-expanded');
                    this.classList.remove('bi-arrows-fullscreen');
                    this.classList.add('bi-fullscreen-exit');
                }
            });
        });

        // === Автопересчёт оксидов в форме создания удобрения ===
        (function initOxideRecalc() {
            // Коэффициенты пересчёта (элемент -> оксид)
            const OXIDE_FACTORS = {
                P: { oxide: 'P2O5', factor: 2.2914 },
                K: { oxide: 'K2O', factor: 1.2046 },
                Ca: { oxide: 'CaO', factor: 1.3992 },
                Mg: { oxide: 'MgO', factor: 1.6582 },
                S: { oxide: 'SO3', factor: 2.4972 }
            };

            // Обратный маппинг (оксид -> элемент)
            const ELEMENT_FROM_OXIDE = {};
            for (const [elem, data] of Object.entries(OXIDE_FACTORS)) {
                ELEMENT_FROM_OXIDE[data.oxide] = { element: elem, factor: data.factor };
            }

            // Используем делегирование событий на document
            let isRecalculating = false;

            document.addEventListener('input', (e) => {
                const input = e.target;
                if (!input.matches('#form-create-fert-inline input, #add_plant_fert input')) return;

                const name = input.name;

                // Проверяем, это элемент или оксид
                if (OXIDE_FACTORS[name]) {
                    // Изменили элемент -> пересчитываем оксид
                    if (isRecalculating) return;
                    const data = OXIDE_FACTORS[name];
                    const form = input.closest('form');
                    const oxideInput = form.querySelector(`[name="${data.oxide}"]`);
                    if (!oxideInput) return;

                    const elemVal = parseFloat(input.value) || 0;
                    if (elemVal > 0) {
                        isRecalculating = true;
                        oxideInput.value = (elemVal * data.factor).toFixed(4);
                        isRecalculating = false;
                    }
                } else if (ELEMENT_FROM_OXIDE[name]) {
                    // Изменили оксид -> пересчитываем элемент
                    if (isRecalculating) return;
                    const data = ELEMENT_FROM_OXIDE[name];
                    const form = input.closest('form');
                    const elemInput = form.querySelector(`[name="${data.element}"]`);
                    if (!elemInput) return;

                    const oxideVal = parseFloat(input.value) || 0;
                    if (oxideVal > 0) {
                        isRecalculating = true;
                        elemInput.value = (oxideVal / data.factor).toFixed(4);
                        isRecalculating = false;
                    }
                }
            });
        })();

        // === Проверка дублей при создании нового удобрения ===
        (function() {
            const nameInput = document.querySelector('#form-create-fert-inline #id_name, #form-create-fert-inline input[name="name"]');
            if (!nameInput) return;

            // Собираем все существующие имена из DOM
            const existingNames = [];
            document.querySelectorAll('.fert-item[data-name]').forEach(el => {
                const name = (el.getAttribute('data-name') || '').trim();
                if (name) existingNames.push(name);
            });

            // Создаём блок для предупреждения
            const warnEl = document.createElement('div');
            warnEl.id = 'fert-duplicate-warning';
            warnEl.className = 'alert alert-warning py-1 px-2 mt-1 mb-0 d-none';
            warnEl.style.fontSize = '0.8rem';
            nameInput.parentElement.appendChild(warnEl);

            let debounceTimer;
            nameInput.addEventListener('input', function() {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const val = this.value.toLowerCase().trim();
                    if (val.length < 3) { warnEl.classList.add('d-none'); return; }

                    // Точное совпадение
                    const exact = existingNames.find(n => n === val);
                    if (exact) {
                        warnEl.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>Удобрение с таким именем уже существует!';
                        warnEl.className = 'alert alert-danger py-1 px-2 mt-1 mb-0';
                        return;
                    }

                    // Похожие (содержит)
                    const similar = existingNames.filter(n => n.includes(val) || val.includes(n)).slice(0, 3);
                    if (similar.length > 0) {
                        warnEl.innerHTML = '<i class="bi bi-info-circle me-1"></i>Похожие: ' +
                            similar.map(n => '<strong>' + n + '</strong>').join(', ');
                        warnEl.className = 'alert alert-warning py-1 px-2 mt-1 mb-0';
                    } else {
                        warnEl.classList.add('d-none');
                    }
                }, 300);
            });
        })();

        // Попапы для всех бейджей summary-quick
        (function initFertInfoPopups() {
            const pairs = [
                ['fert-nh4no3-info-btn',   'fert-nh4no3-popup',   'fert-nh4no3-popup-close'],
                ['fert-kn-info-btn',       'fert-kn-popup',       'fert-kn-popup-close'],
                ['fert-kca-info-btn',      'fert-kca-popup',      'fert-kca-popup-close'],
                ['fert-kmg-info-btn',      'fert-kmg-popup',      'fert-kmg-popup-close'],
                ['fert-cations-info-btn',  'fert-cations-popup',  'fert-cations-popup-close'],
                ['fert-anions-info-btn',   'fert-anions-popup',   'fert-anions-popup-close'],
                ['fert-ec-ion-info-btn',   'fert-ec-ion-popup',   'fert-ec-ion-popup-close'],
                ['fert-ph-calc-info-btn',  'fert-ph-calc-popup',  'fert-ph-calc-popup-close'],
                ['fert-osmotic-info-btn',  'fert-osmotic-popup',  'fert-osmotic-popup-close'],
            ];
            pairs.forEach(([btnId, popupId, closeId]) => {
                const btn    = document.getElementById(btnId);
                const popup  = document.getElementById(popupId);
                const close  = document.getElementById(closeId);
                if (!btn || !popup) return;

                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Закрываем остальные
                    pairs.forEach(([, otherId]) => {
                        if (otherId !== popupId) {
                            document.getElementById(otherId)?.classList.add('d-none');
                        }
                    });
                    popup.classList.toggle('d-none');
                    // Позиционируем под кнопкой
                    const rect = btn.getBoundingClientRect();
                    popup.style.top  = (rect.bottom + window.scrollY + 6) + 'px';
                    popup.style.left = Math.min(rect.left + window.scrollX, window.innerWidth - 280) + 'px';
                });

                close?.addEventListener('click', () => popup.classList.add('d-none'));
            });

            // Клик вне попапа — закрыть все
            document.addEventListener('click', () => {
                pairs.forEach(([, popupId]) => {
                    document.getElementById(popupId)?.classList.add('d-none');
                });
            });
        })();

        // Попап "Ионная активность" в diagnostics_card
        (function initIonActivityPopup() {
            const btn   = document.getElementById('ion-activity-info-btn');
            const popup = document.getElementById('ion-activity-popup');
            const close = document.getElementById('ion-activity-popup-close');
            if (!btn || !popup) return;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                popup.classList.toggle('d-none');
            });
            close?.addEventListener('click', () => popup.classList.add('d-none'));
            document.addEventListener('click', (e) => {
                if (!popup.contains(e.target) && e.target !== btn) {
                    popup.classList.add('d-none');
                }
            });
        })();
})();
