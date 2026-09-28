import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const redIcon = new L.DivIcon({
    html: `<div style="background-color: #EF4444; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
           </div>`,
    className: 'custom-bin-icon-red',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
});

const greenIcon = new L.DivIcon({
    html: `<div style="background-color: #10B981; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
           </div>`,
    className: 'custom-bin-icon-green',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
});

const truckIcon = new L.DivIcon({
    html: `<div style="background-color: #4F46E5; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
           </div>`,
    className: 'custom-truck-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
});

// View Controller to handle dynamic centering and zooming
const MapViewUpdater = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom || map.getZoom());
        }
    }, [center, zoom, map]);
    return null;
};

const MapComponent = ({ bins, trucks, onMapClick, selectedLocation, center, zoom, route, layoutMode, hotspots = [], predictionMode = false, festivals = [] }) => {
    // Default to Thane if no center provided
    const mapCenter = center || [19.2183, 72.9781];

    const MapController = () => {
        const map = useMapEvents({
            click(e) {
                if (onMapClick) onMapClick(e.latlng);
            },
        });
        useEffect(() => {
            if (map) {
                const timeout = setTimeout(() => {
                    map.invalidateSize();
                }, 400); 
                return () => clearTimeout(timeout);
            }
        }, [map, layoutMode]);

        return null;
    };

    return (
        <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} className="h-full w-full rounded-lg show-map z-0">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapViewUpdater center={center} />
            <MapController />

            {selectedLocation && (
                <Marker position={selectedLocation}>
                    <Popup>Selected Location: <br /> {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}</Popup>
                </Marker>
            )}

            {/* Optimized Route Polyline */}
            {route && route.length > 0 && (
                <Polyline
                    positions={route.map(pos => 
                        Array.isArray(pos) ? [pos[0], pos[1]] : [pos.lat, pos.lng]
                    )}
                    color="#4F46E5"
                    weight={5}
                    opacity={0.8}
                />
            )}

            {/* PREDICTIVE HEATMAP OVERLAY */}
            {predictionMode && hotspots.map((spot, idx) => {
                const isNearFestival = festivals.some(f => f.name && spot.hierarchy?.neighborhood);
                return (
                    <Circle
                        key={`hotspot-${idx}`}
                        center={[spot.location.coordinates[1], spot.location.coordinates[0]]}
                        radius={spot.metadata?.radius || 500}
                        pathOptions={{
                            fillColor: isNearFestival ? '#EF4444' : '#F59E0B',
                            color: isNearFestival ? '#B91C1C' : '#D97706',
                            weight: 1,
                            opacity: 0.5,
                            fillOpacity: 0.3,
                            className: isNearFestival ? 'animate-pulse' : ''
                        }}
                    >
                        <Popup>
                            <div className="p-2">
                                <p className="text-[10px] font-black uppercase text-amber-600 mb-1">High-Risk Prediction</p>
                                <p className="text-xs font-bold">{spot.hierarchy?.neighborhood}</p>
                                <p className="text-[9px] opacity-70">Sector: {spot.metadata?.type}</p>
                            </div>
                        </Popup>
                    </Circle>
                );
            })}

            {/* Bins */}
            {bins && bins.map(bin => (
                <Marker
                    key={bin._id}
                    position={[bin.location.lat, bin.location.lng]}
                    icon={bin.status === 'overflowing' || bin.status === 'full' ? redIcon : greenIcon}
                >
                    <Popup>
                        <div className="font-sans min-w-[150px]">
                            <h3 className="font-bold border-b pb-1 mb-2">{bin.type} Bin</h3>
                            <p className="text-sm text-gray-600 mb-1">{bin.address || "Collection Point"}</p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs font-bold text-gray-500 uppercase">Status</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${bin.status === 'empty' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {bin.status}
                                </span>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Trucks */}
            {trucks && trucks.map(truck => (
                <Marker
                    key={truck.id || truck._id}
                    position={[truck.lat, truck.lng]}
                    icon={truckIcon}
                >
                    <Popup>
                        <div className="font-sans">
                            <h3 className="font-bold text-indigo-700">Truck {truck.plate}</h3>
                            <p className="text-sm">Driver: {truck.driver}</p>
                            <p className="text-xs text-gray-500 mt-1">Status: Active</p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapComponent;

