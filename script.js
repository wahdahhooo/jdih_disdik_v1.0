let allFiles = [];
let searchTimeout;
let previousFileIds = new Set();
let currentPage = 1;
const itemsPerPage = 10;

function showLoading() {
  document.getElementById('loadingIndicator').style.display = 'block';
}
function hideLoading() {
  document.getElementById('loadingIndicator').style.display = 'none';
}

async function fetchDriveFiles() {
  const response = await fetch('drive.php');
  const data = await response.json();
  return data.files;
}

function updateDocumentStatistics(files) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const todayCount = files.filter(f => f.createdDate.toDateString() === now.toDateString()).length;
  const weekCount = files.filter(f => f.createdDate >= startOfWeek && f.createdDate <= endOfWeek).length;
  const monthCount = files.filter(f => f.createdDate.getMonth() === now.getMonth() && f.createdDate.getFullYear() === now.getFullYear()).length;
  const allCount = files.length;

  document.getElementById('statToday').textContent = todayCount;
  document.getElementById('statWeek').textContent = weekCount;
  document.getElementById('statMonth').textContent = monthCount;
  document.getElementById('statAll').textContent = allCount;
}

async function renderDokumen() {
  showLoading();
  const dokumenContainer = document.getElementById('dokumenContainer');
  const filterTahun = document.getElementById('filterTahun');

  try {
    const fetchedFiles = await fetchDriveFiles();
    allFiles = fetchedFiles.filter(file => file.name.toLowerCase().endsWith('.pdf'));
    
    const tahunSet = new Set();
    allFiles = allFiles.map(file => {
      
      const tahunMatch = file.name.match(/(19|20)\d{2}/);
      file.tahun = tahunMatch ? tahunMatch[0] : '';
      file.displayName = file.name.replace(/\.pdf$/i, '');
      file.createdDate = new Date(file.createdTime);

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

      if (file.tahun) tahunSet.add(file.tahun);
      return file;
    })

    allFiles.sort((a, b) => a.displayName.localeCompare(b.displayName));

    filterTahun.innerHTML = '<option value="">Semua Tahun</option>';
    Array.from(tahunSet).sort().forEach(tahun => {
      filterTahun.insertAdjacentHTML('beforeend', `<option value="${tahun}">${tahun}</option>`);
    });

    updateDocumentStatistics(allFiles);

    const latestFile = [...allFiles].sort((a, b) => b.createdDate - a.createdDate)[0];
    const storedLatestId = localStorage.getItem('latestFileId');
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');

    if (latestFile && latestFile.id !== storedLatestId && hasVisitedBefore) {
      localStorage.setItem('latestFileId', latestFile.id);
      showNewDocumentNotification(latestFile);
    }
    localStorage.setItem('hasVisitedBefore', 'true');

    applyFilter();
  } catch (error) {
    console.error('Gagal memuat dokumen:', error);
  } finally {
    hideLoading();
  }
}

function applyFilter() {
  showLoading();
  setTimeout(() => { 
    const keyword = document.getElementById('searchInput').value.toLowerCase().trim();
    const jenis = document.getElementById('filterJenis').value;
    const tahun = document.getElementById('filterTahun').value;
    const waktu = document.getElementById('filterWaktu').value;
    const dokumenContainer = document.getElementById('dokumenContainer');
    const noResult = document.getElementById('noResult');

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const filtered = allFiles.filter(file => {
      if (keyword && !file.displayName.toLowerCase().includes(keyword)) return false;
      if (jenis && file.jenis !== jenis) return false;
      if (tahun && file.tahun !== tahun) return false;

      if (waktu === 'today') {
        return file.createdDate.toDateString() === now.toDateString();
      } else if (waktu === 'thisWeek') {
        return file.createdDate >= startOfWeek && file.createdDate <= endOfWeek;
      } else if (waktu === 'thisMonth') {
        return file.createdDate.getMonth() === now.getMonth() &&
              file.createdDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = 1;

    const start = (currentPage - 1) * itemsPerPage;
    const visibleItems = filtered.slice(start, start + itemsPerPage);

    dokumenContainer.innerHTML = '';
    if (!visibleItems.length) {
      noResult.style.display = 'block';
    } else {
      noResult.style.display = 'none';
      visibleItems.forEach(file => {
        const fileDate = file.createdDate;
        let waktuTag = '';
        if (fileDate.toDateString() === now.toDateString()) waktuTag = 'Hari Ini';
        else if (fileDate >= startOfWeek && fileDate <= endOfWeek) waktuTag = 'Minggu Ini';
        else if (fileDate.getMonth() === now.getMonth() && fileDate.getFullYear() === now.getFullYear()) waktuTag = 'Bulan Ini';

        dokumenContainer.insertAdjacentHTML('beforeend', `
          <div class="col dokumen-item mb-3" data-id="${file.id}">
            <div class="p-3 rounded dokumen-card">
              <h5><a href="${file.webViewLink}" target="_blank" class="dokumen-link">${file.displayName}</a></h5>
              <p class="mb-0"><strong>Jenis:</strong> ${file.jenis} | <strong>Tahun:</strong> ${file.tahun || 'Tidak diketahui'}</p>
              <p class="text-muted mb-1"><small>Diunggah: ${fileDate.toLocaleString('id-ID')}</small></p>
              ${waktuTag ? `<span class="badge bg-info text-dark">${waktuTag}</span>` : ''}
            </div>
          </div>
        `);
      });
    }

    renderPagination(filtered.length, totalPages);
    hideLoading();
  }, 300);
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

  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentPage = 1;
      applyFilter();
    }, 500);
  });

  document.getElementById('filterJenis').addEventListener('change', () => { currentPage = 1; applyFilter(); });
  document.getElementById('filterTahun').addEventListener('change', () => { currentPage = 1; applyFilter(); });
  document.getElementById('filterWaktu').addEventListener('change', () => { currentPage = 1; applyFilter(); });
});