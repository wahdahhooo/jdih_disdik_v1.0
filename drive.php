<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include("config.php");

$q = "'" . FOLDER_ID . "' in parents and trashed=false";
$q = urlencode($q);
$url = "https://www.googleapis.com/drive/v3/files?q={$q}&fields=files(id,name,webViewLink,createdTime),nextPageToken&pageSize=1000&key=" . API_KEY;
$allFiles = [];
$pageToken = null;

do {
    $fetchUrl = $url;
    if ($pageToken) {
        $fetchUrl .= "&pageToken=" . urlencode($pageToken);
    }

    $response = file_get_contents($fetchUrl);
    $data = json_decode($response, true);

    if (isset($data['files'])) {
        $allFiles = array_merge($allFiles, $data['files']);
    }

    $pageToken = isset($data['nextPageToken']) ? $data['nextPageToken'] : null;
} while ($pageToken);

echo json_encode([
    "files" => $allFiles,
    "total" => count($allFiles)
]);
?>
