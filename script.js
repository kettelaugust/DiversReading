let xmlDoc = null;
let mapInstance = null;
let markers = {};

// Координаты и описания мест из вашего XML
const placeCoordinates = {
    "place-bolinao": { lat: 16.3886, lng: 119.8928, name: "Bolinao", desc: "A port city in the Philippines" },
    "place-manila": { lat: 14.5995, lng: 120.9842, name: "Manille (Manila)", desc: "The capital of the Philippines" },
    "place-philippines": { lat: 12.8797, lng: 121.7740, name: "Philippines", desc: "Asian country" },
    "place-china": { lat: 35.8617, lng: 104.1954, name: "Chine", desc: "Asian country" },
    "place-cochinchine": { lat: 10.8231, lng: 106.6297, name: "Cochinchine", desc: "Cochinchina (southern Vietnam)" },
    "place-japan": { lat: 36.2048, lng: 138.2529, name: "Iapon (Japan)", desc: "Asian country" },
    "place-macao": { lat: 22.1987, lng: 113.5439, name: "Macao", desc: "Administrative region of China, Portuguese colonyу" }
};

// Функция переключения разделов
function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const targetSection = document.getElementById(`sec-${tabId}`);
    if (targetSection) targetSection.classList.add('active');
    if (btnElement) btnElement.classList.add('active');

    // Если переключились на вкладку карты — инициализируем ее и обновляем размер
    if (tabId === 'map') {
        initMap();
        setTimeout(() => {
            if (mapInstance) mapInstance.invalidateSize();
        }, 200);
    }
}

// Загрузка XML после старта
document.addEventListener('DOMContentLoaded', () => {
    fetch('data/Encoding.xml')
        .then(response => {
            if (!response.ok) throw new Error("Файл Encoding.xml не найден в папке data/");
            return response.text();
        })
        .then(str => (new DOMParser()).parseFromString(str, "text/xml"))
        .then(data => {
            xmlDoc = data;
            renderCollation();
        })
        .catch(err => console.error("Ошибка загрузки:", err));
});

// Инициализация карты
function initMap() {
    if (mapInstance) return;

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    mapInstance = L.map('map').setView([18.0, 115.0], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors | TEI Digital Edition'
    }).addTo(mapInstance);

    const placesListUI = document.getElementById('places-list');
    if (placesListUI) placesListUI.innerHTML = '';

    Object.keys(placeCoordinates).forEach(id => {
        const item = placeCoordinates[id];

        const marker = L.marker([item.lat, item.lng]).addTo(mapInstance);
        marker.bindPopup(`<b>${item.name}</b><br>${item.desc}`);
        markers[id] = marker;

        if (placesListUI) {
            const li = document.createElement('li');
            li.style.cssText = "padding: 10px 14px; margin-bottom: 8px; background: #f8fafc; border-radius: 6px; cursor: pointer; border: 1px solid #e2e8f0; transition: all 0.2s;";
            li.innerHTML = `<strong style="color: #1e293b;">${item.name}</strong><br><small style="color: #64748b;">${item.desc}</small>`;

            li.addEventListener('mouseenter', () => li.style.borderColor = '#2563eb');
            li.addEventListener('mouseleave', () => li.style.borderColor = '#e2e8f0');
            li.addEventListener('click', () => focusPlace(id));

            placesListUI.appendChild(li);
        }
    });
}

function focusPlace(placeId) {
    const item = placeCoordinates[placeId];
    if (item && mapInstance && markers[placeId]) {
        mapInstance.flyTo([item.lat, item.lng], 7, { duration: 1.5 });
        markers[placeId].openPopup();
    }
}

// Вспомогательная функция для сборки текста из <lem> и <rdg>
function getVariantHtml(element) {
    if (!element) return '';
    let html = '';
    element.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
            html += child.textContent;
        } else if (child.nodeName === 'lb') {
            html += '<br/>';
        } else {
            html += getVariantHtml(child);
        }
    });
    return html;
}

