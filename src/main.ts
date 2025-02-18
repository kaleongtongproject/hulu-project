async function fetchData() {
  try {
    const response = await fetch(
      'https://d1q0vy0v52gyjr.cloudfront.net/hub.json'
    );
    const data = await response.json();
    const collections = data.components.filter(
      (comp: any) => comp._type === 'collection'
    );
    renderTiles(collections);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}

async function renderTiles(collections: any[]) {
  const app = document.getElementById('app');
  if (app) {
    let allRows = [];
    for (const collection of collections) {
      const rowContainer = document.createElement('div');
      rowContainer.className = 'row-container';

      const title = document.createElement('h3');
      title.innerText = collection.name;
      title.style.fontFamily = 'Graphik, Helvetica Neue, Arial, sans-serif';
      title.style.fontSize = '1.2rem';
      title.style.fontWeight = 'bold';
      title.style.color = 'white';
      title.style.textTransform = 'uppercase';
      title.style.marginBottom = '10px';

      rowContainer.appendChild(title);

      const rowWrapper = document.createElement('div');
      rowWrapper.className = 'row-wrapper';
      rowWrapper.style.overflow = 'hidden';
      rowWrapper.style.position = 'relative';

      const row = document.createElement('div');
      row.className = 'row';
      row.style.display = 'flex';
      row.style.flexWrap = 'wrap';
      row.style.gap = '10px';
      row.style.transition = 'transform 0.3s ease-in-out';
      row.dataset.index = String(allRows.length || 0);

      let tiles: any[] = [];

      try {
        const response = await fetch(collection.href);
        const tileData = await response.json();
        tileData.items.forEach(async (item: any, index: any) => {
          const tile = document.createElement('div');
          tile.className = 'tile';
          tile.tabIndex = 0;
          tile.dataset.index = index;
          tile.style.opacity = '0';
          tile.style.transform = 'translateY(20px)';
          tile.style.transition =
            'opacity 0.6s ease-out, transform 0.6s ease-out';

          setTimeout(() => {
            tile.style.opacity = '1';
            tile.style.transform = 'translateY(0)';
          }, index * 100); // Staggered effect

          const imageUrl = constructImageUrl(
            item.visuals.artwork.vertical_tile.image.path
          );
          if (await isValidImage(imageUrl)) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = item.visuals.artwork.vertical_tile.text || 'Tile Image';
            img.style.width = '250px';
            img.style.objectFit = 'cover';
            img.style.height = '250px';
            img.style.borderRadius = '4px';

            const caption = document.createElement('div');
            caption.className = 'tile-caption';
            caption.innerText =
              item.visuals.headline || 'No headline available';
            caption.style.fontSize = '0.9rem';
            caption.style.fontFamily =
              'Graphik, "Helvetica Neue", Arial, sans-serif';
            caption.style.fontWeight = 'bold';
            caption.style.color = 'white';
            caption.style.marginTop = '5px';
            caption.style.width = '90%';
            caption.style.maxWidth = '250px';
            caption.style.overflow = 'hidden';
            caption.style.whiteSpace = 'nowrap';
            caption.style.textOverflow = 'ellipsis';

            const watermark = document.createElement('div');
            watermark.innerText = 'hulu';
            watermark.style.position = 'absolute';
            watermark.style.bottom = '40px';
            watermark.style.right = '8px';
            watermark.style.fontSize = '1.2rem';
            watermark.style.fontWeight = 'bold';
            watermark.style.color = '#1ce783';
            watermark.style.background = 'transparent';
            watermark.style.padding = '3px 6px';
            watermark.style.borderRadius = '4px';
            watermark.style.pointerEvents = 'none';
            watermark.style.fontFamily =
              'Graphik, "Helvetica Neue", Arial, sans-serif';

            tile.appendChild(watermark);
            tile.appendChild(img);
            tile.appendChild(caption);
            tile.addEventListener('click', () => openModal(item));
            tiles.push(tile);
            row.appendChild(tile);
          }
        });
      } catch (error) {
        console.error('Failed to fetch collection data:', error);
      }

      rowContainer.appendChild(row);
      rowContainer.appendChild(rowWrapper);
      app.appendChild(rowContainer);
      allRows.push(tiles);
    }
    setupTileNavigation(allRows);
  }
}

