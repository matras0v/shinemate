<?php
if (!defined('SHINEMATE_ADMIN_BOOTSTRAP')) {
    http_response_code(403);
    exit('Forbidden');
}

/**
 * TOTP (RFC 6238) поверх HOTP (RFC 4226) — своя небольшая реализация, а
 * не внешняя библиотека: composer в проекте никогда не использовался
 * (весь стек — обычный PHP без пакетного менеджера, см. остальные файлы
 * этой папки), и тащить vendor/ ради ~80 строк стандартного алгоритма на
 * HMAC-SHA1 — больше риска (чужой код, который на этом хостинге никто не
 * проверял), чем пользы. Алгоритм ПРОВЕРЕН против официальных тестовых
 * векторов RFC 6238 Appendix B — см. scratch-тест при разработке; здесь
 * ничего не "изобретено", только стандартные шаги спецификации.
 *
 * Стандартные параметры: 6 цифр, шаг 30 секунд, HMAC-SHA1 — то, что
 * реально поддерживают Google/Microsoft Authenticator, 1Password, Authy.
 */

const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30;
const TOTP_ALGO = 'sha1';

/** Криптостойкий секрет — 20 байт (160 бит), как рекомендует RFC 4226 §4. */
function totp_generate_secret(): string
{
    return totp_base32_encode(random_bytes(20));
}

function totp_base32_encode(string $data): string
{
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $bits = '';
    foreach (str_split($data) as $byte) {
        $bits .= str_pad(decbin(ord($byte)), 8, '0', STR_PAD_LEFT);
    }
    $output = '';
    foreach (str_split($bits, 5) as $chunk) {
        if (strlen($chunk) < 5) {
            $chunk = str_pad($chunk, 5, '0', STR_PAD_RIGHT);
        }
        $output .= $alphabet[bindec($chunk)];
    }
    return $output;
}

function totp_base32_decode(string $secret): string
{
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $secret = strtoupper(preg_replace('/[^A-Z2-7]/i', '', $secret) ?? '');
    $bits = '';
    foreach (str_split($secret) as $char) {
        $pos = strpos($alphabet, $char);
        if ($pos === false) {
            continue;
        }
        $bits .= str_pad(decbin($pos), 5, '0', STR_PAD_LEFT);
    }
    $bytes = '';
    foreach (str_split($bits, 8) as $chunk) {
        if (strlen($chunk) < 8) {
            continue; // хвост короче байта — заполнение, не данные
        }
        $bytes .= chr(bindec($chunk));
    }
    return $bytes;
}

/** HOTP (RFC 4226 §5.3) для конкретного счётчика — TOTP просто берёт counter = floor(time/period). */
function totp_hotp(string $secretBase32, int $counter): string
{
    $key = totp_base32_decode($secretBase32);
    $counterBytes = pack('N*', 0) . pack('N*', $counter); // 8 байт big-endian
    $hash = hash_hmac(TOTP_ALGO, $counterBytes, $key, true);
    $offset = ord($hash[strlen($hash) - 1]) & 0x0F;
    $truncated = (
        ((ord($hash[$offset]) & 0x7F) << 24)
        | ((ord($hash[$offset + 1]) & 0xFF) << 16)
        | ((ord($hash[$offset + 2]) & 0xFF) << 8)
        | (ord($hash[$offset + 3]) & 0xFF)
    );
    return str_pad((string)($truncated % (10 ** TOTP_DIGITS)), TOTP_DIGITS, '0', STR_PAD_LEFT);
}

/**
 * Проверка кода с допуском ±1 интервал (±30 сек) — часы телефона и
 * сервера расходятся, без допуска валидный код мог бы не проходить.
 */
function totp_verify(string $secretBase32, string $code, ?int $timestamp = null): bool
{
    $code = trim($code);
    if (!preg_match('/^\d{6}$/', $code)) {
        return false;
    }
    $timestamp ??= time();
    $counter = intdiv($timestamp, TOTP_PERIOD);
    for ($drift = -1; $drift <= 1; $drift++) {
        if (hash_equals(totp_hotp($secretBase32, $counter + $drift), $code)) {
            return true;
        }
    }
    return false;
}

function totp_otpauth_uri(string $secretBase32, string $accountLabel, string $issuer): string
{
    $label = rawurlencode($issuer . ':' . $accountLabel);
    return 'otpauth://totp/' . $label
        . '?secret=' . rawurlencode($secretBase32)
        . '&issuer=' . rawurlencode($issuer)
        . '&digits=' . TOTP_DIGITS
        . '&period=' . TOTP_PERIOD
        . '&algorithm=SHA1';
}

/** Читаемое разбиение секрета на группы по 4 символа — легче переносить руками при ручном вводе. */
function totp_format_secret_for_display(string $secretBase32): string
{
    return trim(chunk_split($secretBase32, 4, ' '));
}

/**
 * Резервные коды — на диске хранятся ТОЛЬКО хеши (password_hash), не сами
 * коды. Формат XXXX-XXXX (10 симв. из base32-алфавита без 0/1/O/I —
 * легче читать/переписать от руки, чем длинную строку вперемешку).
 */
function totp_generate_recovery_codes(int $count = 10): array
{
    $alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // без 0/O/1/I
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
