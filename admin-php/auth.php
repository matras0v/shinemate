<?php
if (!defined('SHINEMATE_ADMIN_BOOTSTRAP')) {
    http_response_code(403);
    exit('Forbidden');
}

function admin_start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    session_name(SESSION_NAME);
    session_set_cookie_params([
        'lifetime' => 0,
        // Путь cookie должен буквально совпадать с тем, на каком URL эта
        // папка развёрнута на сервере (см. ADMIN_URL_PATH ниже и раздел
        // про скрытый путь /admin в PROJECT_STATE) — иначе браузер просто
        // не пришлёт cookie обратно и сессия не заработает.
        'path' => ADMIN_URL_PATH,
        'httponly' => true,
        'secure' => $secure,
        // Strict, не Lax: у /admin нет сценария, где вход по ссылке с чужого
        // сайта — легитимный переход (это не публичная страница, на которую
        // может вести внешняя ссылка с ожиданием, что сессия узнается).
        'samesite' => 'Strict',
    ]);
    session_start();
}

/**
 * Реальный IP посетителя — тот же приём, что и в api-php/contact.php:
 * REG.RU отдаёт сайт через nginx перед Apache, реальный IP приходит в
 * X-Forwarded-For.
 */
function admin_client_ip(): string
{
    $xff = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($xff !== '') {
        $first = trim(explode(',', $xff)[0]);
        if (filter_var($first, FILTER_VALIDATE_IP)) {
            return $first;
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/**
 * Токен, который меняется при каждой смене пароля (см. admin_change_
 * password). Создаётся при первом обращении, если файла ещё нет.
 */
function admin_cred_version(): string
{
    if (is_file(CRED_VERSION_FILE)) {
        $v = trim((string) file_get_contents(CRED_VERSION_FILE));
        if ($v !== '') {
            return $v;
        }
    }
    $v = bin2hex(random_bytes(16));
    file_put_contents(CRED_VERSION_FILE, $v, LOCK_EX);
    return $v;
}

function admin_is_logged_in(): bool
{
    if (empty($_SESSION['admin_authed'])) {
        return false;
    }
    // Сессия создана ДО последней смены пароля — считаем её недействительной,
    // даже если по времени бездействия она ещё не истекла. Иначе смена
    // пароля (в т.ч. после подозрения на компрометацию) не отключала бы
    // никакую другую уже открытую сессию, кроме той вкладки, где его меняли.
    if (($_SESSION['cred_version'] ?? null) !== admin_cred_version()) {
        admin_logout();
        return false;
    }
    // Неактивность дольше SESSION_IDLE_SECONDS — тихий логаут: открытая
    // вкладка /admin на чужом или общем компьютере не остаётся
    // авторизованной бессрочно только потому, что вкладку не закрыли.
    $last = $_SESSION['last_activity'] ?? 0;
    if (time() - $last > SESSION_IDLE_SECONDS) {
        admin_logout();
        return false;
    }
    $_SESSION['last_activity'] = time();
    return true;
}

function admin_require_login(): void
{
    if (!admin_is_logged_in()) {
        header('Location: index.php');
        exit;
    }
}

/** Токен на форму — против межсайтовой подделки запроса (CSRF). */
function admin_csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function admin_csrf_check(?string $token): bool
{
    return is_string($token) && !empty($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $token);
}

/**
 * Атомарная запись JSON — тот же приём, что и в catalog.php/api-php.
 */
function admin_write_json_atomic(string $path, array $data): bool
{
    $dir = dirname($path);
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        return false;
    }
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return false;
    }
    $tmp = $path . '.tmp-' . bin2hex(random_bytes(4));
    if (file_put_contents($tmp, $json, LOCK_EX) === false) {
        return false;
    }
    if (!rename($tmp, $path)) {
        @unlink($tmp);
        return false;
    }
    return true;
}

function admin_read_json(string $path): array
{
    if (!is_file($path)) {
        return [];
    }
    $raw = file_get_contents($path);
    $data = $raw !== false ? json_decode($raw, true) : null;
    return is_array($data) ? $data : [];
}

/**
 * Защита от перебора пароля — ПЕРСИСТЕНТНО, в файле по IP, а не в сессии.
 * Раньше счётчик жил в $_SESSION: открыть /admin в приватном окне или
 * просто без старых cookie сбрасывало попытки на ноль, и перебор пароля
 * ничем не ограничивался — клиент прямо указал на этот риск ("любой может
 * набрать /admin и подбирать пароль"). Файл переживает и новую вкладку, и
 * новый браузер, и перезапуск сервера.
 */
function admin_login_locked(): bool
{
    $data = admin_read_json(LOGIN_ATTEMPTS_FILE);
    $ip = admin_client_ip();
    $entry = $data[$ip] ?? null;
    return $entry !== null && ($entry['lockoutUntil'] ?? 0) > time();
}

function admin_register_failed_login(): void
{
    $ip = admin_client_ip();
    $now = time();
    $data = admin_read_json(LOGIN_ATTEMPTS_FILE);

    $entry = $data[$ip] ?? ['attempts' => 0, 'lockoutUntil' => 0];
    $entry['attempts'] = (int)$entry['attempts'] + 1;
    if ($entry['attempts'] >= MAX_LOGIN_ATTEMPTS) {
        $entry['lockoutUntil'] = $now + LOGIN_LOCKOUT_SECONDS;
        $entry['attempts'] = 0;
    }
    $data[$ip] = $entry;

    // Старые IP (давно не пытавшиеся войти) не нужно копить бесконечно.
    foreach ($data as $key => $value) {
        $seenLockout = (int)($value['lockoutUntil'] ?? 0);
        if ($seenLockout < $now - LOGIN_LOCKOUT_SECONDS * 4 && $key !== $ip) {
            unset($data[$key]);
        }
    }

    admin_write_json_atomic(LOGIN_ATTEMPTS_FILE, $data);
    admin_audit_log('login_failed', ['locked' => $entry['lockoutUntil'] > $now]);
    // Небольшая задержка на каждую неудачную попытку — усложняет
    // автоматический перебор, не мешает живому человеку.
    sleep(1);
}

function admin_clear_failed_logins(): void
{
    $ip = admin_client_ip();
    $data = admin_read_json(LOGIN_ATTEMPTS_FILE);
    if (isset($data[$ip])) {
        unset($data[$ip]);
        admin_write_json_atomic(LOGIN_ATTEMPTS_FILE, $data);
    }
}

/**
 * Возвращает 'ok' (сразу залогинен — 2FA не включена), 'need_totp'
 * (пароль верный, но нужен ещё код) или 'fail'. Один и тот же лимит
 * попыток (LOGIN_ATTEMPTS_FILE) считает и неверные пароли, и неверные
 * коды 2FA — это ОДИН бюджет попыток входа на IP, не два независимых.
 */
function admin_login(string $password): string
{
    if (admin_login_locked()) {
        admin_audit_log('login_blocked');
        return 'fail';
    }
    if (!password_verify($password, ADMIN_PASSWORD_HASH)) {
        admin_register_failed_login();
        return 'fail';
    }
    // Регенерация ID сессии сразу на верном пароле — защита от session
    // fixation действует уже на шаге ожидания кода 2FA, а не только после
    // него; admin_complete_login() ниже регенерирует ID ещё раз.
    session_regenerate_id(true);
    admin_clear_failed_logins();

    if (admin_totp_is_enabled()) {
        $_SESSION['pending_2fa'] = true;
        $_SESSION['pending_2fa_since'] = time();
        admin_audit_log('login_password_ok_awaiting_2fa');
        return 'need_totp';
    }

    admin_complete_login();
    return 'ok';
}

/** Второй шаг: только после этого сессия становится по-настоящему авторизованной. */
function admin_complete_login(): void
{
    session_regenerate_id(true);
    $_SESSION['admin_authed'] = true;
    $_SESSION['last_activity'] = time();
    $_SESSION['cred_version'] = admin_cred_version();
    unset($_SESSION['pending_2fa'], $_SESSION['pending_2fa_since']);
    admin_audit_log('login_success');
}

function admin_pending_2fa(): bool
{
    if (empty($_SESSION['pending_2fa'])) {
        return false;
    }
    $since = (int)($_SESSION['pending_2fa_since'] ?? 0);
    if (time() - $since > TOTP_PENDING_SECONDS) {
        unset($_SESSION['pending_2fa'], $_SESSION['pending_2fa_since']);
        return false;
    }
    return true;
}

function admin_logout(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(SESSION_NAME, '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}

/**
 * Смена пароля из самой админки — обязательное требование клиента:
 * хеш, зашитый при установке, должен быть заменяемым без обращения к
 * разработчику. Переписывает config.php на диске (единственное место,
 * где хранится ADMIN_PASSWORD_HASH), атомарно — во временный файл и
 * rename(). Требует текущий пароль: сессия сама по себе не даёт права
 * сменить пароль без подтверждения того, что человек его знает.
 */
function admin_change_password(string $current, string $new): ?string
{
    if (!password_verify($current, ADMIN_PASSWORD_HASH)) {
        return 'Текущий пароль указан неверно.';
    }
    // Нижняя граница — 12 (отсекает откровенно слабые пароли), но в самой
    // форме и подсказке рекомендуем 16+: длина важнее состава символов,
    // искусственные правила "обязательно цифра/спецсимвол" здесь не нужны.
    if (mb_strlen($new) < 12) {
        return 'Новый пароль должен быть не короче 12 символов (рекомендуем 16+).';
    }
    $algo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT;
    $hash = password_hash($new, $algo);
    if ($hash === false) {
        return 'Не удалось сгенерировать хеш пароля.';
    }

    $configPath = __DIR__ . '/config.php';
    $source = file_get_contents($configPath);
    if ($source === false) {
        return 'Не удалось прочитать config.php.';
    }
    $updated = preg_replace(
        "/define\\('ADMIN_PASSWORD_HASH',\\s*'[^']*'\\);/",
        "define('ADMIN_PASSWORD_HASH', '" . addslashes($hash) . "');",
        $source,
        1,
        $count
    );
    if ($updated === null || $count !== 1) {
        return 'Не удалось найти строку с текущим хешем в config.php — смените пароль вручную на сервере.';
    }
    $tmp = $configPath . '.tmp-' . bin2hex(random_bytes(4));
    if (file_put_contents($tmp, $updated, LOCK_EX) === false) {
        return 'Не удалось записать временный файл — проверьте права на запись в папку admin/.';
    }
    if (!rename($tmp, $configPath)) {
        @unlink($tmp);
        return 'Не удалось заменить config.php — проверьте права на запись в папку admin/.';
    }

    // Новый токен версии — любая другая уже открытая сессия (включая
    // потенциально угнанную) перестаёт быть валидной со следующего же
    // запроса. Текущую сессию сразу переводим на новый токен, иначе она
    // отключила бы сама себя же следующим действием.
    $newVersion = bin2hex(random_bytes(16));
    file_put_contents(CRED_VERSION_FILE, $newVersion, LOCK_EX);
    $_SESSION['cred_version'] = $newVersion;

    return null;
}

/* ──────────────────────── Двухфакторная защита (TOTP) ──────────────────────── */

function admin_totp_is_enabled(): bool
{
    $data = admin_read_json(TOTP_SECRET_FILE);
    return !empty($data['enabled']) && !empty($data['secret']);
}

function admin_totp_confirmed_at(): ?int
{
    $data = admin_read_json(TOTP_SECRET_FILE);
    return isset($data['confirmedAt']) ? (int)$data['confirmedAt'] : null;
}

/**
 * Начинает (или перезапускает) настройку: новый секрет сохраняется как
 * ЕЩЁ НЕ включённый (enabled=false) — если 2FA уже была включена другим
 * секретом, она остаётся рабочей, пока не пройдено подтверждение новым
 * кодом (admin_totp_confirm_setup). Так не бывает окна, где 2FA как бы
 * "включена", но верного секрета для неё ещё нет ни на одном устройстве.
 */
function admin_totp_start_setup(): string
{
    $secret = totp_generate_secret();
    $_SESSION['totp_setup_secret'] = $secret;
    $_SESSION['totp_setup_since'] = time();
    return $secret;
}

/**
 * Подтверждение первым верным кодом с телефона — только тогда 2FA
 * реально считается включённой. До этого момента запись в
 * TOTP_SECRET_FILE не создаётся вовсе: "почти настроенная" 2FA без
 * подтверждения не должна требовать код при следующем входе.
 *
 * @return array{0: bool, 1: string[]|null, 2: string|null} [успех, резервные коды (только один раз!), ошибка]
 */
function admin_totp_confirm_setup(string $code): array
{
    $secret = $_SESSION['totp_setup_secret'] ?? null;
    $since = (int)($_SESSION['totp_setup_since'] ?? 0);
    if (!$secret || time() - $since > TOTP_PENDING_SECONDS) {
        unset($_SESSION['totp_setup_secret'], $_SESSION['totp_setup_since']);
        return [false, null, 'Настройка истекла — начните заново.'];
    }
    if (!totp_verify($secret, $code)) {
        return [false, null, 'Код неверный. Проверьте время на телефоне (оно должно быть точным) и попробуйте снова.'];
    }
    admin_write_json_atomic(TOTP_SECRET_FILE, [
        'secret' => $secret,
        'enabled' => true,
        'confirmedAt' => time(),
    ]);
    unset($_SESSION['totp_setup_secret'], $_SESSION['totp_setup_since']);
    $codes = admin_totp_regenerate_recovery_codes();
    admin_audit_log('totp_enabled');
    return [true, $codes, null];
}

function admin_totp_disable(): void
{
    @unlink(TOTP_SECRET_FILE);
    @unlink(TOTP_RECOVERY_FILE);
    admin_audit_log('totp_disabled');
}

/**
 * Отключение 2FA требует ОБА подтверждения — текущий пароль И живой код
 * (TOTP или резервный), не только открытую сессию. Иначе один клик в уже
 * открытой вкладке на чужом/оставленном без присмотра компьютере снимал
 * бы всю дополнительную защиту.
 */
function admin_totp_disable_with_verification(string $currentPassword, string $code): ?string
{
    if (!password_verify($currentPassword, ADMIN_PASSWORD_HASH)) {
        return 'Текущий пароль указан неверно.';
    }
    if (!admin_totp_verify_login_code($code)) {
        return 'Код неверный.';
    }
    admin_totp_disable();
    return null;
}

/** Пробует код как 6-значный TOTP, затем как резервный код XXXX-XXXX. */
function admin_totp_verify_login_code(string $input): bool
{
    $input = trim($input);
    if (preg_match('/^\d{6}$/', $input)) {
        $data = admin_read_json(TOTP_SECRET_FILE);
        $secret = $data['secret'] ?? null;
        if ($secret && totp_verify($secret, $input)) {
            return true;
        }
        return false;
    }
    if (preg_match('/^[A-Z0-9]{4}-[A-Z0-9]{4}$/i', $input)) {
        return admin_totp_consume_recovery_code($input);
    }
    return false;
}

function admin_totp_consume_recovery_code(string $code): bool
{
    $code = strtoupper(trim($code));
    $stored = admin_read_json(TOTP_RECOVERY_FILE);
    $list = $stored['codes'] ?? [];
    foreach ($list as $i => $entry) {
        if (!empty($entry['usedAt'])) {
            continue; // уже потрачен — не может сработать второй раз
        }
        if (password_verify($code, (string)($entry['hash'] ?? ''))) {
            $list[$i]['usedAt'] = time();
            admin_write_json_atomic(TOTP_RECOVERY_FILE, ['codes' => $list]);
            admin_audit_log('recovery_code_used');
            return true;
        }
    }
    return false;
}

/** Новый набор кодов ПОЛНОСТЬЮ заменяет старый — прежние коды сразу перестают работать. */
function admin_totp_regenerate_recovery_codes(): array
{
    $codes = totp_generate_recovery_codes(10);
    $entries = array_map(
        static fn(string $c) => ['hash' => password_hash($c, PASSWORD_DEFAULT), 'usedAt' => null],
        $codes
    );
    admin_write_json_atomic(TOTP_RECOVERY_FILE, ['codes' => $entries]);
    admin_audit_log('totp_recovery_regenerated');
    return $codes;
}

function admin_totp_recovery_remaining(): int
{
    $stored = admin_read_json(TOTP_RECOVERY_FILE);
    $list = $stored['codes'] ?? [];
    return count(array_filter($list, static fn($e) => empty($e['usedAt'])));
}
