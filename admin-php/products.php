<?php
if (!defined('SHINEMATE_ADMIN_BOOTSTRAP')) {
    http_response_code(403);
    exit('Forbidden');
}

/**
 * Товары, созданные клиентом через /admin — поверх сборочного каталога
 * (src/data/catalog.ts), не вместо него. Хранятся в ADMIN_PRODUCTS_FILE,
 * той же структуры, что и Product/Variant во фронтенде (см. комментарий
 * там), чтобы src/lib/adminProducts.ts мог просто push()-нуть их в
 * общий массив products без перевода полей.
 *
 * Категории — ЖЁСТКО тот же список ID и заголовков, что в
 * src/data/catalog.ts (categories[]) — держать в синхроне вручную, при
 * изменении списка разделов на сайте. Дублирование ЗДЕСЬ, а не общий
 * источник, потому что PHP не может импортировать .ts-модуль на
 * shared-хостинге без сборки.
 */
const ADMIN_PRODUCT_CATEGORIES = [
    'rotary' => 'Роторные машинки',
    'da' => 'Эксцентриковые машинки',
    'sander' => 'Шлифовальные машинки',
    'cordless' => 'Аккумуляторные машинки',
    'plates' => 'Подложки и адаптеры',
    'pads' => 'Полировальные круги',
    'chemistry' => 'Полировальные пасты V-Range',
    'workshop' => 'Аксессуары',
];

const ADMIN_PRODUCT_PUB_STATUSES = ['draft', 'published', 'archived'];

/* ──────────────────────── Хранилище ──────────────────────── */

function admin_load_admin_products(): array
{
    if (!is_file(ADMIN_PRODUCTS_FILE)) {
        return [];
    }
    $raw = file_get_contents(ADMIN_PRODUCTS_FILE);
    $data = json_decode($raw ?: '', true);
    return is_array($data) ? $data : [];
}

/** Тот же принцип ротации, что и у admin_backup_overrides() в catalog.php — общий BACKUPS_DIR/MAX_BACKUPS, отдельный префикс файла. */
function admin_backup_admin_products(): void
{
    if (!is_file(ADMIN_PRODUCTS_FILE)) {
        return;
    }
    if (!is_dir(BACKUPS_DIR) && !mkdir(BACKUPS_DIR, 0755, true) && !is_dir(BACKUPS_DIR)) {
        return;
    }
    $stamp = date('Y-m-d_His') . '_' . substr(bin2hex(random_bytes(2)), 0, 4);
    @copy(ADMIN_PRODUCTS_FILE, BACKUPS_DIR . "/admin-products_{$stamp}.json");

    $files = glob(BACKUPS_DIR . '/admin-products_*.json') ?: [];
    sort($files);
    $excess = count($files) - MAX_BACKUPS;
    for ($i = 0; $i < $excess; $i++) {
        @unlink($files[$i]);
    }
}

function admin_list_product_backups(): array
{
    $files = glob(BACKUPS_DIR . '/admin-products_*.json') ?: [];
    rsort($files);
    return array_map(static fn(string $f) => basename($f), $files);
}

/** Атомарная запись (tmp + rename), бэкап ПЕРЕД записью — тот же приём, что и везде в этой папке. */
function admin_write_admin_products(array $products): bool
{
    $dir = dirname(ADMIN_PRODUCTS_FILE);
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        return false;
    }
    admin_backup_admin_products();
    $json = json_encode($products, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return false;
    }
    $tmp = ADMIN_PRODUCTS_FILE . '.tmp-' . bin2hex(random_bytes(4));
    if (file_put_contents($tmp, $json, LOCK_EX) === false) {
        return false;
    }
    if (!rename($tmp, ADMIN_PRODUCTS_FILE)) {
        @unlink($tmp);
        return false;
    }
    admin_regenerate_sitemap($products);
    return true;
}

function admin_find_product(array $products, string $id): ?array
{
    foreach ($products as $p) {
        if (($p['id'] ?? null) === $id) {
            return $p;
        }
    }
    return null;
}

