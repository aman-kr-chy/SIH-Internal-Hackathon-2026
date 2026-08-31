import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { MapPin, Plus, X, Trash2 } from 'lucide-react';

const OperatorDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [parkingLots, setParkingLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [selectedPaymentSlot, setSelectedPaymentSlot] = useState(null);
  const [selectedExitSlot, setSelectedExitSlot] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [hours, setHours] = useState(1);
  const [newLot, setNewLot] = useState({ name: '', address: '', totalSlots: 50, pricePerHour: 20 });

  const fetchLots = async () => {
    try {
      const { data } = await api.get('/parking/my-lots');
      setParkingLots(data);
      if (data.length > 0) {
        handleLotSelect(data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  // Socket listener for realtime slot updates
  useEffect(() => {
    if (!socket) return;
    socket.on('parkingStatusUpdated', (data) => {
      if (selectedLot && data.parkingId === selectedLot._id) {
        setSlots(prev => prev.map(slot => 
          slot._id === data.slotId ? { ...slot, status: data.newStatus } : slot
        ));
      }
      
      // Update lot counters roughly
      setParkingLots(prevLots => prevLots.map(lot => {
        if (lot._id === data.parkingId) {
          let newAvailable = lot.availableSlots;
          if (data.newStatus === 'AVAILABLE' && data.oldStatus !== 'AVAILABLE') newAvailable++;
          else if (data.newStatus !== 'AVAILABLE' && data.oldStatus === 'AVAILABLE') newAvailable--;
          return { ...lot, availableSlots: newAvailable };
        }
        return lot;
      }));
    });

    return () => {
      socket.off('parkingStatusUpdated');
    };
  }, [socket, selectedLot]);

  const handleLotSelect = async (lotId) => {
    const lot = parkingLots.find(l => l._id === lotId) || await api.get(`/parking/${lotId}`).then(res => res.data);
    setSelectedLot(lot);
    const { data } = await api.get(`/slots/${lotId}`);
    setSlots(data);
  };

  const handleCreateLot = async (e) => {
    e.preventDefault();
    try {
      await api.post('/parking', newLot);
      setIsModalOpen(false);
      setNewLot({ name: '', address: '', totalSlots: 50, pricePerHour: 20 });
      fetchLots(); // Refresh list
    } catch (err) {
      console.error('Failed to create lot:', err);
    }
  };

  const handleDeleteLot = async (e, lotId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this parking zone? All associated slots will be lost.')) {
      try {
        await api.delete(`/parking/${lotId}`);
        // If we deleted the currently selected lot, clear the selection
        if (selectedLot && selectedLot._id === lotId) {
          setSelectedLot(null);
          setSlots([]);
        }
        fetchLots();
      } catch (err) {
        console.error('Failed to delete lot:', err);
        alert('Failed to delete parking zone.');
      }
    }
  };

  const handleSlotClick = async (slot) => {
    // Only Staff can book slots, Subscription Admins cannot
    if (user?.email !== 'operator1@smartparking.com') return;

    if (slot.status === 'RESERVED') {
       alert("This slot is already reserved by an app user.");
       return;
    }
    
    if (slot.status === 'AVAILABLE') {
       setSelectedPaymentSlot(slot);
       setPaymentModalOpen(true);
       return;
    }

    if (slot.status === 'OCCUPIED') {
       setSelectedExitSlot(slot);
       setExitModalOpen(true);
       return;
    }
  };

  const handleConfirmExit = async () => {
    try {
      await api.put(`/slots/${selectedExitSlot._id}`, { status: 'AVAILABLE' });
      // Update local state immediately for snappy UI
      setSlots(slots.map(s => s._id === selectedExitSlot._id ? { ...s, status: 'AVAILABLE' } : s));
      fetchLots(); // Refresh lot counts
      setExitModalOpen(false);
      setSelectedExitSlot(null);
    } catch (err) {
      console.error('Failed to update slot:', err);
      alert('Failed to process exit and update slot status.');
    }
  };

  const handleConfirmPayment = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      alert("Please fill in the customer's name, email, and phone number.");
      return;
    }

    if (hours < 1) {
      alert("Please enter a valid number of hours.");
      return;
    }

    try {
      const payload = { 
        status: 'OCCUPIED',
        customerName,
        customerEmail,
        customerPhone,
        hours,
        totalAmount: hours * (selectedLot?.pricePerHour || 0)
      };
      await api.put(`/slots/${selectedPaymentSlot._id}`, payload);
      setSlots(slots.map(s => s._id === selectedPaymentSlot._id ? { ...s, status: 'OCCUPIED' } : s));
      fetchLots(); 
      setPaymentModalOpen(false);
      setSelectedPaymentSlot(null);
      // Reset form
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setHours(1);
    } catch (err) {
      console.error('Failed to update slot:', err);
      alert('Failed to process payment and update slot status.');
    }
  };



  if (loading) return <div className="p-8 text-center text-gray-500">Loading Staff Dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.role === 'admin' ? 'Parking Zones (Live Status)' : (user?.email === 'operator1@smartparking.com' ? 'Staff Dashboard' : 'Subscription Admin Panel')}
        </h1>
        <p className="text-gray-600 mt-1">
          {user?.email === 'operator1@smartparking.com' 
            ? 'Monitor live parking slot availability and collect walk-in payments.' 
            : 'Manage your parking zones and view live statuses.'}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Side: Lot Selection */}
        <div className="w-full md:w-1/3 bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-[calc(100vh-12rem)] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-900 flex items-center"><MapPin size={18} className="mr-2" /> My Parking Zones</h2>
            {user?.email !== 'operator1@smartparking.com' && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-md flex items-center"
                title="Add Parking Zone"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            {parkingLots.length === 0 && (
              <div className="text-gray-500 text-sm italic p-4 text-center">
                You have no parking zones yet. Click + to add one.
              </div>
            )}
            {parkingLots.map(lot => (
              <div 
                key={lot._id}
                onClick={() => handleLotSelect(lot._id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedLot?._id === lot._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900">{lot.name}</h3>
                  {user?.email !== 'operator1@smartparking.com' && (
                    <button 
                      onClick={(e) => handleDeleteLot(e, lot._id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                      title="Delete Parking Zone"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-gray-500">Available:</span>
                  <span className={`font-bold ${lot.availableSlots > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {lot.availableSlots} / {lot.totalSlots}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Live Grid */}
        <div className="w-full md:w-2/3 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          {selectedLot ? (
            <>
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900">{selectedLot.name} - Live Status</h2>
                <div className="flex gap-4 text-sm font-medium">
                  <div className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-1.5"></span> Available</div>
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                {slots.map(slot => {
                  let bgClass = 'bg-gray-100 text-gray-500 cursor-not-allowed';
                  const isStaff = user?.email === 'operator1@smartparking.com';
                  
                  if (slot.status === 'AVAILABLE') {
                    bgClass = isStaff 
                      ? 'bg-green-100 border-green-400 text-green-800 cursor-pointer hover:bg-green-200'
                      : 'bg-green-100 border-green-400 text-green-800 cursor-default';
                  }
                  if (slot.status === 'OCCUPIED') {
                    bgClass = isStaff
                      ? 'bg-red-100 border-red-300 text-red-600 cursor-pointer hover:bg-red-200 opacity-90'
                      : 'bg-red-100 border-red-300 text-red-600 cursor-default opacity-90';
                  }
                  if (slot.status === 'RESERVED') {
                    bgClass = 'bg-gray-200 border-gray-300 text-gray-500 opacity-60 cursor-not-allowed';
                  }

                  return (
                    <div 
                      key={slot._id}
                      onClick={() => handleSlotClick(slot)}
                      className={`p-3 rounded-lg border-2 text-center shadow-sm transition-colors ${bgClass}`}
                    >
                      <div className="font-bold text-lg">{slot.slotNumber}</div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a parking lot from the left to view live slots.
            </div>
          )}
        </div>

      </div>

      {/* Add Zone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">Create New Parking Zone</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateLot} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                <input required type="text" value={newLot.name} onChange={e => setNewLot({...newLot, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Downtown Mall Basement" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input required type="text" value={newLot.address} onChange={e => setNewLot({...newLot, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Full Address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Slots</label>
                  <input required type="number" min="1" value={newLot.totalSlots} onChange={e => setNewLot({...newLot, totalSlots: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price/Hr (₹)</label>
                  <input required type="number" min="0" value={newLot.pricePerHour} onChange={e => setNewLot({...newLot, pricePerHour: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                Create Zone
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalOpen && selectedPaymentSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">Walk-in Booking</h2>
              <button onClick={() => setPaymentModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center mb-4">
                <div className="text-gray-500 text-sm">Slot Number</div>
                <div className="text-3xl font-bold text-gray-900">{selectedPaymentSlot.slotNumber}</div>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                <span className="text-gray-600 font-medium">Rate:</span>
                <span className="font-bold text-blue-600">₹{selectedLot?.pricePerHour}/hr</span>
              </div>
              
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Customer Name" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <input 
                  type="email" 
                  placeholder="Customer Email (for receipt)" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="Customer Phone" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 whitespace-nowrap">Hours:</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                <span className="font-bold text-gray-900">Total Amount:</span>
                <span className="text-xl font-bold text-blue-700">₹{hours * (selectedLot?.pricePerHour || 0)}</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'UPI', 'Card'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-3 text-sm font-medium rounded-lg border flex flex-col items-center gap-1 transition-colors ${paymentMethod === method ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleConfirmPayment}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold text-sm transition-colors flex justify-center items-center gap-2 cursor-pointer"
              >
                Confirm Payment & Book
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Modal */}
      {exitModalOpen && selectedExitSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">Vehicle Exit</h2>
              <button onClick={() => setExitModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center mb-4">
                <div className="text-gray-500 text-sm">Slot Number</div>
                <div className="text-3xl font-bold text-gray-900">{selectedExitSlot.slotNumber}</div>
              </div>
              <p className="text-gray-600 text-center text-sm">
                Confirm that the vehicle has left and this slot should be marked as available.
              </p>

              <button 
                onClick={handleConfirmExit}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-sm transition-colors flex justify-center items-center gap-2 cursor-pointer"
              >
                Confirm Exit & Free Slot
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OperatorDashboard;
