<?php
if (!defined('SHINEMATE_ADMIN_BOOTSTRAP')) {
    http_response_code(403);
    exit('Forbidden');
}

/** Список SKU из сборки — белый список того, что вообще можно редактировать. */
function admin_load_catalog_index(): array
{
    if (!is_file(CATALOG_INDEX_FILE)) {
        return [];
    }
    $raw = file_get_contents(CATALOG_INDEX_FILE);
    $data = json_decode($raw ?: '', true);
    return is_array($data) ? $data : [];
}

/** Текущие оперативные правки — {sku: {price?, status?}}. */
function admin_load_overrides(): array
{
    if (!is_file(OVERRIDES_FILE)) {
        return [];
    }
    $raw = file_get_contents(OVERRIDES_FILE);
    $data = json_decode($raw ?: '', true);
    return is_array($data) ? $data : [];
}

/**
 * Бэкап overrides.json перед КАЖДЫМ изменением — если клиент случайно
 * впишет не ту цену или не тот SKU, можно вернуть предыдущее состояние
 * (в самой админке кнопки "восстановить бэкап" нет намеренно — это
 * необратимое действие поверх текущих правок; бэкапы можно скачать и
 * применить вручную). Хранится только последние MAX_BACKUPS штук —
 * старые тихо удаляются, чтобы папка не росла бесконечно.
 */
function admin_backup_overrides(): void
{
    if (!is_file(OVERRIDES_FILE)) {
        return;
    }
    if (!is_dir(BACKUPS_DIR) && !mkdir(BACKUPS_DIR, 0755, true) && !is_dir(BACKUPS_DIR)) {
        return;
    }
    $stamp = date('Y-m-d_His') . '_' . substr(bin2hex(random_bytes(2)), 0, 4);
    @copy(OVERRIDES_FILE, BACKUPS_DIR . "/catalog-overrides_{$stamp}.json");

    $files = glob(BACKUPS_DIR . '/catalog-overrides_*.json') ?: [];
    sort($files);
    $excess = count($files) - MAX_BACKUPS;
    for ($i = 0; $i < $excess; $i++) {
        @unlink($files[$i]);
    }
}

/** Список бэкапов, новые сверху — для блока "Бэкапы" в /admin. */
function admin_list_backups(): array
{
    $files = glob(BACKUPS_DIR . '/catalog-overrides_*.json') ?: [];
    rsort($files);
    return array_map(static fn(string $f) => basename($f), $files);
}

/**
 * Атомарная запись: пишем во временный файл рядом и переименовываем —
 * rename() на одной файловой системе атомарен, поэтому фронтенд никогда
 * не увидит частично записанный JSON, даже если запрос оборвётся на
 * середине записи.
 */
function admin_write_overrides(array $overrides): bool
{
    $dir = dirname(OVERRIDES_FILE);
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        return false;
    }
    admin_backup_overrides();
    $json = json_encode($overrides, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return false;
    }
    $tmp = OVERRIDES_FILE . '.tmp-' . bin2hex(random_bytes(4));
    if (file_put_contents($tmp, $json, LOCK_EX) === false) {
        return false;
    }
    if (!rename($tmp, OVERRIDES_FILE)) {
        @unlink($tmp);
        return false;
    }
    return true;
}

/** Каталог + применённые правки — то, что реально показывает /admin. */
function admin_effective_products(): array
{
    $index = admin_load_catalog_index();
    $overrides = admin_load_overrides();
    foreach ($index as &$item) {
        $sku = $item['sku'];
        if (isset($overrides[$sku]['price'])) {
            $item['rrp'] = $overrides[$sku]['price'];
        }
        if (isset($overrides[$sku]['status'])) {
            $item['status'] = $overrides[$sku]['status'];
        }
        // defaultImage — то, что реально уйдёт на сайт при пустых overrides
        // (см. scripts/export-admin-catalog.mjs); image — то, что показывает
        // /admin как текущее эффективное фото (с учётом ручной загрузки).
        $item['image'] = $overrides[$sku]['image'] ?? $item['defaultImage'];
        $item['imageOverridden'] = isset($overrides[$sku]['image']);
        $item['overridden'] = isset($overrides[$sku]);
    }
    unset($item);
    return $index;
}

const ADMIN_STATUSES = ['in_stock', 'on_request', 'out_of_stock'];

function admin_status_label(string $status): string
{
    switch ($status) {
        case 'on_request':
            return 'Под заказ / цена по запросу';
        case 'out_of_stock':
            return 'Нет в наличии';
        default:
            return 'В наличии';
    }
}
