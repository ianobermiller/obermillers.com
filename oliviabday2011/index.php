<?php
// 2011-03-01

$questions = array(
	array("You and me", "Our first <i>this</i> happened outside, in the freezing cold, next to your car.", "kiss"),
	array("Crime", "Last name of Clyde, of Bonnie and Clyde fame.", "barrow"),
	array("Misc", "A small rodent, or a computer peripheral.", "mouse"),
	array("Music", "Completes the Eminem lyric 'Maybe that's what happens when a tornado meets a...'", "volcano"),
	array("Crime", "A light of <i>this</i> color is used to describe areas of prostitution in metropolitan centers.", "red"),
	array("Technology", "Term for a company that stores and serves your website, or the man responsible for running an event.", "host"),
	array("You and me", "The Russian name I wanted to name our baby boy.", "Ivan"),
	array("Sociology", "The tendency for each society to place its own culture patterns at the center of things.", "ethnocentrism"),
	array("Crime", "Alphonse Capone died of <i>this</i> disease.", "syphilis"),
	array("Music", "Completes the Eminem lyric 'You don't get another chance, life is no...'", "nintendo game"),
	array("You and me", "The most beautiful, amazing, and lovely wife and birthday girl.", "olivia")
);

$error = "";

if(isset($_POST['submit']))
{
	// Validate and sanitize input
	$id = isset($_POST['id']) ? intval($_POST['id']) : 0;

	// Ensure id is within valid bounds
	if ($id < 0 || $id >= count($questions)) {
		$id = 0;
		$error = "Invalid question ID. Starting over.";
	} else {
		// Compare answers (case-insensitive)
		$userAnswer = isset($_POST['answer']) ? trim($_POST['answer']) : '';
		if (strcasecmp($userAnswer, $questions[$id][2]) == 0)
		{
			$id++;
		}
		else
		{
			$error = "Sorry, try again!";
		}
	}
}
else
{
	$id = 0;
}
?>

<head>
	<meta charset="utf-8">

	<title>Olivia's Birthday Scavenger Hunt</title>

	<link rel="stylesheet" href="../css/legacy.css" />
	<style type="text/css">
		#spa
		{
			background:#ffffcc;
			border:dashed 3px black;
			margin:40px auto;
			padding:20px;
			width:400px;
		}

		table
		{
			margin:0 auto;
			text-align:center;
		}

		.category
		{
			font-size:24px;
			line-height:26px;
		}

		.clue
		{
			background:blue;
			border:solid 5px black;
			color:white;
			width:200px;
			height:125px;
			text-transform:uppercase;
			font-weight:bold;
			vertical-align:middle;
			display:table-cell;
		}
	</style>
</head>

<body>

	<div id="container">
		<h1>Scavenger hunt!</h1>

<?php
if ($id < count($questions))
{
?>

<form action="<?php echo htmlspecialchars($_SERVER['PHP_SELF'], ENT_QUOTES, 'UTF-8'); ?>" method="post" name="hunt">
	<table>
		<tr><td class="clue category"><?php echo $questions[$id][0]; /* Safe: validated array index, trusted source */ ?></td></tr>
		<tr><td class="clue"><?php echo $questions[$id][1]; /* Safe: validated array index, trusted source */ ?></td></tr>
	</table>
	<p><span style="font-weight:bold;color:red"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></span></p>
	<p><input type="text" name="answer" tabindex="1"></p>
	<input type="hidden" name="id" value="<?php echo htmlspecialchars($id, ENT_QUOTES, 'UTF-8'); ?>" />
	<p><input type="submit" name="submit" value="Submit"></p>
</form>

<?php
}
else
{
?>
<div id="spa">
<h1>Free spa day!</h1>
<p>You win a free spa day courtesy of your favorite husband! Look forward to an amazing day of pampering your feet, hands, back and shoulders, and torturing your poor husband with a multitude of tickles! I love you!</p>
</div>
<?php
}
?>

	</div>
</body>
</html>