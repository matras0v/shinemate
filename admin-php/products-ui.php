<?php
if (!defined('SHINEMATE_ADMIN_BOOTSTRAP')) {
    http_response_code(403);
    exit('Forbidden');
}
/**
 * UI раздела "Товары" (созданные клиентом, не из сборки) — вынесено из
 * index.php отдельным include, чтобы не раздувать и без того большой
 * файл ещё на несколько сотен строк. Работает с переменными вызывающей
 * области видимости ($csrf, $myProducts, $myProductsFiltered,
 * $myProductFilter, $editingProduct, $openProductId, $compatCandidates,
 * $error) — тот же процедурный стиль, что и весь остальной admin.
 */
$pubStatusLabel = static function (string $s): string {
    return $s === 'published' ? 'Опубликован' : ($s === 'archived' ? 'В архиве' : 'Черновик');
};
?>
<h2>Товары</h2>
<p style="font-size:0.875rem; color:#565C60; margin-top:-0.75rem;">Товары, добавленные вручную через эту панель — отдельно от каталога сайта, появляются на сайте сразу после публикации, без участия разработчика.</p>

<div class="controls" style="margin-bottom:0.75rem;">
  <a href="index.php?product=new#product-form" class="small" style="text-decoration:none;"><button type="button" class="small">+ Добавить товар</button></a>
  <?php foreach (['all' => 'Все', 'published' => 'Опубликованные', 'draft' => 'Черновики', 'archived' => 'Архив'] as $key => $label): ?>
    <?php $count = $key === 'all' ? count($myProducts) : count(array_filter($myProducts, static fn($p) => ($p['status'] ?? 'draft') === $key)); ?>
    <a href="index.php?pfilter=<?= $key ?>" style="text-decoration:none;">
      <button type="button" class="small<?= $myProductFilter === $key ? '' : ' secondary' ?>"><?= $label ?> (<?= $count ?>)</button>
    </a>
  <?php endforeach; ?>
</div>

<?php if (!$myProductsFiltered): ?>
  <p class="empty">Пока нет товаров в этом фильтре.</p>
<?php else: ?>
  <?php foreach ($myProductsFiltered as $p): ?>
    <?php
      $prices = array_map(static fn($v) => (float)($v['rrp'] ?? 0), $p['variants'] ?? []);
      $priceLabel = $prices ? (count($prices) > 1 ? 'от ' . number_format(min($prices), 0, ',', ' ') . ' ₽' : number_format($prices[0], 0, ',', ' ') . ' ₽') : '—';
      $status = $p['status'] ?? 'draft';
    ?>
    <div class="card">
      <div class="card-head">
        <div class="card-head-left">
          <img class="thumb" src="../<?= htmlspecialchars((string)($p['image'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" alt="" loading="lazy" />
          <div>
            <div class="category"><?= htmlspecialchars(ADMIN_PRODUCT_CATEGORIES[$p['category'] ?? ''] ?? ($p['category'] ?? ''), ENT_QUOTES, 'UTF-8') ?></div>
            <div class="model"><?= htmlspecialchars((string)($p['model'] ?? ''), ENT_QUOTES, 'UTF-8') ?></div>
            <div class="sku"><?= count($p['variants'] ?? []) ?> артикул(ов) · <?= $priceLabel ?></div>
          </div>
        </div>
        <span class="badge-status <?= $status === 'published' ? 'on' : 'off' ?>"><?= $pubStatusLabel($status) ?></span>
      </div>
      <div class="row" style="margin-top:0.75rem;">
        <a href="index.php?product=<?= urlencode((string)$p['id']) ?>#product-form" style="text-decoration:none;"><button type="button" class="small">Редактировать</button></a>
        <?php if ($status === 'archived'): ?>
          <form method="post" style="display:inline;">
            <input type="hidden" name="action" value="product_restore" />
            <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>" />
            <input type="hidden" name="product_id" value="<?= htmlspecialchars((string)$p['id'], ENT_QUOTES, 'UTF-8') ?>" />
            <button type="submit" class="small secondary">Восстановить</button>
          </form>
          <form method="post" style="display:inline;" onsubmit="return confirm('Удалить товар «<?= htmlspecialchars(addslashes((string)$p['model']), ENT_QUOTES, 'UTF-8') ?>» НАВСЕГДА? Это действие нельзя отменить — все фото и данные товара будут удалены с сервера.');">
            <input type="hidden" name="action" value="product_delete" />
            <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>" />
            <input type="hidden" name="product_id" value="<?= htmlspecialchars((string)$p['id'], ENT_QUOTES, 'UTF-8') ?>" />
            <button type="submit" class="small secondary" style="color:#B3261E;">Удалить навсегда</button>
          </form>
        <?php else: ?>
          <form method="post" style="display:inline;" onsubmit="return confirm('Архивировать товар? Он исчезнет с сайта, но останется в панели — потом можно восстановить.');">
            <input type="hidden" name="action" value="product_archive" />
            <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>" />
            <input type="hidden" name="product_id" value="<?= htmlspecialchars((string)$p['id'], ENT_QUOTES, 'UTF-8') ?>" />
            <button type="submit" class="small secondary">Архивировать</button>
          </form>
        <?php endif; ?>
        <?php if ($status === 'published'): ?>
          <a href="../catalog/<?= htmlspecialchars((string)$p['category'], ENT_QUOTES, 'UTF-8') ?>/<?= htmlspecialchars((string)$p['slug'], ENT_QUOTES, 'UTF-8') ?>" target="_blank" rel="noopener" style="font-size:0.8125rem; align-self:center;">Открыть на сайте →</a>
        <?php endif; ?>
      </div>
    </div>
  <?php endforeach; ?>
