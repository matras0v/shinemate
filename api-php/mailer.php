<?php
declare(strict_types=1);

/*
 * Общий guard-константой SHINEMATE_MAILER_BOOTSTRAP (не SHINEMATE_API_
 * BOOTSTRAP/SHINEMATE_ADMIN_BOOTSTRAP) — этот файл подключают ОБА:
 * /api/contact.php и панель управления каталогом (тестовое письмо из
 * "Диагностики"), а они с точки зрения этого файла равноправны, отдельная
 * константа не привязывает его к одному из двух модулей.
 */
if (!defined('SHINEMATE_MAILER_BOOTSTRAP')) {
    http_response_code(403);
    exit('Forbidden');
}

/**
 * Общая отправка почты для /api/contact.php и тестового письма из панели
 * управления ("Диагностика" → "Отправить тестовое письмо"). Кодирует
 * кириллическую тему в MIME (=?UTF-8?B?...?=) — иначе почтовые клиенты
 * показывают тему как набор "?????" или вопросительные знаки.
 */
function sm_send_mail(string $to, string $subject, string $body, ?string $replyTo = null): bool
{
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'From: ' . CONTACT_FROM_NAME . ' <' . CONTACT_FROM . '>',
    ];
    if ($replyTo !== null && $replyTo !== '') {
        $headers[] = 'Reply-To: ' . $replyTo;
    }
    return @mail($to, $encodedSubject, $body, implode("\r\n", $headers));
}
