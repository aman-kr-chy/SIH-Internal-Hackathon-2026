import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, Square, RefreshCw, AlertTriangle, Map, Car, Activity, IndianRupee, TrendingUp, Clock, FileText } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [analytics, setAnalytics] = useState(null);
  const [simulationStatus, setSimulationStatus] = useState('STOPPED');
  const [loading, setLoading] = useState(true);
  const [revenueView, setRevenueView] = useState('monthly');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    // Listen for realtime parking updates to keep stats fresh
    socket.on('parkingStatusUpdated', () => {
      fetchAnalytics(); // For a real app, update states locally to save API calls
    });
    
    socket.on('simulationReset', () => {
      setSimulationStatus('STOPPED');
      fetchAnalytics();
    });

    return () => {
      socket.off('parkingStatusUpdated');
      socket.off('simulationReset');
    };
  }, [socket]);

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get('/admin/analytics');
      setAnalytics(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimControl = async (action) => {
    try {
      await api.post(`/simulation/${action}`);
      if (action === 'start') setSimulationStatus('RUNNING');
      if (action === 'pause') setSimulationStatus('PAUSED');
      if (action === 'reset') setSimulationStatus('STOPPED');
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading dashboard data...</div>;
  if (!analytics) return <div className="p-8 text-center text-red-500">Failed to load analytics</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor the entire city's smart parking network.</p>
        </div>
        

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {/* Card 1: Total Parking Zones */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center opacity-50 group-hover:scale-110 transition-transform duration-300">
             <Map className="w-10 h-10 text-blue-500 opacity-20" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
              <Map size={24} />
            </div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Zones</div>
          </div>
          <div className="text-4xl font-black text-gray-900">{analytics.stats.totalLots}</div>
          <div className="mt-4 text-sm text-gray-500 flex items-center">
            <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100 mr-2 text-xs">ACTIVE</span>
            Network capacity
          </div>
        </div>

        {/* Card 2: Slots */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center opacity-50 group-hover:scale-110 transition-transform duration-300">
             <Car className="w-10 h-10 text-indigo-500 opacity-20" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
              <Car size={24} />
            </div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Availability</div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-black text-indigo-600">{analytics.stats.availableSlots}</div>
            <div className="text-lg text-gray-400 font-bold">/ {analytics.stats.totalSlots}</div>
          </div>
          <div className="mt-4 text-sm text-gray-500 flex items-center">
            <TrendingUp size={16} className="text-indigo-500 mr-1.5" />
            <span className="text-indigo-600 font-bold mr-1">Real-time</span> tracking
          </div>
        </div>


        {/* Card 4: Revenue */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-green-50 w-24 h-24 rounded-full flex items-center justify-center opacity-50 group-hover:scale-110 transition-transform duration-300">
             <IndianRupee className="w-10 h-10 text-green-500 opacity-20" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shadow-sm border border-green-100">
              <IndianRupee size={24} />
            </div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Revenue</div>
          </div>
          <div className="text-4xl font-black text-green-600">₹{analytics.stats.todayRevenue}</div>

        </div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-start text-blue-900">
          <AlertTriangle className="mt-1 mr-3 flex-shrink-0 text-blue-600" size={24} />
          <div>
            <h2 className="text-lg font-bold mb-1">AI Prediction (Beta)</h2>
            <p className="font-medium text-blue-800 text-lg mb-2">{analytics.prediction.predictedShortfall}</p>
            <div className="flex gap-6">
              <p className="text-sm">Expected Peak: <span className="font-bold bg-white px-2 py-1 rounded shadow-sm ml-1">{analytics.prediction.expectedPeakTime}</span></p>
              <p className="text-sm">Expected Occupancy: <span className="font-bold bg-white px-2 py-1 rounded shadow-sm ml-1">{analytics.prediction.expectedOccupancy}%</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Hourly Occupancy Trend</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.charts.hourlyOccupancy}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Area type="monotone" dataKey="occupancy" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOccupancy)" />
                <defs>
                  <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-bold text-gray-900">Revenue Collection</h2>
             <select 
                value={revenueView}
                onChange={(e) => setRevenueView(e.target.value)}
                className="text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 px-3 py-1.5 outline-none focus:ring-2 focus:ring-green-500 font-medium cursor-pointer"
             >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
             </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueView === 'monthly' ? analytics.charts.monthlyRevenue : analytics.charts.yearlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dx={-10} tickFormatter={(val) => val >= 1000 ? `₹${(val/1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : `₹${val}`} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Recent Transactions History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <FileText className="text-gray-500" size={20} />
            <h2 className="text-lg font-bold text-gray-900">Revenue & Booking History</h2>
          </div>
          <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase">Live Updates</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {analytics.recentTransactions && analytics.recentTransactions.map((tx) => (
                <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{tx.userId?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{tx.userId?.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{tx.parkingLotId?.name || 'Unknown Location'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-green-600">₹{tx.amount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${
                      tx.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      tx.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {tx.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                    <div className="flex items-center justify-end gap-1">
                      <Clock size={12} />
                      {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                </tr>
              ))}
              {(!analytics.recentTransactions || analytics.recentTransactions.length === 0) && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No recent transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