<?php endif; ?>

<?php if ($openProductId !== null): ?>
<div id="product-form" style="margin-top:1.25rem;">
  <details class="section" open>
    <summary><?= $editingProduct ? 'Редактирование: ' . htmlspecialchars((string)$editingProduct['model'], ENT_QUOTES, 'UTF-8') : 'Новый товар' ?></summary>

    <form method="post" enctype="multipart/form-data" data-dirty-form id="productForm">
      <input type="hidden" name="action" value="product_save" />
      <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>" />
      <input type="hidden" name="product_id" value="<?= htmlspecialchars((string)($editingProduct['id'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" />

      <h3 style="margin-top:0;">Основное</h3>
      <div style="margin-bottom:0.75rem;">
        <label for="p_name">Название товара</label>
        <input type="text" id="p_name" name="name" required maxlength="150" value="<?= htmlspecialchars((string)($editingProduct['model'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" />
      </div>
      <div class="row">
        <div class="field">
          <label for="p_category">Раздел каталога</label>
          <select id="p_category" name="category" required>
            <option value="">— выберите —</option>
            <?php foreach (ADMIN_PRODUCT_CATEGORIES as $catId => $catTitle): ?>
              <option value="<?= $catId ?>" <?= ($editingProduct['category'] ?? '') === $catId ? 'selected' : '' ?>><?= htmlspecialchars($catTitle, ENT_QUOTES, 'UTF-8') ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="field">
          <label for="p_slug">URL (необязательно — сгенерируется из названия)</label>
          <input type="text" id="p_slug" name="slug" maxlength="80" placeholder="flat-face-green-t120" value="<?= htmlspecialchars((string)($editingProduct['slug'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" />
        </div>
      </div>
      <div style="margin-bottom:0.75rem;">
        <label for="p_short">Краткое описание (видно на карточке и вверху страницы товара)</label>
        <input type="text" id="p_short" name="short_description" required maxlength="400" value="<?= htmlspecialchars((string)($editingProduct['lead'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" />
      </div>
      <div style="margin-bottom:0.75rem;">
        <label for="p_full">Полное описание (необязательно)</label>
        <textarea id="p_full" name="description" rows="4" maxlength="4000"><?= htmlspecialchars((string)($editingProduct['description'] ?? ''), ENT_QUOTES, 'UTF-8') ?></textarea>
      </div>

      <h3>Цена и наличие</h3>
      <p style="font-size:0.8125rem; color:#565C60;">Если у товара несколько размеров/исполнений — заполните первое здесь и добавьте остальные кнопкой ниже. «Название/размер» обязательно у КАЖДОГО исполнения, если их больше одного.</p>
      <div id="variantsList">
        <?php
          $existingVariants = $editingProduct['variants'] ?? [];
          if (!$existingVariants) {
              $existingVariants = [[]];
          }
          foreach ($existingVariants as $vi => $v):
        ?>
          <div class="variant-row" style="border:1px solid rgba(26,28,30,0.1); border-radius:0.5rem; padding:0.75rem; margin-bottom:0.5rem;">
            <div class="row">
              <div class="field">
                <label>Название/размер (напр. «100 мм»; обязательно, если исполнений больше одного)</label>
                <input type="text" name="variant_label[]" maxlength="80" value="<?= htmlspecialchars((string)($v['axis1'] ?? ($v['label'] ?? '')), ENT_QUOTES, 'UTF-8') ?>" />
              </div>
              <div class="field">
                <label>Дюймы (необязательно, мелким текстом рядом)</label>
                <input type="text" name="variant_alt[]" maxlength="20" placeholder="4&quot;" value="<?= htmlspecialchars((string)($v['axis1Alt'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" />
              </div>
            </div>
            <div class="row">
              <div class="field">
                <label>Артикул (SKU)</label>
                <input type="text" name="variant_sku[]" maxlength="60" value="<?= htmlspecialchars((string)($v['sku'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" />
              </div>
              <div class="field">
                <label>Цена, ₽</label>
                <input type="text" inputmode="decimal" name="variant_price[]" value="<?= htmlspecialchars((string)($v['rrp'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" />
              </div>
              <div class="field">
                <label>Наличие</label>
                <select name="variant_stock[]">
                  <?php foreach (ADMIN_STATUSES as $s): ?>
                    <option value="<?= $s ?>" <?= ($v['status'] ?? 'in_stock') === $s ? 'selected' : '' ?>><?= htmlspecialchars(admin_status_label($s), ENT_QUOTES, 'UTF-8') ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
            </div>
            <div class="row" style="align-items:center;">
              <div class="field">
                <label>Фото этого исполнения (необязательно — иначе используется главное фото товара)</label>
                <input type="file" name="variant_image[]" accept="image/jpeg,image/png,image/webp" />
                <input type="hidden" name="variant_keep_image[]" value="<?= htmlspecialchars((string)($v['image'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" />
                <?php if (!empty($v['image'])): ?><span class="photo-source own">своё фото уже загружено</span><?php endif; ?>
              </div>
              <button type="button" class="small secondary variant-remove" style="align-self:flex-end;">Удалить исполнение</button>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
      <button type="button" class="small secondary" id="addVariant">+ Добавить вариант</button>
      <div style="margin-top:0.75rem; max-width:260px;">
        <label for="p_axis_label">Подпись над переключателем (если исполнений больше одного)</label>
        <input type="text" id="p_axis_label" name="axis_label" maxlength="30" placeholder="Размер" value="<?= htmlspecialchars((string)($editingProduct['axisLabel'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" />
      </div>

      <h3>Фотографии товара</h3>
      <div id="photosList" style="display:flex; flex-wrap:wrap; gap:0.75rem;">
        <?php foreach (($editingProduct['images'] ?? []) as $pi => $src): ?>
          <div class="photo-item" style="border:1px solid rgba(26,28,30,0.12); border-radius:0.5rem; padding:0.5rem; width:140px;">
            <img src="../<?= htmlspecialchars($src, ENT_QUOTES, 'UTF-8') ?>" style="width:100%; height:100px; object-fit:contain; background:#F1F0EC; border-radius:0.35rem;" alt="" />
            <input type="hidden" name="photo_keep[]" value="<?= htmlspecialchars($src, ENT_QUOTES, 'UTF-8') ?>" />
            <label style="display:flex; align-items:center; gap:0.35rem; font-size:0.75rem; margin-top:0.35rem;">
              <input type="radio" name="primary_photo" value="<?= $pi ?>" <?= ($editingProduct['image'] ?? '') === $src ? 'checked' : '' ?> /> Главное фото
            </label>
            <div class="row" style="gap:0.25rem; margin-top:0.25rem;">
              <button type="button" class="small secondary photo-up">↑</button>
              <button type="button" class="small secondary photo-down">↓</button>
              <button type="button" class="small secondary photo-remove">Удалить</button>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
      <div style="margin-top:0.5rem;">
        <label for="p_new_photos">+ Добавить фото (можно выбрать сразу несколько)</label>
        <input type="file" id="p_new_photos" name="new_photos[]" accept="image/jpeg,image/png,image/webp" multiple />
      </div>

      <h3>Характеристики</h3>
      <div id="specsList">
        <?php foreach (($editingProduct['specs'] ?? []) as $s): ?>
          <div class="spec-row row">
            <div class="field"><input type="text" name="spec_label[]" placeholder="Характеристика" maxlength="60" value="<?= htmlspecialchars((string)($s['label'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" /></div>
            <div class="field"><input type="text" name="spec_value[]" placeholder="Значение" maxlength="200" value="<?= htmlspecialchars((string)($s['value'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" /></div>
            <button type="button" class="small secondary spec-remove">Удалить</button>
          </div>
        <?php endforeach; ?>
      </div>
      <button type="button" class="small secondary" id="addSpec">+ Добавить характеристику</button>

      <h3>Совместимость (необязательно)</h3>
      <input type="search" id="compatFilter" placeholder="Поиск по названию или артикулу…" style="margin-bottom:0.5rem;" />
      <div id="compatList" style="max-height:200px; overflow-y:auto; border:1px solid rgba(26,28,30,0.1); border-radius:0.5rem; padding:0.5rem;">
        <?php $selectedCompat = array_flip($editingProduct['compatibleProductIds'] ?? []); ?>
        <?php foreach ($compatCandidates as $cand): ?>
          <label data-compat-search="<?= htmlspecialchars(mb_strtolower(($cand['model'] ?? '') . ' ' . ($cand['sku'] ?? '')), ENT_QUOTES, 'UTF-8') ?>" style="display:flex; gap:0.5rem; align-items:center; font-size:0.8125rem; padding:0.25rem 0;">
            <input type="checkbox" name="compatible[]" value="<?= htmlspecialchars((string)($cand['sku'] ?? ''), ENT_QUOTES, 'UTF-8') ?>" <?= isset($selectedCompat[$cand['sku'] ?? '']) ? 'checked' : '' ?> />
            <?= htmlspecialchars((string)($cand['model'] ?? ''), ENT_QUOTES, 'UTF-8') ?> — <span class="sku"><?= htmlspecialchars((string)($cand['sku'] ?? ''), ENT_QUOTES, 'UTF-8') ?></span>
          </label>
        <?php endforeach; ?>
      </div>

      <h3>Публикация</h3>
      <select name="pub_status" style="max-width:220px;">
        <option value="draft" <?= ($editingProduct['status'] ?? 'draft') === 'draft' ? 'selected' : '' ?>>Черновик (не виден на сайте)</option>
        <option value="published" <?= ($editingProduct['status'] ?? '') === 'published' ? 'selected' : '' ?>>Опубликован</option>
      </select>

      <div style="margin-top:1.25rem; display:flex; gap:0.75rem;">
        <button type="submit">Сохранить товар</button>
        <a href="index.php" style="align-self:center; font-size:0.875rem;">Отменить</a>
      </div>
    </form>
  </details>
