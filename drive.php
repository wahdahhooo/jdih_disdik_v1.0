<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include("config.php");

$url = "https://www.googleapis.com/drive/v3/files?q='" . FOLDER_ID . "'+in+parents+and+trashed=false&fields=files(id,name,webViewLink)&key=" . API_KEY;

$response = file_get_contents($url);
echo $response;
?>
