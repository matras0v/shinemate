<?php
if (!defined('SHINEMATE_ADMIN_BOOTSTRAP')) {
    http_response_code(403);
    exit('Forbidden');
}

/**
 * Своя копия отправки письма (не require из ../api-php/mailer.php):
 * admin-php/ и api-php/ — это ДВЕ ОТДЕЛЬНЫЕ папки в исходниках, которые на
 * сервере после сборки/упаковки становятся сестринскими admin/ и api/, а
 * не admin/ и api-php/. Жёстко прописанный относительный путь в одну из
 * этих папок был бы либо неверным в исходниках (локальный dev), либо
 * неверным после деплоя (реальные имена папок на сервере) — в зависимости
 * от того, что именно захардкодить. Дублирование ~15 строк дешевле, чем
 * подгонка путей под два разных набора имён.
 */
function admin_send_mail(string $to, string $subject, string $body, ?string $replyTo = null): bool
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
