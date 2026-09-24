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
        'samesite' => 'Lax',
    ]);
    session_start();
}

function admin_is_logged_in(): bool
{
    return !empty($_SESSION['admin_authed']);
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
 * Простая защита от перебора пароля: считаем неудачные попытки в самой
 * сессии (у анонима сессия начинается пустой) и притормаживаем/блокируем
 * после серии неудач. Не претендует на промышленный уровень — для
 * одного административного пароля на маленьком сайте этого достаточно.
 */
function admin_login_locked(): bool
{
    $until = $_SESSION['lockout_until'] ?? 0;
    return $until > time();
}

function admin_register_failed_login(): void
{
    $_SESSION['attempts'] = ($_SESSION['attempts'] ?? 0) + 1;
    if ($_SESSION['attempts'] >= MAX_LOGIN_ATTEMPTS) {
        $_SESSION['lockout_until'] = time() + LOGIN_LOCKOUT_SECONDS;
        $_SESSION['attempts'] = 0;
    }
    // Небольшая задержка на каждую неудачную попытку — усложняет
    // автоматический перебор, не мешает живому человеку.
    sleep(1);
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
    $_SESSION['attempts'] = 0;
    unset($_SESSION['lockout_until']);
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
