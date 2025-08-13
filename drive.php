<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include("config.php");

$q = "'" . FOLDER_ID . "' in parents and trashed=false";
$q = urlencode($q);

$url = "https://www.googleapis.com/drive/v3/files?q={$q}&fields=files(id,name,webViewLink,createdTime)&key=" . API_KEY;

$response = file_get_contents($url);
echo $response;
?>