// Генерация двух колонок (Collation)
// Генерация двух колонок (Collation)
function renderCollation() {
    if (!xmlDoc) return;

    const col1653 = document.getElementById('col-w1653');
    const col1682 = document.getElementById('col-w1682');
    if (!col1653 || !col1682) return;

    col1653.innerHTML = '';
    col1682.innerHTML = '';

    const body = xmlDoc.querySelector('body');
    if (!body) return;

    let html1653 = '';
    let html1682 = '';
    let appCounter = 0;

    function parseNode(node) {
        node.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                html1653 += child.textContent;
                html1682 += child.textContent;
            } else if (child.nodeName === 'app') {
                appCounter++;
                const lem = child.querySelector('lem');
                const rdg = child.querySelector('rdg');

                // Считываем тип варианта из атрибута <app type="...">
                const appType = child.getAttribute('type') || 'variant';

                const lemHtml = getVariantHtml(lem);
                const rdgHtml = getVariantHtml(rdg);

                // Добавляем data-type в разметку
                html1653 += `<span class="variant-highlight" data-app="${appCounter}" data-type="${appType}">${lemHtml}</span>`;
                html1682 += `<span class="variant-highlight" data-app="${appCounter}" data-type="${appType}">${rdgHtml}</span>`;
            } else if (child.nodeName === 'head') {
                html1653 += '<div class="chapter-title">';
                html1682 += '<div class="chapter-title">';
                parseNode(child);
                html1653 += '</div>';
                html1682 += '</div>';
            } else if (child.nodeName === 'p') {
                html1653 += '<p>';
                html1682 += '<p>';
                parseNode(child);
                html1653 += '</p>';
                html1682 += '</p>';
            } else if (child.nodeName === 'lb') {
                html1653 += '<br/>';
                html1682 += '<br/>';
            } else {
                parseNode(child);
            }
        });
    }

    parseNode(body);

    col1653.innerHTML = html1653;
    col1682.innerHTML = html1682;

    // Обработка клика по подсвеченным словам
    document.querySelectorAll('.variant-highlight').forEach(el => {
        el.addEventListener('click', (e) => {
            const appId = e.target.getAttribute('data-app');

            document.querySelectorAll('.variant-highlight').forEach(vh => vh.classList.remove('active'));
            document.querySelectorAll(`.variant-highlight[data-app="${appId}"]`).forEach(vh => vh.classList.add('active'));

            const appNodes = xmlDoc.querySelectorAll('app');
            if (appNodes && appNodes[appId - 1]) {
                const appNode = appNodes[appId - 1];

                // Берем тип из тега <app type="...">
                const typeVal = appNode.getAttribute('type') || 'variant';

                const lemText = appNode.querySelector('lem')?.textContent.trim().replace(/\s+/g, ' ') || '';
                const rdgText = appNode.querySelector('rdg')?.textContent.trim().replace(/\s+/g, ' ') || '';

                // Выводим плашку с типом в панель вариантов
                document.getElementById('app-details').innerHTML = `
                    <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                        <span class="variant-badge badge-${typeVal.toLowerCase()}">${typeVal}</span>
                        <div><strong style="color: #64748b;">W1653 (1653):</strong> <span style="color:#d97706; font-weight: 500;">${lemText}</span></div>
                        <div><strong style="color: #64748b;">W1682 (1682):</strong> <span style="color:#2563eb; font-weight: 500;">${rdgText}</span></div>
                    </div>
                `;
            }
        });
    });

    let isSyncing = false;
    col1653.onscroll = () => {
        if (!isSyncing) {
            isSyncing = true;
            col1682.scrollTop = col1653.scrollTop;
            isSyncing = false;
        }
    };
    col1682.onscroll = () => {
        if (!isSyncing) {
            isSyncing = true;
            col1653.scrollTop = col1653.scrollTop;
            isSyncing = false;
        }
    };
}

// ==========================================================================
// РАЗДЕЛ TEXTS (BOOK GALLERY & PDF VIEWER)
// ==========================================================================

