<?php
include 'utils.inc';
include 'common.inc';
require_once('object_detail.inc');
require_once('page_data.inc');
require_once('waterfall.inc');

$options = null;
if (array_key_exists('end', $_REQUEST))
	$options = array('end' => $_REQUEST['end']);
$dataArray = loadPageRunData($testPath, $run, $cached, array('SpeedIndex' => true, 'allEvents' => true));

$page_keywords = array('Performance Test','Details','Webpagetest','Website Speed Test','Page Speed');
$page_description = "Website performance test details$testLabel";
?>
<!DOCTYPE html>
<html>
<head>
	<title>WebPagetest Test Details<?php echo $testLabel; ?></title>
	<?php $gaTemplate = 'Details'; include ('head.inc'); ?>
	<style type="text/css">
		div.bar {
			height:12px;
			margin-top:auto;
			margin-bottom:auto;
		}

		.left {text-align:left;}
		.center {text-align:center;}

		.indented1 {padding-left: 40pt;}
		.indented2 {padding-left: 80pt;}

		td {
			white-space:nowrap;
			text-align:left;
			vertical-align:middle;
		}

		td.center {
			text-align:center;
		}

		table.details {
			margin-left:auto; margin-right:auto;
			background: whitesmoke;
			border-collapse: collapse;
		}
		table.details th, table.details td {
			border: 1px silver solid;
			padding: 0.2em;
			text-align: center;
			font-size: smaller;
		}
		table.details th {
			background: gainsboro;
		}
		table.details caption {
			margin-left: inherit;
			margin-right: inherit;
			background: whitesmoke;
		}
		table.details th.reqUrl, table.details td.reqUrl {
			text-align: left;
			width: 30em;
			word-wrap: break-word;
		}
		table.details td.even {
			background: gainsboro;
		}
		table.details td.odd {
			background: whitesmoke;
		}
		table.details td.evenRender {
			background: #dfffdf;
		}
		table.details td.oddRender {
			background: #ecffec;
		}
		table.details td.evenDoc {
			background: #dfdfff;
		}
		table.details td.oddDoc {
			background: #ececff;
		}
		table.details td.warning {
			background: #ffff88;
		}
		table.details td.error {
			background: #ff8888;
		}
		.header_details {
			display: none;
		}
		.a_request {
			cursor: pointer;
		}
		.close_accordeon{
			background: url('/images/close_accordeon.png') no-repeat 10px 50%;
		}
		.open_accordeon{
			background: url('/images/open_accordeon.png') no-repeat 10px 50%;
		}
		.slide_opener{ /* -> CSS-Klasse */
			cursor: pointer;
			border: 1px solid #aaa;
			border-radius: 5px;
			padding: 4px 28px;
		}
		.hide_on_load{}

		<?php
        include "waterfall.css";
        ?>
	</style>
