// Shared user-related types for the project

export interface FileHistoryItem {
  name: string;
  url: string;
  uploadedAt: string;
}

export interface Member {
  id: string;
  name?: string;
  email: string;
  fileHistory?: FileHistoryItem[];
}

export interface ActivityLog {
  date: string;
  loginTime?: string;
  logoutTime?: string;
  totalTime?: number;
}