/* ──────────────────────── slug / SKU ──────────────────────── */

/** Транслит кириллицы в латиницу для автогенерации slug — только для этого, не для отображения. */
function admin_slugify(string $text): string
{
    $map = [
        'а' => 'a', 'б' => 'b', 'в' => 'v', 'г' => 'g', 'д' => 'd', 'е' => 'e', 'ё' => 'e',
        'ж' => 'zh', 'з' => 'z', 'и' => 'i', 'й' => 'y', 'к' => 'k', 'л' => 'l', 'м' => 'm',
        'н' => 'n', 'о' => 'o', 'п' => 'p', 'р' => 'r', 'с' => 's', 'т' => 't', 'у' => 'u',
        'ф' => 'f', 'х' => 'h', 'ц' => 'ts', 'ч' => 'ch', 'ш' => 'sh', 'щ' => 'sch', 'ъ' => '',
        'ы' => 'y', 'ь' => '', 'э' => 'e', 'ю' => 'yu', 'я' => 'ya',
    ];
    $text = mb_strtolower(trim($text));
    $translit = strtr($text, $map);
    $translit = preg_replace('/[^a-z0-9]+/u', '-', $translit) ?? '';
    $translit = trim($translit, '-');
    $translit = preg_replace('/-{2,}/', '-', $translit) ?? '';
    return $translit !== '' ? $translit : ('product-' . substr(bin2hex(random_bytes(4)), 0, 8));
}

/**
 * Зарезервированные пути — реальные маршруты SPA (см. src/lib/router.ts) и
 * ключевые служебные сегменты. slug товара не должен совпасть ни с одним —
 * иначе адрес товара перекрыл бы существующую страницу сайта.
 */
const ADMIN_RESERVED_SLUGS = [
    'admin', 'api', 'catalog', 'contacts', 'about', 'technologies', 'wholesale',
    'data', 'media', 'media-catalog', 'catalog-media', 'brand', 'fonts', 'assets',
];

function admin_valid_slug(string $slug): bool
{
    if ($slug === '' || mb_strlen($slug) > 80) {
        return false;
    }
    if (!preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $slug)) {
        return false;
    }
    if (str_contains($slug, '..') || str_contains($slug, '/')) {
        return false;
    }
    return !in_array($slug, ADMIN_RESERVED_SLUGS, true);
}

/** slug'и, УЖЕ занятые сборочным каталогом или другими admin-товарами (кроме $excludeId — редактируемого сейчас). */
function admin_known_slugs(?string $excludeId = null): array
{
    $slugs = [];
    foreach (admin_load_catalog_index() as $item) {
        if (!empty($item['slug'])) {
            $slugs[] = $item['slug'];
        }
    }
    foreach (admin_load_admin_products() as $p) {
        if ($excludeId !== null && ($p['id'] ?? null) === $excludeId) {
            continue;
        }
        if (!empty($p['slug'])) {
            $slugs[] = $p['slug'];
        }
    }
    return $slugs;
}

/** Артикулы (SKU), уже занятые сборочным каталогом или вариантами других admin-товаров. */
function admin_known_skus(?string $excludeId = null): array
{
    $skus = [];
    foreach (admin_load_catalog_index() as $item) {
        if (!empty($item['sku'])) {
            $skus[] = mb_strtoupper($item['sku']);
        }
    }
    foreach (admin_load_admin_products() as $p) {
        if ($excludeId !== null && ($p['id'] ?? null) === $excludeId) {
            continue;
        }
        foreach ($p['variants'] ?? [] as $v) {
            if (!empty($v['sku'])) {
                $skus[] = mb_strtoupper($v['sku']);
            }
        }
    }
    return $skus;
}

/* ──────────────────────── sitemap ──────────────────────── */

