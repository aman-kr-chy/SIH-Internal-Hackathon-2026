import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Star } from 'lucide-react';

const ParkingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();
  
  const [lot, setLot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Checkout states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState(user?.email || '');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutDuration, setCheckoutDuration] = useState(60); // in minutes
  
  // Dummy vehicle for reservation, ideally should be fetched from user's vehicles
  const dummyVehicleId = '64e8e899b8d2b7a8a1111111'; // Will be handled better if we implement vehicle CRUD

  useEffect(() => {
    fetchParkingDetails();
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    socket.on('parkingStatusUpdated', (data) => {
      if (data.parkingId === id) {
        setSlots(prevSlots => prevSlots.map(slot => 
          slot._id === data.slotId ? { ...slot, status: data.newStatus } : slot
        ));
        
        // Also update lot total availability roughly
        if (data.newStatus === 'AVAILABLE' && data.oldStatus !== 'AVAILABLE') {
          setLot(prev => prev ? { ...prev, availableSlots: prev.availableSlots + 1 } : prev);
        } else if (data.newStatus !== 'AVAILABLE' && data.oldStatus === 'AVAILABLE') {
          setLot(prev => prev ? { ...prev, availableSlots: prev.availableSlots - 1 } : prev);
        }
      }
    });

    return () => {
      socket.off('parkingStatusUpdated');
    };
  }, [socket, id]);

  const [membership, setMembership] = useState(null);

  const fetchParkingDetails = async () => {
    try {
      const [lotRes, slotsRes, membershipRes] = await Promise.all([
        api.get(`/parking/${id}`),
        api.get(`/slots/${id}`),
        api.get('/memberships/my').catch(() => ({ data: { active: false } }))
      ]);
      setLot(lotRes.data);
      setSlots(slotsRes.data);
      if (membershipRes.data.active) {
        setMembership(membershipRes.data.membership);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const playSuccessSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      
      const playTone = (freq, startTime, duration, vol) => {
        // Main body of the chime (Sine wave)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.frequency.setValueAtTime(freq, startTime);
        gain1.gain.setValueAtTime(0, startTime);
        gain1.gain.linearRampToValueAtTime(vol, startTime + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc1.start(startTime);
        osc1.stop(startTime + duration);

        // Metallic strike overtone (Triangle wave, one octave higher)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.setValueAtTime(freq * 2, startTime);
        gain2.gain.setValueAtTime(0, startTime);
        gain2.gain.linearRampToValueAtTime(vol * 0.3, startTime + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.001, startTime + (duration * 0.4));
        osc2.start(startTime);
        osc2.stop(startTime + (duration * 0.4));
      };

      const now = ctx.currentTime;
      
      // Fast, rich major arpeggio (like PhonePe transaction success)
      playTone(1046.50, now, 0.2, 0.15);         // C6
      playTone(1318.51, now + 0.08, 0.2, 0.15);  // E6
      playTone(1567.98, now + 0.16, 0.2, 0.15);  // G6
      playTone(2093.00, now + 0.24, 0.8, 0.25);  // C7 (final lingering note)
      
    } catch (e) {
      console.log('Audio not supported', e);
    }
  };

  const handleReserve = async () => {
    if (!selectedSlot) return;
    setReservationLoading(true);
    setError('');

    try {
      // Create a dummy vehicle if it doesn't exist just to satisfy the schema
      // In a real app, user selects their registered vehicle
      
      const payload = {
        parkingLotId: id,
        slotId: selectedSlot._id,
        vehicleId: dummyVehicleId, 
        startTime: new Date(),
        duration: checkoutDuration,
        email: checkoutEmail,
        phone: checkoutPhone
      };

      await api.post('/reservations', payload);
      playSuccessSound();
      setPaymentSuccess(true);
      
      // Show success screen for 4 seconds then redirect
      setTimeout(() => {
        setShowPaymentModal(false);
        setSelectedSlot(null);
        setPaymentSuccess(false);
        navigate('/dashboard');
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reserve slot');
    } finally {
      setReservationLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading parking details...</div>;
  if (!lot) return <div className="p-8 text-center">Parking lot not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{lot.name}</h1>
          <p className="text-gray-500 mt-1">{lot.address}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">₹{lot.pricePerHour}/hr</div>
          <p className="text-sm text-green-600 font-medium mt-1">{lot.availableSlots} Slots Available</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Select a Slot</h2>
          <div className="flex gap-4 text-sm flex-wrap">
            <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div> Available</div>
            <div className="flex items-center text-yellow-600 font-medium"><Star size={14} className="mr-1 fill-yellow-400" /> Premium</div>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
          {slots.map(slot => {
            let bgClass = 'bg-gray-100';
            if (slot.status === 'AVAILABLE') bgClass = 'bg-green-100 hover:bg-green-200 cursor-pointer border-green-300';
            if (slot.status === 'OCCUPIED') bgClass = 'bg-gray-200 border-gray-300 cursor-not-allowed opacity-60';
            if (slot.status === 'RESERVED') bgClass = 'bg-gray-200 border-gray-300 cursor-not-allowed opacity-60';
            
            const isPremium = slot.type === 'premium';
            const isSelected = selectedSlot?._id === slot._id;

            return (
              <div 
                key={slot._id}
                onClick={() => slot.status === 'AVAILABLE' && setSelectedSlot(slot)}
                className={`p-3 rounded-lg border-2 text-center transition-all relative ${bgClass} ${isPremium ? 'border-yellow-400 shadow-sm' : ''} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
              >
                {isPremium && (
                  <div className="absolute -top-2 -right-2 bg-yellow-100 rounded-full p-0.5 border border-yellow-400">
                    <Star size={12} className="text-yellow-600 fill-yellow-400" />
                  </div>
                )}
                <div className="font-bold text-gray-700">{slot.slotNumber}</div>
              </div>
            );
          })}
        </div>

        {selectedSlot && (
          <div className="mt-8 border-t pt-6 flex flex-col md:flex-row items-center justify-between">
            <div>
              <p className="text-gray-600">Selected Slot: <span className="font-bold text-gray-900">{selectedSlot.slotNumber} {selectedSlot.type === 'premium' && '(Premium)'}</span></p>
              {!membership && (
                <p className="text-sm text-gray-500">
                  Base Price: ₹{selectedSlot.type === 'premium' ? lot.pricePerHour + 10 : lot.pricePerHour}/hr
                </p>
              )}
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-8 rounded-lg transition-colors"
            >
              Reserve Slot
            </button>
          </div>
        )}
      </div>

      {/* Payment Checkout Modal */}
      {showPaymentModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            {!paymentSuccess && (
              <div className="bg-blue-600 p-4 text-white">
                <h3 className="text-xl font-bold">Secure Checkout</h3>
                <p className="text-blue-100 text-sm">Complete your parking reservation</p>
              </div>
            )}
            
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}
            
            {paymentSuccess ? (
              <div className="p-10 flex flex-col items-center justify-center text-center bg-[#10b981] h-[450px]">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-green-900/50 scale-in-center">
                  <svg className="w-12 h-12 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" strokeDasharray="50" strokeDashoffset="50" className="animate-[dash_0.5s_ease-out_0.2s_forwards]"></path>
                  </svg>
                </div>
                
                <div className="text-white fade-in-up">
                  <p className="text-lg font-medium opacity-90 mb-1">{membership ? 'Reserved Successfully at' : 'Paid Successfully to'}</p>
                  <h3 className="text-3xl font-bold mb-4">Parul Smart Parking</h3>
                  <div className="text-5xl font-black mb-8 flex justify-center items-baseline gap-1">
                     {membership ? (
                       <span className="text-3xl">Covered by Pass</span>
                     ) : (
                       <>
                         <span className="text-3xl">₹</span>
                         {((1 + ((checkoutDuration / 60) - 1) * 0.5) * (selectedSlot.type === 'premium' ? lot.pricePerHour + 10 : lot.pricePerHour)).toFixed(2)}
                       </>
                     )}
                  </div>
                </div>
                
                <div className="w-full flex flex-col justify-between px-4 text-green-100 text-sm border-t border-white/20 pt-4 fade-in-up delay-300">
                   <div className="flex justify-between mb-4">
                     <span className="font-medium">Slot: {selectedSlot.slotNumber}</span>
                     <span className="flex items-center gap-2">
                       <div className="w-3 h-3 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></div>
                       Redirecting...
                     </span>
                   </div>
                   <a
                     href={lot.latitude && lot.longitude 
                       ? `https://www.google.com/maps/dir/?api=1&destination=${lot.latitude},${lot.longitude}`
                       : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lot.address || lot.name)}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="bg-white text-green-700 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-green-50 transition-colors mx-auto w-full shadow-md"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                     Navigate to Parking Lot
                   </a>
                </div>

                <style>{`
                  @keyframes dash {
                    to { stroke-dashoffset: 0; }
                  }
                  .scale-in-center {
                    animation: scale-in-center 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
                  }
                  @keyframes scale-in-center {
                    0% { transform: scale(0); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                  }
                  .fade-in-up {
                    animation: fade-in-up 0.6s ease-out 0.4s both;
                  }
                  .delay-300 {
                    animation-delay: 0.8s;
                  }
                  @keyframes fade-in-up {
                    0% { transform: translateY(10px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                  }
                `}</style>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-semibold text-gray-900">{lot.name}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Selected Slot:</span>
                    <span className="font-semibold text-gray-900">{selectedSlot.slotNumber} {selectedSlot.type === 'premium' && '⭐'}</span>
                  </div>
                  <div className="flex justify-between mb-2 items-center">
                    <span className="text-gray-600">Duration:</span>
                    <select 
                      value={checkoutDuration} 
                      onChange={(e) => setCheckoutDuration(Number(e.target.value))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {[...Array(12)].map((_, i) => (
                        <option key={i+1} value={(i+1)*60}>{i+1} Hour{i > 0 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  {!membership && (
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg items-center">
                      <span>Total Amount:</span>
                      <span className="text-blue-600">
                        ₹{((1 + ((checkoutDuration / 60) - 1) * 0.5) * (selectedSlot.type === 'premium' ? lot.pricePerHour + 10 : lot.pricePerHour)).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {membership && (
                    <div className="border-t pt-2 mt-2 flex justify-center font-bold text-lg items-center">
                      <span className="text-green-600">✓ Covered by Commuter Pass</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email for Receipt</label>
                  <input
                    type="email"
                    value={checkoutEmail}
                    onChange={(e) => setCheckoutEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={checkoutPhone}
                    onChange={(e) => {
                      // Only allow numbers and limit to 10 digits
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setCheckoutPhone(val);
                    }}
                    maxLength="10"
                    pattern="[0-9]{10}"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter 10-digit mobile number"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReserve}
                    disabled={reservationLoading || !checkoutEmail || checkoutPhone.length !== 10}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
                  >
                    {reservationLoading ? 'Processing...' : (membership ? 'Confirm Booking' : 'Pay Now')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParkingDetails;
