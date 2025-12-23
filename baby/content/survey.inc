<?php
ERROR_REPORTING(E_ALL);

if ($_SERVER['SERVER_NAME'] == 'localhost')
{
	$dbh = new PDO('mysql:host=localhost;dbname=baby', 'root', '');
}
else
{
	$dbh = new PDO('mysql:host=localhost;dbname=iano_baby', 'iano_baby', 'bTKXDNDQi0,Q');
}

$dbh->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_WARNING );

if (isset($_POST["Submit"]))
{
	$guessStatement = $dbh->prepare("insert into guess 
		(GuesserName, Birthday, Name, Gender, Weight, Height) values 
		(:GuesserName, :Birthday, :Name, :Gender, :Weight, :Height)");
	$guessStatement->bindValue(':GuesserName', $_POST['YourName']);
	$guessStatement->bindValue(':Birthday', date("Y-m-d", strtotime($_POST['Birthday'])));
	$guessStatement->bindValue(':Name', $_POST['Name']);
	$guessStatement->bindValue(':Gender', $_POST['Gender']);
	$guessStatement->bindValue(':Weight', $_POST['Weight']);
	$guessStatement->bindValue(':Height', $_POST['Height']);
	$guessStatement->execute();
	
	echo "<p><b>Your guesses were submitted!</b></p>";
}
?>
<h3>Other guesses</h3>
<table cellspacing="0">
<tr><th>Guesser</th><th>Birthday</th><th>Name</th><th>Gender</th><th>Weight</th><th>Height</th></tr>
<?php
$select = $dbh->prepare("select * from guess");
$select->execute();

while ($row = $select->fetch())
{
	$data = "<tr><td>" . 
	$row[0] . "</td><td>" . 
	$row[1] . "</td><td>" . 
	$row[2] . "</td><td>" . 
	$row[3] . "</td><td>" . 
	$row[4] . "</td><td>" . 
	$row[5] . "</td></tr>\n";
	print $data;
}

?>
</table>
<br />
<form method="post" action="<?php echo $root; ?>survey">
	<fieldset>
		<legend>About you</legend>
		<ol>
			<li>
				<label for="YourName">Your name:</label>
				<input type="text" size="20" name="YourName" id="YourName" title="YourName" />
			</li>
		</ol>
	</fieldset>
	
	<fieldset>
		<legend>Your guesses for our baby</legend>
		<ol>
			<li>
				<label for="Birthday">Birthday:</label>
				<input type="text" size="20" name="Birthday" id="Birthday" value="06/08/2011" title="Birthday" />
			</li>
			<li>
				<label for="Name">Name:</label>
				<input type="text" size="20" name="Name" id="Name" title="Name" />
			</li>
			<li class="clearfix">
				<label>Gender:</label>
				<label><input type="radio" name="Gender" value="boy" id="GenderBoy" title="Gender Boy" />Boy</label>
				<label><input type="radio" name="Gender" value="girl" id="GenderGirl" title="Gender Girl" />Girl</label>
			</li>
			<li>
				<label for="Weight">Weight:</label>
				<input type="text" size="20" name="Weight" id="Weight" title="Weight" />
			</li>
			<li>
				<label for="Height">Height:</label>
				<input type="text" size="20" name="Height" id="Height" title="Height" />
			</li>
		</ol>
	</fieldset>
	<fieldset id="buttons">
		<input type="submit" id="Submit" name="Submit" value="Submit" />
	</fieldset>
</form>