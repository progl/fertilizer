/**
 * Fertilizer ShortLink Module
 * Создание коротких ссылок через новый API /calc/api/shortlink/
 */
(function() {
    'use strict';

    const API_URL = '/calc/api/shortlink/';

    document.addEventListener('DOMContentLoaded', () => {
        initModal();
    });

    // ========== CSRF ==========
    function getCsrfToken() {
        const cookie = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
        return cookie ? cookie.split('=')[1] : '';
    }

    // ========== Получение данных Fertilizer ==========
    // Формат совместим с loadTableFromURL в calc_fert.js: {data: [{f, g, l}]}
    function getFertilizerData() {
        const paramsObject = { data: [] };
        const litres = parseFloat($('#litres').val()) || 1;

        // Собираем данные из таблицы удобрений
        $('.fert > tbody > tr:not(#sum-row):not(#comp-row)').each(function() {
            const row = $(this);
            const fertilizerId = row.find('.fertilizer-name').data('pk');
            const grams = parseFloat(row.find('.grams-input').val()) || 0;

            if (fertilizerId && grams > 0) {
                paramsObject.data.push({
                    f: fertilizerId,
                    g: grams,
                    l: litres
                });
            }
        });

        return paramsObject;
    }

    function getFertilizerCount() {
        let count = 0;
        $('.fert > tbody > tr:not(#sum-row):not(#comp-row)').each(function() {
            const grams = parseFloat($(this).find('.grams-input').val()) || 0;
            if (grams > 0) count++;
        });
        return count;
    }

    // ========== Загрузка списка ссылок ==========
    async function loadLinksToSelect(selectElement) {
        try {
            // Фильтруем на сервере по типу fertilizer
            const response = await fetch('/calc/api/shortlink/my/?type=fertilizer', {
                headers: { 'X-CSRFToken': getCsrfToken() }
            });
            const result = await response.json();

            // Очищаем и заполняем селект
            selectElement.innerHTML = '<option value="" selected>+ Создать новую ссылку</option>';

            if (result.success && result.links && result.links.length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = 'Мои ссылки Fertilizer';

                result.links.forEach(link => {
                    const option = document.createElement('option');
                    option.value = link.code;
                    option.textContent = link.title || ('Ссылка ' + link.code);
                    option.dataset.code = link.code;
                    optgroup.appendChild(option);
                });

                selectElement.appendChild(optgroup);
            }
        } catch (err) {
            console.warn('[FertilizerShortlink] Error loading links:', err);
        }
    }

    // ========== Модал ==========
    function initModal() {
        const modal = document.getElementById('linkModal');
        if (!modal) return;

        const form = document.getElementById('linkForm');
        const urlInput = document.getElementById('linkUrl');
        const nameInput = document.getElementById('linkName');
        const shortNameInput = document.getElementById('linkShortName');
        const submitBtn = document.getElementById('linkSubmit');
        const errorDiv = document.getElementById('linkErrors');
        const linkSelect = document.getElementById('linkSelect');

        // Скрываем поле короткого имени (генерируется автоматически на сервере)
        const shortNameGroup = shortNameInput?.closest('.mb-3');
        if (shortNameGroup) {
            shortNameGroup.style.display = 'none';
            shortNameInput.removeAttribute('required');
        }

        // Делаем URL readonly (не нужен для ShortLink API)
        if (urlInput) {
            urlInput.readOnly = true;
            urlInput.removeAttribute('required');
            urlInput.placeholder = 'Данные из таблицы';
        }

        // Загрузка при открытии модала
        modal.addEventListener('show.bs.modal', async () => {
            // Очищаем форму
            form.reset();
            errorDiv.classList.add('d-none');
            errorDiv.innerHTML = '';

            // Показываем текущий URL (для информации)
            const fertCount = getFertilizerCount();
            const litres = parseFloat($('#litres').val()) || 1;
            if (fertCount > 0) {
                urlInput.value = `${fertCount} удобр. × ${litres} л`;
            } else {
                urlInput.value = 'Добавьте удобрения в таблицу';
            }

            // Загружаем список ссылок пользователя
            if (linkSelect) {
                await loadLinksToSelect(linkSelect);
            }
        });

        // При выборе ссылки из селекта
        if (linkSelect) {
            linkSelect.addEventListener('change', function() {
                const selectedCode = this.value;
                if (!selectedCode) {
                    nameInput.value = '';
                    submitBtn.innerHTML = '<i class="bi bi-check-lg"></i> Сохранить';
                    return;
                }

                // Заполняем название
                const selectedOption = this.options[this.selectedIndex];
                nameInput.value = selectedOption.textContent;
                submitBtn.innerHTML = '<i class="bi bi-check-lg"></i> Обновить';
            });
        }

        // Отправка формы
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fertData = getFertilizerData();
            if (fertData.data.length === 0) {
                showError(errorDiv, 'Добавьте хотя бы одно удобрение в таблицу');
                return;
            }

            const title = nameInput.value.trim();
            const selectedCode = linkSelect ? linkSelect.value : '';
            const isUpdate = !!selectedCode;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Сохранение...';
            errorDiv.classList.add('d-none');

            try {
                let response;

                if (isUpdate) {
                    // Обновление существующей ссылки
                    response = await fetch(`${API_URL}${selectedCode}/update/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCsrfToken()
                        },
                        body: JSON.stringify({
                            data: fertData,
                            title: title
                        })
                    });
                } else {
                    // Создание новой ссылки
                    response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCsrfToken()
                        },
                        body: JSON.stringify({
                            data: fertData,
                            title: title,
                            link_type: 'fertilizer',
                            permanent: true // Авторизованные пользователи получают постоянную ссылку
                        })
                    });
                }

                const result = await response.json();

                if (result.success) {
                    const shortUrl = window.location.origin + '/s/' + result.code;

                    // Закрываем модал
                    const bsModal = bootstrap.Modal.getInstance(modal);
                    bsModal.hide();

                    // Копируем ссылку в буфер
                    try {
                        await navigator.clipboard.writeText(shortUrl);
                        showToast(`Ссылка скопирована: ${shortUrl}`, 'success');
                    } catch (_clipErr) {
                        prompt('Скопируйте ссылку:', shortUrl);
                    }
                } else {
                    showError(errorDiv, result.error || 'Ошибка сохранения');
                }
            } catch (err) {
                console.error('[FertilizerShortlink] Save error:', err);
                showError(errorDiv, 'Ошибка сохранения: ' + err.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-check-lg"></i> Сохранить';
            }
        });
    }

    function showError(container, message) {
        container.classList.remove('d-none');
        container.innerHTML = message;
    }

    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (container) {
            const toast = document.createElement('div');
            toast.className = `alert alert-${type} alert-dismissible fade show`;
            toast.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
            container.appendChild(toast);
            setTimeout(() => toast.remove(), 5000);
        } else {
            console.log(`[${type}] ${message}`);
            if (type === 'success') {
                alert(message);
            }
        }
    }
})();
