<?php
declare(strict_types=1);

define('SHINEMATE_ADMIN_BOOTSTRAP', true);
require __DIR__ . '/config.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/catalog.php';

admin_start_session();

$error = null;
$flash = null;

/* ── POST: логин или сохранение ── */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'login') {
        if (admin_login_locked()) {
            $error = 'Слишком много попыток входа. Подождите несколько минут и попробуйте снова.';
        } elseif (admin_login((string) ($_POST['password'] ?? ''))) {
            header('Location: index.php');
            exit;
        } else {
            $error = 'Неверный пароль.';
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
                $overrides[$sku] = [
                    'price' => round((float) $priceRaw, 2),
                    'status' => $status,
                ];
                if (admin_write_overrides($overrides)) {
                    header('Location: index.php?saved=' . urlencode($sku));
                    exit;
                }
                $error = 'Не удалось сохранить — проверьте права на запись файла data/catalog-overrides.json на сервере.';
            }
        }
    }
}

if (isset($_GET['saved'])) {
    $flash = 'Сохранено: ' . htmlspecialchars((string) $_GET['saved'], ENT_QUOTES, 'UTF-8');
}

$loggedIn = admin_is_logged_in();
$products = $loggedIn ? admin_effective_products() : [];
$csrf = $loggedIn ? admin_csrf_token() : null;
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
  .wrap { max-width: 720px; margin: 0 auto; }
  .login-wrap { max-width: 340px; margin: 4rem auto; }
  label { display: block; font-size: 0.8125rem; color: #565C60; margin-bottom: 0.375rem; }
  input[type=password], input[type=text], input[type=search], select {
    width: 100%; padding: 0.65rem 0.75rem; border: 1px solid rgba(26,28,30,0.18);
    border-radius: 0.5rem; font-size: 0.9375rem; background: #fff; color: #1A1C1E;
  }
  button {
    cursor: pointer; border: none; border-radius: 999px; padding: 0.65rem 1.5rem;
    font-size: 0.875rem; font-weight: 500; background: #1A1C1E; color: #F7F6F2;
  }
  button:hover { background: #34383B; }
  button.secondary { background: transparent; color: #565C60; padding: 0.5rem 0.75rem; }
  .error { background: #FDECEA; color: #B3261E; padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; margin-bottom: 1.25rem; }
  .flash { background: #E7F3EA; color: #1E6B3A; padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; margin-bottom: 1.25rem; }
  .topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
  .card {
    background: #fff; border: 1px solid rgba(26,28,30,0.1); border-radius: 0.75rem;
    padding: 1rem 1.125rem; margin-bottom: 0.75rem;
  }
  .card.changed { border-color: #DE6A18; }
  .card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
  .model { font-weight: 600; font-size: 1rem; }
  .variant { color: #565C60; font-size: 0.8125rem; }
  .sku { font-family: ui-monospace, monospace; font-size: 0.75rem; color: #546166; }
  .category { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.08em; color: #546166; }
  .row { display: flex; gap: 0.75rem; margin-top: 0.75rem; flex-wrap: wrap; align-items: end; }
  .field { flex: 1; min-width: 140px; }
  .badge { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.06em; color: #DE6A18; }
  #search { margin-bottom: 1.25rem; }
  .empty { text-align: center; color: #565C60; padding: 2rem 0; }
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
    <?php if ($flash): ?><p class="flash"><?= $flash ?> — на сайте обновится сразу, перезагрузку страницы товара делать не нужно.</p><?php endif; ?>

    <input type="search" id="search" placeholder="Поиск по модели или артикулу…" />

    <div id="list">
      <?php if (!$products): ?>
        <p class="empty">Список товаров пуст. Проверьте, что admin-data/catalog-index.json загружен на сервер (генерируется командой npm run build).</p>
      <?php endif; ?>
      <?php foreach ($products as $p): ?>
        <div class="card<?= $p['overridden'] ? ' changed' : '' ?>" data-search="<?= htmlspecialchars(mb_strtolower($p['model'] . ' ' . $p['sku']), ENT_QUOTES, 'UTF-8') ?>">
          <div class="card-head">
            <div>
              <div class="category"><?= htmlspecialchars($p['category'], ENT_QUOTES, 'UTF-8') ?></div>
              <div class="model">
                <?= htmlspecialchars($p['model'], ENT_QUOTES, 'UTF-8') ?>
                <?php if ($p['variantLabel']): ?><span class="variant"> · <?= htmlspecialchars($p['variantLabel'], ENT_QUOTES, 'UTF-8') ?></span><?php endif; ?>
              </div>
              <div class="sku">Артикул: <?= htmlspecialchars($p['sku'], ENT_QUOTES, 'UTF-8') ?></div>
            </div>
            <?php if ($p['overridden']): ?><span class="badge">Изменено вручную</span><?php endif; ?>
          </div>
          <form method="post" class="row">
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
        </div>
      <?php endforeach; ?>
    </div>
  </div>

  <script>
    // Фильтрация на клиенте — товаров мало, отдельный запрос на сервер не нужен.
    var search = document.getElementById('search');
    var cards = Array.prototype.slice.call(document.querySelectorAll('#list .card'));
    search.addEventListener('input', function () {
      var q = search.value.trim().toLowerCase();
      cards.forEach(function (card) {
        card.style.display = card.dataset.search.indexOf(q) === -1 ? 'none' : '';
      });
    });
  </script>

<?php endif; ?>
</body>
</html>
