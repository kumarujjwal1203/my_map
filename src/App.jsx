import { useEffect, useRef, useState } from "react";
import esriConfig from "@arcgis/core/config";
import "@arcgis/map-components/components/arcgis-map";

function App() {
  const mapRef = useRef(null);
  const [view, setView] = useState(null);
  const [startExtent, setStartExtent] = useState(null);
  const [panOn, setPanOn] = useState(false);

  esriConfig.apiKey = import.meta.env.VITE_ARCGIS_API_KEY;

  useEffect(() => {
    const map = mapRef.current;

    const mapReady = () => {
      setView(map.view);
      setStartExtent(map.view.extent.clone());
    };

    map.addEventListener("arcgisViewReadyChange", mapReady);
    return () => map.removeEventListener("arcgisViewReadyChange", mapReady);
  }, []);

  useEffect(() => {
    if (!view) return;

    const handle = view.on("drag", (event) => {
      if (!panOn) event.stopPropagation();
    });

    return () => handle.remove();
  }, [view, panOn]);

  return (
    <div>
      <center>
        <button onClick={() => setPanOn(!panOn)}>
          {panOn ? "Pan: ON" : "Pan: OFF"}
        </button>
        <button onClick={() => view.goTo({ zoom: view.zoom + 1 })}>+</button>
        <button onClick={() => view.goTo({ zoom: view.zoom - 1 })}>-</button>
        <button onClick={() => view.goTo(startExtent)}>Full Extent</button>
      </center>

      <arcgis-map
        ref={mapRef}
        basemap="arcgis/navigation"
        center="-10, 30"
        zoom="1"
        attribution={false}
        style={{ height: "calc(100vh - 40px)", display: "block" }}
      />
    </div>
  );
}

export default App;