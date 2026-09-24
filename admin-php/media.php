<?php
if (!defined('SHINEMATE_ADMIN_BOOTSTRAP')) {
    http_response_code(403);
    exit('Forbidden');
}

/**
 * Загрузка фото товара из /admin. Возвращает [путь_для_фронтенда, null]
 * при успехе или [null, "сообщение об ошибке"] при отказе.
 *
 * Все проверки — по фактическому содержимому файла, не по тому, что
 * прислал браузер:
 *  - getimagesize() реально декодирует файл и определяет тип по байтам
 *    (не по Content-Type из формы и не по расширению) — PHP/PHTML/SVG/HTML
 *    под видом .jpg отваливаются здесь же, до любой записи на диск;
 *  - результат ВСЕГДА перекодируется через GD в новый файл — что бы ни было
 *    спрятано в оригинальных байтах (полиглот, встроенный скрипт, левые
 *    метаданные), в перекодированный файл это не попадает;
 *  - имя файла на диске — случайный hex, расширение всегда .webp/.jpg
 *    (то, что реально записали) — оригинальное имя загруженного файла
 *    никогда не становится путём на сервере.
 */
function admin_handle_image_upload(array $file): array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return [null, 'Загрузка файла не удалась (код ' . ($file['error'] ?? '?') . ').'];
    }
    if (!is_uploaded_file($file['tmp_name'] ?? '')) {
        return [null, 'Файл загружен не через форму.'];
    }
    if (($file['size'] ?? 0) <= 0 || $file['size'] > MEDIA_MAX_BYTES) {
        $mb = round(MEDIA_MAX_BYTES / 1024 / 1024, 1);
        return [null, "Файл слишком большой (максимум {$mb} МБ)."];
    }

    $info = @getimagesize($file['tmp_name']);
    if ($info === false) {
        return [null, 'Файл не распознан как изображение.'];
    }
    $type = $info[2];
    $allowed = [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP];
    if (!in_array($type, $allowed, true)) {
        return [null, 'Разрешены только JPEG, PNG и WEBP.'];
    }
    if (!function_exists('imagecreatefromstring')) {
        return [null, 'На сервере недоступно расширение GD — загрузка фото невозможна.'];
    }

    $raw = file_get_contents($file['tmp_name']);
    if ($raw === false) {
        return [null, 'Не удалось прочитать загруженный файл.'];
    }
    // imagecreatefromstring() сама определяет формат по содержимому и
    // одновременно служит второй, независимой от getimagesize() проверкой —
    // файл, который прошёл getimagesize(), но не декодируется GD, здесь же
    // и отсеется (false), а не запишется на диск как есть.
    $gd = @imagecreatefromstring($raw);
    if ($gd === false) {
        return [null, 'Не удалось декодировать изображение.'];
    }

    if (!is_dir(MEDIA_DIR) && !mkdir(MEDIA_DIR, 0755, true) && !is_dir(MEDIA_DIR)) {
        imagedestroy($gd);
        return [null, 'Не удалось создать папку для фото на сервере.'];
    }

    $name = bin2hex(random_bytes(16));
    if (function_exists('imagewebp')) {
        $filename = $name . '.webp';
        $ok = imagewebp($gd, MEDIA_DIR . '/' . $filename, 86);
    } else {
        // WEBP-кодек GD есть не везде — JPEG есть практически всегда.
        $filename = $name . '.jpg';
        imageinterlace($gd, true);
        $ok = imagejpeg($gd, MEDIA_DIR . '/' . $filename, 88);
    }
    imagedestroy($gd);

    if (!$ok) {
        return [null, 'Не удалось сохранить перекодированное изображение.'];
    }

    return ['media/admin-products/' . $filename, null];
}

/**
 * Удаляет ранее загруженный файл — только внутри MEDIA_DIR и только по
 * "чистому" basename (без слэшей и ".." — path traversal через сохранённый
 * в overrides.json путь технически исключён этой проверкой, даже если сам
 * JSON был бы кем-то подменён напрямую на диске).
 */
function admin_delete_media_file(string $relPath): void
{
    $prefix = 'media/admin-products/';
    if (!str_starts_with($relPath, $prefix)) {
        return;
    }
    $basename = basename(substr($relPath, strlen($prefix)));
    if ($basename === '' || $basename === '.' || $basename === '..') {
        return;
    }
    $full = MEDIA_DIR . '/' . $basename;
    if (is_file($full) && dirname(realpath($full) ?: '') === realpath(MEDIA_DIR)) {
        @unlink($full);
    }
}