/**
 * Достраивает sitemap.xml поверх снимка последней сборки (SITEMAP_BASE_FILE,
 * генерируется scripts/generate-sitemap.mjs) опубликованными admin-товарами.
 * Черновики и архив — НЕ попадают. Сам sitemap.xml на диске трогается
 * только здесь, а не при обычной сборке (та переписывает его заново из
 * SITEMAP_BASE_FILE + текущего состояния при следующем npm run build).
 * Ошибка тут (нет прав на запись и т.п.) НЕ должна ронять сохранение
 * товара — сайт со старым sitemap.xml работает, просто новый товар на
 * день-два позже попадёт в индексацию.
 */
function admin_regenerate_sitemap(array $products): void
{
    try {
        if (!is_file(SITEMAP_BASE_FILE)) {
            return;
        }
        $base = file_get_contents(SITEMAP_BASE_FILE);
        if ($base === false) {
            return;
        }
        $urls = array_values(array_filter(array_map('trim', explode("\n", $base))));

        foreach ($products as $p) {
            if (($p['status'] ?? '') !== 'published') {
                continue;
            }
            $category = (string)($p['category'] ?? '');
            $slug = (string)($p['slug'] ?? '');
            if ($category === '' || $slug === '') {
                continue;
            }
            $urls[] = 'https://shinemate-russia.ru/catalog/' . $category . '/' . $slug;
        }

        $urls = array_values(array_unique($urls));
        $body = implode("\n", array_map(
            static fn(string $loc) => "  <url>\n    <loc>{$loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>",
            $urls,
        ));
        $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n{$body}\n</urlset>\n";

        $tmp = SITEMAP_PUBLIC_FILE . '.tmp-' . bin2hex(random_bytes(4));
        if (file_put_contents($tmp, $xml, LOCK_EX) === false) {
            return;
        }
        rename($tmp, SITEMAP_PUBLIC_FILE);
    } catch (\Throwable $e) {
        // см. комментарий выше — тихо не даём sitemap уронить сохранение товара
    }
}

/* ──────────────────────── парсинг формы (whitelist полей) ──────────────────────── */

/**
 * Строит массив variants[] ИСКЛЮЧИТЕЛЬНО из ожидаемых полей запроса —
 * никогда не деserialize'ит $_POST целиком. Каждое поле читается по
 * имени и приводится к нужному типу; неизвестные ключи из $_POST/$_FILES
 * просто никогда не попадают в результат (это и есть whitelist — не
 * отдельный blacklist-фильтр, а то, что код читает СТРОГО заданные поля).
 */
function admin_parse_variants_from_request(): array
{
    $labels = $_POST['variant_label'] ?? [];
    $altLabels = $_POST['variant_alt'] ?? [];
    $skus = $_POST['variant_sku'] ?? [];
    $prices = $_POST['variant_price'] ?? [];
    $stocks = $_POST['variant_stock'] ?? [];
    $keepImages = $_POST['variant_keep_image'] ?? [];
    $files = $_FILES['variant_image'] ?? null;

    if (!is_array($skus)) {
        return [];
    }

    $variants = [];
    foreach (array_keys($skus) as $i) {
        $sku = trim((string)($skus[$i] ?? ''));
        if ($sku === '') {
            continue; // пустая строка — не добавленный вариант, а пропущенный индекс
        }
        $variant = [
            'sku' => mb_substr($sku, 0, 60),
            'label' => mb_substr(trim((string)($labels[$i] ?? '')), 0, 80),
            'rrp' => (float)str_replace(',', '.', (string)($prices[$i] ?? '0')),
            'status' => in_array($stocks[$i] ?? '', ADMIN_STATUSES, true) ? $stocks[$i] : 'in_stock',
        ];
        $axis1 = trim((string)($labels[$i] ?? ''));
        if ($axis1 !== '') {
            $variant['axis1'] = mb_substr($axis1, 0, 40);
        }
        $axis1Alt = trim((string)($altLabels[$i] ?? ''));
        if ($axis1Alt !== '') {
            $variant['axis1Alt'] = mb_substr($axis1Alt, 0, 20);
        }

        // Фото варианта: новая загрузка > сохранённое старое > нет фото.
        $uploaded = null;
        if (is_array($files) && isset($files['error'][$i]) && $files['error'][$i] === UPLOAD_ERR_OK) {
            $single = [
                'name' => $files['name'][$i],
                'type' => $files['type'][$i],
                'tmp_name' => $files['tmp_name'][$i],
                'error' => $files['error'][$i],
                'size' => $files['size'][$i],
            ];
            [$path, $err] = admin_handle_image_upload($single);
            if ($path !== null) {
                $uploaded = $path;
            }
        }
        $kept = (string)($keepImages[$i] ?? '');
        if ($uploaded !== null) {
            // старое фото этого варианта, если было и отличается от нового — больше не используется
            if ($kept !== '' && $kept !== $uploaded) {
                admin_delete_media_file($kept);
            }
            $variant['image'] = $uploaded;
        } elseif ($kept !== '' && admin_valid_own_media_path($kept)) {
            $variant['image'] = $kept;
        }

        $variants[] = $variant;
    }
    return $variants;
}

