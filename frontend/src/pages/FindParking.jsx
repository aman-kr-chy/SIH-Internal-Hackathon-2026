import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Star, Navigation } from 'lucide-react';
import api from '../services/api';

// Fix leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A component to recenter map when location changes
const RecenterAutomatically = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], 18, {
        duration: 1.5
      });
    }
  }, [center, map]);
  return null;
}

const FindParking = () => {
  const navigate = useNavigate();
  const [parkingLots, setParkingLots] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [userLoc, setUserLoc] = useState({ lat: 22.2882, lng: 73.3644 }); // Default Parul University
  const [mapCenter, setMapCenter] = useState({ lat: 22.2882, lng: 73.3644 });
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLoc(loc);
          setMapCenter(loc);
          fetchData(loc.lat, loc.lng);
        },
        (error) => {
          console.warn('Geolocation denied or failed. Using default location.');
          fetchData(userLoc.lat, userLoc.lng);
        }
      );
    } else {
      fetchData(userLoc.lat, userLoc.lng);
    }
  }, []);

  const fetchData = async (lat, lng) => {
    try {
      const [lotsRes, recRes, membershipRes] = await Promise.all([
        api.get('/parking'),
        api.post('/recommendations', { userLat: lat, userLng: lng }),
        api.get('/memberships/my').catch(() => ({ data: { active: false } }))
      ]);
      setParkingLots(lotsRes.data);
      setRecommendations(recRes.data);
      if (membershipRes.data.active) {
        setMembership(membershipRes.data.membership);
      }
    } catch (error) {
      console.error('Error fetching parking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowOnMap = (lat, lng) => {
    setMapCenter({ lat, lng });
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading map and parking locations...</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-4rem)] -mb-8 -mr-8 md:pr-4">
      {/* Sidebar: Recommendations */}
      <div className="w-full md:w-1/3 flex flex-col space-y-4 overflow-y-auto overflow-x-hidden pr-2 pb-8">
        <h2 className="text-xl font-bold text-gray-900">Recommended for you</h2>
        {recommendations.length === 0 ? (
          <p className="text-gray-500 bg-white p-4 rounded-lg shadow-sm">No recommendations available.</p>
        ) : (
          recommendations.map((lot, idx) => (
            <div key={lot._id} className={`bg-white p-4 rounded-xl shadow-sm border ${idx === 0 ? 'border-yellow-400 border-2 relative' : 'border-gray-100'}`}>
              {idx === 0 && (
                <div className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center">
                  <Star className="w-3 h-3 mr-1" /> BEST MATCH
                </div>
              )}
              <h3 className="font-bold text-lg text-gray-900">{lot.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{lot.address}</p>
              
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-gray-500 text-xs">Available</div>
                  <div className="font-semibold text-green-600">{lot.availableSlots} / {lot.totalSlots}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-gray-500 text-xs">Price</div>
                  <div className="font-semibold text-gray-900">{membership ? <span className="text-green-600 text-xs">Covered by Pass</span> : `₹${lot.pricePerHour}/hr`}</div>
                </div>
              </div>

              <div className="flex flex-wrap lg:flex-nowrap gap-2">
                <button 
                  onClick={() => handleShowOnMap(lot.latitude || 22.2882, lot.longitude || 73.3644)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors flex justify-center items-center gap-1 text-sm"
                >
                  <Navigation size={16} /> Show on Map
                </button>
                <button 
                  onClick={() => navigate(`/parking/${lot._id}`)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors text-sm"
                >
                  View Slots
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Map Area */}
      <div className="w-full md:w-2/3 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 relative z-0 min-h-[400px]">
        <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={17} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <RecenterAutomatically center={mapCenter} />

          {/* User Location Marker */}
          <Marker position={[userLoc.lat, userLoc.lng]}>
            <Popup>
              <div className="font-bold">Your Location</div>
            </Popup>
          </Marker>

          {/* Parking Lots Markers */}
          {parkingLots.filter(lot => lot.latitude && lot.longitude).map((lot) => {
            const redIcon = new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            });
            
            return (
              <Marker key={lot._id} position={[lot.latitude, lot.longitude]} icon={redIcon}>
                <Popup>
                <div className="text-center p-1">
                  <h4 className="font-bold text-gray-900">{lot.name}</h4>
                  <p className="text-sm text-green-600 font-semibold my-1">{lot.availableSlots} slots available</p>
                  <p className="text-xs text-gray-500 mb-2">{membership ? <span className="text-green-600 font-bold">Covered by Pass</span> : `₹${lot.pricePerHour}/hr`}</p>
                  <div className="flex gap-2 mt-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lot.latitude},${lot.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-100 text-gray-700 text-xs px-2 py-1.5 rounded hover:bg-gray-200 flex-1 flex justify-center items-center gap-1 border border-gray-200"
                    >
                      <Navigation size={12} /> Navigate
                    </a>
                    <button 
                      onClick={() => navigate(`/parking/${lot._id}`)}
                      className="bg-blue-600 text-white text-xs px-2 py-1.5 rounded hover:bg-blue-700 flex-1"
                    >
                      Reserve
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default FindParking;
