<?php
define('DEFAULT_PAGE', 'welcome');

function get_file_name($page)
{
	return 'content/' . trim($page, '/') . '.inc';
}

function get_menu_title($page)
{
	return ucwords(str_replace('/', ' - ', (trim($page, '/'))));
}

function get_page_title($page)
{
	return ucwords(str_replace('/', ' - ', (trim($page, '/'))));
}

$menupages = array("welcome", "stats", "survey", "photos", "registry");
$menunames = array("welcome", "stats", "boy or girl?", "photos", "registry");

/* Set absolute root for all links */
if ($_SERVER['SERVER_NAME'] == 'localhost')
	$root = '/baby/';
else
	$root = '/';

/* set the specified page or default */
if (isset($_GET['page']) && file_exists(get_file_name($_GET['page'])))
{
	$page = $_GET['page'];
}
else
{
	$page = DEFAULT_PAGE;
}

/* last modified time for current page */
$last_modified = 'last modified ' . date("m/d/y H:i:s", filemtime(get_file_name($page)));

?>
<!doctype html>  

<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">

	<title>Obermillers - Baby on the way!</title>

	<link rel="stylesheet" href="<?php echo $root; ?>assets/css/style.css">
	<link href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/jquery-ui.css" rel="stylesheet" type="text/css"/>
	<!--[if IE]>
		<script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
	<![endif]-->
</head>

<body>

	<div id="container">
		
		<header>
			<div id="countdown">
			<?php
			$target = mktime(0, 0, 0, 6, 8, 2011);
			$today = time();
			$difference = $target - $today;
			$weeks = (int)($difference / (60 * 60 * 24 * 7));
			$days = (int)(($difference / (60 * 60 * 24)) % 7);
			$hours = (int)(($difference / (60 * 60)) % 24);
			$weeks = $weeks == 1 ? "1 week" : $weeks . " weeks";
			$days = $days == 1 ? "1 day" : $days . " days";
			$hours = $hours == 1 ? "1 hour" : $hours . " hours";
			echo "Our baby will be arriving in $weeks, $days, and $hours"
			?>
			</div>
			<a href="<?php echo $root; ?>">
				<h1 class="visuallyhidden">Baby on the way!</h1>
			</a>
		</header>

		<nav>
			<ul>
			<?php
			for ($i = 0; $i < count($menupages); $i++)
			{
				$p = $menupages[$i];
				$class = ($p == $page) ? " class=\"active\"" : "";
				echo "<li$class><a href=\"$root$p/\" title=\"$p\">".$menunames[$i]."</a></li>";
			}
			?>
			</ul>
		</nav>

		<div id="content">
			<h2><?php echo get_page_title($page); ?></h2>
			<?php include(get_file_name($page)); ?>
		</div>
		
	</div>

	<footer>
		Copyright &copy; 2010 Ian Obermiller
	</footer>
	
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.js"></script>
	<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.6/jquery-ui.min.js"></script>
	
	<script>
		$("#Birthday").datepicker();
	</script>
	
	<script>
		var _gaq = [['_setAccount', 'UA-703860-1'], ['_trackPageview']];
		(function(d, t) {
		var g = d.createElement(t),
		s = d.getElementsByTagName(t)[0];
		g.async = true;
		g.src = ('https:' == location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
		s.parentNode.insertBefore(g, s);
		})(document, 'script');
	</script>

</body>
</html>