/** Путь именно из МЕДИА-папки этой системы (не произвольная строка от клиента) — используется, чтобы принять "оставить как есть" для уже загруженного фото. */
function admin_valid_own_media_path(string $path): bool
{
    return (bool)preg_match('#^media/admin-products/[a-f0-9]{32}\.(webp|jpg)$#', $path);
}

/**
 * Фотогалерея товара (не привязанная к конкретному варианту): существующие
 * фото — по списку сохранённых путей в порядке DOM (порядок = порядок
 * массива на сохранении, реордер на клиенте — просто перестановка hidden
 * input'ов), плюс новые загрузки в конце. Главное фото — по индексу.
 */
function admin_parse_gallery_from_request(): array
{
    $kept = $_POST['photo_keep'] ?? [];
    if (!is_array($kept)) {
        $kept = [];
    }
    $paths = [];
    foreach ($kept as $p) {
        $p = (string)$p;
        if (admin_valid_own_media_path($p)) {
            $paths[] = $p;
        }
    }

    $newFiles = $_FILES['new_photos'] ?? null;
    if (is_array($newFiles) && is_array($newFiles['error'] ?? null)) {
        foreach ($newFiles['error'] as $i => $err) {
            if ($err !== UPLOAD_ERR_OK) {
                continue;
            }
            $single = [
                'name' => $newFiles['name'][$i],
                'type' => $newFiles['type'][$i],
                'tmp_name' => $newFiles['tmp_name'][$i],
                'error' => $newFiles['error'][$i],
                'size' => $newFiles['size'][$i],
            ];
            [$path, $err2] = admin_handle_image_upload($single);
            if ($path !== null) {
                $paths[] = $path;
            }
        }
    }

    return array_values(array_unique($paths));
}

/** Характеристики: label/value пар из формы, пустые строки отбрасываются. */
function admin_parse_specs_from_request(): array
{
    $labels = $_POST['spec_label'] ?? [];
    $values = $_POST['spec_value'] ?? [];
    if (!is_array($labels)) {
        return [];
    }
    $specs = [];
    foreach ($labels as $i => $label) {
        $label = trim((string)$label);
        $value = trim((string)($values[$i] ?? ''));
        if ($label === '' || $value === '') {
            continue;
        }
        $specs[] = ['label' => mb_substr($label, 0, 60), 'value' => mb_substr($value, 0, 200)];
    }
    return $specs;
}

/**
 * Собирает и валидирует товар из $_POST/$_FILES целиком. Возвращает
 * [товар|null, ошибка|null]. Каждое поле читается по конкретному имени —
 * это и есть whitelist, отдельного deny-списка не нужно: то, что не
 * прочитано явно, просто не существует в результате.
 */
