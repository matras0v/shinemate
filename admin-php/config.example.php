<?php
/**
 * Настройки /admin. Пароль хранится только как bcrypt-хеш — не в
 * открытом виде, не в JS-бандле фронтенда (этот файл вообще никогда
 * не попадает в браузер как исходник, PHP выполняется на сервере).
 *
 * Это ШАБЛОН — не используется приложением напрямую. Реальный
 * config.php с настоящим хешом пароля НЕ хранится в git (см.
 * .gitignore) и не публиковался нигде, кроме этого чата и ZIP-пакета
 * для загрузки на сервер.
 *
 * СМЕНА ПАРОЛЯ: сгенерируйте новый хеш на сервере командой
 *   php -r "echo password_hash('НОВЫЙ_ПАРОЛЬ', PASSWORD_DEFAULT), PHP_EOL;"
 * и замените строку ниже в реальном config.php на сервере. Открытый
 * пароль нигде не хранится и не логируется.
 */
if (!defined('SHINEMATE_ADMIN_BOOTSTRAP')) {
    http_response_code(403);
    exit('Forbidden');
}

define('ADMIN_PASSWORD_HASH', 'ВСТАВЬТЕ_СЮДА_BCRYPT_ХЕШ_ПАРОЛЯ');

// Файлы данных — вне веб-доступных путей смысла нет на shared hosting
// без выделенного docroot-разделения, поэтому лежат рядом, но админка
// сама не отдаёт их как статику (см. admin/.htaccess).
define('OVERRIDES_FILE', __DIR__ . '/../data/catalog-overrides.json');
define('CATALOG_INDEX_FILE', __DIR__ . '/../admin-data/catalog-index.json');

define('SESSION_NAME', 'shinemate_admin');
define('MAX_LOGIN_ATTEMPTS', 6);
define('LOGIN_LOCKOUT_SECONDS', 300);
