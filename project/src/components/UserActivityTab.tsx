import React, { useEffect, useState } from 'react';
import * as groupUtils from '../firebase/groupUtils';

import { FileHistoryItem, Member, ActivityLog } from '../user';

interface UserActivityTabProps {
  members: Member[];
}

interface ActivityData {
  logs: ActivityLog[];
  fileHistory: FileHistoryItem[];
  member: Member;
}

const UserActivityTab: React.FC<UserActivityTabProps> = ({ members }) => {
  const [activityData, setActivityData] = useState<{ [uid: string]: ActivityData }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!members || members.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    const fetchAll = async () => {
      try {
        const data: { [uid: string]: ActivityData } = {};
        
        for (const member of members) {
          if (!member || !member.id) continue;
          
          try {
            const logs = await groupUtils.getUserActivity(member.id);
            const userProfile = await groupUtils.getUserProfile(member.id);
            
            // Safely extract file history with proper type checking
            let fileHistory: FileHistoryItem[] = [];
            
            if (userProfile?.fileHistory && Array.isArray(userProfile.fileHistory)) {
              fileHistory = userProfile.fileHistory.filter((file): file is FileHistoryItem => 
                file && 
                typeof file === 'object' && 
                typeof file.name === 'string' && 
                typeof file.url === 'string' && 
                typeof file.uploadedAt === 'string'
              );
            } else if (member.fileHistory && Array.isArray(member.fileHistory)) {
              fileHistory = member.fileHistory.filter((file): file is FileHistoryItem => 
                file && 
                typeof file === 'object' && 
                typeof file.name === 'string' && 
                typeof file.url === 'string' && 
                typeof file.uploadedAt === 'string'
              );
            }
            
            data[member.id] = {
              logs: Array.isArray(logs) ? logs : [],
              fileHistory,
              member,
            };
          } catch (memberError) {
            console.error(`Error fetching data for member ${member.id}:`, memberError);
            // Still add the member with empty data to show in the table
            data[member.id] = {
              logs: [],
              fileHistory: [],
              member,
            };
          }
        }
        
        setActivityData(data);
      } catch (err: any) {
        console.error('Error fetching activity data:', err);
        setError(err?.message || 'Failed to fetch activity logs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAll();
  }, [members]);

  const formatTotalTime = (loginTime?: string, logoutTime?: string): string => {
    if (!loginTime || !logoutTime) return '-';
    
    try {
      const login = new Date(loginTime);
      const logout = new Date(logoutTime);
      
      if (isNaN(login.getTime()) || isNaN(logout.getTime())) return '-';
      
      const ms = logout.getTime() - login.getTime();
      if (ms < 0) return '-';
      
      const hours = Math.floor(ms / 3600000);
      const mins = Math.floor((ms % 3600000) / 60000);
      return `${hours}h ${mins}m`;
    } catch {
      return '-';
    }
  };

  const formatTime = (timeString?: string): string => {
    if (!timeString) return '-';
    
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleTimeString();
    } catch {
      return '-';
    }
  };

  const renderFileHistory = (fileHistory: FileHistoryItem[]): React.ReactNode => {
    if (!Array.isArray(fileHistory) || fileHistory.length === 0) {
      return <span className="text-xs text-gray-400">0</span>;
    }

    return (
      <div className="flex flex-col gap-1">
        {fileHistory.map((file, idx) => {
          if (!file || typeof file !== 'object') {
            return (
              <span key={`invalid-${idx}`} className="text-xs text-gray-500">
                Invalid file data
              </span>
            );
          }

          const fileName = file.name || `File ${idx + 1}`;
          const fileUrl = file.url;

          if (fileUrl && typeof fileUrl === 'string' && fileUrl.trim() !== '') {
            return (
              <a
                key={`${fileUrl}-${idx}`}
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline text-xs truncate max-w-xs block"
                title={fileName}
              >
                {fileName}
              </a>
            );
          } else {
            return (
              <span key={`no-url-${idx}`} className="text-xs text-gray-500" title={fileName}>
                {fileName}
              </span>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
      <h3 className="font-semibold mb-2">User Activity Logs</h3>
      
      {loading && <div className="mb-2 text-indigo-600">Loading activity...</div>}
      {error && <div className="mb-2 text-red-500">{error}</div>}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                User
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Login
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Logout
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Total Time
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Uploads
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {Object.keys(activityData).length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-4">
                  No activity data available.
                </td>
              </tr>
            )}
            
            {Object.values(activityData).map(({ member, logs, fileHistory }) => {
              if (!member) return null;
              
              const memberName = member.name || member.email || 'Unknown User';
              
              if (!logs || logs.length === 0) {
                return (
                  <tr key={`${member.id}-no-logs`}>
                    <td className="px-4 py-2 whitespace-nowrap">{memberName}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-400" colSpan={4}>
                      No activity logs
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {renderFileHistory(fileHistory)}
                    </td>
                  </tr>
                );
              }

              return logs.map((log, logIndex) => {
                if (!log) return null;
                
                return (
                  <tr key={`${member.id}-${logIndex}`}>
                    <td className="px-4 py-2 whitespace-nowrap">{memberName}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{log.date || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatTime(log.loginTime)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatTime(log.logoutTime)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatTotalTime(log.loginTime, log.logoutTime)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {logIndex === 0 ? renderFileHistory(fileHistory) : '-'}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserActivityTab;