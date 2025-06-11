import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { auth } from '../firebase/config';
import Navbar from './DashboardNavbar';

const History: React.FC = () => {
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);
  const [downloadHistory, setDownloadHistory] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchHistory = async () => {
      try {
        // Get the current user's ID token
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await axios.get('http://localhost:5000/api/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data as any; // Type assertion to fix TS error
        console.log('Fetched history:', data.history); // Debug log
        const all = data.history || [];
        setUploadHistory(all.filter((item: any) => item.type === 'upload'));
        setDownloadHistory(all.filter((item: any) => item.type === 'download'));
      } catch (err) {
        setUploadHistory([]);
        setDownloadHistory([]);
      }
    };
    console.log('Current userId:', userId); // Debug log
    fetchHistory();
    // Listen for historyUpdated event to refresh immediately
    window.addEventListener('historyUpdated', fetchHistory);
    return () => window.removeEventListener('historyUpdated', fetchHistory);
  }, [userId]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-200 via-white to-blue-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl p-10 flex flex-col items-center border border-indigo-100 dark:border-gray-800">
          <h1 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-400 mb-6 text-center tracking-tight drop-shadow">User History</h1>
          {/* --- Upload History Section --- */}
          <div className="mt-8 w-full">
            <h2 className="text-xl font-bold mb-4 text-[#1976d2] dark:text-indigo-400">Upload History</h2>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 bg-white/90 dark:bg-gray-900/90 rounded-lg shadow p-4">
              {uploadHistory.length === 0 && <li className="py-2 text-gray-500 dark:text-gray-400">No uploads yet.</li>}
              {uploadHistory.map((item, idx) => (
                <li key={idx} className="py-2 flex items-center gap-4">
                  <span className="font-semibold text-[#1976d2] dark:text-indigo-400">Uploaded</span>
                  <span className="text-gray-800 dark:text-gray-100">{item.fileName}</span>
                  <span className="text-gray-400 text-xs">{new Date(item.date).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* --- Download History Section --- */}
          <div className="mt-8 w-full">
            <h2 className="text-xl font-bold mb-4 text-[#1976d2] dark:text-indigo-400">Download History</h2>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 bg-white/90 dark:bg-gray-900/90 rounded-lg shadow p-4">
              {downloadHistory.length === 0 && <li className="py-2 text-gray-500 dark:text-gray-400">No downloads yet.</li>}
              {downloadHistory.map((item, idx) => (
                <li key={idx} className="py-2 flex items-center gap-4">
                  <span className="font-semibold text-[#1976d2] dark:text-indigo-400">Downloaded</span>
                  <span className="text-gray-800 dark:text-gray-100">{item.chartType}</span>
                  <span className="text-gray-400 text-xs">{new Date(item.date).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default History;
