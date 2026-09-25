<?php
declare(strict_types=1);

define('SHINEMATE_ADMIN_BOOTSTRAP', true);
require __DIR__ . '/config.php';
require __DIR__ . '/audit.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/catalog.php';
require __DIR__ . '/media.php';
require __DIR__ . '/mailer.php';
require __DIR__ . '/diagnostics.php';

admin_start_session();

// Скачивание бэкапа — до любого HTML-вывода, отдаёт файл целиком и
// завершает запрос. Только для авторизованных, имя файла сверяется со
// списком реальных бэкапов (admin_list_backups()) — не путь с диска, а
// белый список, так что ни .. , ни абсолютный путь сюда просто не попадут.
if (($_GET['action'] ?? '') === 'download_backup') {
    admin_require_login();
    $requested = (string)($_GET['file'] ?? '');
    if (in_array($requested, admin_list_backups(), true)) {
        $path = BACKUPS_DIR . '/' . $requested;
        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="' . $requested . '"');
        header('Content-Length: ' . (string)filesize($path));
        readfile($path);
        exit;
    }
    http_response_code(404);
    exit('Файл не найден.');
}

$error = null;
$flash = null;

/* ── POST: логин, сохранение, загрузка фото, диагностика, смена пароля ── */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'login') {
        if (admin_login_locked()) {
            $error = 'Слишком много попыток входа. Подождите несколько минут и попробуйте снова.';
        } elseif (admin_login((string) ($_POST['password'] ?? ''))) {
            header('Location: index.php');
            exit;
        } else {
            // Намеренно НЕ уточняем, что именно неверно — единственное поле
            // формы здесь пароль, но фраза остаётся общей на случай, если
            // логика входа когда-нибудь расширится.
            $error = 'Неверные данные для входа.';
        }
    } elseif ($action === 'logout') {
        admin_require_login();
        if (admin_csrf_check($_POST['csrf'] ?? null)) {
            admin_logout();
        }
        header('Location: index.php');
        exit;
    } elseif ($action === 'save') {
        admin_require_login();

        if (!admin_csrf_check($_POST['csrf'] ?? null)) {
            $error = 'Сессия истекла, обновите страницу и попробуйте снова.';
        } else {
            $sku = (string) ($_POST['sku'] ?? '');
            $priceRaw = str_replace(',', '.', trim((string) ($_POST['price'] ?? '')));
            $status = (string) ($_POST['status'] ?? 'in_stock');

            $index = admin_load_catalog_index();
            $known = null;
            foreach ($index as $item) {
                if ($item['sku'] === $sku) {
                    $known = $item;
                    break;
                }
            }

            if ($known === null) {
                // Артикул не из белого списка сборки — молча ничего не пишем.
                $error = 'Неизвестный артикул. Пересоберите каталог (npm run build) и загрузите свежий admin-data/catalog-index.json.';
            } elseif (!is_numeric($priceRaw) || (float) $priceRaw <= 0 || (float) $priceRaw > 10000000) {
                $error = 'Цена должна быть положительным числом (до 10 000 000 ₽).';
            } elseif (!in_array($status, ADMIN_STATUSES, true)) {
                $error = 'Некорректный статус наличия.';
            } else {
                $overrides = admin_load_overrides();
                // merge, не перезапись — иначе загруженное фото (ключ image)
                // терялось бы при каждом сохранении цены/наличия.
                $overrides[$sku] = array_merge($overrides[$sku] ?? [], [
                    'price' => round((float) $priceRaw, 2),
                    'status' => $status,
                ]);
                if (admin_write_overrides($overrides)) {
                    admin_audit_log('save_price', ['sku' => $sku, 'price' => round((float) $priceRaw, 2), 'status' => $status]);
                    header('Location: index.php?saved=' . urlencode($sku) . '&what=price');
                    exit;
                }
                $error = 'Не удалось сохранить — проверьте права на запись файла data/catalog-overrides.json на сервере.';
            }
        }
    } elseif ($action === 'upload_image') {
        admin_require_login();
        if (!admin_csrf_check($_POST['csrf'] ?? null)) {
            $error = 'Сессия истекла, обновите страницу и попробуйте снова.';
        } else {
            $sku = (string) ($_POST['sku'] ?? '');
            $index = admin_load_catalog_index();
            $known = array_filter($index, static fn($item) => $item['sku'] === $sku);
            if (!$known) {
                $error = 'Неизвестный артикул.';
            } elseif (empty($_FILES['photo']) || ($_FILES['photo']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
                $error = 'Файл не выбран.';
            } else {
                [$path, $uploadError] = admin_handle_image_upload($_FILES['photo']);
                if ($uploadError !== null) {
                    $error = $uploadError;
                } else {
                    $overrides = admin_load_overrides();
                    $previous = $overrides[$sku]['image'] ?? null;
                    $overrides[$sku] = array_merge($overrides[$sku] ?? [], ['image' => $path]);
                    if (admin_write_overrides($overrides)) {
                        // Старый загруженный файл (если был) больше не используется — не копим мусор.
                        if ($previous !== null) {
                            admin_delete_media_file($previous);
                        }
                        admin_audit_log('upload_photo', ['sku' => $sku]);
                        header('Location: index.php?saved=' . urlencode($sku) . '&what=photo');
                        exit;
                    }
                    $error = 'Фото загружено, но не удалось сохранить ссылку на него.';
                }
            }
        }
    } elseif ($action === 'restore_image') {
        admin_require_login();
        if (!admin_csrf_check($_POST['csrf'] ?? null)) {
            $error = 'Сессия истекла, обновите страницу и попробуйте снова.';
        } else {
            $sku = (string) ($_POST['sku'] ?? '');
            $overrides = admin_load_overrides();
            if (isset($overrides[$sku]['image'])) {
                $old = $overrides[$sku]['image'];
                unset($overrides[$sku]['image']);
                if (empty($overrides[$sku])) {
                    unset($overrides[$sku]);
                }
                if (admin_write_overrides($overrides)) {
                    admin_delete_media_file($old);
                    admin_audit_log('restore_photo', ['sku' => $sku]);
                    header('Location: index.php?saved=' . urlencode($sku) . '&what=photo_restored');
                    exit;
                }
                $error = 'Не удалось сохранить изменения.';
            } else {
                header('Location: index.php');
                exit;
            }
        }
    } elseif ($action === 'test_mail') {
        admin_require_login();
        if (!admin_csrf_check($_POST['csrf'] ?? null)) {
            $error = 'Сессия истекла, обновите страницу и попробуйте снова.';
        } else {
            $body = "Тестовое письмо из панели управления каталогом.\nВремя: " . date('Y-m-d H:i:s') . "\nХост: " . (string)($_SERVER['HTTP_HOST'] ?? '—');
            if (admin_send_mail(CONTACT_TO, 'Тестовое письмо — панель управления ShineMate Russia', $body)) {
                $flash = 'Тестовое письмо отправлено на ' . htmlspecialchars(CONTACT_TO, ENT_QUOTES, 'UTF-8') . '. Проверьте папку "Входящие"/"Спам".';
            } else {
                $error = 'mail() вернула ошибку — письмо не отправлено. Возможно, на хостинге не настроена отправка почты; обратитесь в поддержку REG.RU.';
            }
        }
    } elseif ($action === 'change_password') {
        admin_require_login();
        if (!admin_csrf_check($_POST['csrf'] ?? null)) {
            $error = 'Сессия истекла, обновите страницу и попробуйте снова.';
        } else {
            $current = (string) ($_POST['current_password'] ?? '');
            $new = (string) ($_POST['new_password'] ?? '');
            $confirm = (string) ($_POST['new_password_confirm'] ?? '');
            if ($new !== $confirm) {
                $error = 'Новый пароль и подтверждение не совпадают.';
            } else {
                $result = admin_change_password($current, $new);
                if ($result === null) {
                    $flash = 'Пароль изменён.';
                    admin_audit_log('change_password');
                } else {
                    $error = $result;
                }
            }
        }
    }
}

