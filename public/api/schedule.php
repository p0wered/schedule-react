<?php
// Self-contained Web Station endpoint, compatible with PHP 7.4 and newer.
declare(strict_types=1);

const RSREU_SOURCE = 'https://rasp.rsreu.ru/schedule-frame/group?faculty=4&group=2265';
const RSREU_DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

function rsreu_clean(string $text): string
{
    return trim(preg_replace('/\s+/u', ' ', $text));
}

function rsreu_nodes(DOMXPath $xpath, string $query, ?DOMNode $context = null): array
{
    $nodes = $xpath->query($query, $context);
    if ($nodes === false) throw new RuntimeException('Invalid parser query');
    return iterator_to_array($nodes);
}

function rsreu_has_class(DOMNode $node, string $class): bool
{
    return $node instanceof DOMElement && in_array($class, preg_split('/\s+/', $node->getAttribute('class')), true);
}

function rsreu_valid_week($date): bool
{
    if (!is_string($date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/D', $date)) return false;
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date, new DateTimeZone('UTC'));
    return $parsed !== false && $parsed->format('Y-m-d') === $date && $parsed->format('N') === '1';
}

function rsreu_parse_week(string $html): array
{
    if (trim($html) === '' || strlen($html) > 1048576) throw new RuntimeException('Invalid HTML size');
    $document = new DOMDocument('1.0', 'UTF-8');
    $previous = libxml_use_internal_errors(true);
    try {
        // The source lacks a charset meta tag; explicitly preserve Cyrillic text.
        $loaded = $document->loadHTML('<?xml encoding="UTF-8" ?>' . $html, LIBXML_NONET);
    } finally {
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
    }
    if (!$loaded) throw new RuntimeException('Could not parse HTML');
    $xpath = new DOMXPath($document);
    $groups = rsreu_nodes($xpath, '//input[@id="field-group"]');
    if (count($groups) !== 1 || $groups[0]->getAttribute('value') !== '648М') {
        throw new RuntimeException('Unexpected schedule group');
    }
    $options = [];
    $selected = null;
    foreach (rsreu_nodes($xpath, '//select[@name="date"]/option') as $option) {
        $date = $option->getAttribute('value');
        if ($date === '') continue;
        $label = $option->textContent;
        $parity = strpos($label, 'числ.') !== false ? 'numerator'
            : (strpos($label, 'знам.') !== false ? 'denominator' : null);
        if (!rsreu_valid_week($date) || $parity === null) throw new RuntimeException('Invalid schedule week');
        $value = ['date' => $date, 'parity' => $parity, 'current' => strpos($label, '(текущая)') !== false];
        $options[] = $value;
        if ($option->hasAttribute('selected')) {
            if ($selected !== null) throw new RuntimeException('Multiple selected weeks');
            $selected = $value;
        }
    }
    if ($selected === null) throw new RuntimeException('Missing selected week');
    $tables = rsreu_nodes($xpath, '//table[.//th[1][normalize-space(.)="Время"]]');
    if (count($tables) !== 1) throw new RuntimeException('Missing schedule table');
    $rows = rsreu_nodes($xpath, './/tr', $tables[0]);
    if (count($rows) < 2) throw new RuntimeException('Missing time rows');
    $headers = rsreu_nodes($xpath, './th', $rows[0]);
    if (count($headers) !== 7) throw new RuntimeException('Unexpected schedule columns');
    $days = [];
    foreach (RSREU_DAYS as $index => $name) {
        if (strpos($headers[$index + 1]->textContent, $name) === false) throw new RuntimeException('Wrong weekday');
        $days[] = ['weekday' => $index + 1, 'name' => $name, 'pairs' => []];
    }
    $types = ['1' => 'lec', '2' => 'lab', '3' => 'upr'];
    foreach (array_slice($rows, 1) as $row) {
        $cells = rsreu_nodes($xpath, './td', $row);
        if (count($cells) !== 7) throw new RuntimeException('Unexpected schedule row');
        preg_match_all('/\d{2}:\d{2}/', $cells[0]->textContent, $matches);
        $times = $matches[0];
        if (count($times) !== 2 || !rsreu_valid_time($times[0]) || !rsreu_valid_time($times[1])
            || $times[0] >= $times[1]) throw new RuntimeException('Invalid lesson time');
        foreach (array_slice($cells, 1) as $dayIndex => $cell) {
            if (rsreu_clean($cell->textContent) === '') continue;
            preg_match('/\bschedule-lesson-type-(\d+)\b/', $cell->getAttribute('class'), $typeMatch);
            $type = $types[$typeMatch[1] ?? ''] ?? null;
            $content = rsreu_nodes($xpath, './div', $cell);
            $badges = rsreu_nodes($xpath, './/*[contains(concat(" ",normalize-space(@class)," ")," schedule-lesson-type-badge ")]', $cell);
            if ($type === null || count($content) !== 1 || count($badges) !== 1) {
                throw new RuntimeException('Unsupported lesson structure');
            }
            $name = '';
            foreach ($content[0]->childNodes as $node) {
                if ($node instanceof DOMElement && strtolower($node->tagName) === 'br') break;
                if (rsreu_has_class($node, 'schedule-lesson-type-badge')) continue;
                $name .= $node->textContent;
            }
            $name = preg_replace('/[,\s]+$/u', '', rsreu_clean($name));
            if ($name === '') throw new RuntimeException('Missing discipline name');
            $lesson = ['type' => $type, 'name' => $name];
            foreach (['teacher' => '/lecturer?', 'room' => '/classroom?'] as $field => $path) {
                $links = rsreu_nodes($xpath, './/a[contains(@href,"' . $path . '")]', $content[0]);
                if (count($links) > 1) throw new RuntimeException('Multiple lesson locations or teachers');
                if (count($links) === 1) $lesson[$field] = rsreu_clean($links[0]->textContent);
            }
            $id = ($dayIndex + 1) . '-' . str_replace(':', '', $times[0]);
            foreach ($days[$dayIndex]['pairs'] as $pair) {
                if ($pair['id'] === $id) throw new RuntimeException('Duplicate lesson time');
            }
            $days[$dayIndex]['pairs'][] = ['id' => $id, 'time' => ['start' => $times[0], 'end' => $times[1]],
                'schedule' => ['kind' => 'alternating', $selected['parity'] => $lesson]];
        }
    }
    return ['date' => $selected['date'], 'parity' => $selected['parity'], 'options' => $options, 'days' => $days];
}

function rsreu_download(string $url): string
{
    $parts = parse_url($url);
    if (($parts['scheme'] ?? '') !== 'https' || ($parts['host'] ?? '') !== 'rasp.rsreu.ru'
        || ($parts['path'] ?? '') !== '/schedule-frame/group') throw new RuntimeException('Unexpected source URL');
    if (!function_exists('curl_init')) throw new RuntimeException('PHP curl extension is not enabled');
    // Use the bundled Mozilla trust store without modifying the NAS PHP profile
    // or relying on its possibly outdated system certificates.
    $caFile = __DIR__ . '/cacert.pem';
    if (!is_readable($caFile)) throw new RuntimeException('Missing readable api/cacert.pem certificate bundle');
    $curl = curl_init($url);
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 12, CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_CAINFO => $caFile,
        CURLOPT_FOLLOWLOCATION => false, CURLOPT_USERAGENT => 'schedule-react/1.0',
        CURLOPT_HTTPHEADER => ['Accept: text/html']]);
    if (defined('CURLOPT_PROTOCOLS_STR')) curl_setopt($curl, constant('CURLOPT_PROTOCOLS_STR'), 'https');
    else curl_setopt($curl, CURLOPT_PROTOCOLS, CURLPROTO_HTTPS);
    $html = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($curl, CURLINFO_CONTENT_TYPE);
    if ($html === false || $status !== 200 || !is_string($contentType) || strpos($contentType, 'text/html') === false) {
        throw new RuntimeException('Schedule download failed: HTTP ' . $status . ', ' . curl_error($curl));
    }
    return $html;
}

