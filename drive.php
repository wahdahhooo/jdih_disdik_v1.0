<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include("config.php");

$fields = "files(id,name,webViewLink,createdTime)";
$url = "https://www.googleapis.com/drive/v3/files?q='" . FOLDER_ID . "'+in+parents+and+trashed=false&fields=files(id,name,webViewLink,createdTime)&key=" . API_KEY;

$response = file_get_contents($url);
echo $response;
?>