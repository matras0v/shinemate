<?php
/**
 * Настройки /admin. Пароль хранится только как хеш (Argon2id, если PHP на
 * сервере собран с поддержкой, иначе bcrypt) — не в открытом виде, не в
 * JS-бандле фронтенда (этот файл вообще никогда не попадает в браузер как
 * исходник, PHP выполняется на сервере).
 *
 * Это ШАБЛОН — не используется приложением напрямую. Реальный
 * config.php с настоящим хешом пароля НЕ хранится в git (см.
 * .gitignore) и не публиковался нигде, кроме этого чата и ZIP-пакета
 * для загрузки на сервер.
 *
 * СМЕНА ПАРОЛЯ: проще всего прямо в самой админке (раздел "Смена
 * пароля" внизу страницы после входа) — она сама переписывает
 * ADMIN_PASSWORD_HASH в config.php на сервере. Вручную, на сервере:
 *   php -r "echo password_hash('НОВЫЙ_ПАРОЛЬ', defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT), PHP_EOL;"
 * и заменить строку ниже в реальном config.php. Открытый пароль нигде
 * не хранится и не логируется.
 */
if (!defined('SHINEMATE_ADMIN_BOOTSTRAP')) {
    http_response_code(403);
    exit('Forbidden');
}

define('ADMIN_PASSWORD_HASH', 'ВСТАВЬТЕ_СЮДА_ХЕШ_ПАРОЛЯ');

// Путь, под которым эта папка развёрнута на сервере — НЕ /admin/ (защита
// через неочевидный путь, см. комментарий в реальном config.php). Держать
// в синхроне с реальным именем папки в ZIP и с RedirectMatch в .htaccess.
define('ADMIN_URL_PATH', '/ВСТАВЬТЕ_СЮДА_РЕАЛЬНЫЙ_ПУТЬ/');

// Журнал входов и сохранений — время, IP, что произошло. Не публикуется.
define('AUDIT_LOG_FILE', __DIR__ . '/audit.log');
define('AUDIT_LOG_MAX_LINES', 1000);

// Файлы данных — вне веб-доступных путей смысла нет на shared hosting
// без выделенного docroot-разделения, поэтому лежат рядом, но админка
// сама не отдаёт их как статику (см. admin/.htaccess).
define('OVERRIDES_FILE', __DIR__ . '/../data/catalog-overrides.json');
define('CATALOG_INDEX_FILE', __DIR__ . '/../admin-data/catalog-index.json');

define('SESSION_NAME', 'shinemate_admin');
define('MAX_LOGIN_ATTEMPTS', 6);
define('LOGIN_LOCKOUT_SECONDS', 300);

// Лимит попыток входа хранится в файле (не в сессии) — переживает новую
// вкладку/приватное окно/перезапуск сервера.
define('LOGIN_ATTEMPTS_FILE', __DIR__ . '/login-attempts.json');

// Сессия молча разлогинивает после этого периода бездействия.
define('SESSION_IDLE_SECONDS', 1800);

// Бэкапы overrides.json перед каждым сохранением.
define('BACKUPS_DIR', __DIR__ . '/backups');
define('MAX_BACKUPS', 20);

// Загруженные клиентом фото товаров.
define('MEDIA_DIR', __DIR__ . '/../media/admin-products');
define('MEDIA_MAX_BYTES', 8 * 1024 * 1024);

// Тестовое письмо и заявки с сайта — те же значения, что в api-php/config.php.
define('CONTACT_TO', 'shinemate_russia@mail.ru');
define('CONTACT_FROM', 'webmaster@shinemate-russia.ru');
define('CONTACT_FROM_NAME', 'ShineMate Russia — сайт');
