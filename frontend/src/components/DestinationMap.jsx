import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);
  return null;
};

const DestinationMap = ({ latitude, longitude, name }) => {
  if (latitude == null || longitude == null || isNaN(latitude) || isNaN(longitude)) {
    return (
      <div style={styles.fallbackContainer}>
        <span style={{ fontSize: "32px", marginBottom: "8px" }}>🗺️</span>
        <p style={styles.fallbackText}>Location coordinates not available for map display</p>
      </div>
    );
  }

  const position = [latitude, longitude];

  return (
    <div style={styles.mapWrapper}>
      <MapContainer
        center={position}
        zoom={12}
        scrollWheelZoom={true}
        style={styles.mapContainer}
      >
        <MapRecenter center={position} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <div style={styles.popupContent}>
              <strong style={{ fontSize: "14px", color: "#0f172a" }}>{name}</strong>
              <br />
              <span style={{ fontSize: "12px", color: "#475569" }}>
                {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
              </span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

const styles = {
  mapWrapper: {
    width: "100%",
    height: "350px",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    position: "relative",
    zIndex: 1,
  },
  mapContainer: {
    width: "100%",
    height: "100%",
  },
  fallbackContainer: {
    padding: "40px 20px",
    background: "rgba(255, 255, 255, 0.03)",
    borderRadius: "12px",
    textAlign: "center",
    border: "1px dashed rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    color: "#94a3b8",
    fontSize: "14px",
  },
  popupContent: {
    padding: "4px",
    lineHeight: "1.4",
  },
};

export default DestinationMap;
