<?php
declare(strict_types=1);

/**
 * Публичный, НЕавторизованный, только для чтения список товаров,
 * добавленных клиентом через /admin — фронтенд (src/lib/adminProducts.ts)
 * вызывает это ДО первого рендера и push()-ит результат в тот же массив
 * products, что уже есть в собранном бандле (см. src/data/catalog.ts).
 * Отдаёт ТОЛЬКО опубликованные товары — черновики и архив сюда не
 * попадают ни при каких условиях, это единственное место, где решается,
 * что уже можно показывать посетителям сайта.
 *
 * Сам admin-products.json посетителю напрямую НЕ отдаётся (см.
 * RedirectMatch в public/.htaccess) — только через этот фильтр.
 */

header('X-Robots-Tag: noindex, nofollow');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
// Мутируемые данные — не кэшировать агрессивно: правки клиента должны
// быть видны почти сразу, а не после протухания CDN/браузерного кэша.
header('Cache-Control: no-cache, must-revalidate, max-age=0');

define('SHINEMATE_API_BOOTSTRAP', true);
require __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

/**
 * Поля, которые реально нужны фронтенду — тот же принцип whitelist, что
 * и на запись (admin-php/products.php): отдаём НАРУЖУ только то, что
 * явно перечислено здесь, а не файл как есть. Служебные админ-поля
 * (id, status, createdAt/updatedAt) наружу не идут — id и даты не нужны
 * фронтенду, а status — это ровно то, по чему мы уже фильтруем ниже
 * (публично видно только следствие фильтра "published", не сам статус
 * как поле, чтобы не намекать на существование черновиков).
 */
function sm_public_product(array $p): ?array
{
    $slug = (string)($p['slug'] ?? '');
    $category = (string)($p['category'] ?? '');
    $model = (string)($p['model'] ?? '');
    $variants = is_array($p['variants'] ?? null) ? $p['variants'] : [];
    if ($slug === '' || $category === '' || $model === '' || count($variants) === 0) {
        return null; // битая запись — молча пропускаем, не роняем весь список
    }

    $out = [
        'slug' => $slug,
        'model' => $model,
        'category' => $category,
        'kind' => (string)($p['kind'] ?? ''),
        'lead' => (string)($p['lead'] ?? ''),
        'specs' => [],
        'variants' => [],
        'image' => (string)($p['image'] ?? ''),
        'imageWidth' => (int)($p['imageWidth'] ?? 900),
        'imageHeight' => (int)($p['imageHeight'] ?? 900),
    ];
    if (!empty($p['description']) && is_string($p['description'])) {
        $out['description'] = $p['description'];
    }
    if (!empty($p['axisLabel']) && is_string($p['axisLabel'])) {
        $out['axisLabel'] = $p['axisLabel'];
    }
    if (!empty($p['images']) && is_array($p['images'])) {
        $out['images'] = array_values(array_filter($p['images'], 'is_string'));
    }

    foreach ($p['specs'] ?? [] as $s) {
        if (!empty($s['label']) && isset($s['value'])) {
            $out['specs'][] = ['label' => (string)$s['label'], 'value' => (string)$s['value']];
        }
    }
    foreach ($variants as $v) {
        if (empty($v['sku']) || !isset($v['rrp'])) {
            continue;
        }
        $variant = [
            'sku' => (string)$v['sku'],
            'label' => (string)($v['label'] ?? $v['axis1'] ?? ''),
            'rrp' => (float)$v['rrp'],
        ];
        if (!empty($v['status'])) {
            $variant['status'] = (string)$v['status'];
        }
        if (!empty($v['axis1'])) {
            $variant['axis1'] = (string)$v['axis1'];
        }
        if (!empty($v['axis1Alt'])) {
            $variant['axis1Alt'] = (string)$v['axis1Alt'];
        }
        if (!empty($v['image'])) {
            $variant['image'] = (string)$v['image'];
        }
        $out['variants'][] = $variant;
    }
    if (count($out['variants']) === 0) {
        return null;
    }

    return $out;
}

$raw = is_file(ADMIN_PRODUCTS_FILE) ? file_get_contents(ADMIN_PRODUCTS_FILE) : '';
$data = $raw !== false && $raw !== '' ? json_decode($raw, true) : [];
$all = is_array($data) ? $data : [];

$published = [];
foreach ($all as $p) {
    if (!is_array($p) || ($p['status'] ?? '') !== 'published') {
        continue;
    }
    $clean = sm_public_product($p);
    if ($clean !== null) {
        $published[] = $clean;
    }
}

echo json_encode(['ok' => true, 'products' => $published], JSON_UNESCAPED_UNICODE);
