import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  Search,
  Pencil,
  Trash2,
  X,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';

const avatarColors = [
  { bg: '#FFF1ED', text: '#FF4B2B' },
  { bg: '#DCFCE7', text: '#22C55E' },
  { bg: '#E0F2FE', text: '#0284C7' },
  { bg: '#F3E8FF', text: '#9333EA' },
  { bg: '#FEF3C7', text: '#D97706' },
  { bg: '#FCE7F3', text: '#DB2777' },
  { bg: '#E0E7FF', text: '#4F46E5' },
  { bg: '#CCFBF1', text: '#0D9488' },
];

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRole, selectedStatus]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'CUSTOMER',
    status: 'Active'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getUsers();

      const formattedUsers = (Array.isArray(data) ? data : data.data || [])
        .filter(u => (u.role || '').toLowerCase() !== 'delivery')
        .map((user, index) => ({
        id: user._id || user.id || index + 1,
        code: user.code || `#USR-${index + 1}`,
        name: user.name || 'Unknown User',
        email: user.email || 'N/A',
        role: user.role || 'CUSTOMER',
        status: user.status || 'Active',
        joinedOn: (user.createdAt || user.createdDate)
          ? new Date(user.createdAt || user.createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
          : 'Recent',
      }));

      setUsers(formattedUsers);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizeRole = (role) => {
    if (!role) return '';
    const r = String(role).trim().toUpperCase();
    if (r.includes('ADMIN')) return 'ADMIN';
    if (r.includes('RESTAURANT')) return 'RESTAURANT';
    if (r.includes('CUSTOMER') || r.includes('USER')) return 'CUSTOMER';
    return r;
  };

  const normalizeStatus = (status) => {
    if (!status) return 'ACTIVE';
    const s = String(status).trim().toUpperCase();
    if (s === 'ACTIVE' || s === 'APPROVED' || s === 'ENABLED') return 'ACTIVE';
    if (s === 'INACTIVE' || s === 'DISABLED' || s === 'REJECTED' || s === 'SUSPENDED') return 'INACTIVE';
    return s;
  };

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      (u.name || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query) ||
      (u.code || '').toLowerCase().includes(query) ||
      (u.role || '').toLowerCase().includes(query);

    const matchesRole =
      selectedRole === 'All' ||
      normalizeRole(u.role) === normalizeRole(selectedRole);

    const matchesStatus =
      selectedStatus === 'All' ||
      normalizeStatus(u.status) === normalizeStatus(selectedStatus);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: normalizeRole(user.role),
      status: normalizeStatus(user.status) === 'ACTIVE' ? 'Active' : 'Inactive'
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setUserToDelete(id);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        await adminAPI.deleteUser(userToDelete);
      } catch (err) {
        console.error('Failed to delete user on server:', err);
      }
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete));
      setUserToDelete(null);
    }
  };

  const renderRoleBadge = (role) => {
    const norm = normalizeRole(role);
    if (norm === 'ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-[600] bg-[#FFF1ED] text-[#FF4B2B] border border-[#FF4B2B]/20">
          ADMIN
        </span>
      );
    }
    if (norm === 'RESTAURANT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-[600] bg-[#E0F2FE] text-[#0369A1] border border-[#0284C7]/20">
          RESTAURANT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-[600] bg-[#F3E8FF] text-[#7C3AED] border border-[#9333EA]/20">
        CUSTOMER
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    if (normalizeStatus(status) === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-[500] bg-[#DCFCE7] text-[#15803D] border border-[#22C55E]/20">
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-[500] bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/20">
        Inactive
      </span>
    );
  };

  const getAvatarStyle = (userId) => {
    let hash = 0;
    const strId = String(userId);
    for (let i = 0; i < strId.length; i++) {
      hash = strId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % avatarColors.length;
    const color = avatarColors[index] || avatarColors[0];

    return {
      backgroundColor: color.bg,
      color: color.text,
    };
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    if (editingUser) {
      if (formData.status !== editingUser.status) {
        try {
          await adminAPI.updateUserStatus(editingUser.id, formData.status);
        } catch (err) {
          console.error('Failed to update status on server:', err);
        }
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, ...formData }
            : u
        )
      );
    } else {
      const newId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
      const newUser = {
        id: newId,
        code: `#USR-${newId}`,
        ...formData,
        joinedOn: 'Recent',
      };
      setUsers((prev) => [newUser, ...prev]);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 font-poppins text-[#111827]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-[700] text-[#111827] tracking-tight">
            Manage Users
          </h1>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">
          {error}
        </div>
      )}

      <div className="bg-[#FFFFFF] rounded-[14px] border border-[#F1F1F1] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] space-y-5">

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80 lg:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full pl-10 pr-9 py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827] p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] font-[500] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all cursor-pointer flex-1 sm:flex-none"
            >
              <option value="All">All Roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="RESTAURANT">Restaurant</option>
              <option value="ADMIN">Admin</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] font-[500] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all cursor-pointer flex-1 sm:flex-none"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F1F1F1] text-[12px] font-[500] text-[#6B7280]">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Joined On</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1F1] text-[14px] text-[#111827]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-[#6B7280]">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-[#D1D5DB]" />
                      <span className="text-[14px] font-[500] text-[#6B7280]">No users found matching your search or filter criteria.</span>
                      {(searchQuery || selectedRole !== 'All' || selectedStatus !== 'All') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedRole('All');
                            setSelectedStatus('All');
                          }}
                          className="mt-1 text-[13px] font-medium text-[#FF4B2B] hover:underline cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3.5 px-3 font-[600] text-[#111827]">{user.code}</td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full font-[700] text-[12px] flex items-center justify-center shrink-0"
                          style={getAvatarStyle(user.id)}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <span className="font-[600] text-[#111827] text-[13px] sm:text-[14px]">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-[#6B7280]">{user.email}</td>
                    <td className="py-3.5 px-3">
                      {renderRoleBadge(user.role)}
                    </td>
                    <td className="py-3.5 px-3">
                      {renderStatusBadge(user.status)}
                    </td>
                    <td className="py-3.5 px-3 text-[#6B7280] text-[11px] whitespace-nowrap">
                      {user.joinedOn}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(user)}
                          className="px-3 py-1.5 border border-[#F1F1F1] text-[#111827] hover:bg-[#FAFAFA] font-[500] shadow-[0_4px_16px_rgba(0,0,0,0.06)] rounded-[8px] text-[12px] flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user.id)}
                          className="px-3 py-1.5 border border-[#FEE2E2] text-[#DC2626] hover:bg-[#FEE2E2] font-[500] shadow-[0_4px_16px_rgba(0,0,0,0.06)] rounded-[8px] text-[12px] flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 text-[12px] text-[#6B7280] font-[500]">
          <div>
            Showing {filteredUsers.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-[8px] border border-[#F1F1F1] text-[#6B7280] flex items-center justify-center hover:bg-[#FAFAFA] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-[8px] bg-[#FF4B2B] text-white font-[700] flex items-center justify-center shadow-sm"
            >
              {currentPage}
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage * ITEMS_PER_PAGE >= filteredUsers.length}
              className="w-8 h-8 rounded-[8px] border border-[#F1F1F1] text-[#6B7280] flex items-center justify-center hover:bg-[#FAFAFA] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-[14px] max-w-lg w-full p-6 sm:p-7 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#F1F1F1] relative space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#F1F1F1] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#FFF1ED] text-[#FF4B2B] flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[20px] font-[600] text-[#111827]">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h3>
                  <p className="text-[14px] font-[500] text-[#6B7280]">Manage user profile and platform role</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#6B7280] hover:text-[#111827] p-1.5 rounded-[10px] hover:bg-[#FAFAFA] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-[500] text-[#6B7280] mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Kulal"
                  className="w-full px-4 py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all"
                />
              </div>

              <div>
                <label className="block text-[12px] font-[500] text-[#6B7280] mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  disabled={!!editingUser}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. rahul@example.com"
                  className={`w-full px-4 py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all ${!!editingUser ? 'opacity-60 cursor-not-allowed bg-[#F9FAFB]' : ''}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-[500] text-[#6B7280] mb-1.5">User Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all cursor-pointer"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="RESTAURANT">Restaurant</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-[500] text-[#6B7280] mb-1.5">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FFFFFF] border border-[#F1F1F1] rounded-[10px] text-[14px] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#FF4B2B] focus:border-[#FF4B2B] transition-all cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1F1F1]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-[14px] font-[500] text-[#6B7280] hover:text-[#111827] bg-[#FAFAFA] border border-[#F1F1F1] rounded-[10px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-[14px] font-[500] bg-[#FF4B2B] text-white rounded-[10px] hover:bg-[#E04518] shadow-sm transition-all"
                >
                  {editingUser ? 'Save Changes' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] rounded-[14px] max-w-sm w-full p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-[#F1F1F1] relative space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-[18px] font-[600] text-[#111827]">Delete User</h3>
              <p className="text-[14px] text-[#6B7280]">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-[#F1F1F1]">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 px-4 py-2.5 text-[14px] font-[500] text-[#6B7280] hover:text-[#111827] bg-[#FAFAFA] border border-[#F1F1F1] rounded-[10px] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 text-[14px] font-[500] bg-red-600 text-white rounded-[10px] hover:bg-red-700 shadow-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
