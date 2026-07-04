import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, Mail, Phone, Calendar, UserCheck, Shield, ChevronDown, MapPin } from 'lucide-react';
import api from '../../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null); // To view address list details

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/admin/users');
        if (data.success) {
          setUsers(data.data);
        }
      } catch (err) {
        console.error('Failed to load user management details:', err);
        setError('Failed to retrieve registered users directory. Please check network logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-48 bg-slate-900 rounded-xl shimmer-dark" />
          <div className="h-10 w-64 bg-slate-900 rounded-xl shimmer-dark" />
        </div>
        <div className="h-96 bg-slate-900 border border-slate-800 rounded-3xl shimmer-dark" />
      </div>
    );
  }

  // Filter users by search term and city
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (user.phone && user.phone.includes(searchTerm));
      
    const matchesCity = !cityFilter || user.addresses?.some(addr => 
      addr.city.toLowerCase().includes(cityFilter.toLowerCase())
    );
    
    return matchesSearch && matchesCity;
  });

  return (
    <div className="space-y-8 font-inter text-slate-100">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-poppins font-black text-2xl sm:text-3xl text-white">Registered Users</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Audit customer log accounts, phone directories, and registered shop owner credentials.</p>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* City Filter */}
          <div className="relative w-full sm:w-44">
            <input
              type="text"
              placeholder="Filter by City..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-900 border border-slate-850 text-white rounded-xl focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-850 text-white rounded-xl focus:outline-none focus:border-purple-500"
            />
            <Search size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-2xl text-xs text-red-400 font-medium">
          {error}
        </div>
      )}

      {/* USER LIST TABLE */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-900/40">
                <th className="px-6 py-4">Client Name</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">System Role</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/50 text-xs">
              {filteredUsers.map((user) => (
                <React.Fragment key={user._id}>
                  <tr className="hover:bg-slate-850/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=60&q=80'}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-800"
                        />
                        <span className="font-bold text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">{user.email}</td>
                    <td className="px-6 py-4 text-slate-400 font-semibold">{user.phone || 'Not provided'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${user.role === 'shopowner' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/40' : 'bg-emerald-950 text-emerald-400 border border-emerald-900/40'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-semibold">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedUser(selectedUser === user._id ? null : user._id)}
                        className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 transition inline-flex items-center gap-1"
                      >
                        Addresses <ChevronDown size={10} className={`transition-transform ${selectedUser === user._id ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                  </tr>

                  {/* Address drop-down drawer */}
                  {selectedUser === user._id && (
                    <tr>
                      <td colSpan="6" className="px-8 py-4 bg-slate-950/40 border-b border-slate-850">
                        <div className="space-y-3">
                          <h5 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin size={12} /> Registered Delivery Addresses ({user.addresses?.length || 0})
                          </h5>
                          {user.addresses && user.addresses.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              {user.addresses.map((addr) => (
                                <div key={addr._id} className="p-3 bg-slate-900/80 border border-slate-850 rounded-xl space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-extrabold text-white bg-slate-850 px-2 py-0.5 rounded-md uppercase">{addr.label}</span>
                                    {addr.isDefault && <span className="text-[9px] text-emerald-400 font-bold">Default</span>}
                                  </div>
                                  <p className="text-[11px] text-slate-300 font-semibold leading-relaxed pt-1">{addr.addressLine}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">{addr.city}, {addr.state} - {addr.zipCode}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 font-semibold">No addresses saved on profile yet.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500 text-xs font-semibold">No registered users match your query.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