</div>
<?php endif; ?>

<template id="variantRowTemplate">
  <div class="variant-row" style="border:1px solid rgba(26,28,30,0.1); border-radius:0.5rem; padding:0.75rem; margin-bottom:0.5rem;">
    <div class="row">
      <div class="field">
        <label>Название/размер (напр. «100 мм»; обязательно, если исполнений больше одного)</label>
        <input type="text" name="variant_label[]" maxlength="80" />
      </div>
      <div class="field">
        <label>Дюймы (необязательно, мелким текстом рядом)</label>
        <input type="text" name="variant_alt[]" maxlength="20" placeholder="4&quot;" />
      </div>
    </div>
    <div class="row">
      <div class="field">
        <label>Артикул (SKU)</label>
        <input type="text" name="variant_sku[]" maxlength="60" />
      </div>
      <div class="field">
        <label>Цена, ₽</label>
        <input type="text" inputmode="decimal" name="variant_price[]" />
      </div>
      <div class="field">
        <label>Наличие</label>
        <select name="variant_stock[]">
          <option value="in_stock">В наличии</option>
          <option value="on_request">Под заказ / цена по запросу</option>
          <option value="out_of_stock">Нет в наличии</option>
        </select>
      </div>
    </div>
    <div class="row" style="align-items:center;">
      <div class="field">
        <label>Фото этого исполнения (необязательно)</label>
        <input type="file" name="variant_image[]" accept="image/jpeg,image/png,image/webp" />
        <input type="hidden" name="variant_keep_image[]" value="" />
      </div>
      <button type="button" class="small secondary variant-remove" style="align-self:flex-end;">Удалить исполнение</button>
    </div>
  </div>
