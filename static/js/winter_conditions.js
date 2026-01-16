const winterConditionsLayer = L.layerGroup();
let winterConditionsVisible = false;

// Create a legend element but keep it hidden initially
const legend = L.control({ position: 'topright' });
legend.onAdd = function (map) {
  const div = L.DomUtil.create('div', 'info legend');
  div.innerHTML = `
    <strong>Winter Road Conditions</strong><br>
    <i style="background: blue; width: 12px; height: 12px; display: inline-block;"></i> Snow / Ice<br>
    <i style="background: tan; width: 12px; height: 12px; display: inline-block;"></i> Generally Clear & Dry<br>
    <i style="background: green; width: 12px; height: 12px; display: inline-block;"></i> Wet<br>
    <i style="background: gray; width: 12px; height: 12px; display: inline-block;"></i> Unknown
  `;
  div.style.padding = "6px";
  div.style.backgroundColor = "white";
  div.style.border = "1px solid #ccc";
  div.style.borderRadius = "4px";
  div.style.boxShadow = "0 0 5px rgba(0,0,0,0.3)";
  return div;
};

async function toggleWinterConditions(map) {
  if (winterConditionsVisible) {
    winterConditionsLayer.clearLayers();
    winterConditionsVisible = false;
    // Remove legend when layer is hidden
    legend.remove();
  } else {
    try {
      const response = await fetch("/api/winter-road-conditions");
      if (!response.ok) throw new Error("Failed to fetch winter road conditions");
      const data = await response.json();
      data.forEach(condition => {
        if (condition.Polyline) {
          const decodedPolyline = polyline.decode(condition.Polyline);
          let color;
          switch (condition.Condition) {
            case "Snow / Ice":
              color = "blue";
              break;
            case "Generally Clear & Dry":
              color = "tan";
              break;
            case "Wet":
              color = "green";
              break;
            default:
              color = "gray";
          }
          L.polyline(decodedPolyline, { color }).addTo(winterConditionsLayer);
        }
      });
      winterConditionsLayer.addTo(map);
      legend.addTo(map); // Show legend when layer is added
      winterConditionsVisible = true;
    } catch (error) {
      console.error("Error loading winter road conditions:", error);
    }
  }
}

document.getElementById("toggleWinterConditionsBtn").addEventListener("click", () => {
  toggleWinterConditions(map);
});
