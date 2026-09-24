<?php
declare(strict_types=1);

/**
 * Публичный, неавторизованный приём формы обратной связи. Пишет ТОЛЬКО
 * временный технический файл лимита частоты (IP → счётчик), содержимое
 * заявок никуда на диск не сохраняется и никак иначе не логируется —
 * это прямое требование клиента: сайт не хранит содержимое заявок и не
 * ведёт аналитику (см. текст в CookieNotice.tsx / data/legal.ts).
 */

header('X-Robots-Tag: noindex, nofollow');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

define('SHINEMATE_API_BOOTSTRAP', true);
define('SHINEMATE_MAILER_BOOTSTRAP', true);
require __DIR__ . '/config.php';
require __DIR__ . '/mailer.php';

/** @return never */
function sm_respond(bool $ok, ?string $error = null, int $code = 0): void
{
    http_response_code($code > 0 ? $code : ($ok ? 200 : 400));
    echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $error], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    sm_respond(false, 'method_not_allowed', 405);
}

// Реальный IP посетителя: REG.RU отдаёт сайт через nginx перед Apache,
// он передаёт исходный IP через X-Forwarded-For — тот же паттерн, что
// уже используется в public/.htaccess для HTTPS-редиректа.
function sm_client_ip(): string
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

/** Атомарная запись — как в admin-php/catalog.php: во временный файл, затем rename(). */
function sm_write_json_atomic(string $path, array $data): void
{
    $dir = dirname($path);
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    $tmp = $dir . '/.tmp-' . bin2hex(random_bytes(8));
    file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    rename($tmp, $path);
}

function sm_read_rate_data(): array
{
    if (!is_file(RATE_LIMIT_FILE)) {
        return [];
    }
    $raw = file_get_contents(RATE_LIMIT_FILE);
    $data = $raw !== false ? json_decode($raw, true) : null;
    return is_array($data) ? $data : [];
}

/** true, если этому IP сейчас нужно отказать — заодно фиксирует текущую попытку. */
function sm_rate_limited(string $ip): bool
{
    $now = time();
    $data = sm_read_rate_data();

    $entry = $data[$ip] ?? ['count' => 0, 'windowStart' => $now];
    if ($now - (int)$entry['windowStart'] > RATE_LIMIT_WINDOW) {
        $entry = ['count' => 0, 'windowStart' => $now];
    }
    $entry['count'] = (int)$entry['count'] + 1;
    $data[$ip] = $entry;

    // Не даём файлу расти бесконечно — старые IP из давно закрытых окон не нужны.
    foreach ($data as $key => $value) {
        if ($now - (int)($value['windowStart'] ?? 0) > RATE_LIMIT_WINDOW * 6) {
            unset($data[$key]);
        }
    }

    sm_write_json_atomic(RATE_LIMIT_FILE, $data);
    return $entry['count'] > RATE_LIMIT_MAX;
}

$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > 20000) {
    sm_respond(false, 'invalid_request');
}
$payload = json_decode((string)$raw, true);
if (!is_array($payload)) {
    sm_respond(false, 'invalid_request');
}

// --- honeypot: бот заполнил скрытое поле — тихий "успех", письмо не уходит ---
if (!empty($payload['hp'])) {
    sm_respond(true);
}

// --- форма отправлена подозрительно быстро после показа — тоже похоже на бота ---
$startedAt = (int)($payload['startedAt'] ?? 0);
$nowMs = (int)round(microtime(true) * 1000);
if ($startedAt <= 0 || $startedAt > $nowMs || ($nowMs - $startedAt) < MIN_SUBMIT_SECONDS * 1000) {
    sm_respond(false, 'too_fast');
}

$ip = sm_client_ip();
if (sm_rate_limited($ip)) {
    sm_respond(false, 'rate_limited');
}

/**
 * Обрезает и убирает переносы строк/нулевые байты — поля, которые могут
 * попасть в заголовки письма (email, тема через productModel), должны
 * остаться однострочными, иначе это классическая header injection
 * (лишний "Bcc:" и т.п. через \r\n в поле формы).
 */
function sm_line(?string $value, int $max = 300): string
{
    $value = (string)($value ?? '');
    $value = preg_replace('/[\r\n\x00]+/u', ' ', $value) ?? '';
    $value = trim($value);
    return function_exists('mb_substr') ? mb_substr($value, 0, $max) : substr($value, 0, $max);
}