if (isset($_GET['saved'])) {
    $what = (string)($_GET['what'] ?? 'price');
    $label = $what === 'photo' ? 'Фото обновлено' : ($what === 'photo_restored' ? 'Фото возвращено' : 'Сохранено');
    $flash = ($flash ? $flash . ' ' : '') . $label . ': ' . htmlspecialchars((string) $_GET['saved'], ENT_QUOTES, 'UTF-8');
}

$loggedIn = admin_is_logged_in();
$products = $loggedIn ? admin_effective_products() : [];
$csrf = $loggedIn ? admin_csrf_token() : null;
$diagnostics = $loggedIn ? admin_diagnostics() : [];
$backups = $loggedIn ? admin_list_backups() : [];

/*
 * Товары сгруппированы по семейству (одна карточка каталога = несколько
 * SKU-исполнений), чтобы клиент не перепутал, какой именно размер/цвет он
 * правит — ровно жалоба из брифа: "не должен случайно поменять цену 4",
 * думая что это 6"". admin_effective_products() уже отсортирован по
 * модели+SKU (см. export-admin-catalog.mjs), поэтому исполнения одного
 * семейства всегда идут подряд — здесь только собираем их в группы.
 */
$groups = [];
foreach ($products as $p) {
    $groups[$p['model']][] = $p;
}