</head>
<body>
<div class="page">
	<?php
	$tab = 'Test Result';
	$subtab = 'Details';
	include 'header.inc';
	?>

	<div id="result">
		<div id="download">
			<div id="testinfo">
				<?php
				echo GetTestInfoHtml();
				?>
			</div>
			<?php
			echo '<a href="/export.php?' . "test=$id&run=$run&cached=$cached&bodies=1&pretty=1" . '">Export HTTP Archive (.har)</a>';
			if ( is_dir('./google') && array_key_exists('enable_google_csi', $settings) && $settings['enable_google_csi'] )
				echo '<br><a href="/google/google_csi.php?' . "test=$id&run=$run&cached=$cached" . '">CSI (.csv) data</a>';
			if (array_key_exists('custom', $data) && is_array($data['custom']) && count($data['custom']))
				echo '<br><a href="/custom_metrics.php?' . "test=$id&run=$run&cached=$cached" . '">Custom Metrics</a>';
			if( is_file("$testPath/{$run}{$cachedText}_dynaTrace.dtas") )
			{
				echo "<br><a href=\"/$testPath/{$run}{$cachedText}_dynaTrace.dtas\">Download dynaTrace Session</a>";
				echo ' (<a href="http://ajax.dynatrace.com/pages/" target="_blank">get dynaTrace</a>)';
			}
			if( is_file("$testPath/{$run}{$cachedText}_bodies.zip") )
				echo "<br><a href=\"/$testPath/{$run}{$cachedText}_bodies.zip\">Download Response Bodies</a>";
			echo '<br>';
			?>
		</div>
		<div class="cleared"></div>
		<br>
		<table id="tableResults" class="pretty" align="center" border="1" cellpadding="10" cellspacing="0">
			<tr>
				<?php
				$cols = 5;
				if (checkForAllEventNames($dataArray, 'userTime', '>', 0.0, "float"))
					$cols++;
				if (checkForAllEventNames($dataArray, 'domTime', '>', 0.0, "float"))
					$cols++;
				if (array_key_exists('aft', $test['test']) && $test['test']['aft'] )
					$cols++;
				if (checkForAllEventNames($dataArray, 'domElements', '>', 0.0, "float"))
					$cols++;
				if (checkForAllEventNames($dataArray, 'SpeedIndex', '>', 0.0, "float"))
					$cols++;
				if (checkForAllEventNames($dataArray, 'visualComplete', '>', 0.0, "float"))
					$cols++;
				?>
				<th align="center" class="empty" valign="middle" colspan=<?php echo "\"$cols\"";?> ></th>
				<th align="center" class="border" valign="middle" colspan="3">Document Complete</th>
				<th align="center" class="border" valign="middle" colspan="3">Fully Loaded</th>
			</tr>
			<tr>
				<th align="center" valign="middle">Event Name</th>
				<th align="center" valign="middle">Load Time</th>
				<th align="center" valign="middle">First Byte</th>
				<th align="center" valign="middle">Start Render</th>
				<?php if (checkForAllEventNames($dataArray, 'userTime', '>', 0.0, "float")) { ?>
					<th align="center" valign="middle">User Time</th>
				<?php } ?>
				<?php if( array_key_exists('aft', $test['test']) && $test['test']['aft'] ) { ?>
					<th align="center" valign="middle">Above the Fold</th>
				<?php } ?>
				<?php if (checkForAllEventNames($dataArray, 'visualComplete', '>', 0.0, "float")) { ?>
					<th align="center" valign="middle">Visually Complete</th>
				<?php } ?>
				<?php if (checkForAllEventNames($dataArray, 'SpeedIndex', '>', 0.0, "int")) { ?>
					<th align="center" valign="middle"><a href="https://sites.google.com/a/webpagetest.org/docs/using-webpagetest/metrics/speed-index" target="_blank">Speed Index</a></th>
				<?php } ?>
				<?php if (checkForAllEventNames($dataArray, 'domTime', '>', 0.0, "float")) { ?>
					<th align="center" valign="middle">DOM Element</th>
				<?php } ?>
				<?php if (checkForAllEventNames($dataArray, 'domElements', '>', 0)) { ?>
					<th align="center" valign="middle">DOM Elements</th>
				<?php } ?>
				<th align="center" valign="middle">Result (error code)</th>

				<th align="center" class="border" valign="middle">Time</th>
				<th align="center" valign="middle">Requests</th>
				<th align="center" valign="middle">Bytes In</th>

				<th align="center" class="border" valign="middle">Time</th>
				<th align="center" valign="middle">Requests</th>
				<th align="center" valign="middle">Bytes In</th>
			</tr>
			<?php foreach($dataArray as $eventName => $data) {?>
			<tr>
				<?php
				echo "<td id=\"Event\" valign=\"middle\">" . $eventName . "</td>\n";
				echo "<td id=\"LoadTime\" valign=\"middle\">" . formatMsInterval($data['loadTime'], 3) . "</td>\n";
				echo "<td id=\"TTFB\" valign=\"middle\">" . formatMsInterval($data['TTFB'], 3) . "</td>\n";
				//echo "<td id=\"startRender\" valign=\"middle\">" . number_format($data['render'] / 1000.0, 3) . "s</td>\n";
				echo "<td id=\"startRender\" valign=\"middle\">" . formatMsInterval($data['render'], 3) . "</td>\n";
				if (array_key_exists('userTime', $data) && (float)$data['userTime'] > 0.0 )
					echo "<td id=\"userTime\" valign=\"middle\">" . formatMsInterval($data['userTime'], 3) . "</td>\n";
				if (array_key_exists('aft', $test['test']) && $test['test']['aft'] ) {
					$aft = number_format($data['aft'] / 1000.0, 1) . 's';
					if( !$data['aft'] )
						$aft = 'N/A';
					echo "<td id=\"aft\" valign=\"middle\">$aft</th>";
				}
				if( array_key_exists('visualComplete', $data) && (float)$data['visualComplete'] > 0.0 )
					echo "<td id=\"visualComplate\" valign=\"middle\">" . formatMsInterval($data['visualComplete'], 3) . "</td>\n";
				if( array_key_exists('SpeedIndex', $data) && (int)$data['SpeedIndex'] > 0 ) {
					if (array_key_exists('SpeedIndexCustom', $data))
						echo "<td id=\"speedIndex\" valign=\"middle\">{$data['SpeedIndexCustom']}</td>\n";
					else
						echo "<td id=\"speedIndex\" valign=\"middle\">{$data['SpeedIndex']}</td>\n";
				}
				if (array_key_exists('domTime', $data) && (float)$data['domTime'] > 0.0 )
					echo "<td id=\"domTime\" valign=\"middle\">" . formatMsInterval($data['domTime'], 3) . "</td>\n";
				if (array_key_exists('domElements', $data) && $data['domElements'] > 0 )
					echo "<td id=\"domElements\" valign=\"middle\">{$data['domElements']}</td>\n";
				$resultCode = $data['result'];
				if(!isset($resultCode) || $resultCode === null || $resultCode === ""){
					$resultCode = "&nbsp;";
				}
				echo "<td id=\"result\" valign=\"middle\">{$resultCode}</td>\n";

				echo "<td id=\"docComplete\" class=\"border\" valign=\"middle\">" . formatMsInterval($data['docTime'], 3) . "</td>\n";
				echo "<td id=\"requestsDoc\" valign=\"middle\">{$data['requestsDoc']}</td>\n";
				if($data['bytesInDoc'] >=0){
					echo "<td id=\"bytesInDoc\" valign=\"middle\">" . number_format($data['bytesInDoc'] / 1024, 0) . " KB</td>\n";
				} else {
					echo "<td id=\"bytesInDoc\" valign=\"middle\">" . " - " . " KB</td>\n";
				}
				echo "<td id=\"fullyLoaded\" class=\"border\" valign=\"middle\">" . formatMsInterval($data['fullyLoaded'], 3) . "</td>\n";
				if($data['requests'] >=0){
					echo "<td id=\"requests\" valign=\"middle\">{$data['requests']}</td>\n";
				} else {
					echo "<td id=\"requests\" valign=\"middle\">" . " - " . "</td>\n";
				}
				if($data['bytesIn'] >=0){
					echo "<td id=\"bytesIn\" valign=\"middle\">" . number_format($data['bytesIn'] / 1024, 0) . " KB</td>\n";
				} else {
					echo "<td id=\"bytesIn\" valign=\"middle\">" . " - " . " KB</td>\n";
				}
				?>
			</tr>
			<?php } ?>
		</table><br>
		<?php
		if( is_dir('./google') && isset($test['testinfo']['extract_csi']) )
		{
			require_once('google/google_lib.inc');
			$params = ParseCsiInfo($id, $testPath, $run, $_GET["cached"], true);
			?>
			<h2>Csi Metrics</h2>
			<table id="tableCustomMetrics" class="pretty" align="center" border="1" cellpadding="10" cellspacing="0">
				<tr>
					<?php
					foreach ( $test['testinfo']['extract_csi'] as $csi_param )
						echo '<th align="center" class="border" valign="middle">' . $csi_param . '</th>';
					echo '</tr><tr>';
					foreach ( $test['testinfo']['extract_csi'] as $csi_param )
					{
						if( array_key_exists($csi_param, $params) )
						{
							echo '<td class="even" valign="middle">' . $params[$csi_param] . '</td>';
						}
						else
						{
							echo '<td class="even" valign="middle"></td>';
						}
					}
					echo '</tr>';
					?>
			</table><br>
			<?php
		}
		$userTimings = array();
		foreach($data as $metric => $value)
			if (substr($metric, 0, 9) == 'userTime.')
				$userTimings[substr($metric, 9)] = number_format($value / 1000, 3) . 's';
		if (isset($data['custom']) && count($data['custom'])) {
			foreach($data['custom'] as $metric) {
				if (isset($data[$metric])) {
					$value = $data[$metric];
					if (is_double($value))
						$value = number_format($value, 3, '.', '');
					$userTimings[$metric] = $value;
				}
			}
		}
		$timingCount = count($userTimings);
		$navTiming = false;
		if ((array_key_exists('loadEventStart', $data) && $data['loadEventStart'] > 0) ||
			(array_key_exists('domContentLoadedEventStart', $data) && $data['domContentLoadedEventStart'] > 0))
			$navTiming = true;
		if ($timingCount || $navTiming)
		{
			$borderClass = '';
			if ($timingCount)
				$borderClass = ' class="border"';
			echo '<table id="tableW3CTiming" class="pretty" align="center" border="1" cellpadding="10" cellspacing="0">';
			echo '<tr>';
			echo '<th>Event Name</th>';
			if ($timingCount)
				foreach($userTimings as $label => $value)
					echo '<th>' . htmlspecialchars($label) . '</th>';
			if ($navTiming) {
				echo "<th$borderClass>";
				if ($data['firstPaint'] > 0)
					echo "RUM First Paint</th><th>";
				echo "<a href=\"http://dvcs.w3.org/hg/webperf/raw-file/tip/specs/NavigationTiming/Overview.html#process\">domContentLoaded</a></th><th><a href=\"http://dvcs.w3.org/hg/webperf/raw-file/tip/specs/NavigationTiming/Overview.html#process\">loadEvent</a></th>";
			}
			echo '</tr><tr>';
			if ($timingCount)
				foreach($userTimings as $label => $value)
					echo '<td>' . htmlspecialchars($value) . '</td>';
			if ($navTiming) {
				foreach ($dataArray as $eventName => $data) {
					echo "<tr><td>$eventName</td>";
					echo "<td$borderClass>";
					if ($data['firstPaint'] > 0)
						echo number_format($data['firstPaint'] / 1000.0, 3) . 's</td><td>';
					echo number_format($data['domContentLoadedEventStart'] / 1000.0, 3) . 's - ' .
						number_format($data['domContentLoadedEventEnd'] / 1000.0, 3) . 's (' .
						number_format(($data['domContentLoadedEventEnd'] - $data['domContentLoadedEventStart']) / 1000.0, 3) . 's)' . '</td>';
					echo '<td>' . number_format($data['loadEventStart'] / 1000.0, 3) . 's - ' .
						number_format($data['loadEventEnd'] / 1000.0, 3) . 's (' .
						number_format(($data['loadEventEnd'] - $data['loadEventStart']) / 1000.0, 3) . 's)' . '</td>';
					echo '</tr>';
				}
			}
			echo '</table><br>';
		}
		$secure = false;
		$haveLocations = false;
		$requests = getRequests($id, $testPath, $run, @$_GET['cached'], $secure, $haveLocations, true, true,true);
		?>
		<script type="text/javascript">
			markUserTime('aft.Detail Table');
		</script>

		<br />
		<div style="text-align: center;">
			<a name="quicklinks"></a>
			<h3>Quicklinks</h3>
			<a href="#">Back to page top</a>
			<table class="pretty">
				<thead>
				<th>Event Name</th>
				<th>Waterfall View</th>
				<th>Connection View</th>
				<th>Request Details</th>
				<th>Request Headers</th>
				<th>Customize Waterfall</th>
				<th>View all Images</th>
				</thead>
				<tbody>
				<?php foreach(array_keys($dataArray) as $eventName)
				{ ?>
					<tr>
						<td><?= $eventName ?></td>
						<td><a href=" #waterfall_view<?= getEventNameID($eventName); ?>">WV
								#<?= getShortEventName($eventName) ?>
							</a></td>
						<td><a href=" #connection_view<?= getEventNameID($eventName); ?>">CV
								#<?= getShortEventName($eventName) ?>
							</a></td>
						<td><a href=" #request_details<?= getEventNameID($eventName); ?>">RD
								#<?= getShortEventName($eventName) ?>
							</a></td>
						<td><a href=" #request_headers<?= getEventNameID($eventName); ?>">RH
								#<?= getShortEventName($eventName) ?>
							</a></td>
						<td><a
								href=<?php echo "\"/customWaterfall.php?width=930&test=$id&run=$run&cached=$cached&eventName=".urlencode($eventName)."\"";?>>CW
								#<?= getShortEventName($eventName) ?>
							</a></td>
						<td><a
								href=<?php echo "\"/pageimages.php?test=$id&run=$run&cached=$cached&eventName=".urlencode($eventName)."\"";?>>VaI
								#<?= getShortEventName($eventName) ?>
							</a></td>
					</tr>
					<?php
				}
				?>
				</tbody>
			</table>
		</div>
		<br /> <br /> <br />
		<div style="text-align:center;">
			<?php
			foreach($dataArray as $eventName => $data)
			{ ?>
			<a name="waterfall_view<?= getEventNameID($eventName); ?>"></a>
			<h3 name="waterfall_view<?= getEventNameID($eventName); ?>" id="slide_opener_waterfall_view<?= getEventNameID($eventName); ?>" data-slideid="waterfall_view<?= getEventNameID($eventName); ?>" class="slide_opener close_accordeon">Waterfall View - <?= $eventName ?> </h3>
			<div id="waterfall_view<?= getEventNameID($eventName); ?>" class="hide_on_load" data-waterfallcontainer="waterfallcontainer-<?= $data['eventNumber'] ?>" data-eventname="<?= $eventName ?>">
				<a href="#quicklinks">Back to Quicklinks</a>
			<table border="1" bordercolor="silver" cellpadding="2px" cellspacing="0" style="width:auto; font-size:11px; margin-left:auto; margin-right:auto;">
				<tr>
					<td><table><tr><td><div class="bar" style="width:15px; background-color:#1f7c83"></div></td><td>DNS Lookup</td></tr></table></td>
					<td><table><tr><td><div class="bar" style="width:15px; background-color:#e58226"></div></td><td>Initial Connection</td></tr></table></td>
					<?php if($secure) { ?>
						<td><table><tr><td><div class="bar" style="width:15px; background-color:#c141cd"></div></td><td>SSL Negotiation</td></tr></table></td>
					<?php } ?>
					<td><table><tr><td><div class="bar" style="width:15px; background-color:#1fe11f"></div></td><td>Time to First Byte</td></tr></table></td>
					<td><table><tr><td><div class="bar" style="width:15px; background-color:#1977dd"></div></td><td>Content Download</td></tr></table></td>
					<td style="vertical-align:middle; padding: 4px;"><div style="background-color:#ffff60">&nbsp;3xx response&nbsp;</div></td>
					<td style="vertical-align:middle; padding: 4px;"><div style="background-color:#ff6060">&nbsp;4xx+ response&nbsp;</div></td>
				</tr>
			</table>
			<table border="1" bordercolor="silver" cellpadding="2px" cellspacing="0" style="width:auto; font-size:11px; margin-left:auto; margin-right:auto; margin-top:11px;">
				<tr>
					<td><table><tr><td><div class="bar" style="width:2px; background-color:#28BC00"></div></td><td>Start Render</td></tr></table></td>
					<?php
					if (array_key_exists('aft', $data) && $data['aft'] )
						echo '<td><table><tr><td><div class="bar" style="width:2px; background-color:#FF0000"></div></td><td>Above the Fold</td></tr></table></td>';
					if (array_key_exists('domTime', $data) && (float)$data['domTime'] > 0.0 )
						echo '<td><table><tr><td><div class="bar" style="width:2px; background-color:#F28300"></div></td><td>DOM Element</td></tr></table></td>';
					if(array_key_exists('firstPaint', $data) && (float)$data['firstPaint'] > 0.0 )
						echo '<td><table><tr><td><div class="bar" style="width:2px; background-color:#8FBC83"></div></td><td>msFirstPaint</td></tr></table></td>';
					if(array_key_exists('domContentLoadedEventStart', $data) && (float)$data['domContentLoadedEventStart'] > 0.0 )
						echo '<td><table><tr><td><div class="bar" style="width:15px; background-color:#D888DF"></div></td><td>DOM Content Loaded</td></tr></table></td>';
					if(array_key_exists('loadEventStart', $data) && (float)$data['loadEventStart'] > 0.0 )
						echo '<td><table><tr><td><div class="bar" style="width:15px; background-color:#C0C0FF"></div></td><td>On Load</td></tr></table></td>';
					echo '<td><table><tr><td><div class="bar" style="width:2px; background-color:#0000FF"></div></td><td>Document Complete</td></tr></table></td>';
					if(array_key_exists('userTime', $data) || (array_key_exists('enable_google_csi', $settings) && $settings['enable_google_csi']))
						echo '<td><table><tr><td><div class="arrow-down"></div></td><td>User Timings</td></tr></table></td>';
					?>
				</tr>
			</table>
			<br>
				<div id="waterfallcontainer-<?= $data['eventNumber'] ?>" style="width:930px"></div>
			<?php
			echo "<br><a href=\"/customWaterfall.php?width=930&test=$id&run=$run&cached=$cached&eventName=$eventName\">customize waterfall</a> &#8226; ";
			echo "<a id=\"view-images\" href=\"/pageimages.php?test=$id&run=$run&cached=$cached&eventName=$eventName\">View all Images (for event name $eventName)</a>";
			echo "<br/><br/><br/>";
			echo "</div>";
			}
			?>
				<?php
				foreach($dataArray as $eventName => $data)
				{ ?>
				<a name="connection_view<?= getEventNameID($eventName); ?>"></a>
				<h3 name="connection_view<?= getEventNameID($eventName); ?>">
					Connection View -
					<?= $eventName ?>
				</h3>
				<a href="#quicklinks">Back to Quicklinks</a>
				<map name="connection_map<?= $eventName ?>">
					<?php
				$connection_rows = GetConnectionRows($requests[$eventName], true);
				$options = array(
					'id' => $id,
					'path' => $testPath,
					'run_id' => $run,
					'is_cached' => (bool)@$_GET['cached'],
					'use_cpu' => true,
					'show_labels' => true,
					'width' => 930
				);
				$map = GetWaterfallMap($connection_rows, $eventName, $options, $data);
				foreach($map as $entry) {
					if (array_key_exists('request', $entry)) {
						$index = $entry['request'] + 1;
						$title = "$index: " . htmlspecialchars($entry['url']);
						echo "<area href=\"#request$index\" alt=\"$title\" title=\"$title\" shape=RECT coords=\"{$entry['left']},{$entry['top']},{$entry['right']},{$entry['bottom']}\">\n";
					} elseif(array_key_exists('url', $entry)) {
						echo "<area href=\"#request\" alt=\"{$entry['url']}\" title=\"{$entry['url']}\" shape=RECT coords=\"{$entry['left']},{$entry['top']},{$entry['right']},{$entry['bottom']}\">\n";
					}
				}
				?>
			</map>
			<table border="1" bordercolor="silver" cellpadding="2px" cellspacing="0" style="width:auto; font-size:11px; margin-left:auto; margin-right:auto;">
				<tr>
					<td><table><tr><td><div class="bar" style="width:15px; background-color:#007B84"></div></td><td>DNS Lookup</td></tr></table></td>
					<td><table><tr><td><div class="bar" style="width:15px; background-color:#FF7B00"></div></td><td>Initial Connection</td></tr></table></td>
					<?php if($secure) { ?>
						<td><table><tr><td><div class="bar" style="width:15px; background-color:#CF25DF"></div></td><td>SSL Negotiation</td></tr></table></td>
					<?php } ?>
					<td><table><tr><td><div class="bar" style="width:2px; background-color:#28BC00"></div></td><td>Start Render</td></tr></table></td>
					<?php if(checkForAllEventNames($dataArray, 'domTime', '>', 0.0, "float") ) { ?>
						<td><table><tr><td><div class="bar" style="width:2px; background-color:#F28300"></div></td><td>DOM Element</td></tr></table></td>
					<?php } ?>
					<?php if(array_key_exists('domContentLoadedEventStart', $data) && (float)$data['domContentLoadedEventStart'] > 0.0 ) { ?>
						<td><table><tr><td><div class="bar" style="width:15px; background-color:#D888DF"></div></td><td>DOM Content Loaded</td></tr></table></td>
					<?php } ?>
					<?php if(array_key_exists('loadEventStart', $data) && (float)$data['loadEventStart'] > 0.0 ) { ?>
						<td><table><tr><td><div class="bar" style="width:15px; background-color:#C0C0FF"></div></td><td>On Load</td></tr></table></td>
					<?php } ?>
					<td><table><tr><td><div class="bar" style="width:2px; background-color:#0000FF"></div></td><td>Document Complete</td></tr></table></td>
				</tr>
			</table>
			<br> <img class="progress" alt="Connection View waterfall diagram"
					  usemap="#connection_map<?= $eventName ?>"
					  id="connectionView<?= $eventName ?>"
					  src="<?php
					  if($test['testinfo']['imageCaching']){
						  $type = "connection";
						  $file = generateViewImagePath($testPath, $eventName, $run, $cached, $type);
						  if(!file_exists($file)){
							  createImageAndSave($id, $testPath, $test['testinfo'], $eventName, $run, $cached, $data[$run][$cached], $type);
						  }
						  echo substr($file, 1);
					  } else {
						  echo "/waterfall.php?type=connection&width=930&test=$id&run=$run&cached=$cached&mime=1&eventName=$eventName";
					  }
					  ?>">
					<br /> <br /> <br />
					<?php
				} ?>
			</div>
		<?php include('./ads/details_middle.inc'); ?>

		<br>
		<?php
		// script support
		if(true){
			$eventCount = array();
			foreach(array_keys($requests) as $page){
				$eventCount[$page] = count($requests[$eventName]);
			}
		} else {
			$eventCount = count($requests);
		}
		echo "<script type=\"text/javascript\">\n";
		echo "var wptRequestCount=" . $eventCount. ";\n";
		echo "var wptRequestData=" . json_encode($requests) . ";\n";
		echo "var wptNoLinks={$settings['nolinks']};\n";
		echo "</script>";
		?>
		<script type="text/javascript"><?php include "waterfall.js"; ?></script>
		<?php include 'waterfall_detail.inc'; ?>
	</div>

	<?php include('footer.inc'); ?>
