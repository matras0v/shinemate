<?php
if (!defined('SHINEMATE_ADMIN_BOOTSTRAP')) {
    http_response_code(403);
    exit('Forbidden');
}

/**
 * Только безопасные для показа факты о сервере — ни путей, ни версий
 * ОС/Apache, ни чего-либо, что можно было бы использовать для разведки
 * перед атакой. Смысл раздела — дать однозначный ответ "работает / не
 * работает" сразу после заливки на прод, а не после того, как клиент
 * напишет "форма не пришла".
 */
function admin_diagnostics(): array
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    return [
        ['label' => 'Версия PHP', 'ok' => version_compare(PHP_VERSION, '8.0', '>='), 'value' => PHP_VERSION],
        ['label' => 'HTTPS активен', 'ok' => $https, 'value' => $https ? 'да' : 'нет'],
        [
            'label' => 'Папка data/ доступна для записи',
            'ok' => is_dir(dirname(OVERRIDES_FILE)) && is_writable(dirname(OVERRIDES_FILE)),
            'value' => is_dir(dirname(OVERRIDES_FILE)) ? (is_writable(dirname(OVERRIDES_FILE)) ? 'да' : 'нет прав') : 'папки нет',
        ],
        [
            'label' => 'Папка для фото товаров доступна для записи',
            'ok' => is_dir(MEDIA_DIR) ? is_writable(MEDIA_DIR) : is_writable(dirname(MEDIA_DIR)),
            'value' => is_dir(MEDIA_DIR) ? (is_writable(MEDIA_DIR) ? 'да' : 'нет прав') : 'будет создана при первой загрузке',
        ],
        ['label' => 'Расширение GD (обработка фото)', 'ok' => function_exists('imagecreatefromstring'), 'value' => function_exists('imagecreatefromstring') ? 'есть' : 'нет'],
        ['label' => 'Функция mail() доступна', 'ok' => function_exists('mail'), 'value' => function_exists('mail') ? 'есть' : 'нет'],
        ['label' => 'Получатель заявок', 'ok' => true, 'value' => CONTACT_TO],
        ['label' => 'Адрес отправителя писем', 'ok' => true, 'value' => CONTACT_FROM],
        ['label' => 'Получатель кода входа', 'ok' => true, 'value' => admin_mask_email(admin_admin_email())],
        ['label' => 'Подтверждение по email при входе', 'ok' => REQUIRE_EMAIL_2FA, 'value' => REQUIRE_EMAIL_2FA ? 'требуется' : 'временно отключено'],
        ['label' => 'Текущий хост', 'ok' => true, 'value' => (string)($_SERVER['HTTP_HOST'] ?? '—')],
    ];
}
