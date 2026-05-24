/**
 * Welcome Tour - интерактивное обучение для калькулятора OHPG v2
 * Использует Driver.js + localStorage для хранения состояния
 */
(function() {
    'use strict';

    // Ключи localStorage
    var TOUR_KEY = 'ohpg_tour_v4';
    var HINT_SHOWN_KEY = 'ohpg_tour_hint_v4';
    var CITRUS_TOUR_KEY = 'ohpg_citrus_tour_v1';

    // Конфигурация шагов основного тура OHPG v2
    var TOUR_STEPS = [
        // Шаг 1: Приветствие
        {
            element: '#calculator-app h1',
            popover: {
                title: 'Добро пожаловать!',
                description: 'Это калькулятор OHPG — расчёт питательных растворов для гидропоники. Давайте пройдём по основным разделам. Для сохранения профилей и журнала нужна авторизация.',
                side: 'bottom',
                align: 'start'
            }
        },
        // Шаг 2: Профили (кнопка) — открываем модалку
        {
            element: '[data-action="showPresetsModal"]',
            popover: {
                title: 'Профили и пресеты',
                description: 'НАЧНИТЕ ЗДЕСЬ — выберите готовый профиль для вашего субстрата. Здесь же можно сохранить и поделиться своим профилем (вкладка «Поделиться» внутри).',
                side: 'bottom'
            },
            onHighlightStarted: () => {
                if (typeof window.showPresetsModal === 'function') {
                    window.showPresetsModal();
                }
            }
        },
        // Шаг 3: Табы субстратов внутри модалки
        {
            element: '.preset-tabs',
            popover: {
                title: 'Выбор субстрата',
                description: 'Выберите тип субстрата: ГИДРО (DWC, NFT, керамзит), КОКОС, МИНВАТА, БУСТ (усиленные профили), КЛАССИКА. Каждый субстрат — свои оптимальные соотношения элементов.',
                side: 'bottom'
            }
        },
        // Шаг 4: Таблица профилей
        {
            element: '.preset-table-wrap',
            popover: {
                title: 'Таблица профилей',
                description: 'Список профилей: рассада, вегетация, цветение. Нажмите «Применить» — калькулятор загрузит все PPM и пересчитает граммы солей под ваши параметры.',
                side: 'top'
            }
        },
        // Шаг 5: Раствор (закрываем модалку)
        {
            element: '#solution-section',
            popover: {
                title: 'Раствор',
                description: 'EC — главный показатель концентрации раствора. PPM — то же в других единицах (EC×700). NH4/NO3 — соотношение форм азота. EC_ION — расчётная проводимость по ионам, П — осмотическое давление.'
            },
            onHighlightStarted: () => {
                if (typeof window.closePresetsModal === 'function') {
                    window.closePresetsModal();
                }
            }
        },
        // Шаг 6: Макроэлементы
        {
            element: '.section-macro',
            popover: {
                title: 'Макроэлементы',
                description: 'N, P, K, Ca, Mg, S — основа питания. Кликните на значение чтобы изменить PPM. Справа — ионный баланс катионов и анионов: чем ближе к нулю, тем точнее раствор.'
            }
        },
        // Шаг 7: Единицы
        {
            element: '#toggle-units',
            popover: {
                title: 'Единицы измерения',
                description: 'Переключение: PPM (привычные единицы) → ммоль/л (научные) → мэкв/л (для ионного баланса). Все расчёты мгновенно пересчитываются.'
            }
        },
        // Шаг 8: Вода и кислоты
        {
            element: '#section-water-acids',
            popover: {
                title: 'Вода и кислоты',
                description: 'Учёт состава воды из водопровода. Если вода содержит Ca или Mg — калькулятор вычтет их из расчёта солей. Кислоты (азотная, фосфорная, серная) добавляют N, P или S.'
            }
        },
        // Шаг 9: Соли
        {
            element: '.section-salts',
            popover: {
                title: 'Соли',
                description: 'Граммы каждой соли на 1 литр готового раствора. Хотите 10 л? Умножьте на 10 — или переключитесь в раздел «Концентраты» ниже для удобного расчёта на большой объём.'
            }
        },
        // Шаг 10: Состав %
        {
            element: '#toggle-percent',
            popover: {
                title: 'Состав солей %',
                description: 'Проценты элементов в соли — берите с упаковки или из паспорта. Кальциевая селитра: Ca≈17%, N≈12%. Точные проценты = точный расчёт. Меняйте под свои реальные удобрения!'
            }
        },
        // Шаг 11: Моноконцентраты
        {
            element: '#toggle-mono',
            popover: {
                title: 'Моноконцентраты',
                description: 'Уже есть готовые маточные растворы? Укажите тару (мл) и концентрацию (г/л). Калькулятор покажет сколько мл каждого моноконцентрата добавить на литр рабочего раствора.'
            }
        },
        // Шаг 12: Микроэлементы
        {
            element: '.section-micro',
            popover: {
                title: 'Микроэлементы',
                description: 'Fe, Mn, B, Zn, Cu, Mo. Введите % с упаковки хелата: Fe-EDTA ~13%, Fe-DTPA ~11%. Можно использовать готовый комплекс микро или отдельные соли — всё считается.'
            }
        },
        // Шаг 13: Корректор
        {
            element: '.ohpg-corrector-header',
            popover: {
                title: 'Корректор раствора',
                description: 'Переход между фазами без полной замены раствора. Пример: вега 10л → плодоношение 12л. Укажите текущий объём и EC — получите сколько долить воды и добавить солей.'
            }
        },
        // Шаг 14: Концентраты А/Б/В
        {
            element: '.section-conc',
            popover: {
                title: 'Концентраты А/Б/В',
                description: 'Сделайте маточные растворы 1 раз → используйте многократно. А-бак: Ca(NO₃)₂. Б-бак: KNO₃, KH₂PO₄, MgSO₄. В-бак: микроэлементы. НИКОГДА не смешивайте А и Б концентрированными!'
            }
        },
        // Шаг 15: Объём концентрата
        {
            element: '.ohpg-conc-fix-wrap',
            popover: {
                title: 'Объём концентрата',
                description: 'На сколько литров делаете концентрат? По умолчанию А/Б на 100л, В на 1000л. Поставьте 5 или 10 литров для небольшого хозяйства — граммы пересчитаются автоматически.'
            }
        },
        // Шаг 16: Практика — профиль цитрусовых (загружаем пример)
        {
            element: '#solution-section',
            popover: {
                title: '🍋 Практика: профиль цитрусовых',
                description: 'Загружен пример для цитрусовых: EC=2.0, N=200, P=40, K=280, Ca=200, Mg=70, S=60. K:Ca≈1.4 — оптимально для лимонов и мандаринов. NH4 не более 5–8% от N, иначе листья желтеют.'
            },
            onHighlightStarted: () => {
                if (typeof window.loadCitrusProfile === 'function') window.loadCitrusProfile();
            }
        },
        // Шаг 17: Проценты солей для цитрусов
        {
            element: '#toggle-percent',
            popover: {
                title: '🍋 Проценты с упаковки',
                description: 'Откройте «Состав %» и сверьте с упаковкой. Ca(NO₃)₂: Ca≈16–17%, N≈11–12%. KNO₃: K≈38–39%, N≈13–14%. Ошибка в 1% даёт погрешность в граммах — всегда вводите реальные цифры с вашего удобрения.'
            }
        },
        // Шаг 18: Микро — Fe для цитрусов
        {
            element: '.section-micro',
            popover: {
                title: '🍋 Микро: железо критично',
                description: 'Fe=2–3 ppm (Fe-EDTA 13%). Цитрусы склонны к хлорозу при дефиците Fe! При pH>6.5 используйте Fe-DTPA (11%) или Fe-EDDHA (6%). Mn=0.5, B=0.3, Zn=0.1 ppm — берите % с упаковки хелата.'
            }
        },
        // Шаг 19: Концентраты для цитрусов
        {
            element: '.section-conc',
            popover: {
                title: '🍋 Концентраты А/Б для цитрусов',
                description: 'Задайте объём 5 литров. А-бак: ТОЛЬКО Ca(NO₃)₂. Б-бак: KNO₃ + KH₂PO₄ + MgSO₄ + K₂SO₄. Микро — в отдельный В-бак. Никогда не смешивайте Ca и сульфаты/фосфаты концентрированными!'
            }
        },
        // Шаг 20: Миксер (если есть)
        {
            element: '.ohpg-mixer-label',
            popover: {
                title: 'Миксер (IoT)',
                description: 'Есть IoT-миксер? Он сам отмерит объёмы концентратов по рецепту. Кнопка «Изготовить» отправляет задание на устройство. Требуется авторизация и подключённый миксер.',
                side: 'top'
            }
        },
        // Шаг 21: Сохранение
        {
            element: '#save-profile-btn',
            popover: {
                title: 'Сохранение профиля',
                description: 'Кнопка дискеты сохраняет текущий профиль. Без авторизации — только в браузере. С авторизацией — на сервере, доступно с любого устройства и можно поделиться.'
            }
        },
        // Финальный шаг
        {
            element: '#start-tour-btn',
            popover: {
                title: 'Обучение завершено!',
                description: 'Вы прошли полный цикл: от профиля до концентратов с примером на цитрусовых. Нажмите эту кнопку в любой момент чтобы пройти снова. Полная инструкция — кнопка ❓ рядом.'
            }
        }
    ];

    // ===== ТУР ПО ЦИТРУСОВЫМ =====
    var CITRUS_TOUR_STEPS = [
        {
            element: '#solution-section',
            popover: {
                title: '🍋 Шаг 1: Профиль цитрусовых',
                description: 'Профиль загружен! Для цитрусовых: EC=2.0, 10л. N=200, P=40, K=280, Ca=200, Mg=70, S=60. Соотношение K:Ca≈1.4 (классика для цитрусов). NH4 не более 5–8% от N.'
            }
        },
        {
            element: '.section-salts',
            popover: {
                title: '🍋 Шаг 2: Таблица солей — г/л',
                description: 'Калькулятор подобрал соли. Столбец «г/л» — граммы на 1 литр готового раствора. Ca(NO₃)₂ ~1.7 г/л, KNO₃ ~1.2 г/л, KH₂PO₄ ~0.27 г/л, MgSO₄ ~0.73 г/л. Для 10 литров умножьте.'
            }
        },
        {
            element: '#toggle-percent',
            popover: {
                title: '🍋 Шаг 2б: Проценты солей',
                description: 'Откройте «Состав %» и проверьте цифры с упаковки. Ca(NO₃)₂: Ca≈16–17%, N≈11–12%. KNO₃: K≈38–39%, N≈13–14%. Если на упаковке другие цифры — меняйте! Точность % = точность расчёта.'
            }
        },
        {
            element: '.section-micro',
            popover: {
                title: '🍋 Шаг 3: Микроэлементы',
                description: 'Fe=3 ppm (Fe-EDTA 13%), Mn=0.5 ppm (13%), B=0.3 ppm (17%). Для цитрусов: Fe особенно важен! При pH>6.5 используйте Fe-DTPA (11%) или Fe-EDDHA (6%). Проценты берите с упаковки хелата.'
            }
        },
        {
            element: '#toggle-mono',
            popover: {
                title: '🍋 Шаг 4: Моноконцентраты',
                description: 'Откройте «Моно концентраты». Задайте для каждой соли: тара (мл) и концентрация (г/л). Пример: Ca(NO₃)₂ — тара 1000 мл, 600 г/л → калькулятор покажет 2.83 мл/л рабочего раствора.'
            }
        },
        {
            element: '.section-conc',
            popover: {
                title: '🍋 Шаг 5а: А/Б на 5л из сухих солей',
                description: 'Концентраты А/Б: задайте объём = 5 литров. А-бак (ТОЛЬКО Ca(NO₃)₂): граммы из таблицы × 5. Б-бак (KNO₃ + KH₂PO₄ + MgSO₄ + К₂SO₄): граммы × 5. Добавляйте в воду 2/3 → соли → доводим до 5л.'
            }
        },
        {
            element: '.section-conc',
            popover: {
                title: '🍋 Шаг 5б: А/Б на 5л из моно (мл)',
                description: 'Если моноконцентраты уже готовы — переключите режим на «мл». Калькулятор покажет: А = X мл раствора Ca(NO₃)₂, Б = Y мл KNO₃ + Z мл KH₂PO₄ + ... Смешайте в порядке: вода → А → Б → вода до 5л.'
            }
        },
        {
            element: '.section-conc',
            popover: {
                title: '🍋 Шаг 5в: А/Б на 5л из граммов моно',
                description: 'Режим «граммы из моно»: отвесьте нужные граммы каждой соли прямо в 5-литровую ёмкость с водой. Удобно когда нет готовых растворов. Для Б-бака: сначала фосфаты, потом сульфаты — никогда Ca вместе с SO₄!'
            }
        },
        {
            element: '#start-tour-btn',
            popover: {
                title: '🍋 Цитрусовый раствор готов!',
                description: 'Вы прошли полный цикл приготовления. Сохраните профиль для следующего раза. Для зимы: снизьте K на 10%, добавьте Ca до 220. Для жаркого лета: EC 2.2–2.5. Удачного урожая цитрусовых!'
            }
        }
    ];

    var driverInstance = null;
    var citrusDriverInstance = null;

    function markTourCompleted() {
        try {
            localStorage.setItem(TOUR_KEY, '1');
        } catch {}
    }

    function createDriver(steps, onDestroyed) {
        if (typeof window.driver === 'undefined' || !window.driver.js) {
            console.warn('Driver.js не загружен');
            return null;
        }

        var filteredSteps = steps.filter(step => {
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
            popoverClass: 'ohpg-tour-popover',
            onPopoverRender: (popover, { state }) => {
                var footer = popover.footer;
                if (!footer) return;
                var progressEl = footer.querySelector('.driver-popover-progress-text');
                if (!progressEl) return;

                // Убираем старые элементы (перерендер на каждый шаг)
                var oldBtn = footer.querySelector('.tour-toc-btn');
                if (oldBtn) oldBtn.remove();
                var oldPanel = popover.wrapper.querySelector('.tour-toc-panel');
                if (oldPanel) oldPanel.remove();

                var currentIdx = (state && state.activeIndex !== undefined) ? state.activeIndex : 0;

                // Кнопка «Оглавление» — инлайн стили чтобы гарантированно работало
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

                // Панель оглавления — скрыта по умолчанию через style.display
                var tocPanel = document.createElement('div');
                tocPanel.className = 'tour-toc-panel';
                tocPanel.style.cssText = [
                    'display:none',
                    'max-height:200px', 'overflow-y:auto',
                    'margin:8px -16px 0',
                    'border-top:1px solid #e5e7eb',
                    'background:#f9fafb',
                    'padding:4px 0'
                ].join(';');

                filteredSteps.forEach(function(step, i) {
                    var item = document.createElement('button');
                    item.type = 'button';
                    item.tabIndex = -1;
                    item.dataset.step = i;
                    var rawTitle = (step.popover && step.popover.title) ? step.popover.title : ('Шаг ' + (i + 1));
                    var title = rawTitle.replace(/^[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, '');
                    item.textContent = (i + 1) + '. ' + title;
                    var isActive = i === currentIdx;
                    item.style.cssText = [
                        'display:block', 'width:100%',
                        'padding:6px 14px',
                        'background:' + (isActive ? '#667eea' : 'none'),
                        'border:none', 'text-align:left',
                        'font-size:12px',
                        'color:' + (isActive ? '#fff' : '#374151'),
                        'font-weight:' + (isActive ? '600' : 'normal'),
                        'cursor:pointer', 'white-space:nowrap',
                        'overflow:hidden', 'text-overflow:ellipsis',
                        'box-sizing:border-box'
                    ].join(';');
                    item.addEventListener('mouseenter', function() {
                        if (!isActive) { this.style.background = '#ede9fe'; this.style.color = '#4c1d95'; }
                    });
                    item.addEventListener('mouseleave', function() {
                        if (!isActive) { this.style.background = 'none'; this.style.color = '#374151'; }
                    });
                    tocPanel.appendChild(item);
                });

                // Тогл панели
                tocBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    tocPanel.style.display = tocPanel.style.display === 'none' ? 'block' : 'none';
                });

                // Навигация по клику на шаг
                tocPanel.addEventListener('click', function(e) {
                    var item = e.target.closest('[data-step]');
                    if (!item) return;
                    var idx = parseInt(item.dataset.step, 10);
                    tocPanel.style.display = 'none';
                    if (instance && typeof instance.moveTo === 'function') {
                        instance.moveTo(idx);
                    }
                });

                // Закрыть при клике снаружи
                document.addEventListener('click', function closeToc(e) {
                    if (!tocPanel.contains(e.target) && e.target !== tocBtn) {
                        tocPanel.style.display = 'none';
                        document.removeEventListener('click', closeToc);
                    }
                });

                progressEl.insertAdjacentElement('afterend', tocBtn);
                footer.insertAdjacentElement('beforebegin', tocPanel);
            },
            onDestroyed: () => {
                if (onDestroyed) onDestroyed();
                if (typeof window.closePresetsModal === 'function') {
                    window.closePresetsModal();
                }
            },
            steps: filteredSteps
        });

        return instance;
    }

    function startTour() {
        window.scrollTo({ top: 0, behavior: 'instant' });
        driverInstance = createDriver(TOUR_STEPS, markTourCompleted);
        if (driverInstance) driverInstance.drive();
    }

    /**
     * Запустить тур по цитрусовым.
     * Перед запуском — загружает профиль цитрусовых через window.loadCitrusProfile (если доступна).
     */
    function startCitrusTour() {
        if (typeof window.loadCitrusProfile === 'function') {
            window.loadCitrusProfile();
        }
        citrusDriverInstance = createDriver(CITRUS_TOUR_STEPS, () => {
            try { localStorage.setItem(CITRUS_TOUR_KEY, '1'); } catch {}
        });
        if (citrusDriverInstance) {
            citrusDriverInstance.drive();
        }
    }

    function initTour() {
        var isV2 = document.getElementById('calculator-app') !== null;
        if (!isV2) return;

        if (typeof window.driver === 'undefined' || !window.driver.js) {
            console.warn('Driver.js не загружен');
            return;
        }

        var btn = document.getElementById('start-tour-btn');
        if (!btn) return;

        // Создаём driver только по клику — не на загрузке страницы
        btn.addEventListener('click', startTour);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTour);
    } else {
        setTimeout(initTour, 100);
    }

    window.WelcomeTour = {
        init: initTour,
        reset: () => {
            try {
                localStorage.removeItem(TOUR_KEY);
                localStorage.removeItem(HINT_SHOWN_KEY);
                localStorage.removeItem(CITRUS_TOUR_KEY);
                console.info('Тур сброшен. Перезагрузите страницу.');
            } catch {}
        },
        start: startTour,
        startCitrusTour: startCitrusTour,
        steps: TOUR_STEPS,
        citrusSteps: CITRUS_TOUR_STEPS
    };

})();