</div>

<script type="text/javascript">

	function setStateForAllByEventName(eventName, expanded) {
		$(".header_details_".concat(eventName)).each(function(index) {
			if(expanded){
				$(this).show();
			} else {
				$(this).hide();
			}
		});
		var link = $("#all_".concat(eventName));
		var html;
		if(expanded){
			html = '- <a href="javascript:setStateForAllByEventName(\''.concat(eventName).concat('\', false);">Hide All Requests for Event Name "').concat(eventName).concat('"</a>');
		} else {
			html = '+ <a href="javascript:setStateForAllByEventName(\''.concat(eventName).concat('\', true);">Expand All Requests for Event Name "').concat(eventName).concat('"</a>')
		}
		link.html(html);
	}

	function expandRequest(targetNode) {
		if (targetNode.length) {
			var div_to_expand = $('#' + targetNode.attr('data-target-id'));

			if (div_to_expand.is(":visible")) {
				div_to_expand.hide();
				targetNode.html('+' + targetNode.html().substring(1));
			} else {
				div_to_expand.show();
				targetNode.html('-' + targetNode.html().substring(1));
			}
		}
	}

	$(document).ready(function() { $("#tableDetails").tablesorter({
		headers: { 3: { sorter:'currency' } ,
			4: { sorter:'currency' } ,
			5: { sorter:'currency' } ,
			6: { sorter:'currency' } ,
			7: { sorter:'currency' } ,
			8: { sorter:'currency' } ,
			9: { sorter:'currency' }
		}
	}); } );

	$('.a_request').click(function () {
		expandRequest($(this));
	});

	function expandAll() {
		$(".header_details").each(function(index) {
			$(this).show();
		});
	}

	if (window.location.hash == '#all') {
		expandAll();
	} else
		expandRequest($(window.location.hash));

	<?php
    include "waterfall.js";
    ?>
