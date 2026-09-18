<?php
declare(strict_types=1);
require __DIR__ . '/../public/api/schedule.php';

function check(bool $condition, string $message): void
{
    if (!$condition) throw new RuntimeException($message);
}
function rejects(callable $action, string $message): void
{
    try { $action(); } catch (Throwable $error) { return; }
    throw new RuntimeException($message);
}
$numerator = file_get_contents(__DIR__ . '/../src/test/fixtures/rsreu-numerator.html');
$denominator = file_get_contents(__DIR__ . '/../src/test/fixtures/rsreu-denominator.html');
$tests = [];
$tests['real HTML preserves Cyrillic, times, types and details'] = function () use ($numerator, $denominator) {
    $week = rsreu_parse_week($numerator);
    check($week['date'] === '2026-09-14' && $week['parity'] === 'numerator', 'Wrong selected week');
    check(array_sum(array_map(function ($day) { return count($day['pairs']); }, $week['days'])) === 9, 'Missing lessons');
    check($week['days'][1]['pairs'][0] === ['id' => '2-1705', 'time' => ['start' => '17:05', 'end' => '18:40'],
        'schedule' => ['kind' => 'alternating', 'numerator' => ['type' => 'lec',
            'name' => 'Методы и технологии управления ИТ-проектами', 'teacher' => 'проф. Таганов А.И.', 'room' => '21 B']]], 'Incorrect lesson');
    check($week['days'][5]['pairs'][0]['schedule']['numerator'] === ['type' => 'upr',
        'name' => 'НИР практика/Научно-исследовательская практика'], 'Incorrect NIR');
    $other = rsreu_parse_week($denominator);
    check(array_sum(array_map(function ($day) { return count($day['pairs']); }, $other['days'])) === 10, 'Missing denominator lessons');
};
$fixtureDownload = function ($url) use ($numerator, $denominator) {
    return strpos($url, '&date=') === false ? $numerator : $denominator;
};
$tests['source check distinguishes download and parser failures without exposing traces'] = function () use ($fixtureDownload) {
    check(rsreu_source_health($fixtureDownload)['ok'] === true, 'Source check rejected valid HTML');
    $download = rsreu_source_health(function () { throw new RuntimeException('Simulated download failure'); });
    check($download === ['ok' => false, 'stage' => 'current-download', 'error' => 'Simulated download failure'], 'Lost download diagnosis');
    $parse = rsreu_source_health(function () { return '<html>Maintenance</html>'; });
    check($parse['ok'] === false && $parse['stage'] === 'current-parse', 'Lost parser diagnosis');
    $runtime = rsreu_source_health(function () { throw new TypeError('Private runtime path'); });
    check(strpos($runtime['error'], 'Private') === false, 'Exposed runtime internals');
};
$tests['two weeks merge by time and retain identical NIR'] = function () use ($fixtureDownload) {
    $urls = [];
    $snapshot = rsreu_fetch_schedule(function ($url) use ($fixtureDownload, &$urls) {
        $urls[] = $url;
        return $fixtureDownload($url);
    });
    check(strpos($urls[1], '&date=2026-09-21') !== false, 'Did not request next opposite week');
    check($snapshot['weeks'] === ['numerator' => '2026-09-14', 'denominator' => '2026-09-21'], 'Incorrect weeks');
    $days = $snapshot['schedule']['days'];
    check(count($days[0]['pairs']) === 2, 'Missing denominator-only Monday');
    $mixed = $days[2]['pairs'][1]['schedule'];
    check($mixed['numerator']['type'] === 'lec' && $mixed['denominator']['type'] === 'lab', 'Lost lesson types');
    $nir = $days[5]['pairs'][0]['schedule'];
    check($nir['numerator'] === $nir['denominator'], 'Identical lessons cannot be merged by UI');
    check(rsreu_valid_snapshot($snapshot), 'Invalid generated snapshot');
};
$tests['preceding opposite week is used when next is unavailable'] = function () use ($numerator, $denominator) {
    $last = preg_replace('/<option value="2026-09-21"[^>]*>.*?<\/option>/', '', $numerator);
    $previous = str_replace('2026-09-21', '2026-09-07', $denominator);
    $snapshot = rsreu_fetch_schedule(function ($url) use ($last, $previous) {
        if (strpos($url, '&date=') === false) return $last;
        check(strpos($url, '&date=2026-09-07') !== false, 'Did not select previous week');
        return $previous;
    });
    check($snapshot['weeks']['denominator'] === '2026-09-07', 'Wrong preceding week');
};
$tests['unsupported source data is rejected'] = function () use ($numerator) {
    foreach (['<html>Maintenance</html>',
        str_replace('648М', '999М', $numerator),
        str_replace('schedule-lesson-type-3', 'schedule-lesson-type-99', $numerator),
        str_replace('17:05', '27:05', $numerator),
        str_replace('НИР практика/Научно-исследовательская практика',
            'НИР практика/Научно-исследовательская практика</div><div>Ещё одна пара', $numerator)] as $html) {
        rejects(function () use ($html) { rsreu_parse_week($html); }, 'Accepted unsupported source');
    }
    rejects(function () use ($numerator) {
        rsreu_fetch_schedule(function () use ($numerator) { return $numerator; });
    }, 'Accepted wrong opposite week');
    rejects(function () { rsreu_download('http://example.com/'); }, 'Accepted arbitrary source URL');
};
$tests['disk fallback preserves timestamp and sequential requests refresh'] = function () use ($fixtureDownload) {
    $directory = sys_get_temp_dir() . '/rsreu-test-' . bin2hex(random_bytes(8));
    $path = $directory . '/cache.json';
    $snapshot = rsreu_fetch_schedule($fixtureDownload);
    $snapshot['updatedAt'] = '2026-09-18T09:00:00.000Z';
    $failure = function () { throw new RuntimeException('Simulated source unavailable'); };
    try {
        $count = 0;
        $refresh = function () use ($snapshot, &$count) { $count++; return $snapshot; };
        check(rsreu_get_schedule($path, $refresh)['stale'] === false, 'Fresh marked stale');
        rsreu_get_schedule($path, $refresh);
        check($count === 2, 'Sequential request skipped refresh');
        $saved = rsreu_get_schedule($path, $failure);
        check($saved['stale'] === true && $saved['updatedAt'] === $snapshot['updatedAt'], 'Fallback changed timestamp');
        check($saved['schedule'] === $snapshot['schedule'], 'Fallback changed schedule');
        file_put_contents($path, '{broken json');
        check(rsreu_read_cache($path) === null, 'Accepted broken cache');
        rejects(function () use ($path, $failure) { rsreu_get_schedule($path, $failure); }, 'Invented data without cache');
        foreach ([['updatedAt' => 'invalid'], array_merge($snapshot, ['schedule' => ['days' => [null]]]),
            array_merge($snapshot, ['weeks' => 'invalid'])] as $invalid) {
            file_put_contents($path, json_encode($invalid));
            check(rsreu_read_cache($path) === null, 'Accepted invalid cached snapshot');
        }
    } finally {
        // Remove only files created by this isolated test.
        foreach ([$path, $path . '.lock'] as $file) if (is_file($file)) unlink($file);
        if (is_dir($directory)) rmdir($directory);
    }
};
foreach ($tests as $name => $test) {
    $test();
    echo 'PASS ' . $name . PHP_EOL;
}
echo count($tests) . ' PHP tests passed on PHP ' . PHP_VERSION . PHP_EOL;
