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
 * Возвращает 'ok' (пароль верный и это всё, что нужно — либо
 * REQUIRE_EMAIL_2FA=false, см. ниже), 'need_otp' (пароль верный, код уже
 * отправлен на почту) или 'fail'. Один и тот же лимит попыток
 * (LOGIN_ATTEMPTS_FILE) считает и неверные пароли, и неверные коды —
 * это ОДИН бюджет попыток входа на IP, не два независимых.
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
    // fixation действует уже на шаге ожидания кода, а не только после
    // него; admin_complete_login() ниже регенерирует ID ещё раз.
    session_regenerate_id(true);
    admin_clear_failed_logins();

    // ВРЕМЕННЫЙ режим передачи клиенту (см. config.php): вся реализация
    // кода на email ниже никуда не делась и продолжает работать в обычном
    // порядке при REQUIRE_EMAIL_2FA=true — здесь просто пропускается сам
    // запрос кода, если константа сейчас false. Ни URL, ни cookie, ни
    // заголовок запроса на это не влияют — только серверная константа.
    if (!REQUIRE_EMAIL_2FA) {
        admin_complete_login();
        return 'ok';
    }

    $_SESSION['pending_2fa'] = true;
    $_SESSION['pending_2fa_since'] = time();
    admin_send_login_otp();
    admin_audit_log('login_password_ok_awaiting_otp');
    return 'need_otp';
}

/** Второй шаг (или сразу после пароля, если REQUIRE_EMAIL_2FA=false) — только после этого сессия становится по-настоящему авторизованной. */
function admin_complete_login(): void
{
    session_regenerate_id(true);
    $_SESSION['admin_authed'] = true;
    $_SESSION['last_activity'] = time();
    $_SESSION['cred_version'] = admin_cred_version();
    unset($_SESSION['pending_2fa'], $_SESSION['pending_2fa_since']);
    admin_audit_log('login_success', ['emailCode' => REQUIRE_EMAIL_2FA ? 'required' : 'temporarily_disabled']);
}

