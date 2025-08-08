let allFiles = [];
let previousFileIds = new Set();
let currentPage = 1;
const itemsPerPage = 10;

async function fetchDriveFiles() {
  const response = await fetch('drive.php');
  const data = await response.json();
  return data.files;
}

async function renderDokumen() {
  const dokumenContainer = document.getElementById('dokumenContainer');
  const filterTahun = document.getElementById('filterTahun');

  allFiles = await fetchDriveFiles();
  allFiles = allFiles.filter(file => file.name.toLowerCase().endsWith('.pdf'));
  const tahunSet = new Set();

  allFiles = allFiles.map(file => {
    const tahunMatch = file.name.match(/(19|20)\d{2}/);
    file.tahun = tahunMatch ? tahunMatch[0] : '';
    file.displayName = file.name.replace(/\.pdf$/i, '');

    const nameLower = file.name.toLowerCase();
    if (nameLower.includes('perpu')) file.jenis = 'PERPU';
    else if (nameLower.includes('perpres')) file.jenis = 'PERPRES';
    else if (nameLower.includes('pp')) file.jenis = 'PP';
    else if (nameLower.includes('uu')) file.jenis = 'Undang-Undang';
    else if (nameLower.includes('perda')) file.jenis = 'PERDA';
    else if (nameLower.includes('permendikbud')) file.jenis = 'PERMEN';
    else if (nameLower.includes('pergub')) file.jenis = 'PERGUB';
    else if (nameLower.includes('kepbup')) file.jenis = 'KEPBUP';
    else if (nameLower.includes('edaran')) file.jenis = 'Edaran';
    else file.jenis = 'Lainnya';

    file.createdDate = new Date(file.createdTime);

    if (file.tahun) tahunSet.add(file.tahun);
    return file;
  });

  allFiles.sort((a, b) => a.displayName.localeCompare(b.displayName));

  filterTahun.innerHTML = '<option value="">Semua Tahun</option>';
  Array.from(tahunSet).sort().forEach(tahun => {
    const option = document.createElement('option');
    option.value = tahun;
    option.textContent = tahun;
    filterTahun.appendChild(option);
  });

  const sortedFiles = [...allFiles].sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
  const latestFile = sortedFiles[0];
  const storedLatestId = localStorage.getItem('latestFileId');

    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');

  if (latestFile && latestFile.id !== storedLatestId && hasVisitedBefore) {
    localStorage.setItem('latestFileId', latestFile.id);
    showNewDocumentNotification({
      ...latestFile,
      displayName: latestFile.name.replace(/\.pdf$/i, '')
    });
  }

  localStorage.setItem('hasVisitedBefore', 'true'); 

  updateDocumentStatistics(allFiles);
  applyFilter();
}

function updateDocumentStatistics(files) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - 6);

  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();

  let countToday = 0;
  let countWeek = 0;
  let countMonth = 0;

  files.forEach(file => {
    const fileDate = new Date(file.createdTime);
    const fileDateStr = fileDate.toISOString().split('T')[0];
    if (fileDateStr === todayStr) countToday++;
    if (fileDate >= thisWeekStart && fileDate <= today) countWeek++;
    if (fileDate.getMonth() === thisMonth && fileDate.getFullYear() === thisYear) countMonth++;
  });

  document.getElementById('statToday').textContent = countToday;
  document.getElementById('statWeek').textContent = countWeek;
  document.getElementById('statMonth').textContent = countMonth;
}

