const apiUrl = "/api/cameras"; // Flask backend

let cameras = [];
let multiSelectMode = false;
let selectedCameras = [];
let camerasHidden = false;

// ---------------- MAP INIT ----------------
const map = L.map('map').setView([44.0, -74.9481], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

const markersLayer = L.layerGroup().addTo(map);

// ---------------- RADAR SETUP (OPTION 2 – PRELOADED) ----------------
const radarUrls = [
  "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png",
  "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-m05m/{z}/{x}/{y}.png",
  "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-m10m/{z}/{x}/{y}.png",
  "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-m15m/{z}/{x}/{y}.png",
  "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-m20m/{z}/{x}/{y}.png",
  "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-m25m/{z}/{x}/{y}.png",
  "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-m30m/{z}/{x}/{y}.png",
  "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-m35m/{z}/{x}/{y}.png",
  "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-m40m/{z}/{x}/{y}.png"
];

// Create ALL radar layers once (no flashing)
const radarLayers = radarUrls.map((url, idx) =>
  L.tileLayer(url, {
    opacity: idx === 0 ? 0.7 : 0,
    keepBuffer: 4,
    updateWhenIdle: false,
    updateWhenZooming: false,
    zIndex: 400
  }).addTo(map)
);

// ---------------- SLIDER ----------------
const slider = document.getElementById('radarSlider');
const radarLabel = document.getElementById('radarTimeLabel');

slider.addEventListener('input', () => {
  const val = parseInt(slider.value);

  radarLayers.forEach((layer, idx) => {
    layer.setOpacity(idx === val ? 0.7 : 0);
  });

  radarLabel.innerText = val === 0 ? 'Current' : `-${val * 5} min`;
});

// ---------------- CLICK ANYWHERE → ENABLE KEYBOARD ----------------
document.body.setAttribute("tabindex", "0");

document.addEventListener("click", () => {
  document.body.focus();
});

// ---------------- KEYBOARD RADAR CONTROL ----------------
document.addEventListener("keydown", (e) => {
    let val = parseInt(slider.value);
  
    // LEFT = newer (toward current)
    if (e.key === "ArrowLeft") {
      val = Math.max(val - 1, 0);
    }
  
    // RIGHT = older (back in time)
    else if (e.key === "ArrowRight") {
      val = Math.min(val + 1, radarLayers.length - 1);
    }
  
    else {
      return;
    }
  
    slider.value = val;
  
    radarLayers.forEach((layer, idx) => {
      layer.setOpacity(idx === val ? 0.7 : 0);
    });
  
    radarLabel.innerText = val === 0 ? 'Current' : `-${val * 5} min`;
  });
  

// ---------------- FETCH CAMERAS ----------------
fetch(apiUrl)
  .then(res => res.json())
  .then(data => {
    const northern = data.filter(c => c.VideoUrl && c.Latitude >= 41.5);
    const southern = data.filter(c => c.VideoUrl && c.Latitude < 41.5);
    cameras = northern.concat(southern);
    shuffleArray(cameras);
    cameras.forEach(addMarker);
  })
  .catch(err => console.error(err));

// ---------------- UTILITIES ----------------
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ---------------- MARKERS ----------------
function addMarker(camera) {
  const index = cameras.indexOf(camera) + 1;

  const icon = L.divIcon({
    className: "camera-marker",
    html: index,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  const marker = L.marker(
    [camera.Latitude, camera.Longitude],
    { icon }
  ).addTo(markersLayer);

  marker.on('click', () => {
    if (multiSelectMode) {
      toggleSelection(marker, camera);
    } else {
      showSingleCam(camera);
    }
  });

  camera._marker = marker;
}

// ---------------- MULTI SELECT ----------------
function toggleSelection(marker, camera) {
  const idx = selectedCameras.indexOf(camera);

  if (idx === -1) {
    selectedCameras.push(camera);
    marker._icon.classList.add('selected');
  } else {
    selectedCameras.splice(idx, 1);
    marker._icon.classList.remove('selected');
  }

  document.getElementById('showSelectedBtn').style.display =
    selectedCameras.length ? 'block' : 'none';
}

// ---------------- VIDEO PANEL ----------------
function showVideoPanel(camerasToShow) {
  document.getElementById('singleCamPopup').style.display = 'none';

  const panel = document.getElementById('videoPanel');
  const grid = document.getElementById('videoGrid');
  grid.innerHTML = '';

  const cols = Math.ceil(Math.sqrt(camerasToShow.length));
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  camerasToShow.forEach(c => {
    const vid = document.createElement('video');
    vid.controls = true;
    vid.autoplay = true;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(c.VideoUrl);
      hls.attachMedia(vid);
    } else {
      vid.src = c.VideoUrl;
    }

    grid.appendChild(vid);
  });

  panel.style.display = 'block';
  document.getElementById('exitFullscreenBtn').style.display = 'block';
}

// ---------------- SINGLE CAM ----------------
function showSingleCam(camera) {
  const popup = document.getElementById('singleCamPopup');
  const vid = document.getElementById('singleCamVideo');

  vid.pause();
  vid.src = '';

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(camera.VideoUrl);
    hls.attachMedia(vid);
  } else {
    vid.src = camera.VideoUrl;
  }

  popup.style.display = 'block';
  vid.onclick = () => showVideoPanel([camera]);
}

// ---------------- UI CONTROLS ----------------
document.getElementById('exitFullscreenBtn').addEventListener('click', () => {
  document.querySelectorAll('#videoPanel video').forEach(v => {
    v.pause();
    v.src = '';
  });
  document.getElementById('videoPanel').style.display = 'none';
  document.getElementById('exitFullscreenBtn').style.display = 'none';
});

document.getElementById('multiSelectBtn').addEventListener('click', () => {
  multiSelectMode = !multiSelectMode;
  selectedCameras = [];

  cameras.forEach(c => {
    if (c._marker?._icon) c._marker._icon.classList.remove('selected');
  });

  document.getElementById('cancelMultiBtn').style.display =
    multiSelectMode ? 'block' : 'none';

  document.getElementById('multiSelectBtn').innerText =
    multiSelectMode ? 'Multi-Select ON' : 'Select Multiple Cameras';
});

document.getElementById('showSelectedBtn').addEventListener('click', () => {
  if (selectedCameras.length) showVideoPanel(selectedCameras);
});

document.getElementById('cancelMultiBtn').addEventListener('click', () => {
  multiSelectMode = false;
  selectedCameras = [];

  cameras.forEach(c => {
    if (c._marker?._icon) c._marker._icon.classList.remove('selected');
  });

  document.getElementById('showSelectedBtn').style.display = 'none';
  document.getElementById('cancelMultiBtn').style.display = 'none';
  document.getElementById('multiSelectBtn').innerText = 'Select Multiple Cameras';
});

document.getElementById('hideCamerasBtn').addEventListener('click', () => {
  if (camerasHidden) {
    cameras.forEach(addMarker); // Re-add all markers to the map
    camerasHidden = false;
    console.log('All cameras shown');
  } else {
    markersLayer.clearLayers(); // Remove all markers from the map
    camerasHidden = true;
    console.log('All cameras hidden');
  }
});