function admin_pending_2fa(): bool
{
    if (empty($_SESSION['pending_2fa'])) {
        return false;
    }
    $since = (int)($_SESSION['pending_2fa_since'] ?? 0);
    if (time() - $since > OTP_PENDING_SECONDS) {
        unset($_SESSION['pending_2fa'], $_SESSION['pending_2fa_since'], $_SESSION['otp_hash'], $_SESSION['otp_since'], $_SESSION['otp_attempts'], $_SESSION['otp_resend_count']);
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

/* ──────────────────────── Код входа на email (единственный администратор) ──────────────────────── */

/**
 * Ровно ОДИН администратор — email хранится только в config.php на
 * сервере, посетитель никогда не может ни ввести, ни увидеть его целиком
 * (см. admin_mask_email). Сменить можно только изнутри уже авторизованной
 * панели через admin_email_change_* ниже.
 */
function admin_admin_email(): string
{
    return defined('ADMIN_EMAIL') ? ADMIN_EMAIL : '';
}

/** "a***@company.ru" — для отображения в уже авторизованной/предавторизованной форме. */
function admin_mask_email(string $email): string
{
    $at = strpos($email, '@');
    if ($at === false || $at === 0) {
        return '···';
    }
    $local = mb_substr(substr($email, 0, $at), 0, 1);
    $domain = substr($email, $at); // включая @
    return $local . '***' . $domain;
}

function admin_otp_generate_code(): string
{
    return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

/**
 * Генерирует код, отправляет ТОЛЬКО на предустановленный admin-email
 * (никогда — на адрес из запроса посетителя, такого поля в форме входа
 * вообще нет) и кладёт в сессию только ХЕШ кода, не сам код.
 */
function admin_send_login_otp(): void
{
    $code = admin_otp_generate_code();
    $_SESSION['otp_hash'] = password_hash($code, PASSWORD_DEFAULT);
    $_SESSION['otp_since'] = time();
    $_SESSION['otp_attempts'] = 0;
    admin_send_mail(
        admin_admin_email(),
        'Код входа — панель ShineMate',
        "Код для входа в панель управления каталогом: {$code}\n\n"
        . 'Код действует ' . (int) round(OTP_PENDING_SECONDS / 60) . " минут.\n"
        . "Если вы не пытались войти в панель — просто игнорируйте это письмо, вход без этого кода невозможен."
    );
    admin_audit_log('otp_sent');
}

/**
 * Повторная отправка (например, письмо не пришло/попало в спам) — не
 * более 3 раз за одну "подвисшую" попытку входа и не чаще раза в 30 сек,
 * чтобы не заваливать почту и не превращать это в лазейку для рассылки.
 */
function admin_resend_login_otp(): ?string
{
    if (!admin_pending_2fa()) {
        return 'Сессия входа истекла. Войдите заново.';
    }
    $sentAt = (int) ($_SESSION['otp_since'] ?? 0);
    if (time() - $sentAt < 30) {
        return 'Код уже отправлен — подождите немного перед повторной отправкой.';
    }
    $count = (int) ($_SESSION['otp_resend_count'] ?? 0);
    if ($count >= 3) {
        return 'Превышен лимит повторных отправок для этой попытки входа. Подождите несколько минут и войдите заново, либо используйте резервный код.';
    }
    $_SESSION['otp_resend_count'] = $count + 1;
    admin_send_login_otp();
    return null;
}

/** Пробует код как 6-значный код из письма, затем как резервный код XXXX-XXXX. */
function admin_otp_verify_login_code(string $input): bool
{
    $input = trim($input);
    if (preg_match('/^\d{6}$/', $input)) {
        $hash = $_SESSION['otp_hash'] ?? null;
        $since = (int) ($_SESSION['otp_since'] ?? 0);
        if (!$hash || time() - $since > OTP_PENDING_SECONDS) {
            return false;
        }
        if (password_verify($input, $hash)) {
            unset($_SESSION['otp_hash'], $_SESSION['otp_since'], $_SESSION['otp_attempts'], $_SESSION['otp_resend_count']);
            return true;
        }
        return false;
    }
    if (preg_match('/^[A-Z0-9]{4}-[A-Z0-9]{4}$/i', $input)) {
        return admin_otp_consume_recovery_code($input);
    }
    return false;
}

function admin_otp_consume_recovery_code(string $code): bool
{
    $code = strtoupper(trim($code));
    $stored = admin_read_json(OTP_RECOVERY_FILE);
    $list = $stored['codes'] ?? [];
    foreach ($list as $i => $entry) {
        if (!empty($entry['usedAt'])) {
            continue; // уже потрачен — не может сработать второй раз
        }
        if (password_verify($code, (string) ($entry['hash'] ?? ''))) {
            $list[$i]['usedAt'] = time();
            admin_write_json_atomic(OTP_RECOVERY_FILE, ['codes' => $list]);
            admin_audit_log('recovery_code_used');
            return true;
        }
    }
    return false;
}

/**
 * Тестовое письмо для раздела «Безопасность» — проверить, что код входа
 * реально доходит на текущий email, не трогая состояние логина.
 * Одноразовый код нигде не сохраняется — этим письмом залогиниться нельзя,
 * оно только подтверждает доставку.
 */
function admin_send_test_otp(): bool
{
    $code = admin_otp_generate_code();
    $ok = admin_send_mail(
        admin_admin_email(),
        'Тестовый код — панель ShineMate',
        "Это ПРОВЕРОЧНОЕ письмо, оно не подходит для входа.\n"
        . "Если вы его получили — доставка кодов входа работает исправно.\n\n"
        . "Пример кода: {$code}\nВремя: " . date('Y-m-d H:i:s')
    );
    admin_audit_log('test_otp_sent', ['ok' => $ok]);
    return $ok;
}

/** Новый набор кодов ПОЛНОСТЬЮ заменяет старый — прежние коды сразу перестают работать. */
function admin_otp_regenerate_recovery_codes(): array
{
    $codes = admin_generate_recovery_codes(10);
    $entries = array_map(
        static fn(string $c) => ['hash' => password_hash($c, PASSWORD_DEFAULT), 'usedAt' => null],
        $codes
    );
    admin_write_json_atomic(OTP_RECOVERY_FILE, ['codes' => $entries]);
    admin_audit_log('otp_recovery_regenerated');
    return $codes;
}

function admin_otp_recovery_remaining(): int
{
    $stored = admin_read_json(OTP_RECOVERY_FILE);
    $list = $stored['codes'] ?? [];
    return count(array_filter($list, static fn($e) => empty($e['usedAt'])));
}

/** Формат XXXX-XXXX из алфавита без 0/O/1/I — легче переписать от руки. */
function admin_generate_recovery_codes(int $count = 10): array
{
    $alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    $codes = [];
    for ($i = 0; $i < $count; $i++) {
        $raw = '';
        for ($j = 0; $j < 8; $j++) {
            $raw .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
        $codes[] = substr($raw, 0, 4) . '-' . substr($raw, 4, 4);
    }
    return $codes;
}

/* ──────────────────────── Смена email для кода входа ──────────────────────── */
/*
 * Единственное место, где новый email вообще где-либо вводится — форма
 * ТОЛЬКО внутри уже полностью авторизованной сессии (admin_require_login()
 * вызывается в index.php перед каждым из этих действий). Ровно 4 шага
 * из брифа: текущий пароль → код на СТАРЫЙ email → ввод нового адреса →
 * код на НОВЫЙ email → только тогда запись в config.php обновляется.
 * Общий бюджет попыток (LOGIN_ATTEMPTS_FILE) действует и здесь — неверный
 * пароль или неверный код на любом из шагов считается как обычная
 * неудачная попытка входа.
 */

function admin_email_change_stage(): ?string
{
    $stage = $_SESSION['email_change_stage'] ?? null;
    $since = (int) ($_SESSION['email_change_since'] ?? 0);
    if ($stage && time() - $since > OTP_PENDING_SECONDS) {
        admin_email_change_cancel();
        return null;
    }
    return is_string($stage) ? $stage : null;
}

function admin_email_change_cancel(): void
{
    unset(
        $_SESSION['email_change_stage'],
        $_SESSION['email_change_since'],
        $_SESSION['email_change_otp_hash'],
        $_SESSION['email_change_new_email'],
        $_SESSION['email_change_attempts']
    );
}

/** Шаг 1: текущий пароль → код уходит на СТАРЫЙ (текущий) email. */
function admin_email_change_start(string $currentPassword): ?string
{
    if (!password_verify($currentPassword, ADMIN_PASSWORD_HASH)) {
        admin_register_failed_login();
        return 'Текущий пароль указан неверно.';
    }
    $code = admin_otp_generate_code();
    $_SESSION['email_change_stage'] = 'verify_old';
    $_SESSION['email_change_since'] = time();
    $_SESSION['email_change_otp_hash'] = password_hash($code, PASSWORD_DEFAULT);
    $_SESSION['email_change_attempts'] = 0;
    admin_send_mail(
        admin_admin_email(),
        'Код подтверждения — смена email в панели ShineMate',
        "Код подтверждения для смены email, на который приходит код входа: {$code}\n\n"
        . 'Действует ' . (int) round(OTP_PENDING_SECONDS / 60) . " минут.\n"
        . 'Если вы не запрашивали смену email — не вводите этот код и смените пароль.'
    );
    admin_audit_log('email_change_started');
    return null;
}

/** Шаг 2: код с текущего email → переход к вводу нового адреса. */
function admin_email_change_verify_old(string $code): ?string
{
    if (admin_email_change_stage() !== 'verify_old') {
        return 'Сессия смены email истекла — начните заново.';
    }
    $hash = $_SESSION['email_change_otp_hash'] ?? null;
    if (!$hash || !password_verify(trim($code), $hash)) {
        admin_register_failed_login();
        $_SESSION['email_change_attempts'] = (int) ($_SESSION['email_change_attempts'] ?? 0) + 1;
        if ($_SESSION['email_change_attempts'] >= 6) {
            admin_email_change_cancel();
            return 'Слишком много неверных попыток — начните смену email заново.';
        }
        return 'Код неверный.';
    }
    $_SESSION['email_change_stage'] = 'enter_new_email';
    $_SESSION['email_change_since'] = time();
    unset($_SESSION['email_change_otp_hash'], $_SESSION['email_change_attempts']);
    admin_audit_log('email_change_old_verified');
    return null;
}

/** Шаг 3: новый адрес → код уходит на НЕГО (первый и единственный раз, когда он используется до подтверждения). */
function admin_email_change_request_new(string $newEmail): ?string
{
    if (admin_email_change_stage() !== 'enter_new_email') {
        return 'Сессия смены email истекла — начните заново.';
    }
    $newEmail = trim($newEmail);
    if (!filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
        return 'Некорректный email.';
    }
    $code = admin_otp_generate_code();
    $_SESSION['email_change_stage'] = 'verify_new';
    $_SESSION['email_change_since'] = time();
    $_SESSION['email_change_new_email'] = $newEmail;
    $_SESSION['email_change_otp_hash'] = password_hash($code, PASSWORD_DEFAULT);
    $_SESSION['email_change_attempts'] = 0;
    admin_send_mail(
        $newEmail,
        'Код подтверждения нового email — панель ShineMate',
        "Код подтверждения: {$code}\n\n"
        . 'Этот адрес станет новым получателем кодов входа в панель управления ShineMate, если вы введёте код в течение '
        . (int) round(OTP_PENDING_SECONDS / 60) . " минут.\n"
        . 'Если это не вы — просто игнорируйте письмо, адрес не будет изменён.'
    );
    admin_audit_log('email_change_new_requested');
    return null;
}

/** Шаг 4: код с нового адреса → только теперь ADMIN_EMAIL реально обновляется на диске. */
function admin_email_change_verify_new(string $code): ?string
{
    if (admin_email_change_stage() !== 'verify_new') {
        return 'Сессия смены email истекла — начните заново.';
    }
    $hash = $_SESSION['email_change_otp_hash'] ?? null;
    $newEmail = $_SESSION['email_change_new_email'] ?? null;
    if (!$hash || !$newEmail || !password_verify(trim($code), $hash)) {
        admin_register_failed_login();
        $_SESSION['email_change_attempts'] = (int) ($_SESSION['email_change_attempts'] ?? 0) + 1;
        if ($_SESSION['email_change_attempts'] >= 6) {
            admin_email_change_cancel();
            return 'Слишком много неверных попыток — начните смену email заново.';
        }
        return 'Код неверный.';
    }
    $result = admin_write_admin_email($newEmail);
    admin_email_change_cancel();
    if ($result !== null) {
        return $result;
    }
    admin_audit_log('email_change_completed');
    return null;
}

/**
 * Переписывает config.php на диске — тот же атомарный приём (tmp + rename),
 * что и admin_change_password() для ADMIN_PASSWORD_HASH.
 */
function admin_write_admin_email(string $newEmail): ?string
{
    $configPath = __DIR__ . '/config.php';
    $source = file_get_contents($configPath);
    if ($source === false) {
        return 'Не удалось прочитать config.php.';
    }
    $updated = preg_replace(
        "/define\\('ADMIN_EMAIL',\\s*'[^']*'\\);/",
        "define('ADMIN_EMAIL', '" . addslashes($newEmail) . "');",
        $source,
        1,
        $count
    );
    if ($updated === null || $count !== 1) {
        return 'Не удалось найти строку с email в config.php — смените вручную на сервере.';
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
