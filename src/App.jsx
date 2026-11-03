import { useEffect, useRef, useState } from "react";
import esriConfig from "@arcgis/core/config";
import Basemap from "@arcgis/core/Basemap";
import OpenStreetMapLayer from "@arcgis/core/layers/OpenStreetMapLayer";
import esriId from "@arcgis/core/identity/IdentityManager";
import "@arcgis/map-components/components/arcgis-map";
import "./App.css";

// Prevent automated "Sign in to access the item on ArcGIS Online" popup dialog
esriId.getCredential = () => Promise.reject(new Error("Anonymous session"));

const apiKey = import.meta.env.VITE_ARCGIS_API_KEY;
if (apiKey) {
  esriConfig.apiKey = apiKey;
}

function App() {
  const mapRef = useRef(null);
  const [view, setView] = useState(null);
  const [startExtent, setStartExtent] = useState(null);
  const [panOn, setPanOn] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [basemapType, setBasemapType] = useState("osm");

  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    // Create free OpenStreetMap basemap that doesn't require any API key or login
    const osmLayer = new OpenStreetMapLayer();
    const osmBasemap = new Basemap({
      baseLayers: [osmLayer],
      title: "OpenStreetMap",
      id: "osm"
    });

    const mapReady = () => {
      const v = mapElement.view;
      setView(v);

      if (v?.extent) {
        setStartExtent(v.extent.clone());
      }

      // If API key is provided, use navigation basemap, otherwise use free OSM
      if (apiKey) {
        mapElement.map.basemap = "arcgis/navigation";
        setBasemapType("navigation");
      } else {
        mapElement.map.basemap = osmBasemap;
        setBasemapType("osm");
      }

      v.watch("zoom", (newZoom) => {
        if (newZoom !== undefined) {
          setCurrentZoom(Math.round(newZoom * 10) / 10);
        }
      });
    };

    mapElement.addEventListener("arcgisViewReadyChange", mapReady);
    return () => mapElement.removeEventListener("arcgisViewReadyChange", mapReady);
  }, []);

  useEffect(() => {
    if (!view) return;

    const handle = view.on("drag", (event) => {
      if (!panOn) {
        event.stopPropagation();
      }
    });

    return () => handle.remove();
  }, [view, panOn]);

  const handleBasemapChange = (type) => {
    if (!view?.map) return;
    setBasemapType(type);

    if (type === "osm") {
      const osmLayer = new OpenStreetMapLayer();
      view.map.basemap = new Basemap({
        baseLayers: [osmLayer],
        title: "OpenStreetMap",
        id: "osm"
      });
    } else {
      view.map.basemap = type;
    }
  };

  return (
    <div className="map-container">
      {/* Floating High-Visibility Header Controls */}
      <div className="controls-toolbar">
        {/* Pan toggle */}
        <button
          type="button"
          className={`btn ${panOn ? "btn-pan-on" : "btn-pan-off"}`}
          onClick={() => setPanOn(!panOn)}
          title="Toggle map dragging/panning"
        >
          {panOn ? "✋ Pan: ON" : "🔒 Pan: OFF"}
        </button>

        <div className="divider" />

        {/* Zoom controls */}
        <button
          type="button"
          className="btn btn-action btn-circle"
          onClick={() => {
            if (view) {
              view.goTo({ zoom: (view.zoom || 1) + 1 });
            }
          }}
          title="Zoom In"
        >
          +
        </button>
        <button
          type="button"
          className="btn btn-action btn-circle"
          onClick={() => {
            if (view) {
              view.goTo({ zoom: (view.zoom || 1) - 1 });
            }
          }}
          title="Zoom Out"
        >
          −
        </button>

        <div className="divider" />

        {/* Full extent */}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (view && startExtent) {
              view.goTo(startExtent);
            }
          }}
          title="Reset to Full Extent"
        >
          🌍 Full Extent
        </button>

        <div className="divider" />

        {/* Basemap Switcher */}
        <select
          className="select-basemap"
          value={basemapType}
          onChange={(e) => handleBasemapChange(e.target.value)}
          title="Switch Map Style"
        >
          <option value="osm">🗺️ OpenStreetMap</option>
          <option value="satellite">🛰️ Satellite</option>
          <option value="hybrid">🛰️ Hybrid</option>
          <option value="topo-vector">⛰️ Topographic</option>
          <option value="arcgis/navigation">🧭 Navigation</option>
        </select>
      </div>

      {/* Map Component */}
      <arcgis-map
        ref={mapRef}
        center="-10, 30"
        zoom="1"
        attribution={false}
      />

      {/* Status Bar */}
      <div className="status-badge">
        <span className="status-dot" />
        <span>Zoom: {currentZoom}</span>
        <span>•</span>
        <span>{panOn ? "Interactive" : "Map Locked"}</span>
      </div>
    </div>
  );
}

export default App;