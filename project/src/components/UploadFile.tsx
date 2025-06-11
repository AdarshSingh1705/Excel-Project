import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Plot from 'react-plotly.js';
import axios from 'axios';
import Navbar from './DashboardNavbar.tsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ExcelRow {
  [key: string]: string | number | null;
}

interface UploadResponse {
  id?: string;
  rowCount?: number;
  // Add other expected response fields here
}

const isNumericArray = (arr: any[]) => arr.every((v) => typeof v === 'number' && !isNaN(v));

const chartTypes = [
  { key: 'line', label: 'Line Chart' },
  { key: 'bar', label: 'Bar Chart' },
  { key: 'pie', label: 'Pie Chart' },
  { key: 'surface', label: '3D Surface Plot' },
];

const barColors = [
  '#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#90caf9', '#ffb300', '#e57373', '#81c784', '#8e24aa', '#00838f', '#c62828', '#f57c00'
];

import { getAuth } from 'firebase/auth';

const UploadFile: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [data, setData] = useState<ExcelRow[]>([]);
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [pieCol, setPieCol] = useState<string>('');
  const [surfaceX, setSurfaceX] = useState<string>('');
  const [surfaceY, setSurfaceY] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('line');
  const [uploading, setUploading] = useState<boolean>(false);

  // Fetch history from backend and split into upload/download
  React.useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        
        // History fetching logic can be added here when needed
        await axios.get(`${API_BASE_URL}/api/history`, {
          params: { userId: currentUser.uid }
        });
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    };
    checkAuthAndFetch();
  }, []);


  // Handle file upload
  const handleFileUpload = useCallback(async (file: File): Promise<void> => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', currentUser.uid);

      console.log('Sending file upload request...');
      const response = await axios.post<UploadResponse>(
        `${API_BASE_URL}/api/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${await currentUser.getIdToken()}`
          }
        }
      );

      if (response.status !== 201) {
        throw new Error(`Unexpected status code: ${response.status}`);
      }

      // Create file data object
      const fileData = {
        id: response.data?.id || Date.now().toString(),
        fileName: file.name,
        date: new Date().toISOString(),
        rows: response.data?.rowCount || 0,
        status: 'Uploaded',
        userId: currentUser.uid,
        uploadedAt: new Date().toISOString(),
        rowCount: response.data?.rowCount || 0,
        type: 'upload',
        fileSize: file.size,
        chartType: 'file_upload'
      };
      
      console.log('File upload successful:', fileData);
      
      // Dispatch events to notify the application
      const uploadEvent = new CustomEvent('fileUploaded', { detail: fileData });
      window.dispatchEvent(uploadEvent);
      window.dispatchEvent(new Event('fileUploaded'));
      // Dispatch historyUpdated event so History updates instantly
      window.dispatchEvent(new Event('historyUpdated'));
      // Force a page refresh to ensure all components get the latest data
      // setTimeout(() => {
      //   window.location.reload();
      // }, 1000);
      
      return Promise.resolve();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      console.error('Upload failed:', errorMessage, err);
      setError(`Failed to upload file: ${errorMessage}`);
      return Promise.reject(errorMessage);
    } finally {
      setUploading(false);
    }
  }, []);

  // Save download to history
  const saveDownloadHistory = useCallback(async (chartType: string) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      await axios.post(`${API_BASE_URL}/api/history`, {
        type: 'download',
        chartType,
        date: new Date().toISOString(),
        userId: currentUser.uid,
      });
    } catch (err) {
      console.error('Failed to save download history:', err);
    }
  }, []);

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError('');
    const file = acceptedFiles[0];
    if (!file) return;
    
    setUploadedFile(file);
    
    try {
      // Process file for local visualization first
      const processFile = () => new Promise<ExcelRow[]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            const excelData: ExcelRow[] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
            // Remove rows with all values null or undefined
            const filtered = excelData.filter((row) => Object.values(row).some((v) => v != null));
            resolve(filtered);
          } catch (err) {
            reject(new Error('Failed to parse Excel file'));
          }
        };
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsArrayBuffer(file);
      });

      // Process the file and update state
      const filteredData = await processFile();
      setData(filteredData);
      
      // Set default axes and columns
      const columns = Object.keys(filteredData[0] || {});
      setXAxis(columns[0] || '');
      setYAxis(columns[1] || columns[0] || '');
      setPieCol(columns.find(col => isNumericArray(filteredData.map(row => row[col]))) || '');
      const numericCols = columns.filter(col => isNumericArray(filteredData.map(row => row[col])));
      setSurfaceX(numericCols[0] || '');
      setSurfaceY(numericCols[1] || numericCols[0] || '');
      
      // Upload to backend after successful processing
      await handleFileUpload(file);
      
    } catch (err) {
      console.error('File processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process file. Please try again.');
    }
  }, [handleFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
  });

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const numericColumns = columns.filter(col => isNumericArray(data.map(row => row[col])));

  // Chart traces
  const lineTrace = (xAxis && yAxis && data.length > 0)
    ? [{
        x: data.map((row) => row[xAxis]),
        y: data.map((row) => row[yAxis]),
        type: 'scatter',
        mode: 'lines+markers',
        name: `${yAxis} vs ${xAxis}`,
        line: { color: '#1976d2' },
        marker: { color: '#1976d2' },
      }]
    : [];

  const barTrace = (xAxis && yAxis && data.length > 0)
    ? [{
        x: data.map((row) => row[xAxis]),
        y: data.map((row) => row[yAxis]),
        type: 'bar',
        name: `${yAxis} by ${xAxis}`,
        marker: {
          color: data.map((_, i) => barColors[i % barColors.length]),
        },
      }]
    : [];

  // Pie chart: user-selected numeric column
  let pieTrace: any = null;
  if (pieCol && data.length > 0) {
    const values = data.map((row) => row[pieCol]);
    pieTrace = {
      labels: data.map((_, idx) => `Row ${idx + 1}`),
      values: values,
      type: 'pie',
      name: pieCol,
      marker: { colors: barColors },
      textinfo: 'label+percent',
      hoverinfo: 'label+value+percent',
    };
  }

  // 3D Surface plot (user-selected numeric columns)
  let surfaceTrace: any = null;
  if (surfaceX && surfaceY && data.length > 0) {
    surfaceTrace = {
      type: 'surface',
      z: data.map(row => [Number(row[surfaceX]) || 0, Number(row[surfaceY]) || 0]),
      showscale: true,
      colorscale: 'Blues',
    };
  }

  // Plotly config for controls
  const plotlyConfig = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['sendDataToCloud'],
    toImageButtonOptions: {
      format: 'png',
      filename: 'chart',
      height: 800,
      width: 1200,
      scale: 2,
    },
  };

  // Handle download button click
  const handleDownload = useCallback((chartType: string) => {
    saveDownloadHistory(chartType);
  }, [saveDownloadHistory]);

  // Axis selectors for each chart type
  const AxisSelectors = () => (
    <div className="flex flex-wrap gap-4 mb-8 items-center justify-center">
      <label className="flex items-center gap-2">
        <span className="font-semibold">X Axis:</span>
        <select
          className="border rounded px-2 py-1 dark:bg-gray-700 dark:text-gray-100"
          value={xAxis}
          onChange={e => setXAxis(e.target.value)}
        >
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2">
        <span className="font-semibold">Y Axis:</span>
        <select
          className="border rounded px-2 py-1 dark:bg-gray-700 dark:text-gray-100"
          value={yAxis}
          onChange={e => setYAxis(e.target.value)}
        >
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </label>
    </div>
  );

  // Pie column selector
  const PieSelector = () => (
    <div className="flex flex-wrap gap-4 mb-8 items-center justify-center">
      <label className="flex items-center gap-2">
        <span className="font-semibold">Pie Column:</span>
        <select
          className="border rounded px-2 py-1 dark:bg-gray-700 dark:text-gray-100"
          value={pieCol}
          onChange={e => setPieCol(e.target.value)}
        >
          {numericColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </label>
    </div>
  );

  // Surface selectors
  const SurfaceSelectors = () => (
    <div className="flex flex-wrap gap-4 mb-8 items-center justify-center">
      <label className="flex items-center gap-2">
        <span className="font-semibold">X Numeric:</span>
        <select
          className="border rounded px-2 py-1 dark:bg-gray-700 dark:text-gray-100"
          value={surfaceX}
          onChange={e => setSurfaceX(e.target.value)}
        >
          {numericColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2">
        <span className="font-semibold">Y Numeric:</span>
        <select
          className="border rounded px-2 py-1 dark:bg-gray-700 dark:text-gray-100"
          value={surfaceY}
          onChange={e => setSurfaceY(e.target.value)}
        >
          {numericColumns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </label>
    </div>
  );

  // Chart rendering logic
  const renderChart = () => {
    const chartConfig = {
      ...plotlyConfig,
      modeBarButtonsToAdd: [{
        name: 'Download Chart',
        icon: {
          width: 857.1,
          height: 1000,
          path: 'm214-142q-40-40-40-96t40-96l36-36 119 119 153-153q-17-17 42.5-8.5T586-92v214H214zm97-86h188v-188L405-322 299-428l-36 36q-17 17-17 42.5t17 42.5l48 48z',
          transform: 'matrix(1 0 0 -1 0 850)'
        },
        click: () => handleDownload(activeTab)
      }]
    };

    switch (activeTab) {
      case 'line':
        return <>
          <AxisSelectors />
          <div className="window" style={{ width: '90%', background: '#fff', borderRadius: 10, boxShadow: '0 0 8px rgba(0,0,0,0.2)', padding: 10, margin: 6 }}>
            <h2 className="text-xl font-bold mb-2 text-[#1976d2]">Line Chart</h2>
            <Plot data={lineTrace} layout={{ title: '', autosize: true, plot_bgcolor: '#fff', paper_bgcolor: '#f7f7f7', font: {color:'#1a5276'} }} style={{ width: '100%', height: 500 }} config={chartConfig} />
          </div>
        </>;
      case 'bar':
        return <>
          <AxisSelectors />
          <div className="window" style={{ width: '90%', background: '#fff', borderRadius: 10, boxShadow: '0 0 8px rgba(0,0,0,0.2)', padding: 10, margin: 6 }}>
            <h2 className="text-xl font-bold mb-2 text-[#1976d2]">Bar Chart</h2>
            <Plot data={barTrace} layout={{ title: '', autosize: true, plot_bgcolor: '#fff', paper_bgcolor: '#f7f7f7', font: {color:'#1a5276'} }} style={{ width: '100%', height: 500 }} config={chartConfig} />
          </div>
        </>;
      case 'pie':
        return <>
          <PieSelector />
          <div className="window" style={{ width: '90%', background: '#fff', borderRadius: 10, boxShadow: '0 0 8px rgba(0,0,0,0.2)', padding: 10, margin: 6 }}>
            <h2 className="text-xl font-bold mb-2 text-[#1976d2]">Pie Chart</h2>
            <Plot data={[pieTrace]} layout={{ title: '', autosize: true, plot_bgcolor: '#fff', paper_bgcolor: '#f7f7f7', font: {color:'#1a5276'} }} style={{ width: '100%', height: 600 }} config={chartConfig} />
          </div>
        </>;
      case 'surface':
        return <>
          <SurfaceSelectors />
          <div className="window" style={{ width: '90%', background: '#fff', borderRadius: 10, boxShadow: '0 0 8px rgba(0,0,0,0.2)', padding: 10, margin: 6 }}>
            <h2 className="text-xl font-bold mb-2 text-[#1976d2]">3D Surface Plot</h2>
            <Plot data={[surfaceTrace]} layout={{ title: '', autosize: true, plot_bgcolor: '#fff', paper_bgcolor: '#f7f7f7', font: {color:'#1a5276'} }} style={{ width: '100%', height: 550 }} config={chartConfig} />
          </div>
        </>;
      default:
        return null;
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-200 via-white to-blue-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4 sm:px-6 lg:px-8">

      <div className="w-full max-w-3xl bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl p-10 flex flex-col items-center border border-indigo-100 dark:border-gray-800">
        <h2 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-400 mb-6 text-center tracking-tight drop-shadow">Upload Excel File</h2>
        <button
          className="mb-6 px-4 py-2 bg-[#1976d2] text-white rounded hover:bg-[#1565c0] font-semibold transition-colors"
          onClick={() => window.location.href = '/dashboard'}
        >
          ← Back to Dashboard
        </button>
        <h1 className="title text-3xl font-bold mb-6 text-center text-[#1a5276]" style={{textShadow:'2px 2px 4px rgba(0,0,0,0.1)'}}>Excel File Upload & Analytics</h1>
        <div
          {...getRootProps()}
          className={`dropzone border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-[#1976d2] bg-[#e3f2fd]' : 'border-[#1a5276] bg-[#f9f9f9]'} ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ boxShadow: isDragActive ? '0 0 10px #1976d2' : '0 2px 8px #e0e0e0', marginBottom: 32 }}
        >
          <input {...getInputProps()} disabled={uploading} />
          <p className="text-lg text-[#1976d2] font-semibold">
            {uploading 
              ? 'Uploading...' 
              : isDragActive 
                ? 'Drop your Excel file here...' 
                : 'Drag & drop an Excel file here, or click to select'
            }
          </p>
          <p className="text-sm text-[#888] mt-2">Supported: .xlsx, .xls</p>
          {uploadedFile && (
            <div className="file-info" style={{ marginTop: 16, color: '#1976d2', fontWeight: 500, fontSize: 16, background: '#e3f2fd', padding: '8px 16px', borderRadius: 6 }}>
              Uploaded File: {uploadedFile.name}
              {uploading && <span className="ml-2">⏳</span>}
            </div>
          )}
          {error && <div className="mt-2 text-red-600 font-semibold">{error}</div>}
        </div>
        {data.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2 mb-8 items-center justify-center">
              {chartTypes.map(tab => (
                <button
                  key={tab.key}
                  className={`px-4 py-2 rounded font-semibold transition-colors duration-200 ${activeTab === tab.key ? 'bg-[#1976d2] text-white' : 'bg-gray-200 text-[#1976d2] hover:bg-[#90caf9]'}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {renderChart()}
          </>
        )}
      </div>
    </div>
    </>
  );
};

export default UploadFile;