function admin_build_product_from_request(?string $existingId, array $existingProduct): array
{
    $name = trim((string)($_POST['name'] ?? ''));
    $category = (string)($_POST['category'] ?? '');
    $slugInput = trim((string)($_POST['slug'] ?? ''));
    $shortDesc = trim((string)($_POST['short_description'] ?? ''));
    $fullDesc = trim((string)($_POST['description'] ?? ''));
    $pubStatus = (string)($_POST['pub_status'] ?? 'draft');

    if ($name === '' || mb_strlen($name) > 150) {
        return [null, 'Укажите название товара (до 150 символов).'];
    }
    if (!array_key_exists($category, ADMIN_PRODUCT_CATEGORIES)) {
        return [null, 'Выберите раздел каталога из списка.'];
    }
    if ($shortDesc === '') {
        return [null, 'Укажите краткое описание.'];
    }
    if (!in_array($pubStatus, ['draft', 'published'], true)) {
        $pubStatus = 'draft';
    }

    $slug = $slugInput !== '' ? admin_slugify($slugInput) : admin_slugify($name);
    if (!admin_valid_slug($slug)) {
        return [null, 'Некорректный URL (используйте только латиницу, цифры и дефис).'];
    }
    if (in_array($slug, admin_known_slugs($existingId), true)) {
        return [null, "Такой URL уже занят другим товаром (/catalog/*/{$slug}). Измените адрес."];
    }

    $variants = admin_parse_variants_from_request();
    if (count($variants) === 0) {
        return [null, 'Добавьте хотя бы один артикул (SKU) с ценой.'];
    }
    if (count($variants) > 1) {
        foreach ($variants as $v) {
            if (empty($v['axis1'])) {
                return [null, 'У товара несколько исполнений — заполните название/размер у КАЖДОГО из них.'];
            }
        }
    }
    foreach ($variants as $v) {
        if ($v['rrp'] <= 0 || $v['rrp'] > 10_000_000) {
            return [null, "Некорректная цена у артикула {$v['sku']}."];
        }
    }
    // Дубли SKU между собой и с уже существующими товарами/вариантами.
    $seen = [];
    $known = admin_known_skus($existingId);
    foreach ($variants as $v) {
        $upper = mb_strtoupper($v['sku']);
        if (isset($seen[$upper])) {
            return [null, "Артикул {$v['sku']} повторяется у этого товара дважды."];
        }
        $seen[$upper] = true;
        if (in_array($upper, $known, true)) {
            return [null, "Артикул {$v['sku']} уже используется другим товаром — выберите другой."];
        }
    }

    $specs = admin_parse_specs_from_request();
    $gallery = admin_parse_gallery_from_request();

    // Старые фото галереи, которых больше нет в новом списке — удаляем с диска.
    $oldGallery = $existingProduct['images'] ?? [];
    foreach ($oldGallery as $old) {
        if (!in_array($old, $gallery, true)) {
            admin_delete_media_file($old);
        }
    }

    $primaryIndex = (int)($_POST['primary_photo'] ?? 0);
    $mainImage = $gallery[$primaryIndex] ?? ($gallery[0] ?? ($existingProduct['image'] ?? 'catalog-media/tool-cart-thumb.webp'));

    $axisLabelInput = trim((string)($_POST['axis_label'] ?? ''));

    $compatible = [];
    foreach ((array)($_POST['compatible'] ?? []) as $sku) {
        $sku = trim((string)$sku);
        if ($sku !== '') {
            $compatible[] = mb_substr($sku, 0, 60);
        }
    }

    $now = date('c');
    $product = [
        'id' => $existingId ?? ('p_' . bin2hex(random_bytes(8))),
        'slug' => $slug,
        'model' => mb_substr($name, 0, 150),
        'category' => $category,
        'kind' => mb_substr($shortDesc, 0, 150),
        'lead' => mb_substr($shortDesc, 0, 400),
        'description' => $fullDesc !== '' ? mb_substr($fullDesc, 0, 4000) : null,
        'specs' => $specs,
        'variants' => $variants,
        'image' => $mainImage,
        'imageWidth' => 900,
        'imageHeight' => 900,
        'images' => $gallery,
        'compatibleProductIds' => $compatible,
        'status' => $pubStatus,
        'createdAt' => $existingProduct['createdAt'] ?? $now,
        'updatedAt' => $now,
    ];
    if (count($variants) > 1 && $axisLabelInput !== '') {
        $product['axisLabel'] = mb_substr($axisLabelInput, 0, 30);
    }

    return [$product, null];
}