/** Тело письма — переносы строк допустимы, это не заголовок. */
function sm_text(?string $value, int $max = 4000): string
{
    $value = (string)($value ?? '');
    $value = str_replace("\r\n", "\n", $value);
    $value = preg_replace('/[\x00]+/u', '', $value) ?? '';
    $value = trim($value);
    return function_exists('mb_substr') ? mb_substr($value, 0, $max) : substr($value, 0, $max);
}

function sm_valid_email(string $email): ?string
{
    $email = sm_line($email, 254);
    if ($email === '') {
        return '';
    }
    $valid = filter_var($email, FILTER_VALIDATE_EMAIL);
    return $valid !== false ? $valid : null;
}

$intent = is_string($payload['intent'] ?? null) ? $payload['intent'] : '';
if (!in_array($intent, ['retail', 'wholesale'], true)) {
    sm_respond(false, 'invalid_request');
}

$name = sm_line($payload['name'] ?? '', 150);
$phone = sm_line($payload['phone'] ?? '', 40);
$city = sm_line($payload['city'] ?? '', 150);
$message = sm_text($payload['message'] ?? '');
$emailRaw = sm_valid_email((string)($payload['email'] ?? ''));

if ($emailRaw === null) {
    sm_respond(false, 'invalid_email');
}
// Телефон — мягкая проверка на разумный набор символов и длину, не строгий формат
// (клиенты пишут номера по-разному: +7, 8, с пробелами/скобками/дефисами).
if ($phone !== '' && !preg_match('/^[+\d][\d\s().-]{4,30}$/u', $phone)) {
    sm_respond(false, 'invalid_phone');
}

if ($intent === 'retail') {
    if ($name === '' || $city === '' || $phone === '' || $emailRaw === '') {
        sm_respond(false, 'validation');
    }
    $companyName = sm_line($payload['companyName'] ?? '', 150);
    $website = sm_line($payload['website'] ?? '', 200);
    $productModel = sm_line($payload['productModel'] ?? '', 150);
    $productSku = sm_line($payload['productSku'] ?? '', 60);
    $productPrice = sm_line($payload['productPrice'] ?? '', 40);

    $subject = $productModel !== ''
        ? "Заявка с сайта ShineMate — {$productModel}"
        : 'Заявка с сайта ShineMate — ' . ($name !== '' ? $name : 'без имени');

    $lines = [];
    if ($productModel !== '') {
        $lines[] = 'Интересует: ShineMate ' . $productModel . ($productSku !== '' ? " ({$productSku})" : '');
    }
    if ($productPrice !== '') {
        $lines[] = 'РРЦ: ' . $productPrice;
    }
    if ($productModel !== '') {
        $lines[] = '';
    }
    $lines[] = 'Имя: ' . $name;
    $lines[] = 'Email: ' . $emailRaw;
    $lines[] = 'Город: ' . $city;
    $lines[] = 'Компания: ' . ($companyName !== '' ? $companyName : '—');
    $lines[] = 'Телефон: ' . $phone;
    $lines[] = 'Сайт: ' . ($website !== '' ? $website : '—');
    $lines[] = '';
    $lines[] = 'Сообщение:';
    $lines[] = $message !== '' ? $message : '—';
} else {
    $companyField = sm_line($payload['company'] ?? '', 150);
    if ($name === '' || $companyField === '' || $phone === '') {
        sm_respond(false, 'validation');
    }
    $inn = sm_line($payload['inn'] ?? '', 30);
    $businessType = sm_line($payload['businessType'] ?? '', 100);

    $subject = 'Оптовый запрос ShineMate — ' . ($companyField !== '' ? $companyField : $name);
    $lines = [
        'Компания: ' . $companyField,
        'Контактное лицо: ' . $name,
        'Телефон: ' . $phone,
        'Email: ' . ($emailRaw !== '' ? $emailRaw : '—'),
        'Город / регион: ' . ($city !== '' ? $city : '—'),
        'ИНН: ' . ($inn !== '' ? $inn : '—'),
        'Тип бизнеса: ' . ($businessType !== '' ? $businessType : '—'),
        '',
        'Комментарий:',
        $message !== '' ? $message : '—',
    ];
}

$lines[] = '';
$lines[] = '— IP отправителя (техническое, для антиспама): ' . $ip;

$sent = sm_send_mail(CONTACT_TO, $subject, implode("\n", $lines), $emailRaw !== '' ? $emailRaw : null);

if (!$sent) {
    sm_respond(false, 'mail_failed');
}

sm_respond(true);