function setupTileNavigation(allRows: any) {
  let currentRowIndex = 0;
  let currentTileIndex = 0;

  function updateFocus() {
    allRows.forEach((row: any) =>
      row.forEach((tile: any) => {
        const img = tile.querySelector('img');
        if (img) {
          img.style.transform = 'scale(1)';
          img.style.outline = 'none';
          img.style.border = 'none';
        }
        tile.style.outline = 'none';
      })
    );

    if (
      allRows[currentRowIndex] &&
      allRows[currentRowIndex][currentTileIndex]
    ) {
      const selectedTile = allRows[currentRowIndex][currentTileIndex];
      const img = selectedTile.querySelector('img');
      selectedTile.focus();

      if (img) {
        img.style.transition =
          'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out';
        img.style.transform = 'scale(1.06)';
        img.style.border = '2px solid white';
        img.style.borderRadius = '4px';
        img.style.outline = 'none';
      }
    }
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      if (currentTileIndex < allRows[currentRowIndex].length - 1) {
        currentTileIndex++;
      }
    } else if (event.key === 'ArrowLeft') {
      if (currentTileIndex > 0) {
        currentTileIndex--;
      }
    } else if (event.key === 'ArrowDown') {
      if (currentRowIndex < allRows.length - 1) {
        currentRowIndex++;
        currentTileIndex = 0;
      }
    } else if (event.key === 'ArrowUp') {
      if (currentRowIndex > 0) {
        currentRowIndex--;
        currentTileIndex = 0;
      }
    }
    updateFocus();
  });
}

async function isValidImage(url: string) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;

    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
  });
}

function constructImageUrl(baseUrl: string): string {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}size=250x250&format=jpeg`.replace(
    /&amp;/g,
    '&'
  );
}

function openModal(item: any) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');
  const modalCloseBtn = document.getElementById('close-modal');
  if (modal && modalBody && modalCloseBtn) {
    const headline = item.visuals.headline || 'No headline';
    const body = item.visuals.body || 'No description available.';
    const imageUrl = constructImageUrl(
      item.visuals.artwork.vertical_tile.image.path
    );
    modalBody.innerHTML = `
    <div style="display: flex; flex-direction: row; align-items: center; 
                background: white; padding: 20px; border-radius: 8px; 
                width: 100%; max-width: 950px; gap: 20px; overflow: hidden;">
      
      <div style="flex: 1;">
        <img src="${imageUrl}&size=1000x1000&format=jpeg" 
             alt="Movie Preview" 
             style="width: 100%; height: auto; border-radius: 8px; display: block;">
      </div>
  
      <div style="flex: 2; text-align: left; color: black; height: 300px; font-family: Graphik, 'Helvetica Neue', Arial, sans-serif;">
      <h2 style="margin: 0 0 30px; font-size: 1.5rem;">${headline}</h2>
        <p style="margin: 0; font-size: 1rem;">${body}</p>
      </div>
  
    </div>
  `;
    modalBody.style.display = 'flex';
    modalBody.style.flexDirection = 'column';
    modalBody.style.alignItems = 'flex-start';

    modalCloseBtn.style.display = 'flex';
    modalCloseBtn.style.justifyContent = 'flex-end';
    modalCloseBtn.style.cursor = 'pointer';
    modalCloseBtn.style.fontSize = '2rem';
    modalCloseBtn.style.fontWeight = 'bold';
    modalCloseBtn.style.cursor = 'pointer';
    modalCloseBtn.style.lineHeight = '10px';

    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.background = 'rgba(0, 0, 0, 0.7)';
    modal.style.backdropFilter = 'blur(5px)';
    modal.style.zIndex = '1000';

    const modalContent = document.querySelector(
      '.modal-content'
    ) as HTMLElement;
    if (modalContent) {
      modalContent.style.background = 'white';
      modalContent.style.color = 'black';
      modalContent.style.padding = '20px';
      modalContent.style.borderRadius = '8px';
      modalContent.style.maxWidth = '1000px';
      modalContent.style.width = '100%';
      modalContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
      modalContent.style.textAlign = 'center';
      modalContent.style.transform = 'translateY(20px)';
      modalContent.style.transition = 'transform 0.3s ease-out';

      setTimeout(() => {
        modalContent.style.transform = 'translateY(0)';
      }, 50);
    }

    modal.classList.remove('hidden');

    const closeModal = document.getElementById('close-modal');
    closeModal?.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }
}

(function () {
  if (!(window as any).fetchDataCalled) {
    (window as any).fetchDataCalled = true;
    fetchData();
  }
})();
