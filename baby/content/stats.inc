<h3>How big is baby?</h3>
<?php
	$currentWeek = 39 - $weeks;
	$currentMonth = intval($weeks / 4 + 1);
	if ($currentWeek <= 21)
	{
		$image = 'wk'.$currentWeek;
	}
	else
	{
		$image = 'mo'.$currentMonth;
	}
?>
<img src="http://images.thenestbaby.com/stages/<?php echo $image?>_sm.jpg" />
<p>For more info: <a href="http://www.in-gender.com/cs/forums/t/94345.aspx">Baby size...Compared to fruit</a></p>

<h3>Baby info</h3>
<table cellspacing="0">
	<tr><th>Due date:</th><td>June 8th, 2011</td></tr>
	<tr><th>Length on Nov 2nd:</th><td>2.2 cm</td></tr>
	<tr><th>Heart rate on Nov 29th:</th><td>145 BPM</td></tr>
	<tr><th>Heart rate on Dec 28th:</th><td>150 BPM</td></tr>
	<tr><th>Heart rate on Jan 25th:</th><td>160 BPM</td></tr>
	<tr><th>Heart rate on Feb 22nd:</th><td>160 BPM</td></tr>
	<tr><th>Heart rate on Mar 28th:</th><td>140 BPM</td></tr>
	<tr><th>Weight on Jan 25th:</th><td>13.5 ounces</td></tr>
	<tr><th>Weight on Mar 28th:</th><td>2.5 pounds</td></tr>
</table>

