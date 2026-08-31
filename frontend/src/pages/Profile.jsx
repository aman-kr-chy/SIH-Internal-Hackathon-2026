import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Edit3, Save, Check } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // Local state for editing fields
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');

  if (!user) return null;

  const handleSave = () => {
    // In a real app, this would call an API to update the user
    setIsEditing(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account details and preferences.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
        {/* Banner */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        
        <div className="relative mt-12 flex flex-col sm:flex-row items-center sm:items-end gap-6">
          <div className="w-32 h-32 bg-white rounded-full p-1 shadow-lg shrink-0">
            <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <span className="text-5xl font-black">{user.name.charAt(0).toUpperCase()}</span>
            </div>
          </div>
          
          <div className="flex-1 text-center sm:text-left mb-2">
            <h2 className="text-3xl font-black text-gray-900">{user.name}</h2>
            <div className="flex items-center justify-center sm:justify-start text-gray-500 mt-1 gap-4 text-sm font-medium">
              <span className="flex items-center"><Mail size={16} className="mr-1.5" /> {user.email}</span>
              <span className="flex items-center capitalize"><Shield size={16} className="mr-1.5" /> {user.role}</span>
            </div>
          </div>
          
          {isEditing ? (
            <button 
              onClick={handleSave}
              className="flex items-center px-4 py-2 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 transition-colors"
            >
              <Save size={16} className="mr-2" /> Save Profile
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Edit3 size={16} className="mr-2" /> Edit Profile
            </button>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <User size={18} className="mr-2 text-blue-500" /> Personal Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                ) : (
                  <div className="mt-1 text-gray-900 font-medium">{user.name}</div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                {isEditing ? (
                  <input 
                    type="email" 
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                ) : (
                  <div className="mt-1 text-gray-900 font-medium">{user.email}</div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center">
              <Shield size={18} className="mr-2 text-indigo-500" /> Account Security
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Account Role</label>
                <div className="mt-1 inline-flex px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-bold capitalize">
                  {user.role}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                <div className="mt-1 text-gray-900 font-medium">••••••••</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styled Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 z-50 animate-bounce-short">
          <div className="bg-green-500 rounded-full p-1 text-white">
            <Check size={16} strokeWidth={3} />
          </div>
          <span className="font-medium text-lg">Profile updated successfully!</span>
        </div>
      )}
    </div>
  );
};

export default Profile;
