import L from "leaflet";
import { useCallback, useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import PixiOverlay from "./wrapper/PixiOverlay";

const generateMarkers = (count: number) => {
  const southWest = new L.LatLng(-6.5, 106);
  const northEast = new L.LatLng(-6, 107);
  const bounds = new L.LatLngBounds(southWest, northEast);

  const minLat = bounds.getSouthWest().lat,
    rangeLng = bounds.getNorthEast().lat - minLat,
    minLng = bounds.getSouthWest().lng,
    rangeLat = bounds.getNorthEast().lng - minLng;

  const result = Array.from({ length: count }, (_v, k) => {
    return {
      id: k,
      pos: new L.LatLng(
        minLat + Math.random() * rangeLng,
        minLng + Math.random() * rangeLat,
      ),
    };
  });
  return result;
};

function App() {
  const [poppedUpMarkerId, setPoppedUpMarkerId] = useState<
    number | string | undefined
  >(undefined);
  const randomMarkers = useMemo(() => generateMarkers(15000), []);
  const handleMarkerClick = useCallback(
    (id: number | string) => setPoppedUpMarkerId(id),
    [],
  );

  return (
    <MapContainer
      center={[-6.1592, 106.8456]}
      zoom={13}
      scrollWheelZoom={false}
      className="full-height"
      minZoom={1}
      maxZoom={18}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <PixiOverlay
        markers={randomMarkers.map((marker) => ({
          id: marker.id,
          iconId: "bluebird-arrow",
          position: marker.pos,
          popup: `this is a popup`,
          tooltip: `${marker.pos.lat},${marker.pos.lng}`,
          popupOpen: poppedUpMarkerId === marker.id,
        }))}
        onMarkerClick={handleMarkerClick}
      />
    </MapContainer>
  );
}

export default App;
