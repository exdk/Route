<?php
echo'<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Маршрутизатор-3000</title>
    <link rel="stylesheet" href="route.css">
    <script src="route.js"></script>
</head>
<body>
	<div class="zagolovok"><b><center><div style="font-size: 28px;">Маршрутизатор-3000</div></center></b></div>
    <div id="map" style="width: 100%; height: 400px;"></div>
    <div id="routeControl" class="controlRoute">
		<form action="index.php" method="POST">
        <input type="search" name="startAddress" id="startAddress" placeholder="Укажите точку отправления на карте"></input>
        <input type="search" name="finishAddress" id="finishAddress" placeholder="Укажите точку прибытия на карте"></input>
        <div id="totalInfo" style="display: none;"></div>
        <input type="button" id="clear" value="Очистить"></input><br>
		<input type="submit" value="Сохранить маршрут" /></form>
    </div>
	<script src="parameters.js"></script>';
//////подключение к БД//////
$mysqli = new mysqli('mysql-174554.srv.hoster.ru', 'srv174554_aa59', 'bcs2d.,y', 'srv174554_b63cb');
$mysqli->query("SET NAMES 'utf8'"); 
$mysqli->query("SET CHARACTER SET 'utf8'");
$mysqli->query("SET SESSION collation_connection = 'utf8_general_ci'");
if ($mysqli->connect_error) {
    die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
}
//////подключение к БД//////

//////общее кол-во маршрутов//////
if ($result = $mysqli->query("SELECT id FROM gbook")) {
    printf("<div class='zagolovok'>Построено маршрутов при помощи нашего замечательного сервиса: %d</div>", $result->num_rows);
    $result->close();
}
//////общее кол-во маршрутов//////

//////форма//////
//echo '<form action="index.php" method="POST">';
//echo"<input type='text' name='author' value='адрес откуда'/><br/>
//<input type='text' name='text' value='адрес куда'/><br/><br>";
//echo'<input type="submit" value="Добавить" /></form>';
if(!empty($_POST['startAddress']))
{
$startAddress = mysqli_real_escape_string($mysqli, $_POST['startAddress']);
$finishAddress = mysqli_real_escape_string($mysqli, $_POST['finishAddress']); 
$date = time();
$ip = $_SERVER['REMOTE_ADDR'];
if ($mysqli->query("INSERT into gbook VALUES ('', '".$startAddress."', '".$finishAddress."', '".$date."', '".$ip."')")) {
    printf("<div class='bordur'>%d маршрут добавлен.</div><div class='bordur'><a href='http://yunusov.me/route/'><img src='please.jpg' width='110' height='82' alt='!'><br>Профессор, можно еще?</a></div>", $mysqli->affected_rows);
}
//$mysqli->close();
}
//////форма//////

//////вывод последний трех маршрутов//////
$query = "SELECT id, startAddress, finishAddress FROM `gbook` ORDER BY id DESC LIMIT 3";
if (mysqli_multi_query($mysqli, $query)) {
    do {
        if ($result = mysqli_use_result($mysqli)) {
			echo"<div class='menu'><img src='yakub.jpg' width='110' height='110' alt='!'><br>Последняя тройка маршрутов в студию:</div>";
            while ($row = mysqli_fetch_row($result)) {
                printf("<div class='menu'>От:<br><b>%s</b><br>До:<br><b>%s</b><br><a href='?'>Посмотреть</a></div>", $row[1], $row[2]);
            }
            mysqli_free_result($result);
        }
        if (mysqli_more_results($mysqli)) {
            printf("-----------------\n");
        }
    } while (mysqli_next_result($mysqli));
}
mysqli_close($mysqli);
//////вывод последний трех маршрутов//////
echo'</body>
</html>';
?>