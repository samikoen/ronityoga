<?php
// Basit session kontrolü
session_start();

header('Content-Type: text/plain');

if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
    echo "LOGGED_IN";
} else {
    echo "NOT_LOGGED_IN";
}
?>