const pdfBooksData = {
    '1651_cathechismus': {
        pdfPath: 'data/pdfs/Cathechismus.pdf',
        title: 'Cathechismus Pro iis, qui volunt suscipere baptismum In Octo dies divisus, Ope Sacrae Congregationis de Propaganda Fide in lucem editus, Ab Alexandro de Rhodes...',
        author: 'Rhodes, Alexandre de (1591–1660)',
        year: '1651',
        publisher: 'Romae, Typis Sacrae Congregationis de propaganda fide',
        source: 'Bibliothèque nationale de France / Facultés Loyola Paris (C 06/0245)',
        sourceUrl: 'https://gallica.bnf.fr/ark:/12148/bpt6k91252300?rk=257512;0',
        description: 'Bilingual Latin-Vietnamese Catechism divided into eight days ("Phép giảng tám ngày"). Published by Propaganda Fide, this foundational text is one of the earliest printed works in Chữ Quốc ngữ.'
    },
    '1653_voyages': {
        pdfPath: 'data/pdfs/Divers_voyages_1653.pdf',
        title: 'Divers voyages et missions du P. Alexandre de Rhodes en la Chine, & autres royaumes de l\'Orient, avec son retour en Europe par la Perse & l\'Armenie...',
        author: 'Rhodes, Alexandre de (1591–1660)',
        year: '1653',
        publisher: 'S. Cramoisy et G. Cramoisy (Paris)',
        source: 'Bibliothèque nationale de France, département Philosophie, histoire, sciences de l\'homme (RES4-O2N-9)',
        sourceUrl: 'https://gallica.bnf.fr/ark:/12148/btv1b8607026z?rk=85837;2',
        description: 'First major French edition detailing Alexandre de Rhodes\' 35-year travel through Asia, mission work in Tonkin and Cochinchina, and notes on regional languages and culture.'
    },
    '1655_relation': {
        pdfPath: 'data/pdfs/Relation.pdf',
        title: 'Relation de ce qui s\'est passé en l\'année 1649. dans les royaumes où les Peres de la Compagnie de Jésus de la province du Japon, publient le Saint Evangile...',
        author: 'Rhodes, Alexandre de (1591–1660)',
        year: '1655',
        publisher: 'A Paris, chez Florentin Lambert',
        source: 'Bibliothèque nationale de France',
        sourceUrl: 'https://gallica.bnf.fr/ark:/12148/bpt6k1512534s?rk=64378;0',
        description: 'Dedicated to the Queen of Poland and Sweden, this narrative reports on missionary affairs and political developments in Japan and neighbouring East Asian realms during 1649.'
    },
    '1666_voyages': {
        pdfPath: 'data/pdfs/Divers_voyages_1666.pdf',
        title: 'Divers voiages du P. Alexandre de Rhodes en la Chine et autres royaumes de l\'Orient, avec son retour en Europe par la Perse et l\'Arménie... 2de édition',
        author: 'Rhodes, Alexandre de (1591–1660)',
        year: '1666',
        publisher: 'S. Mabre-Cramoisy (Paris)',
        source: 'Bibliothèque nationale de France, département Arsenal (4-H-457)',
        sourceUrl: 'https://gallica.bnf.fr/ark:/12148/bpt6k8727042c?rk=128756;0',
        description: 'Second French edition printed by Sébastien Mabre-Cramoisy. Includes minor typographic adaptations and revised orthography compared to the 1653 princeps edition.'
    },
    '1682_voyages': {
        pdfPath: 'data/pdfs/W1682.pdf',
        title: 'Divers voyages de la Chine, et autres royaumes de l\'orient. Avec le retour de l\'autheur en europe, par la Perse & l\'Armenie. Le tout divise\' en trois parties',
        author: 'Rhodes, Alexandre de (1591–1660)',
        year: '1682',
        publisher: 'Chez Christophe Iournel, Paris',
        source: 'National Central Library of Rome (Biblioteca Nazionale Centrale di Roma)',
        sourceUrl: 'https://books.google.com',
        description: 'Late 17th-century edition in three parts. Serves as a vital source for diachronic textual collation, exhibiting structural re-chaptering and orthographic evolution.'
    }
};

// Открыть PDF-вьюер
function openPdfViewer(bookKey) {
    const data = pdfBooksData[bookKey];
    if (!data) return;

    // Наполняем метаданные и файл
    document.getElementById('pdf-frame').src = data.pdfPath + '#toolbar=1';
    document.getElementById('pdf-download-link').href = data.pdfPath;

    const sourceLink = document.getElementById('pdf-source-link');
    if (data.sourceUrl) {
        sourceLink.href = data.sourceUrl;
        sourceLink.style.display = 'inline-block';
    } else {
        sourceLink.style.display = 'none';
    }

    document.getElementById('pdf-meta-title').innerText = data.title;
    document.getElementById('pdf-meta-author').innerText = data.author;
    document.getElementById('pdf-meta-year').innerText = data.year;
    document.getElementById('pdf-meta-publisher').innerText = data.publisher;
    document.getElementById('pdf-meta-source').innerText = data.source;
    document.getElementById('pdf-meta-desc').innerText = data.description;

    // Переключаем режимы просмотра
    document.getElementById('pdf-gallery-grid').style.display = 'none';
    document.getElementById('pdf-viewer-mode').style.display = 'block';
}

