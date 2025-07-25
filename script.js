let allFiles = [];
let currentPage = 1;
const itemsPerPage = 20;

async function fetchDriveFiles() {
  const response = await fetch('drive.php');
  const data = await response.json();
  return data.files;
}

async function renderDokumen() {
  const dokumenContainer = document.getElementById('dokumenContainer');
  const filterTahun = document.getElementById('filterTahun');

  allFiles = await fetchDriveFiles();
  dokumenContainer.innerHTML = '';
  filterTahun.innerHTML = '<option value="">Semua Tahun</option>';

  const tahunSet = new Set();

  allFiles = allFiles.map(file => {
    const tahunMatch = file.name.match(/(19|20)\d{2}/);
    file.tahun = tahunMatch ? tahunMatch[0] : '';

    const nameLower = file.name.toLowerCase();
    if (nameLower.includes('perpu')) file.jenis = 'PERPU';
    else if (nameLower.includes('perpres')) file.jenis = 'PERPRES';
    else if (nameLower.includes('pp')) file.jenis = 'PP';
    else if (nameLower.includes('uu')) file.jenis = 'Undang-Undang';
    else if (nameLower.includes('perda')) file.jenis = 'PERDA';
    else if (nameLower.includes('permendikbud')) file.jenis = 'PERMEN';
    else if (nameLower.includes('kepbup')) file.jenis = 'KEPBUP';
    else if (nameLower.includes('edaran')) file.jenis = 'Edaran';
    else file.jenis = 'Lainnya';

    if (file.tahun) tahunSet.add(file.tahun);
    return file;
  });

  Array.from(tahunSet).sort().forEach(tahun => {
    const option = document.createElement('option');
    option.value = tahun;
    option.textContent = tahun;
    filterTahun.appendChild(option);
  });

  applyFilter();
}

function applyFilter() {
  const keyword = document.getElementById('searchInput').value.toLowerCase();
  const jenis = document.getElementById('filterJenis').value;
  const tahun = document.getElementById('filterTahun').value;
  const dokumenContainer = document.getElementById('dokumenContainer');
  const noResult = document.getElementById('noResult');

  const filtered = allFiles.filter(file => {
    const name = file.name.toLowerCase();
    const matchKeyword = !keyword || name.includes(keyword);
    const matchJenis = !jenis || file.jenis === jenis;
    const matchTahun = !tahun || file.tahun === tahun;
    return matchKeyword && matchJenis && matchTahun;
  });

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
      const item = document.createElement('div');
      item.className = 'col dokumen-item mb-3';
      item.innerHTML = `
        <div class="p-3 rounded dokumen-card">
          <h5><a href="${file.webViewLink}" target="_blank" class="dokumen-link">${file.name}</a></h5>
          <p class="mb-0"><strong>Jenis:</strong> ${file.jenis} | <strong>Tahun:</strong> ${file.tahun || 'Tidak diketahui'}</p>
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

document.addEventListener('DOMContentLoaded', () => {
  renderDokumen();

  document.getElementById('searchInput').addEventListener('input', () => {
    currentPage = 1;
    applyFilter();
  });

  document.getElementById('filterJenis').addEventListener('change', () => {
    currentPage = 1;
    applyFilter();
  });

  document.getElementById('filterTahun').addEventListener('change', () => {
    currentPage = 1;
    applyFilter();
  });
});