</template>

<template id="specRowTemplate">
  <div class="spec-row row">
    <div class="field"><input type="text" name="spec_label[]" placeholder="Характеристика" maxlength="60" /></div>
    <div class="field"><input type="text" name="spec_value[]" placeholder="Значение" maxlength="200" /></div>
    <button type="button" class="small secondary spec-remove">Удалить</button>
  </div>
</template>

<script>
(function () {
  var form = document.getElementById('productForm');
  if (!form) return;

  function cloneTemplate(tplId, containerId) {
    var tpl = document.getElementById(tplId);
    var container = document.getElementById(containerId);
    var node = tpl.content.cloneNode(true);
    container.appendChild(node);
  }

  var addVariantBtn = document.getElementById('addVariant');
  if (addVariantBtn) addVariantBtn.addEventListener('click', function () { cloneTemplate('variantRowTemplate', 'variantsList'); });

  var addSpecBtn = document.getElementById('addSpec');
  if (addSpecBtn) addSpecBtn.addEventListener('click', function () { cloneTemplate('specRowTemplate', 'specsList'); });

  // Делегирование кликов "Удалить" — работает и для строк, добавленных позже клоном шаблона.
  form.addEventListener('click', function (e) {
    var t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.classList.contains('variant-remove')) {
      var row = t.closest('.variant-row');
      if (row) row.remove();
    } else if (t.classList.contains('spec-remove')) {
      var srow = t.closest('.spec-row');
      if (srow) srow.remove();
    } else if (t.classList.contains('photo-remove')) {
      var prow = t.closest('.photo-item');
      if (prow) prow.remove();
    } else if (t.classList.contains('photo-up')) {
      var up = t.closest('.photo-item');
      if (up && up.previousElementSibling) up.parentNode.insertBefore(up, up.previousElementSibling);
    } else if (t.classList.contains('photo-down')) {
      var down = t.closest('.photo-item');
      if (down && down.nextElementSibling) down.parentNode.insertBefore(down.nextElementSibling, down);
    }
  });

  // Автогенерация slug на клиенте — только подсказка, финальный slug всё равно нормализует сервер.
  var nameInput = document.getElementById('p_name');
  var slugInput = document.getElementById('p_slug');
  if (nameInput && slugInput) {
    nameInput.addEventListener('blur', function () {
      if (slugInput.value.trim() !== '') return;
      var map = {а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
      var s = nameInput.value.toLowerCase().split('').map(function (ch) { return map[ch] !== undefined ? map[ch] : ch; }).join('');
      s = s.replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');
      slugInput.placeholder = s;
    });
  }

  // Поиск по списку совместимости.
  var compatFilter = document.getElementById('compatFilter');
  if (compatFilter) {
    compatFilter.addEventListener('input', function () {
      var q = compatFilter.value.trim().toLowerCase();
      document.querySelectorAll('#compatList label').forEach(function (label) {
        var hay = label.getAttribute('data-compat-search') || '';
        label.style.display = !q || hay.indexOf(q) !== -1 ? '' : 'none';
      });
    });
  }
})();
</script>