// Вернуться обратно к сетке книг
function closePdfViewer() {
    document.getElementById('pdf-viewer-mode').style.display = 'none';
    document.getElementById('pdf-gallery-grid').style.display = 'grid';
    document.getElementById('pdf-frame').src = ''; // сброс кадра
}

// ==========================================================================
// GALLERY / LIGHTBOX METADATA (UPDATED)
// ==========================================================================

const galleryData = [
    {
        title: "Portrait of Alexandre de Rhodes",
        author: "Unknown artist",
        year: "17th century",
        source: "Société des Missions Étrangères de Paris, France / Bridgeman Images",
        description: "A formal portrait depicting Father Alexandre de Rhodes (1591–1660)."
    },
    {
        title: "The Introduction of Roman Writing Into Vietnam",
        author: "Nguyen Dinh Dang",
        year: "March 2001",
        source: `Author's <a href="http://rarfaxp.riken.go.jp/~dang/rhodes_motive.html" target="_blank" rel="noopener noreferrer">official website</a>`,
        description: "This artwork was created on the occasion of the 350th anniversary of the first Vietnamese dictionary. An artistic representation symbolizing the historical transition and cultural synthesis of Latin writing in Vietnam."
    },
    {
        title: "Postage Stamps of French Indochina",
        author: "Indochinese Postal Service",
        year: "Late 19th – Early 20th century",
        source: "Historical Philatelic Archives",
        description: "A commemorative philatelic collection from the colonial period in French Indochina, reflecting colonial administration iconography, trade, and regional heritage."
    },
    {
        title: "Postage Stamps of Vietnam",
        author: "Vietnam Post",
        year: "20th century",
        source: "National Postal Archives of Vietnam",
        description: "Modern postage stamps celebrating key historical figures, cultural heritage, and landmark events in Vietnamese history."
    },
    {
        title: "Old Map of Annam",
        author: "Alexander de Rhodes",
        year: "1651",
        source: "Bibliothèque nationale de France",
        description: "An cartographic representation of the showing Cocincina (left) and Tunkin (right). One of the earliest Western maps showing details of northern and central Vietnam appeared in Father Alexander de Rhodes's Histoire dv royavme de Tvnqvin, published in Rome in 1650. This map is from the French edition, published a year later in Lyon."
    }
];

function openLightbox(index) {
    const item = galleryData[index];
    if (!item) return;

    const cards = document.querySelectorAll('.artefact-card');
    if (cards[index]) {
        const cardImg = cards[index].querySelector('img');
        if (cardImg) {
            document.getElementById('modal-img').src = cardImg.src;
        }
    }

    document.getElementById('modal-title').innerText = item.title;
    document.getElementById('modal-author').innerText = item.author;
    document.getElementById('modal-year').innerText = item.year;
    document.getElementById('modal-source').innerHTML = item.source || 'N/A';
    document.getElementById('modal-desc').innerText = item.description;

    // Вывод ресурса/источника
    const sourceElem = document.getElementById('modal-source');
    if (sourceElem) {
        sourceElem.innerText = item.source || 'N/A';
    }

    const modal = document.getElementById('gallery-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox(event) {
    if (event) {
        event.stopPropagation();
    }
    const modal = document.getElementById('gallery-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    document.body.style.overflow = '';
}

// Логика переключения вкладок в разделе About
document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.about-nav-btn');
    const tabContents = document.querySelectorAll('.about-tab-content');

    if (navButtons.length > 0) {
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');

                // Снимаем активные классы со всех кнопок и вкладок
                navButtons.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // Активируем нужную вкладку и кнопку
                btn.classList.add('active');
                const activeContent = document.getElementById(targetTab);
                if (activeContent) {
                    activeContent.classList.add('active');
                }
            });
        });
    }
});
