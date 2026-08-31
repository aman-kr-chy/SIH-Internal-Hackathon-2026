import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, Lock, Mail, ShieldAlert, Users, Building } from 'lucide-react';
import parkingBg from '../assets/parking-bg.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (result.success) {
      if (result.user.role === 'admin') {
        navigate('/admin');
      } else if (result.user.role === 'operator') {
        navigate('/staff');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${parkingBg})` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10 w-full">
        <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
          <div className="flex justify-center text-blue-400">
            <Car size={48} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Street Parking
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">Sign in to your account</p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-6xl flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: System Logins */}
        <div className="w-full lg:w-1/3 space-y-4">
          <h3 className="text-lg font-medium text-white mb-4 text-center lg:text-left drop-shadow-md">Quick Login (System)</h3>
          
          <div 
            onClick={() => handleQuickLogin('admin@smartparking.com', 'password123')}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all flex items-center gap-4"
          >
            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="font-bold text-gray-900">Admin</div>
              <div className="text-sm text-gray-500">Full system access & simulation</div>
            </div>
          </div>



          <div 
            onClick={() => handleQuickLogin('driver1@smartparking.com', 'password123')}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all flex items-center gap-4"
          >
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Car size={24} />
            </div>
            <div>
              <div className="font-bold text-gray-900">Car Owner</div>
              <div className="text-sm text-gray-500">Find & reserve parking</div>
            </div>
          </div>

        </div>

        {/* Middle Column: Manual Login Form */}
        <div className="w-full lg:w-1/3 flex flex-col justify-center">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-8 h-full">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex justify-end mt-2">
                <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  New to Street Parking?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/register"
                className="w-full flex justify-center py-2 px-4 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create an account
              </Link>
            </div>
          </div>
          </div>
        </div>

        {/* Right Column: Business Logins */}
        <div className="w-full lg:w-1/3 space-y-4">
          <h3 className="text-lg font-medium text-white mb-4 text-center lg:text-left drop-shadow-md">Quick Login (Business)</h3>
          <div 
            onClick={() => handleQuickLogin('operator1@smartparking.com', 'password123')}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:border-emerald-500 hover:ring-1 hover:ring-emerald-500 transition-all flex items-center gap-4"
          >
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
              <Building size={24} />
            </div>
            <div>
              <div className="font-bold text-gray-900">Staff</div>
              <div className="text-sm text-gray-500">Collect walk-in payments</div>
            </div>
          </div>

          <div 
            onClick={() => handleQuickLogin('operator@smartparking.com', 'password123')}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all flex items-center gap-4"
          >
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <div className="font-bold text-gray-900">Subscription Basic</div>
              <div className="text-sm text-gray-500">Manage own parking zones</div>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