</script>
<script>
	$(document).ready( function(){
		//hide defined slides on load of page
		$('.hide_on_load').hide();

		//waterfall of first_event
		var initial_slide_opener_id = "";

		$('.slide_opener').on('click', function(){
			var slideid = '#' + $(this).data('slideid');

			$(slideid).slideToggle(500,'linear',function(){
				if( $(this).is(':visible') && $(this).data('loaded') != 'true' ){
					var test_id = <?= "\"".urlencode($id)."\""; ?>;
					var test_path = <?= "\"".urlencode($testPath)."\""; ?>;
					var event_name = encodeURIComponent($(this).data('eventname'));
					var run_number = <?= "\"$run\""; ?>;
					var cached = <?= "\"$cached\""; ?>;
					var test_info = <?= "\"".urlencode(json_encode($test['testinfo']))."\""; ?>;
					var secure = <?= "\"$secure\""; ?>;
					var have_locations = <?= "\"$haveLocations\""; ?>;

					var argument_map = {'id':test_id , 'testPath':test_path , 'eventName':event_name , 'run':run_number , 'cached':cached , 'testInfo':test_info , 'secure':secure , 'haveLocation':have_locations };
					var waterfallcontainerid = '#' + $(this).data('waterfallcontainer');
					$(waterfallcontainerid).load('/template_create_waterfall.php', argument_map, function(){
						$(this).data('loaded','true');
					});
				}
			});
			$(this).toggleClass('close_accordeon').toggleClass('open_accordeon');
		})

		//check if inital waterfall was specified in anchor
		var waterfall_anchor = window.location.hash;
		if(waterfall_anchor !== ''){
			initial_slide_opener_id = "#slide_opener_" + waterfall_anchor.replace('#','');
		} else {
			initial_slide_opener_id = '#' + document.getElementsByClassName('slide_opener')[0].id;
		}
		//open inital waterfall-slide
		$(initial_slide_opener_id).click();
	});
</script>
</body>
</html>