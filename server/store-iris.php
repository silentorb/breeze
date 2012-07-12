<?php

$data = $_POST['data'];
$filename = $_POST['filename'];
file_put_contents('../projects/' . $filename, $data);

?>