/* Категории для фильтра — в порядке первого появления, без дублей. */
$categoryList = [];
foreach ($products as $p) {
    $categoryList[$p['category']] = true;
}
$categoryList = array_keys($categoryList);
?>
<!doctype html>
<html lang="ru">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ShineMate — управление каталогом</title>
<meta name="robots" content="noindex, nofollow" />
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 2rem 1.25rem 4rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    background: #F7F6F2; color: #1A1C1E;
  }
  h1 { font-size: 1.375rem; font-weight: 600; margin: 0 0 1.5rem; letter-spacing: -0.01em; }
  h2 { font-size: 1.0625rem; font-weight: 600; margin: 2.5rem 0 0.75rem; }
  .wrap { max-width: 720px; margin: 0 auto; }
  .login-wrap { max-width: 340px; margin: 4rem auto; }
  label { display: block; font-size: 0.8125rem; color: #565C60; margin-bottom: 0.375rem; }
  input[type=password], input[type=text], input[type=search], input[type=file], select {
    width: 100%; padding: 0.65rem 0.75rem; border: 1px solid rgba(26,28,30,0.18);
    border-radius: 0.5rem; font-size: 0.9375rem; background: #fff; color: #1A1C1E;
  }
  button {
    cursor: pointer; border: none; border-radius: 999px; padding: 0.65rem 1.5rem;
    font-size: 0.875rem; font-weight: 500; background: #1A1C1E; color: #F7F6F2;
  }
  button:hover { background: #34383B; }
  button.secondary { background: transparent; color: #565C60; padding: 0.5rem 0.75rem; }
  button.small { padding: 0.4rem 0.85rem; font-size: 0.8125rem; }
  .error { background: #FDECEA; color: #B3261E; padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; margin-bottom: 1.25rem; }
  .flash { background: #E7F3EA; color: #1E6B3A; padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; margin-bottom: 1.25rem; }
  .topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
  .card {
    background: #fff; border: 1px solid rgba(26,28,30,0.1); border-radius: 0.75rem;
    padding: 1rem 1.125rem; margin-bottom: 0.75rem;
  }
  .card.changed { border-color: #DE6A18; }
  .card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
  .card-head-left { display: flex; gap: 0.75rem; align-items: flex-start; min-width: 0; }
  .thumb { width: 44px; height: 44px; border-radius: 0.5rem; object-fit: contain; background: #F1F0EC; border: 1px solid rgba(26,28,30,0.08); flex-shrink: 0; }
  .model { font-weight: 600; font-size: 1rem; }
  .variant { color: #565C60; font-size: 0.8125rem; }
  .sku { font-family: ui-monospace, monospace; font-size: 0.75rem; color: #546166; }
  .category { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.08em; color: #546166; }
  .row { display: flex; gap: 0.75rem; margin-top: 0.75rem; flex-wrap: wrap; align-items: end; }
  .field { flex: 1; min-width: 140px; }
  .badge { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.06em; color: #DE6A18; }
  .controls { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
  .controls #search { flex: 1; min-width: 200px; }
  .controls #categoryFilter { width: auto; min-width: 160px; }
  .empty { text-align: center; color: #565C60; padding: 2rem 0; }
  .family { margin-bottom: 1.25rem; }
  .family-head { display: flex; gap: 0.75rem; align-items: center; padding: 0 0.25rem 0.6rem; }
  .family-title { font-weight: 600; font-size: 1.0625rem; }
  .card.in-family { margin-left: 1.5rem; border-left: 2px solid rgba(26,28,30,0.08); border-top-left-radius: 0; border-bottom-left-radius: 0; }
  .variant-label { font-weight: 600; font-size: 0.9375rem; }
  .thumb.small { width: 32px; height: 32px; }
  .photo-row { margin-top: 0.75rem; display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; padding-top: 0.75rem; border-top: 1px dashed rgba(26,28,30,0.12); }
  .photo-row input[type=file] { flex: 1; min-width: 160px; }
  .photo-source { flex-basis: 100%; font-size: 0.75rem; font-weight: 500; }
  .photo-source.own { color: #DE6A18; }
  .photo-source.default { color: #565C60; }
  details.section { background: #fff; border: 1px solid rgba(26,28,30,0.1); border-radius: 0.75rem; padding: 0.25rem 1.125rem 1rem; margin-bottom: 0.75rem; }
  details.section summary { cursor: pointer; padding: 0.85rem 0; font-weight: 600; font-size: 0.9375rem; }
  table.diag { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
  table.diag td { padding: 0.4rem 0; border-bottom: 1px solid rgba(26,28,30,0.06); }
  table.diag td:first-child { color: #565C60; padding-right: 1rem; }
  .dot { display: inline-block; width: 8px; height: 8px; border-radius: 999px; margin-right: 0.4rem; }
  .dot.ok { background: #1E6B3A; }
  .dot.bad { background: #B3261E; }
  ul.backups { list-style: none; margin: 0; padding: 0; font-size: 0.8125rem; }
  ul.backups li { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0; border-bottom: 1px solid rgba(26,28,30,0.06); gap: 0.5rem; }
  ul.backups a { color: #1A1C1E; }
</style>
</head>
<body>

<?php if (!$loggedIn): ?>

  <div class="login-wrap">
    <h1>SHINEMATE — управление каталогом</h1>
    <?php if ($error): ?><p class="error"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p><?php endif; ?>
    <form method="post" autocomplete="off">
      <input type="hidden" name="action" value="login" />
      <label for="password">Пароль</label>
      <input type="password" id="password" name="password" required autofocus />
      <div style="margin-top: 1rem;"><button type="submit">Войти</button></div>
    </form>
  </div>

<?php else: ?>

  <div class="wrap">
    <div class="topbar">
      <h1 style="margin:0;">SHINEMATE — управление каталогом</h1>
      <form method="post">
        <input type="hidden" name="action" value="logout" />
        <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>" />
        <button type="submit" class="secondary">Выйти</button>
      </form>
    </div>

    <?php if ($error): ?><p class="error"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p><?php endif; ?>
    <?php if ($flash): ?><p class="flash"><?= $flash ?><?= isset($_GET['saved']) ? ' — на сайте обновится сразу, перезагрузку страницы товара делать не нужно.' : '' ?></p><?php endif; ?>

    <div class="controls">
      <input type="search" id="search" placeholder="Поиск по модели или артикулу…" />
      <select id="categoryFilter">
        <option value="">Все категории</option>
        <?php foreach ($categoryList as $c): ?>
          <option value="<?= htmlspecialchars(mb_strtolower($c), ENT_QUOTES, 'UTF-8') ?>"><?= htmlspecialchars($c, ENT_QUOTES, 'UTF-8') ?></option>
        <?php endforeach; ?>
      </select>
    </div>

    <div id="list">
      <?php if (!$products): ?>
        <p class="empty">Список товаров пуст. Проверьте, что admin-data/catalog-index.json загружен на сервер (генерируется командой npm run build).</p>
      <?php endif; ?>
      <?php foreach ($groups as $familyModel => $variants): ?>
        <?php
          // Семейство целиком скрывается поиском/фильтром, только если ВСЕ
          // его исполнения не подходят — иначе, набирая артикул одного
          // размера, пропадали бы остальные размеры того же товара.
          $familySearch = mb_strtolower($familyModel);
          foreach ($variants as $v) { $familySearch .= ' ' . mb_strtolower($v['sku']); }
          $familyCategory = mb_strtolower($variants[0]['category']);
        ?>
        <section class="family" data-search="<?= htmlspecialchars($familySearch, ENT_QUOTES, 'UTF-8') ?>" data-category="<?= htmlspecialchars($familyCategory, ENT_QUOTES, 'UTF-8') ?>">
          <?php if (count($variants) > 1): ?>
            <div class="family-head">
              <img class="thumb" src="../<?= htmlspecialchars($variants[0]['image'], ENT_QUOTES, 'UTF-8') ?>" alt="" loading="lazy" />
              <div>
                <div class="category"><?= htmlspecialchars($variants[0]['category'], ENT_QUOTES, 'UTF-8') ?></div>
                <div class="family-title"><?= htmlspecialchars($familyModel, ENT_QUOTES, 'UTF-8') ?></div>
              </div>
            </div>
          <?php endif; ?>
          <?php foreach ($variants as $p): ?>
            <div class="card<?= $p['overridden'] ? ' changed' : '' ?><?= count($variants) > 1 ? ' in-family' : '' ?>">
              <div class="card-head">
                <?php if (count($variants) === 1): ?>
                  <div class="card-head-left">
                    <img class="thumb" src="../<?= htmlspecialchars($p['image'], ENT_QUOTES, 'UTF-8') ?>" alt="" loading="lazy" />
                    <div>
                      <div class="category"><?= htmlspecialchars($p['category'], ENT_QUOTES, 'UTF-8') ?></div>
                      <div class="model"><?= htmlspecialchars($p['model'], ENT_QUOTES, 'UTF-8') ?></div>
                      <div class="sku">Артикул: <?= htmlspecialchars($p['sku'], ENT_QUOTES, 'UTF-8') ?></div>
                    </div>
                  </div>
                <?php else: ?>
                  <div class="card-head-left">
                    <img class="thumb small" src="../<?= htmlspecialchars($p['image'], ENT_QUOTES, 'UTF-8') ?>" alt="" loading="lazy" />
                    <div>
                      <div class="variant-label"><?= htmlspecialchars($p['variantLabel'] ?: $p['sku'], ENT_QUOTES, 'UTF-8') ?></div>
                      <div class="sku">Артикул: <?= htmlspecialchars($p['sku'], ENT_QUOTES, 'UTF-8') ?></div>
                    </div>
                  </div>
                <?php endif; ?>
                <?php if ($p['overridden']): ?><span class="badge">Изменено вручную</span><?php endif; ?>
              </div>
              <form method="post" class="row" data-dirty-form>
                <input type="hidden" name="action" value="save" />
                <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>" />
                <input type="hidden" name="sku" value="<?= htmlspecialchars($p['sku'], ENT_QUOTES, 'UTF-8') ?>" />
                <div class="field">
                  <label>Цена, ₽</label>
                  <input type="text" inputmode="decimal" name="price" value="<?= htmlspecialchars((string) $p['rrp'], ENT_QUOTES, 'UTF-8') ?>" required />
                </div>
                <div class="field">
                  <label>Наличие</label>
                  <select name="status">
                    <?php foreach (ADMIN_STATUSES as $s): ?>
                      <option value="<?= $s ?>" <?= ($p['status'] ?? 'in_stock') === $s ? 'selected' : '' ?>>
                        <?= htmlspecialchars(admin_status_label($s), ENT_QUOTES, 'UTF-8') ?>
                      </option>
                    <?php endforeach; ?>
                  </select>
                </div>
                <div><button type="submit">Сохранить</button></div>
              </form>

              <form method="post" enctype="multipart/form-data" class="photo-row">
                <span class="photo-source <?= $p['imageOverridden'] ? 'own' : 'default' ?>">
                  <?= $p['imageOverridden'] ? 'Фото: своё' : 'Фото: по умолчанию' ?>
                </span>
                <input type="hidden" name="action" value="upload_image" />
                <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>" />
                <input type="hidden" name="sku" value="<?= htmlspecialchars($p['sku'], ENT_QUOTES, 'UTF-8') ?>" />
                <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required />
                <button type="submit" class="small secondary">Загрузить фото</button>
              </form>
              <?php if ($p['imageOverridden']): ?>
                <form method="post" style="margin-top:0.4rem;">
                  <input type="hidden" name="action" value="restore_image" />
                  <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>" />
                  <input type="hidden" name="sku" value="<?= htmlspecialchars($p['sku'], ENT_QUOTES, 'UTF-8') ?>" />
                  <button type="submit" class="small secondary">Вернуть фото по умолчанию</button>
                </form>
              <?php endif; ?>
            </div>
          <?php endforeach; ?>
        </section>
      <?php endforeach; ?>
    </div>

    <h2>Диагностика</h2>
    <details class="section">
      <summary>Состояние сервера и почты</summary>
      <table class="diag">
        <?php foreach ($diagnostics as $d): ?>
          <tr>
            <td><span class="dot <?= $d['ok'] ? 'ok' : 'bad' ?>"></span><?= htmlspecialchars($d['label'], ENT_QUOTES, 'UTF-8') ?></td>
            <td><?= htmlspecialchars($d['value'], ENT_QUOTES, 'UTF-8') ?></td>
          </tr>
        <?php endforeach; ?>
      </table>
      <form method="post" style="margin-top:1rem;">
        <input type="hidden" name="action" value="test_mail" />
        <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>" />
        <button type="submit" class="small">Отправить тестовое письмо</button>
      </form>
    </details>

    <h2>Бэкапы цен и наличия</h2>
    <details class="section">
      <summary>Последние <?= count($backups) ?> из <?= MAX_BACKUPS ?></summary>
      <?php if (!$backups): ?>
        <p class="empty" style="padding:0.5rem 0;">Бэкапов пока нет — появятся после первого сохранения.</p>
      <?php else: ?>
        <ul class="backups">
          <?php foreach ($backups as $b): ?>
            <li>
              <span><?= htmlspecialchars($b, ENT_QUOTES, 'UTF-8') ?></span>
              <a href="index.php?action=download_backup&amp;file=<?= urlencode($b) ?>">Скачать</a>
            </li>
          <?php endforeach; ?>
        </ul>
      <?php endif; ?>
    </details>

    <h2>Смена пароля</h2>
    <details class="section">
      <summary>Сменить пароль входа в панель управления</summary>
      <form method="post" autocomplete="off">
        <input type="hidden" name="action" value="change_password" />
        <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>" />
        <div style="margin-bottom:0.75rem;">
          <label for="current_password">Текущий пароль</label>
          <input type="password" id="current_password" name="current_password" required />
        </div>
        <div style="margin-bottom:0.75rem;">
          <label for="new_password">Новый пароль (не короче 10 символов)</label>
          <input type="password" id="new_password" name="new_password" minlength="10" required />
        </div>
        <div style="margin-bottom:0.75rem;">
          <label for="new_password_confirm">Повторите новый пароль</label>
          <input type="password" id="new_password_confirm" name="new_password_confirm" minlength="10" required />
        </div>
        <button type="submit" class="small">Сменить пароль</button>
      </form>
    </details>
  </div>

  <script>
    // Фильтрация на клиенте — товаров мало, отдельный запрос на сервер не нужен.
    // Фильтруются целиком СЕМЕЙСТВА (.family), не отдельные исполнения —
    // иначе поиск по одному артикулу прятал бы соседние размеры того же товара.
    var search = document.getElementById('search');
    var categoryFilter = document.getElementById('categoryFilter');
    var families = Array.prototype.slice.call(document.querySelectorAll('#list .family'));
    function applyFilter() {
      var q = search.value.trim().toLowerCase();
      var cat = categoryFilter.value;
      families.forEach(function (family) {
        var matchesSearch = !q || family.dataset.search.indexOf(q) !== -1;
        var matchesCategory = !cat || family.dataset.category === cat;
        family.style.display = matchesSearch && matchesCategory ? '' : 'none';
      });
    }
    search.addEventListener('input', applyFilter);
    categoryFilter.addEventListener('change', applyFilter);

    // Предупреждение при уходе со страницы с несохранённой ценой/наличием —
    // клиент отредактировал поле, но не нажал "Сохранить". Фото-формы сюда
    // не входят: там нет "черновика", загрузка происходит сразу по кнопке.
    // Сброс отметки — на submit самой этой формы (сохранение уводит со
    // страницы через redirect, so сама форма всё равно не остаётся "грязной").
    var dirty = false;
    document.querySelectorAll('[data-dirty-form]').forEach(function (form) {
      form.addEventListener('input', function () { dirty = true; });
      form.addEventListener('submit', function () { dirty = false; });
    });
    window.addEventListener('beforeunload', function (e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    });
  </script>

<?php endif; ?>
</body>
</html>
