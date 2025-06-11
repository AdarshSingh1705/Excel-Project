import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  User,
  FileSpreadsheet,
  BarChart2,
  PieChart,
  LineChart,
  Settings,
  FilePlus2,
  FileBarChart2,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase/config';
import Plot from 'react-plotly.js';
import { UserProfile } from '../firebase/groupUtils';

interface FileHistory {
  id: string;
  fileName: string;
  date: Date;
  rows: number;
  status: string;
  userId: string;
  uploadedAt: Date;
  rowCount: number;
}

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [recentFiles, setRecentFiles] = useState<FileHistory[]>([]);
  const [stats, setStats] = useState<{
    totalFiles: number;
    analyzedRows: number;
    averageValue: number;
    maxValue: number;
  }>({
    totalFiles: 0,
    analyzedRows: 0,
    averageValue: 0,
    maxValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [makeAdminMsg, setMakeAdminMsg] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUserId(user ? user.uid : null);
      if (user && user.uid) {
        const groupUtils = await import('../firebase/groupUtils');
        const profile = await groupUtils.getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleMakeMeAdmin = async () => {
    if (!userId) return;
    setMakeAdminMsg(null);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      await updateDoc(doc(db, 'users', userId), { role: 'admin' });

      const groupUtils = await import('../firebase/groupUtils');
      const newProfile = await groupUtils.getUserProfile(userId);
      setUserProfile(newProfile);
      setMakeAdminMsg('You are now an admin! Admin features unlocked.');
    } catch (err: any) {
      setMakeAdminMsg('Failed to set admin: ' + (err.message || err));
    }
  };

  // Add handler for Become User (remove admin role)
  const handleBecomeUser = async () => {
    if (!userId) return;
    setMakeAdminMsg(null);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      await updateDoc(doc(db, 'users', userId), { role: 'user' });
      const groupUtils = await import('../firebase/groupUtils');
      const newProfile = await groupUtils.getUserProfile(userId);
      setUserProfile(newProfile);
      setMakeAdminMsg('You are now a normal user. Admin privileges removed.');
    } catch (err: any) {
      setMakeAdminMsg('Failed to remove admin: ' + (err.message || err));
    }
  };

  const fetchData = React.useCallback(async () => {
    if (!userId) {
      console.log('Dashboard: No user ID, skipping data fetch');
      return;
    }
    
    console.log('Dashboard: Starting data fetch for user:', userId);
    try {
      setLoading(true);
      // Fetch file history from backend API with Firebase auth token
      const axios = (await import('axios')).default;
      const { getAuth } = await import('firebase/auth');
      const user = getAuth().currentUser;
      
      if (!user) {
        console.log('Dashboard: No authenticated user found');
        setRecentFiles([]);
        setStats({ totalFiles: 0, analyzedRows: 0, averageValue: 0, maxValue: 0 });
        setLoading(false);
        return;
      }
      
      const token = await user.getIdToken();
      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/history`;
      console.log('Dashboard: Fetching history from:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Dashboard: API Response:', response.data);
      
      const allHistory = (response.data as any).history as any[] || [];
      console.log('Dashboard: Raw history data:', allHistory);
      
      // Filter for uploads by current user
      const uploads = allHistory
        .filter((item) => {
          const isMatch = item.type === 'upload' && item.userId === userId;
          console.log(`Dashboard: Checking item - type:${item.type}, userId:${item.userId}, match:${isMatch}`);
          return isMatch;
        })
        .sort((a, b) => {
          const aTime = a.uploadedAt?.toDate ? a.uploadedAt.toDate().getTime() : new Date(a.uploadedAt).getTime();
          const bTime = b.uploadedAt?.toDate ? b.uploadedAt.toDate().getTime() : new Date(b.uploadedAt).getTime();
          return bTime - aTime;
        })
        .slice(0, 6);

      console.log('Dashboard: Processed uploads:', uploads);
      setRecentFiles(uploads);

      // Calculate stats
      const totalFiles = uploads.length;
      const analyzedRows = uploads.reduce((acc: number, f: any) => acc + (f.rowCount || 0), 0);
      const averageValue = totalFiles > 0 ? Math.round(analyzedRows / totalFiles) : 0;
      const maxValue = uploads.reduce((max: number, f: any) => Math.max(max, f.rowCount || 0), 0);

      const newStats = {
        totalFiles,
        analyzedRows,
        averageValue,
        maxValue,
      };
      
      console.log('Dashboard: New stats:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial data fetch
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up event listener for file uploads
  React.useEffect(() => {
    const handleFileUploaded = () => {
      console.log('Dashboard: Received fileUploaded event, refreshing data...');
      fetchData();
    };
    
    window.addEventListener('fileUploaded', handleFileUploaded);
    return () => {
      window.removeEventListener('fileUploaded', handleFileUploaded);
    };
  }, [fetchData]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-t-indigo-600 border-indigo-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white dark:bg-gray-800 shadow-lg flex flex-col py-6 px-4 fixed h-full top-20 left-0 z-40 transition-all duration-300`}
      >
        <div className="flex items-center mb-10">
          <FileSpreadsheet className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          {isSidebarOpen && (
            <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">ExcelAnalytics</span>
          )}
        </div>
        <nav className="flex-1">
          <ul className="space-y-4">
            <li className="mb-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="flex items-center w-full px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
              >
                {isSidebarOpen ? <ChevronLeft className="w-5 h-5 mr-2" /> : <ChevronRight className="w-5 h-5 mr-2" />}
                {isSidebarOpen && 'Hide'}
              </button>
            </li>
            <li>
              <Link to="/dashboard" className="flex items-center text-indigo-600 font-semibold hover:text-indigo-800">
                <BarChart2 className="w-5 h-5 mr-2" /> {isSidebarOpen && 'Dashboard'}
              </Link>
            </li>
            <li>
              <Link
                to="/upload"
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 cursor-pointer"
              >
                <FilePlus2 className="w-5 h-5 mr-2" /> {isSidebarOpen && 'Upload File'}
              </Link>
            </li>
            <li>
              <Link
                to="/data-explorer"
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 cursor-pointer"
              >
                <FileBarChart2 className="w-5 h-5 mr-2" /> {isSidebarOpen && 'Data Explorer'}
              </Link>
            </li>
            <li>
              <Link
                to="/visualization"
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 cursor-pointer"
              >
                <PieChart className="w-5 h-5 mr-2" /> {isSidebarOpen && 'Visualization'}
              </Link>
            </li>
            <li>
              <Link
                to="/reports"
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 cursor-pointer"
              >
                <LineChart className="w-5 h-5 mr-2" /> {isSidebarOpen && 'Reports'}
              </Link>
            </li>
            <li>
              <Link
                to="/history"
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 cursor-pointer"
              >
                <FileSpreadsheet className="w-5 h-5 mr-2" /> {isSidebarOpen && 'History'}
              </Link>
            </li>
            <li>
              <Link
                to="/settings"
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 cursor-pointer"
              >
                <Settings className="w-5 h-5 mr-2" /> {isSidebarOpen && 'Settings'}
              </Link>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
              >
                <LogOut className="w-5 h-5 mr-2" /> {isSidebarOpen && 'Logout'}
              </button>
            </li>
            {/* Add Make Me Admin button in sidebar if not admin */}
            {userProfile && userProfile.role !== 'admin' && (
              <li>
                <button
                  onClick={handleMakeMeAdmin}
                  className="flex items-center w-full px-4 py-2 rounded-lg text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800 transition-colors duration-300"
                >
                  <Settings className="w-5 h-5 mr-2" />
                  {isSidebarOpen && 'Become Admin'}
                </button>
                {makeAdminMsg && <span className="block mt-2 text-xs text-green-700">{makeAdminMsg}</span>}
              </li>
            )}
            {/* Add Become User button in sidebar if admin */}
            {userProfile && userProfile.role === 'admin' && (
              <li>
                <button
                  onClick={handleBecomeUser}
                  className="flex items-center w-full px-4 py-2 rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors duration-300"
                >
                  <User className="w-5 h-5 mr-2" />
                  {isSidebarOpen && 'Become User'}
                </button>
              </li>
            )}
          </ul>
        </nav>
      </aside>

      <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-20'} flex flex-col transition-all duration-300`}>
        {/* Main */}
        <main className="flex-1 p-8 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
          {/* Remove the admin message from the main dashboard area */}
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {['Total Files', 'Analyzed Rows', 'Average Rows/File', 'Max Rows'].map((label, i) => {
              const value = [stats.totalFiles, stats.analyzedRows, stats.averageValue, stats.maxValue][i];
              return (
                <div key={label} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex flex-col items-center">
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{value}</span>
                  <span className="text-gray-600 dark:text-gray-300 mt-2">{label}</span>
                </div>
              );
            })}
          </div>

          {/* Recent Files & Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="col-span-1 lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recently Uploaded Files</h2>
              <div className="overflow-x-auto">
                {recentFiles.length === 0 ? (
                  <div className="text-gray-500 py-8 text-center">No uploads yet.</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">File Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rows</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {recentFiles.map((file, idx) => (
                        <tr key={file.fileName + idx}>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-white">{file.fileName}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300">
                            {file.date ? new Date(file.date).toLocaleDateString() : ''}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300">{file.rows || '-'}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                file.status === 'Analyzed'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}
                            >
                              {file.status || 'Uploaded'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex flex-col">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sales Trends</h2>
              <div style={{ width: '100%', height: 400 }}>
                {recentFiles.length > 0 ? (
                  <Plot
                    data={[
                      {
                        x: recentFiles.map((f) => (f.date ? new Date(f.date).toLocaleDateString() : '')),
                        y: recentFiles.map((f) => f.rows || 0),
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Rows Uploaded',
                        line: { color: '#6366f1' },
                        marker: { color: '#6366f1' },
                      },
                    ]}
                    layout={{
                      title: {
                        text: 'Rows Uploaded Over Time',
                        font: { color: '#1e293b', size: 20 },
                      },
                      autosize: true,
                      plot_bgcolor: 'rgba(255,255,255,1)',
                      paper_bgcolor: 'rgba(249,250,251,1)',
                      font: { color: '#1e293b', family: 'Inter, sans-serif', size: 14 },
                      xaxis: {
                        title: { text: 'Date', font: { color: '#64748b', size: 14 } },
                        gridcolor: '#e5e7eb',
                        zerolinecolor: '#e5e7eb',
                        tickfont: { color: '#64748b' },
                      },
                      yaxis: {
                        title: { text: 'Rows', font: { color: '#64748b', size: 14 } },
                        gridcolor: '#e5e7eb',
                        zerolinecolor: '#e5e7eb',
                        tickfont: { color: '#64748b' },
                      },
                      margin: { l: 40, r: 20, t: 40, b: 40 },
                    }}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%', height: 400, borderRadius: 12 }}
                  />
                ) : (
                  <div className="text-gray-400 text-center w-full py-16">No upload trend data available yet.</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
