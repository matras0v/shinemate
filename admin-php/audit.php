<?php
if (!defined('SHINEMATE_ADMIN_BOOTSTRAP')) {
    http_response_code(403);
    exit('Forbidden');
}

/**
 * Минимальный журнал: неудачные/успешные входы и успешные изменения
 * (цена/фото/пароль) — время, IP, что произошло. Не смешивается с
 * login-attempts.json (тот — рабочее состояние лок-аута, этот — только
 * для последующего просмотра человеком через FTP/SSH, если понадобится
 * разобраться, кто и когда что менял). Файл не отдаётся по HTTP — тот же
 * .htaccess-запрет, что и у остальных служебных файлов (см. admin-php/
 * .htaccess), плюс собственный guard-константой, как везде в этой папке.
 *
 * Формат — JSON-строки (одна запись на строку), не единый JSON-массив:
 * дозапись всегда идёт в конец файла (FILE_APPEND), не требует ни чтения,
 * ни повторной сериализации всего файла на каждую запись.
 */
function admin_audit_log(string $event, array $context = []): void
{
    $entry = array_merge([
        'ts' => date('Y-m-d H:i:s'),
        'ip' => admin_client_ip(),
        'event' => $event,
    ], $context);

    $line = json_encode($entry, JSON_UNESCAPED_UNICODE) . "\n";
    @file_put_contents(AUDIT_LOG_FILE, $line, FILE_APPEND | LOCK_EX);

    admin_trim_audit_log();
}

/** Не даём файлу расти бесконечно — оставляем только последние AUDIT_LOG_MAX_LINES. */
function admin_trim_audit_log(): void
{
    if (!is_file(AUDIT_LOG_FILE)) {
        return;
    }
    // Дешёвая проверка перед тем, как читать весь файл на каждую запись —
    // считаем размер в байтах, а не строки, точность здесь не критична.
    if (filesize(AUDIT_LOG_FILE) < AUDIT_LOG_MAX_LINES * 300) {
        return;
    }
    $lines = @file(AUDIT_LOG_FILE, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false || count($lines) <= AUDIT_LOG_MAX_LINES) {
        return;
    }
    $trimmed = array_slice($lines, -AUDIT_LOG_MAX_LINES);
    $tmp = AUDIT_LOG_FILE . '.tmp-' . bin2hex(random_bytes(4));
    file_put_contents($tmp, implode("\n", $trimmed) . "\n", LOCK_EX);
    rename($tmp, AUDIT_LOG_FILE);
}

/** Человекочитаемая подпись события для таблицы "Последние события безопасности". */
function admin_event_label(string $event): string
{
    $labels = [
        'login_success' => 'Успешный вход',
        'login_failed' => 'Неверный пароль/код',
        'login_blocked' => 'Вход заблокирован (превышен лимит попыток)',
        'login_password_ok_awaiting_2fa' => 'Пароль верный, ожидание кода 2FA',
        'save_price' => 'Изменена цена/наличие',
        'upload_photo' => 'Загружено фото',
        'restore_photo' => 'Восстановлено фото по умолчанию',
        'change_password' => 'Изменён пароль',
        'totp_enabled' => 'Включена двухфакторная защита',
        'totp_disabled' => 'Отключена двухфакторная защита',
        'totp_recovery_regenerated' => 'Созданы новые резервные коды',
        'recovery_code_used' => 'Использован резервный код',
    ];
    return $labels[$event] ?? $event;
}

/**
 * Последние N записей для раздела "Последние события безопасности" в
 * самой панели — только для чтения авторизованным клиентом, файл на
 * диске как был недоступен по HTTP, так и остаётся (см. .htaccess).
 */
function admin_read_audit_tail(int $limit = 20): array
{
    if (!is_file(AUDIT_LOG_FILE)) {
        return [];
    }
    $lines = @file(AUDIT_LOG_FILE, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return [];
    }
    $tail = array_slice($lines, -$limit);
    $entries = [];
    foreach (array_reverse($tail) as $line) {
        $decoded = json_decode($line, true);
        if (is_array($decoded)) {
            $entries[] = $decoded;
        }
    }
    return $entries;
}
