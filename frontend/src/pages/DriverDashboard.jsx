import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const DriverDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    nearbyLots: 0,
    availableSlots: 0,
    activeReservations: 0,
    currentSession: 'None'
  });
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionToCancel, setSessionToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [membership, setMembership] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // Fetch parking lots, reservations, and membership in parallel
      const [parkingRes, reservationsRes, membershipRes] = await Promise.all([
        api.get('/parking'),
        api.get('/reservations/my'),
        api.get('/memberships/my')
      ]);
      
      const lots = parkingRes.data;
      const reservations = reservationsRes.data;
      
      if (membershipRes.data.active) {
        setMembership(membershipRes.data.membership);
      }

      // Calculate stats
      const totalLots = lots.length;
      const totalAvailableSlots = lots.reduce((sum, lot) => sum + lot.availableSlots, 0);
      
      const activeRes = reservations.filter(res => res.status === 'confirmed' || res.status === 'active');
      
      let sessionStatus = 'None';
      if (activeRes.length > 0) {
        const latest = activeRes[0];
        sessionStatus = latest.parkingLotId?.name || 'Active Session';
      }

      setStats({
        nearbyLots: totalLots,
        availableSlots: totalAvailableSlots,
        activeReservations: activeRes.length,
        currentSession: sessionStatus
      });
      setReservations(reservations);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const confirmEndSession = async () => {
    if (!sessionToCancel) return;
    setIsCancelling(true);
    try {
      await api.put(`/reservations/${sessionToCancel}/cancel`);
      await fetchDashboardData(); // Refresh the table and stats
      setSessionToCancel(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to end session');
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePurchaseMembership = async (months) => {
    setMembershipLoading(true);
    try {
      const res = await api.post('/memberships', { planType: months });
      setMembership(res.data);
      alert(`Successfully purchased a ${months}-month membership pass!`);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to purchase membership');
    } finally {
      setMembershipLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name} 👋</h1>
        <p className="text-gray-600 mt-1">Find and manage your street parking in real-time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Dashboard Cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500 mb-1">Nearby Parking Lots</div>
          <div className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.nearbyLots}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500 mb-1">Available Slots</div>
          <div className="text-3xl font-bold text-green-600">{loading ? '...' : stats.availableSlots}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500 mb-1">Active Reservations</div>
          <div className="text-3xl font-bold text-blue-600">{loading ? '...' : stats.activeReservations}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500 mb-1">Current Session</div>
          <div className="text-xl font-bold text-gray-900 truncate">{loading ? '...' : stats.currentSession}</div>
        </div>
      </div>
      
      {/* Membership Pass Section */}
      <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 p-8 rounded-xl border border-indigo-200 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Daily Commuter Pass</h2>
        {membership ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-indigo-100 mb-4">You have an active membership pass. Park without paying daily fees!</p>
              <div className="bg-white/20 p-4 rounded-lg inline-block backdrop-blur-sm border border-white/30">
                <div className="text-sm text-indigo-100 uppercase tracking-wider font-semibold">Valid Until</div>
                <div className="text-2xl font-black">{new Date(membership.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/parking')}
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold py-3 px-6 rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              Find a Parking Spot
            </button>
          </div>
        ) : (
          <div>
            <p className="text-indigo-100 mb-6">Skip the daily checkout. Buy a pass for unlimited parking access.</p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => handlePurchaseMembership(1)}
                disabled={membershipLoading}
                className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold py-3 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-70"
              >
                1 Month (₹500)
              </button>
              <button 
                onClick={() => handlePurchaseMembership(2)}
                disabled={membershipLoading}
                className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold py-3 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-70"
              >
                2 Months (₹900)
              </button>
              <button 
                onClick={() => handlePurchaseMembership(3)}
                disabled={membershipLoading}
                className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold py-3 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-70"
              >
                3 Months (₹1200)
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 bg-blue-50 p-8 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-blue-900 mb-2">Ready to park?</h2>
        <p className="text-blue-700 mb-6">Find the best available slots near your destination.</p>
        <button 
          onClick={() => navigate('/parking')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-sm"
        >
          Find Parking Now
        </button>
      </div>

      {/* My Reservations Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Recent Bookings</h2>
        {loading ? (
          <p className="text-gray-500">Loading your bookings...</p>
        ) : reservations.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-gray-100 text-center text-gray-500">
            You haven't booked any parking slots yet.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slot</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reservations.map((res) => (
                  <tr key={res._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {res.parkingLotId?.name || 'Unknown Location'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {res.slotId?.slotNumber || 'Unknown Slot'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{res.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        res.status === 'active' ? 'bg-green-100 text-green-800' : 
                        res.status === 'completed' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {res.status === 'active' && (
                          <>
                            <a
                              href={res.parkingLotId?.latitude && res.parkingLotId?.longitude 
                                ? `https://www.google.com/maps/dir/?api=1&destination=${res.parkingLotId.latitude},${res.parkingLotId.longitude}`
                                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(res.parkingLotId?.address || res.parkingLotId?.name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-4 py-1.5 rounded-lg font-semibold transition-all border border-blue-200 hover:border-blue-600 shadow-sm flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                              Navigate
                            </a>
                            <button
                              onClick={() => setSessionToCancel(res._id)}
                              className="text-red-600 hover:text-white bg-red-50 hover:bg-red-600 px-4 py-1.5 rounded-lg font-semibold transition-all border border-red-200 hover:border-red-600 shadow-sm"
                            >
                              End Session
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      {sessionToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">End Parking Session?</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to end your parking session? This will immediately free up the slot for other drivers.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSessionToCancel(null)}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEndSession}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors flex justify-center items-center disabled:opacity-50 shadow-md hover:shadow-lg"
                >
                  {isCancelling ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Yes, End Session'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
