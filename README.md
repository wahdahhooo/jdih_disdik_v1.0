1. Instalasi Awal (Developer)  
A. Siapkan Tools
Install XAMPP
Clone repo ini atau download ZIP lalu extract ke:
C:\xampp\htdocs\

B. Konfigurasi Google Drive API    
Buat project di Google Cloud Console   
Aktifkan Google Drive API  
Buat API Key  
Salin API Key ke file config.php:  
php
Copy
Edit
<?php
$apiKey = 'ISI_DENGAN_API_KEY_ANDA';
$folderId = 'ISI_DENGAN_FOLDER_ID_DRIVE';
?>

Catatan: Pastikan file dan folder di Google Drive Anda bersifat publik.

C. Jalankan Server  
Buka XAMPP → Start Apache  
Akses di browser: 
http://localhost/jdih_kp/

2. Cara Penggunaan (User)  
Buka http://localhost/jdih_kp/
Gunakan filter tahun & jenis di atas halaman
Klik tombol "Berikutnya" untuk pagination
Jika tidak ada data → muncul tampilan Dokumen Tidak Ditemukan

3. Troubleshooting  
Masalah dan	Solusi  
Not Found saat dibuka	maka Cek apakah folder berada di htdocs/ dan XAMPP aktif  
Tidak muncul data dokumen maka	Cek config.php: pastikan API Key & folder ID benar  
Filter tidak bekerja	maka Cek apakah file script.js terhubung dan tidak error di console  
Gambar Not Found tidak muncul	maka Pastikan file img/notfound.png ada  

4. Kontribusi  
Fork repo ini  
Buat branch baru (fitur-nama)  
Commit & push perubahan  
Buat Pull Request  
