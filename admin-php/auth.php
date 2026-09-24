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
        'path' => '/admin/',
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

function admin_is_logged_in(): bool
{
    if (empty($_SESSION['admin_authed'])) {
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

function admin_login(string $password): bool
{
    if (admin_login_locked()) {
        return false;
    }
    if (!password_verify($password, ADMIN_PASSWORD_HASH)) {
        admin_register_failed_login();
        return false;
    }
    // Регенерация ID сессии на успешном входе — защита от session fixation.
    session_regenerate_id(true);
    $_SESSION['admin_authed'] = true;
    $_SESSION['last_activity'] = time();
    admin_clear_failed_logins();
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
    if (mb_strlen($new) < 10) {
        return 'Новый пароль должен быть не короче 10 символов.';
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
    return null;
}
