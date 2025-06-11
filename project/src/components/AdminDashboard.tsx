import React, { useState, useEffect } from 'react';
import { UserPlus, Users, ShieldCheck, Activity, ListChecks, FileSpreadsheet, BarChart2, FilePlus2, FileBarChart2, PieChart, LineChart, Settings, LogOut, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import * as groupUtils from '../firebase/groupUtils';
import UserActivityTab from './UserActivityTab';

const TABS = [
  { key: 'group', label: 'Group Management', icon: <Users className="w-5 h-5 mr-2" /> },
  { key: 'requests', label: 'Join Requests', icon: <ListChecks className="w-5 h-5 mr-2" /> },
  { key: 'activity', label: 'User Activity', icon: <Activity className="w-5 h-5 mr-2" /> },
];

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('group');
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // Get current user
  const user = auth.currentUser;

  // Real-time group info and members
  useEffect(() => {
    let unsubGroup: any = null;
    let unsubMembers: any = null;
    let groupId: string | undefined;
    let isMounted = true;
    setLoading(true);
    setError(null);
    async function setupListeners() {
      if (!user || !user.uid) {
        if (isMounted) setLoading(false);
        return;
      }
      // Get user profile to find groupId
      const userProfile = await groupUtils.getUserProfile(user.uid);
      groupId = userProfile && typeof (userProfile as any).groupId === 'string' ? (userProfile as any).groupId : undefined;
      if (!groupId) {
        if (isMounted) {
          setGroup(null);
          setMembers([]);
          setJoinRequests([]);
          setLoading(false);
        }
        return;
      }
      // Real-time group listener
      const { doc, onSnapshot } = await import('firebase/firestore');
      unsubGroup = onSnapshot(doc(db, 'groups', groupId), async (docSnap: any) => {
        const groupData = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
        if (isMounted) setGroup(groupData);
        // Real-time members
        if (groupData && Array.isArray(groupData.members)) {
          const memberProfiles = await Promise.all(
            groupData.members.filter((uid: any) => typeof uid === 'string').map((uid: string) => groupUtils.getUserProfile(uid))
          );
          if (isMounted) setMembers(memberProfiles.filter(Boolean));
        } else {
          if (isMounted) setMembers([]);
        }
        // Real-time joinRequests
        if (groupData && Array.isArray(groupData.joinRequests) && groupData.joinRequests.length > 0) {
          const reqUsers = await Promise.all(
            groupData.joinRequests.filter((uid: any) => typeof uid === 'string').map((uid: string) => groupUtils.getUserProfile(uid))
          );
          if (isMounted) setJoinRequests(reqUsers.filter(Boolean));
        } else {
          if (isMounted) setJoinRequests([]);
        }
        if (isMounted) setLoading(false);
      }, () => {
        if (isMounted) {
          setError('Failed to get group info');
          setLoading(false);
        }
      });
    }
    setupListeners();
    return () => {
      isMounted = false;
      if (unsubGroup) unsubGroup();
      if (unsubMembers) unsubMembers();
    };
  }, [user]);

  // Handlers
  const handleInvite = async () => {
    if (!inviteEmail) return;
    setLoading(true);
    setError(null);
    try {
      if (!group || typeof group.id !== 'string') throw new Error('Group not loaded');
      if (!user?.uid) throw new Error('User not authenticated');
      await groupUtils.inviteUserToGroup(group.id, inviteEmail, user.uid);
      setInviteEmail('');
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!group || typeof group.id !== 'string') throw new Error('Group not loaded');
      await groupUtils.removeUserFromGroup(group.id, uid);
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to remove user');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!group || typeof group.id !== 'string') throw new Error('Group not loaded');
      await groupUtils.approveJoinRequest(group.id, uid);
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!group || typeof group.id !== 'string') throw new Error('Group not loaded');
      await groupUtils.rejectJoinRequest(group.id, uid);
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const refresh = async () => {
    // Re-fetch group info and members
    if (user && user.uid) {
      const userProfile = await groupUtils.getUserProfile(user.uid);
      const groupId = userProfile && typeof (userProfile as any).groupId === 'string' ? (userProfile as any).groupId : undefined;
      if (groupId) {
        const groupData = await groupUtils.getGroup(groupId);
        setGroup(groupData);
        const groupMembers = await groupUtils.getGroupUsers(groupId);
        setMembers(groupMembers);
        if (groupData && typeof groupData === 'object' && Array.isArray((groupData as any).joinRequests) && (groupData as any).joinRequests.length > 0) {
          const reqUsers = await Promise.all(
            (groupData as any).joinRequests
              .filter((uid: any) => typeof uid === 'string')
              .map((uid: string) => groupUtils.getUserProfile(uid))
          );
          setJoinRequests(reqUsers.filter(Boolean));
        } else {
          setJoinRequests([]);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-gray-800 shadow-lg flex flex-col py-6 px-4 fixed h-full top-0 left-0 z-10 transition-all duration-300`}>
        <div className="flex items-center mb-10">
          <FileSpreadsheet className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          {isSidebarOpen && <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">ExcelAnalytics</span>}
        </div>
        <nav className="flex-1">
          <ul className="space-y-4">
            {/* Sidebar Toggle Button */}
            <li className="mb-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="flex items-center w-full px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
              >
                {isSidebarOpen ? <ChevronLeft className="w-5 h-5 mr-2" /> : <ChevronRight className="w-5 h-5 mr-2" />}
                {isSidebarOpen && "Toggle Sidebar"}
              </button>
            </li>
            <li>
              <Link to="/dashboard" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 cursor-pointer">
                <BarChart2 className="w-5 h-5 mr-2" /> {isSidebarOpen && "Dashboard"}
              </Link>
            </li>
            <li>
              <Link to="/upload" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 cursor-pointer">
                <FilePlus2 className="w-5 h-5 mr-2" /> {isSidebarOpen && "Upload File"}
              </Link>
            </li>
            <li>
              <Link to="/data-explorer" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 cursor-pointer">
                <FileBarChart2 className="w-5 h-5 mr-2" /> {isSidebarOpen && "Data Explorer"}
              </Link>
            </li>
            <li>
              <Link to="/visualization" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 cursor-pointer">
                <PieChart className="w-5 h-5 mr-2" /> {isSidebarOpen && "Visualization"}
              </Link>
            </li>
            <li>
              <Link to="/reports" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 cursor-pointer">
                <LineChart className="w-5 h-5 mr-2" /> {isSidebarOpen && "Reports"}
              </Link>
            </li>
            <li>
              <Link to="/history" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 cursor-pointer">
                <FileSpreadsheet className="w-5 h-5 mr-2" /> {isSidebarOpen && "History"}
              </Link>
            </li>
            <li>
              <div className="flex items-center text-indigo-600 font-semibold">
                <ShieldCheck className="w-5 h-5 mr-2" /> {isSidebarOpen && "Admin Panel"}
              </div>
            </li>
            <li>
              <Link to="/settings" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 cursor-pointer">
                <Settings className="w-5 h-5 mr-2" /> {isSidebarOpen && "Settings"}
              </Link>
            </li>
          </ul>
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center mt-10 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
        >
          <LogOut className="w-5 h-5 mr-2" /> {isSidebarOpen && "Logout"}
        </button>
      </aside>

      {/* Main Content */}
      <div className={`${isSidebarOpen ? 'ml-64' : 'ml-20'} flex flex-col min-h-screen transition-all duration-300`}>
        {/* Header */}
        <header className="flex items-center justify-between bg-white dark:bg-gray-800 shadow px-8 py-4">
          <div className="flex items-center space-x-8">
            <span className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <ShieldCheck className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
              Admin Panel
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={() => navigate('/profile')} className="flex items-center space-x-2">
              <User className="w-8 h-8 rounded-full text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900 p-1" />
              <span className="hidden md:block text-gray-900 dark:text-white font-medium">Profile</span>
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="flex space-x-4 px-8 py-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === tab.key 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900 border border-gray-200 dark:border-gray-600'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-900">
          {loading && (
            <div className="mb-4 flex items-center text-indigo-600">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Loading...
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Group Management Tab */}
          {activeTab === 'group' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Group Management</h2>
              {/* Create Group Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Group</h3>
                <form
                  className="flex flex-col sm:flex-row gap-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    setError(null);
                    try {
                      if (!user?.uid) throw new Error('User not authenticated');
                      const groupName = (e.target as any).groupName.value.trim();
                      if (!groupName) throw new Error('Group name is required');
                      const groupDesc = (e.target as any).groupDesc.value.trim();
                      await groupUtils.createGroup(user.uid, groupName, groupDesc, user.displayName ?? undefined, user.email ?? undefined);
                      await refresh();
                    } catch (err: any) {
                      setError(err.message || 'Failed to create group');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <input
                    name="groupName"
                    type="text"
                    placeholder="Group name"
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <input
                    name="groupDesc"
                    type="text"
                    placeholder="Description (optional)"
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                    disabled={loading}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Create Group
                  </button>
                </form>
              </div>

              {/* Invite User Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invite New User</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <button
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                    onClick={handleInvite}
                    disabled={loading || !inviteEmail}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Send Invite
                  </button>
                </div>
              </div>

              {/* Group Members Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Group Members ({members.length})</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {members.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                            No members found
                          </td>
                        </tr>
                      ) : (
                        members.map((member) => (
                          <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-medium">
                              {member.name || member.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                              {member.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                member.role === 'admin'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              }`}>
                                {member.role === 'admin' ? 'Admin' : 'User'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {member.role !== 'admin' && (
                                <button
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                                  onClick={() => handleRemove(member.id)}
                                  disabled={loading}
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Join Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Join Requests</h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {joinRequests.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                            No pending join requests
                          </td>
                        </tr>
                      ) : (
                        joinRequests.map((req: any) => (
                          <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-medium">
                              {req.name || req.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                              {req.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-3">
                                <button
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                  onClick={() => handleApprove(req.id)}
                                  disabled={loading}
                                >
                                  Approve
                                </button>
                                <button
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                  onClick={() => handleReject(req.id)}
                                  disabled={loading}
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* User Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">User Activity</h2>
              <UserActivityTab members={members} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;