function applyFilter() {
  const keyword = document.getElementById('searchInput').value.toLowerCase();
  const jenis = document.getElementById('filterJenis').value;
  const tahun = document.getElementById('filterTahun').value;
  const waktu = document.getElementById('filterWaktu').value;
  const dokumenContainer = document.getElementById('dokumenContainer');
  const noResult = document.getElementById('noResult');

  let filtered = allFiles.filter(file => {
    const name = file.displayName.toLowerCase();
    const matchKeyword = !keyword || name.includes(keyword);
    const matchJenis = !jenis || file.jenis === jenis;
    const matchTahun = !tahun || file.tahun === tahun;

    let matchWaktu = true;
    const now = new Date();
    const fileDate = file.createdDate;

    if (waktu === 'today') {
      matchWaktu = fileDate.toDateString() === now.toDateString();
    } else if (waktu === 'thisWeek') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      matchWaktu = fileDate >= startOfWeek && fileDate <= endOfWeek;
    } else if (waktu === 'thisMonth') {
      matchWaktu = fileDate.getMonth() === now.getMonth() && fileDate.getFullYear() === now.getFullYear();
    }

    return matchKeyword && matchJenis && matchTahun && matchWaktu;
  });

  filtered.sort((a, b) => a.displayName.localeCompare(b.displayName));

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  if (currentPage > totalPages) currentPage = 1;

  const start = (currentPage - 1) * itemsPerPage;
  const visibleItems = filtered.slice(start, start + itemsPerPage);

  dokumenContainer.innerHTML = '';
  if (visibleItems.length === 0) {
    noResult.style.display = 'block';
  } else {
    noResult.style.display = 'none';
    visibleItems.forEach(file => {
      const fileDate = file.createdDate;
      const now = new Date();

      let waktuTag = '';
      if (fileDate.toDateString() === now.toDateString()) {
        waktuTag = 'Hari Ini';
      } else {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        if (fileDate >= startOfWeek && fileDate <= endOfWeek) {
          waktuTag = 'Minggu Ini';
        } else if (
          fileDate.getMonth() === now.getMonth() &&
          fileDate.getFullYear() === now.getFullYear()
        ) {
          waktuTag = 'Bulan Ini';
        }
      }

      const item = document.createElement('div');
      item.className = 'col dokumen-item mb-3';
      item.setAttribute('data-id', file.id);
      item.innerHTML = `
        <div class="p-3 rounded dokumen-card">
          <h5><a href="${file.webViewLink}" target="_blank" class="dokumen-link">${file.displayName}</a></h5>
          <p class="mb-0"><strong>Jenis:</strong> ${file.jenis} | <strong>Tahun:</strong> ${file.tahun || 'Tidak diketahui'}</p>
          <p class="text-muted mb-1"><small>Diunggah: ${fileDate.toLocaleString('id-ID')}</small></p>
          ${waktuTag ? `<span class="badge bg-info text-dark">${waktuTag}</span>` : ''}
        </div>
      `;
      dokumenContainer.appendChild(item);
    });
  }

  renderPagination(filtered.length, totalPages);
}

function renderPagination(totalItems, totalPages) {
  const container = document.querySelector('.pagination');
  const pageInfo = document.getElementById('pageInfo');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (totalItems <= itemsPerPage) {
    container.style.display = 'none';
    return;
  } else {
    container.style.display = 'flex';
  }

  pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;

  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      applyFilter();
    }
  };

  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      applyFilter();
    }
  };
}

function showNewDocumentNotification(file) {
  const notif = document.createElement('div');
  notif.className = 'fixed bottom-4 end-4 text-white p-3 rounded shadow-lg z-50';
  notif.style.backgroundColor = '#001f3f';
  notif.style.maxWidth = '300px';
  notif.style.position = 'fixed';
  notif.style.bottom = '20px';
  notif.style.right = '20px';
  notif.style.zIndex = '9999';

  notif.innerHTML = `
    <strong>Dokumen Baru Diunggah!</strong><br>
    <span class="filename">${file.displayName}</span><br>
    <div class="mt-2 d-flex justify-content-between">
      <button id="gotoNewDoc" class="btn btn-outline-light small">Lihat</button>
      <button id="closeNotif" class="btn btn-outline-light small">Tutup</button>
    </div>
  `;

  document.body.appendChild(notif);

  document.getElementById('gotoNewDoc').onclick = () => {
    const el = document.querySelector(`[data-id="${file.id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('border', 'border-primary');
      setTimeout(() => el.classList.remove('border', 'border-primary'), 3000);
    }
    notif.remove();
  };

  document.getElementById('closeNotif').onclick = () => {
    notif.remove();
  };

  setTimeout(() => notif.remove(), 100000);
}
setInterval(() => {
  renderDokumen();
}, 60000);

document.addEventListener('DOMContentLoaded', () => {
  renderDokumen();
  
  document.getElementById('filterJenis').addEventListener('change', () => {
    currentPage = 1;
    applyFilter();
  });

  document.getElementById('filterTahun').addEventListener('change', () => {
    currentPage = 1;
    applyFilter();
  });

  document.getElementById('filterWaktu').addEventListener('change', () => {
    currentPage = 1;
    applyFilter();
  });

});