function rsreu_fetch_schedule(?callable $download = null): array
{
    $download = $download ?? 'rsreu_download';
    $current = rsreu_parse_week($download(RSREU_SOURCE));
    $selected = array_values(array_filter($current['options'], function ($option) use ($current) {
        return $option['date'] === $current['date'];
    }));
    if (!$selected[0]['current']) throw new RuntimeException('Source did not return the current week');
    $opposite = array_values(array_filter($current['options'], function ($option) use ($current) {
        return $option['parity'] !== $current['parity'];
    }));
    usort($opposite, function ($a, $b) { return strcmp($a['date'], $b['date']); });
    $neighbor = null;
    foreach ($opposite as $option) {
        $neighbor = $option;
        if ($option['date'] > $current['date']) break;
    }
    if ($neighbor === null) throw new RuntimeException('No opposite week published');
    $other = rsreu_parse_week($download(RSREU_SOURCE . '&date=' . rawurlencode($neighbor['date'])));
    if ($other['date'] !== $neighbor['date'] || $other['parity'] !== $neighbor['parity']) {
        throw new RuntimeException('Wrong week returned');
    }
    $days = $current['days'];
    foreach ($days as $index => &$day) {
        $pairs = [];
        foreach ($day['pairs'] as $pair) $pairs[$pair['id']] = $pair;
        foreach ($other['days'][$index]['pairs'] as $pair) {
            $id = $pair['id'];
            if (isset($pairs[$id])) {
                if ($pairs[$id]['time'] !== $pair['time']) throw new RuntimeException('Different lesson times between weeks');
                $pairs[$id]['schedule'] = array_merge($pairs[$id]['schedule'], $pair['schedule']);
            } else $pairs[$id] = $pair;
        }
        $day['pairs'] = array_values($pairs);
        usort($day['pairs'], function ($a, $b) { return strcmp($a['time']['start'], $b['time']['start']); });
    }
    unset($day);
    $numerators = array_values(array_filter($current['options'], function ($option) { return $option['parity'] === 'numerator'; }));
    usort($numerators, function ($a, $b) { return strcmp($a['date'], $b['date']); });
    $anchor = array_map('intval', explode('-', $numerators[0]['date']));
    $snapshot = ['schedule' => ['semesterStart' => ['year' => $anchor[0], 'month' => $anchor[1], 'day' => $anchor[2]],
        'header' => ['titles' => ['Числитель', 'Знаменатель']], 'days' => $days],
        'weeks' => [$current['parity'] => $current['date'], $other['parity'] => $other['date']],
        'updatedAt' => (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.v\Z')];
    if (!rsreu_valid_snapshot($snapshot)) throw new RuntimeException('Invalid parsed schedule');
    return $snapshot;
}

function rsreu_valid_time($value): bool
{
    return is_string($value) && preg_match('/^([01]\d|2[0-3]):[0-5]\d$/D', $value) === 1;
}

function rsreu_valid_lesson($value): bool
{
    return is_array($value) && in_array($value['type'] ?? null, ['lec', 'lab', 'upr'], true)
        && is_string($value['name'] ?? null) && trim($value['name']) !== ''
        && (!isset($value['teacher']) || is_string($value['teacher']))
        && (!isset($value['room']) || is_string($value['room']));
}

function rsreu_valid_snapshot($value): bool
{
    if (!is_array($value) || !is_string($value['updatedAt'] ?? null) || strtotime($value['updatedAt']) === false
        || !rsreu_valid_week($value['weeks']['numerator'] ?? null) || !rsreu_valid_week($value['weeks']['denominator'] ?? null)
        || $value['weeks']['numerator'] === $value['weeks']['denominator']) return false;
    $schedule = $value['schedule'] ?? null;
    if (!is_array($schedule) || !is_array($schedule['days'] ?? null) || count($schedule['days']) !== 6
        || !is_array($schedule['header']['titles'] ?? null) || count($schedule['header']['titles']) !== 2
        || !is_string($schedule['header']['titles'][0] ?? null) || !is_string($schedule['header']['titles'][1] ?? null)) return false;
    foreach (['year', 'month', 'day'] as $field) {
        if (!is_int($schedule['semesterStart'][$field] ?? null)) return false;
    }
    $ids = [];
    $weekdays = [];
    foreach ($schedule['days'] as $day) {
        $weekday = $day['weekday'] ?? null;
        if (!is_int($weekday) || $weekday < 1 || $weekday > 6 || isset($weekdays[$weekday])
            || !is_string($day['name'] ?? null) || !is_array($day['pairs'] ?? null)) return false;
        $weekdays[$weekday] = true;
        foreach ($day['pairs'] as $pair) {
            $id = $pair['id'] ?? null;
            $time = $pair['time'] ?? [];
            $slots = $pair['schedule'] ?? [];
            if (!is_string($id) || isset($ids[$id]) || !rsreu_valid_time($time['start'] ?? null)
                || !rsreu_valid_time($time['end'] ?? null) || $time['start'] >= $time['end']) return false;
            $ids[$id] = true;
            if (($slots['kind'] ?? null) === 'every-week') {
                if (!rsreu_valid_lesson($slots['discipline'] ?? null)) return false;
            } elseif (($slots['kind'] ?? null) === 'alternating') {
                if (!isset($slots['numerator']) && !isset($slots['denominator'])) return false;
                foreach (['numerator', 'denominator'] as $parity) {
                    if (isset($slots[$parity]) && !rsreu_valid_lesson($slots[$parity])) return false;
                }
            } else return false;
        }
    }
    return true;
}

function rsreu_read_cache(string $path): ?array
{
    $text = @file_get_contents($path);
    if ($text === false) return null;
    $value = json_decode($text, true);
    return rsreu_valid_snapshot($value) ? $value : null;
}

function rsreu_write_cache(string $path, array $snapshot): void
{
    $temporary = tempnam(dirname($path), 'rsreu-');
    if ($temporary === false) throw new RuntimeException('Cannot create cache file');
    try {
        $text = json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        if (file_put_contents($temporary, $text) !== strlen($text) || !rename($temporary, $path)) {
            throw new RuntimeException('Cannot persist schedule cache');
        }
    } finally {
        if (is_file($temporary)) unlink($temporary);
    }
}

function rsreu_get_schedule(string $cachePath, ?callable $refresh = null): array
{
    $refresh = $refresh ?? 'rsreu_fetch_schedule';
    $started = microtime(true);
    $lock = null;
    $locked = false;
    try {
        if (is_dir(dirname($cachePath)) || @mkdir(dirname($cachePath), 0700, true)) {
            $lock = @fopen($cachePath . '.lock', 'c');
        }
        if ($lock !== null && $lock !== false) {
            $locked = flock($lock, LOCK_EX | LOCK_NB);
            if (!$locked && flock($lock, LOCK_EX)) {
                $locked = true;
                $saved = rsreu_read_cache($cachePath);
                if ($saved === null) throw new RuntimeException('Concurrent refresh failed without cached data');
                $updated = new DateTimeImmutable($saved['updatedAt']);
                $saved['stale'] = (float) $updated->format('U.u') < $started;
                return $saved;
            }
        }
        try {
            $snapshot = $refresh();
            if (!rsreu_valid_snapshot($snapshot)) throw new RuntimeException('Invalid refreshed schedule');
            try { rsreu_write_cache($cachePath, $snapshot); }
            catch (Throwable $error) { error_log('RSREU cache: ' . $error->getMessage()); }
            $snapshot['stale'] = false;
            return $snapshot;
        } catch (Throwable $error) {
            error_log('RSREU refresh: ' . $error->getMessage());
            $saved = rsreu_read_cache($cachePath);
            if ($saved === null) throw $error;
            $saved['stale'] = true;
            return $saved;
        }
    } finally {
        if ($lock !== null && $lock !== false) {
            if ($locked) flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
}

function rsreu_health(): array
{
    return ['phpSupported' => version_compare(PHP_VERSION, '7.4.0', '>='),
        'curl' => function_exists('curl_init'), 'dom' => class_exists('DOMDocument'),
        'libxml' => function_exists('libxml_use_internal_errors'), 'json' => function_exists('json_encode'),
        'https' => function_exists('curl_version') && (curl_version()['features'] & CURL_VERSION_SSL) !== 0];
}

function rsreu_source_health(?callable $download = null): array
{
    $download = $download ?? 'rsreu_download';
    $stage = 'current-download';
    $requests = 0;
    try {
        $snapshot = rsreu_fetch_schedule(function ($url) use ($download, &$stage, &$requests) {
            $week = $requests === 0 ? 'current' : 'opposite';
            $stage = $week . '-download';
            $html = $download($url);
            $stage = $week . '-parse';
            $requests++;
            return $html;
        });
        return ['ok' => true, 'stage' => 'complete', 'weeks' => $snapshot['weeks']];
    } catch (Throwable $error) {
        error_log('RSREU source check: ' . $error->getMessage());
        // Our RuntimeExceptions contain only parser messages or cURL errors for
        // the fixed public source. Do not expose PHP traces or runtime paths.
        return ['ok' => false, 'stage' => $stage, 'error' => $error instanceof RuntimeException
            ? $error->getMessage() : 'Unexpected PHP runtime error (see PHP log)'];
    }
}

function rsreu_endpoint(): void
{
    ini_set('display_errors', '0');
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        http_response_code(405);
        header('Allow: GET');
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }
    $health = rsreu_health();
    if (isset($_GET['health'])) {
        if ($_GET['health'] === 'source') {
            // HTTP 200 keeps Web Station from replacing diagnostic JSON with
            // its generic error page. Normal API failures still return 503.
            echo json_encode(in_array(false, $health, true)
                ? ['ok' => false, 'stage' => 'environment', 'features' => $health]
                : rsreu_source_health(), JSON_UNESCAPED_UNICODE);
            return;
        }
        if (in_array(false, $health, true)) http_response_code(503);
        echo json_encode($health);
        return;
    }
    try {
        if (in_array(false, $health, true)) throw new RuntimeException('Missing required PHP features');
        $directory = sys_get_temp_dir() . '/rsreu-schedule-' . substr(hash('sha256', __DIR__), 0, 20);
        echo json_encode(rsreu_get_schedule($directory . '/648m.json'), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    } catch (Throwable $error) {
        error_log('RSREU endpoint: ' . $error->getMessage());
        http_response_code(503);
        echo json_encode(['error' => 'Расписание РГРТУ временно недоступно'], JSON_UNESCAPED_UNICODE);
    }
}

// Requiring this file from CLI tests only loads functions; direct HTTP requests run the API.
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) rsreu_endpoint();
