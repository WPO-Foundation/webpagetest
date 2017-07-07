<?php
include 'common.inc';
set_time_limit(0);

// parse the logs for the counts
$days = $_REQUEST['days'];
if( !$days || $days > 1000 )
    $days = 7;

$title = 'WebPagetest - Usage';
$dat_dir = GetSetting('dat_dir');
$logs_dir = GetSetting('logs_dir');

include 'admin_header.inc';
?>

<?php
    if( array_key_exists('k', $_REQUEST) && strlen($_REQUEST['k']) ) {
        $key = trim($_REQUEST['k']);
        $keys = parse_ini_file('./settings/keys.ini', true);

        // see if it was an auto-provisioned key
        if (preg_match('/^(?P<prefix>[0-9A-Za-z]+)\.(?P<key>[0-9A-Za-z]+)$/', $key, $matches)) {
          $prefix = $matches['prefix'];
          if (is_file(__DIR__ . "/dat/{$prefix}_api_keys.db")) {
            $db = new SQLite3(__DIR__ . "/dat/{$prefix}_api_keys.db");
            $k = $db->escapeString($matches['key']);
            $info = $db->querySingle("SELECT key_limit FROM keys WHERE key='$k'", true);
            $db->close();
            if (isset($info) && is_array($info) && isset($info['key_limit']))
              $keys[$key] = array('limit' => $info['key_limit']);
          }
        }
        
        if( $admin && $key == 'all' ) {
            $day = gmdate('Ymd');
            if( strlen($req_date) )
                $day = $req_date;
            $keyfile = $dat_dir . "/keys_$day.dat";
            $usage = null;
            if( is_file($keyfile) )
              $usage = json_decode(file_get_contents($keyfile), true);
            if( !isset($usage) )
              $usage = array();

            $used = array();
            foreach($keys as $key => &$keyUser)
            {
                $u = (int)$usage[$key];
                if( $u )
                    $used[] = array('used' => $u, 'description' => $keyUser['description'], 'contact' => $keyUser['contact'], 'limit' => $keyUser['limit']);
            }
            if( count($used) )
            {
                usort($used, 'comp');
                echo "<table class=\"table\"><tr><th>Used</th><th>Limit</th><th>Contact</th><th>Description</th></tr>";
                foreach($used as &$entry)
                    echo "<tr><td>{$entry['used']}</td><td>{$entry['limit']}</td><td>{$entry['contact']}</td><td>{$entry['description']}</td></tr>";
                echo '</table>';
            }
        } else {
            if( isset($keys[$key]) ) {
                $limit = (int)@$keys[$key]['limit'];
                echo "<table class=\"table\"><tr><th>Date</th><th>Used</th><th>Limit</th></tr>";
                $targetDate = new DateTime('now', new DateTimeZone('GMT'));
                for($offset = 0; $offset <= $days; $offset++) {
                    $keyfile = $dat_dir . '/keys_' . $targetDate->format("Ymd") . '.dat';
                    $usage = null;
                    $used = 0;
                    if( is_file($keyfile) ) {
                      $usage = json_decode(file_get_contents($keyfile), true);
                      $used = (int)@$usage[$key];
                    }
                    $date = $targetDate->format("Y/m/d");
                    echo "<tr><td>$date</td><td>$used</td><td>$limit</td></tr>\n";
                    $targetDate->modify('-1 day');
                }
                echo '</table>';

                $limit = (int)$keys[$key]['limit'];
                if( isset($usage[$key]) )
                  $used = (int)$usage[$key];
                else
                  $used = 0;
            }
        }
    } elseif ($privateInstall || $admin) {
        $total_api = 0;
        $total_ui = 0;
        echo "<table class=\"table\"><tr><th>Date</th><th>Interactive</th><th>API</th><th>Total</th></tr>" . PHP_EOL;
        $targetDate = new DateTime('now', new DateTimeZone('GMT'));
        for($offset = 0; $offset <= $days; $offset++)
        {
            // figure out the name of the log file
            $fileName = $logs_dir . $targetDate->format("Ymd") . '.log';
            $file = file($fileName);
            $api = 0;
            $ui = 0;
            foreach ($file as &$line) {
              $parts = tokenizeLogLine($line);
              if (array_key_exists('key', $parts) && strlen($parts['key']))
                $api++;
              else
                $ui++;
            }
            $count = $api + $ui;
            $date = $targetDate->format("Y/m/d");
            echo "<tr><td>$date</td><td>$ui</td><td>$api</td><td>$count</td></tr>\n";
            $targetDate->modify('-1 day');
            $total_api += $api;
            $total_ui += $ui;
            flush();
            ob_flush();
        }
        $total = $total_api + $total_ui;
        echo "<tr>
                <td><b>Total</b></td>
                <td><b>$total_ui</b></td>
                <td><b>$total_api</b></td>
                <td><b>$total</b></td>
            </tr>\n";

        echo '</table>';
    }

function comp($a, $b)
{
    if ($a['used'] == $b['used']) {
        return 0;
    }
    return ($a['used'] > $b['used']) ? -1 : 1;
}

include 'admin_footer.inc';

?>