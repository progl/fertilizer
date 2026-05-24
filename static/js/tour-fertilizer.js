/**
 * Fertilizer Tour - интерактивное обучение для калькулятора Fertilizer
 * Использует Driver.js + localStorage для хранения состояния
 */
(function() {
    'use strict';

    var TOUR_KEY = 'fert_tour_v2';

    function openModal(selector) {
        var modalEl = document.querySelector(selector);
        if (modalEl && typeof bootstrap !== 'undefined') {
            bootstrap.Modal.getOrCreateInstance(modalEl).show();
        }
    }

    function closeModal(selector) {
        var modalEl = document.querySelector(selector);
        if (modalEl && typeof bootstrap !== 'undefined') {
            var m = bootstrap.Modal.getInstance(modalEl);
            if (m) m.hide();
        }
    }

    function closeAllModals() {
        ['#fertilizerPresetsModal', '#autoSolveModal', '#ohpgShareModal'].forEach(closeModal);
    }

    // Конфигурация шагов
    var TOUR_STEPS = [
        // 1: Обзор тулбара
        {
            element: '.fert-toolbar',
            popover: {
                title: 'Добро пожаловать!',
                description: 'Калькулятор Fertilizer — подбор удобрений для питательного раствора по целевому PPM-профилю. Пройдём по основным элементам.'
            }
        },
        // 2: Единицы (видны в тулбаре)
        {
            element: '#grams_ppm_menu',
            popover: {
                title: 'Единицы измерения',
                description: 'Переключение между ppm и ммоль/л. PPM — привычные единицы, ммоль/л — для точных научных расчётов.'
            }
        },
        // 3: База удобрений
        {
            element: '[data-bs-target="#selectFertilizerModal"]',
            popover: {
                title: 'База удобрений',
                description: 'Выберите удобрения из каталога. Сотни позиций с точным составом элементов. Авторизованные пользователи могут добавлять свои удобрения!'
            }
        },
        // 4: Примеры профилей (открываем модалку)
        {
            element: '[data-bs-target="#fertilizerPresetsModal"]',
            popover: {
                title: 'Готовые примеры',
                description: 'Готовые NPK-профили для разных культур и фаз роста.',
                side: 'bottom'
            },
            onHighlightStarted: () => { openModal('#fertilizerPresetsModal'); }
        },
        // 5: Табы субстратов внутри модалки
        {
            element: '#fert-preset-tabs',
            popover: {
                title: 'Выбор субстрата',
                description: 'ГИДРО, КОКОС, МИНВАТА, БУСТ, КЛАССИКА — каждый субстрат имеет свои оптимальные соотношения NPK.',
                side: 'bottom'
            }
        },
        // 6: Таблица профилей (закрываем на deselected)
        {
            element: '#fert-presets-tbody',
            popover: {
                title: 'Таблица профилей',
                description: 'Рассада, вегетация, цветение. Нажмите «Применить» — калькулятор автоматически подберёт граммы удобрений.',
                side: 'top'
            },
            onDeselected: () => { closeModal('#fertilizerPresetsModal'); }
        },
        // 7: Автоподбор (открываем модалку)
        {
            element: '[data-bs-target="#autoSolveModal"]',
            popover: {
                title: 'Автоподбор рецепта',
                description: 'Умный солвер подберёт комбинацию удобрений под заданный NPK-профиль.',
                side: 'bottom'
            },
            onHighlightStarted: () => { openModal('#autoSolveModal'); }
        },
        // 8: Внутри модалки автоподбора
        {
            element: '#autoSolveModal .modal-body',
            popover: {
                title: 'Настройка автоподбора',
                description: 'Укажите целевые N, P, K, Ca, Mg, S в ppm. Солвер выберет оптимальную комбинацию из вашего набора удобрений.',
                side: 'left'
            },
            onDeselected: () => { closeModal('#autoSolveModal'); }
        },
        // 9: EC
        {
            element: '#ec-input',
            popover: {
                title: 'Целевой EC',
                description: 'Электропроводность раствора — главный показатель концентрации питания. Рассада: 0.8–1.2, вегетация: 1.2–1.8, цветение: 1.8–2.4 mS/cm.'
            }
        },
        // 10: Литры
        {
            element: '#litres',
            popover: {
                title: 'Объём раствора',
                description: 'Объём раствора который вы готовите. Граммы удобрений пересчитываются автоматически при изменении объёма.'
            }
        },
        // 11: Панель параметров
        {
            element: '.summary-panel',
            popover: {
                title: 'Панель параметров',
                description: 'EC, PPM, сумма катионов/анионов и другие параметры раствора в реальном времени.'
            }
        },
        // 12: Соотношения
        {
            element: '.summary-quick',
            popover: {
                title: 'Соотношения элементов',
                description: 'NH₄:NO₃, K:N, K:Ca, K:Mg — ключевые соотношения. Цвет показывает статус: зелёный = норма, жёлтый = внимание, красный = проблема.'
            }
        },
        // 13: Переключение вида
        {
            element: '#view-mode-toggle-btn',
            popover: {
                title: 'Переключение вида',
                description: 'Таблица или карточки — выберите удобный способ просмотра удобрений.'
            }
        },
        // 14: Меню «Ещё» — всё что внутри dropdown
        {
            element: '#fert-more-btn',
            popover: {
                title: 'Меню «Ещё»',
                description: 'Здесь дополнительные инструменты: Матрица соотношений, Диагностика баланса, Замешать в OHPG (расчёт солей), Калькулятор кислот (коррекция pH), Поделиться рецептом, Справка.'
            }
        },
        // 15: Сохранить профиль (только для авторизованных)
        {
            element: '[data-bs-target="#saveProfileModal"]',
            popover: {
                title: 'Сохранить профиль',
                description: 'Сохраните рецепт в своём аккаунте и возвращайтесь к нему позже с любого устройства. Требуется авторизация.',
                side: 'bottom'
            }
        },
        // Финальный шаг — тулбар (не dropdown, всегда виден)
        {
            element: '.fert-toolbar',
            popover: {
                title: 'Готово!',
                description: 'Теперь вы знаете основы калькулятора Fertilizer. Запустить обучение снова — кнопка «Ещё» → «Обучающий тур». Удачных урожаев!'
            }
        }
    ];

    var driverInstance = null;

    function markTourCompleted() {
        try { localStorage.setItem(TOUR_KEY, '1'); } catch {}
    }

    function createDriver() {
        if (typeof window.driver === 'undefined' || !window.driver.js) {
            console.warn('Driver.js не загружен');
            return null;
        }

        var filteredSteps = TOUR_STEPS.filter(function(step) {
            if (!step.element) return true;
            return document.querySelector(step.element) !== null;
        });

        var instance = null;

        instance = window.driver.js.driver({
            showProgress: true,
            progressText: '{{current}} из {{total}}',
            nextBtnText: 'Далее →',
            prevBtnText: '← Назад',
            doneBtnText: 'Готово!',
            animate: true,
            allowClose: true,
            overlayOpacity: 0.7,
            stagePadding: 10,
            stageRadius: 5,
            popoverClass: 'fert-tour-popover',
            onPopoverRender: function(popover, opts) {
                var state = opts && opts.state;
                var footer = popover.footer;
                if (!footer) return;
                var progressEl = footer.querySelector('.driver-popover-progress-text');
                if (!progressEl) return;

                // Убираем старые
                var oldBtn = footer.querySelector('.tour-toc-btn');
                if (oldBtn) oldBtn.remove();
                var oldPanel = popover.wrapper.querySelector('.tour-toc-panel');
                if (oldPanel) oldPanel.remove();

                var currentIdx = (state && state.activeIndex !== undefined) ? state.activeIndex : 0;

                var tocBtn = document.createElement('button');
                tocBtn.type = 'button';
                tocBtn.tabIndex = -1;
                tocBtn.className = 'tour-toc-btn';
                tocBtn.setAttribute('aria-label', 'Оглавление шагов');
                tocBtn.innerHTML = '&#9776; Оглавление';
                tocBtn.style.cssText = [
                    'display:inline-flex', 'align-items:center', 'gap:4px',
                    'padding:3px 8px', 'margin-left:8px',
                    'border-radius:4px', 'border:1px solid #d1d5db',
                    'background:#f9fafb', 'color:#6b7280',
                    'font-size:11px', 'font-weight:500',
                    'cursor:pointer', 'vertical-align:middle',
                    'line-height:1.4', 'flex-shrink:0'
                ].join(';');

                var tocPanel = document.createElement('div');
                tocPanel.className = 'tour-toc-panel';
                tocPanel.style.cssText = [
                    'display:none', 'max-height:200px', 'overflow-y:auto',
                    'margin:8px -16px 0', 'border-top:1px solid #e5e7eb',
                    'background:#f9fafb', 'padding:4px 0'
                ].join(';');

                filteredSteps.forEach(function(step, i) {
                    var item = document.createElement('button');
                    item.type = 'button';
                    item.tabIndex = -1;
                    item.dataset.step = i;
                    var rawTitle = (step.popover && step.popover.title) ? step.popover.title : ('Шаг ' + (i + 1));
                    item.textContent = (i + 1) + '. ' + rawTitle;
                    var isActive = i === currentIdx;
                    item.style.cssText = [
                        'display:block', 'width:100%', 'padding:6px 14px',
                        'background:' + (isActive ? '#667eea' : 'none'),
                        'border:none', 'text-align:left', 'font-size:12px',
                        'color:' + (isActive ? '#fff' : '#374151'),
                        'font-weight:' + (isActive ? '600' : 'normal'),
                        'cursor:pointer', 'white-space:nowrap',
                        'overflow:hidden', 'text-overflow:ellipsis', 'box-sizing:border-box'
                    ].join(';');
                    item.addEventListener('mouseenter', function() {
                        if (!isActive) { this.style.background = '#ede9fe'; this.style.color = '#4c1d95'; }
                    });
                    item.addEventListener('mouseleave', function() {
                        if (!isActive) { this.style.background = 'none'; this.style.color = '#374151'; }
                    });
                    tocPanel.appendChild(item);
                });

                tocBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    tocPanel.style.display = tocPanel.style.display === 'none' ? 'block' : 'none';
                });

                tocPanel.addEventListener('click', function(e) {
                    var item = e.target.closest('[data-step]');
                    if (!item) return;
                    var idx = parseInt(item.dataset.step, 10);
                    tocPanel.style.display = 'none';
                    if (instance && typeof instance.moveTo === 'function') instance.moveTo(idx);
                });

                document.addEventListener('click', function closeToc(e) {
                    if (!tocPanel.contains(e.target) && e.target !== tocBtn) {
                        tocPanel.style.display = 'none';
                        document.removeEventListener('click', closeToc);
                    }
                });

                progressEl.insertAdjacentElement('afterend', tocBtn);
                footer.insertAdjacentElement('beforebegin', tocPanel);
            },
            onDestroyed: function() {
                markTourCompleted();
                closeAllModals();
            },
            steps: filteredSteps
        });

        return instance;
    }

    function startTour() {
        closeAllModals();
        window.scrollTo({ top: 0, behavior: 'instant' });
        driverInstance = createDriver();
        if (driverInstance) driverInstance.drive();
    }

    function initTour() {
        if (!document.querySelector('.fert-toolbar')) return;
        if (typeof window.driver === 'undefined' || !window.driver.js) return;

        var btn = document.getElementById('start-fert-tour-btn');
        if (!btn) return;

        btn.addEventListener('click', startTour);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTour);
    } else {
        setTimeout(initTour, 100);
    }

    window.FertilizerTour = {
        init: initTour,
        reset: function() {
            try {
                localStorage.removeItem(TOUR_KEY);
                console.info('Тур сброшен. Перезагрузите страницу.');
            } catch {}
        },
        start: startTour,
        steps: TOUR_STEPS
    };

})();
