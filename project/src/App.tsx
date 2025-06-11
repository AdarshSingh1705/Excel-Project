import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase/config';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import DashboardNavbar from './components/DashboardNavbar'; // New navbar for authenticated users
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Statistics from './components/Statistics';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import CTA from './components/CTA';
import Footer from './components/Footer';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import UserProfile from './components/UserProfile';
import UploadFile from './components/UploadFile';
import DataExplorer from './components/DataExplorer';
import Visualization from './components/Visualization';
import Reports from './components/Reports';
import Settings from './components/Settings';
import History from './components/History';

// Layout wrapper for authenticated pages
const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
    <DashboardNavbar />
    <main className="pt-16"> {/* Add padding-top to account for fixed navbar */}
      {children}
    </main>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: 'var(--bg-color)',
            color: 'var(--text-color)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: 'white',
            },
          },
        }}
      />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const hasSignedOut = sessionStorage.getItem('signedOutOnServerStart');
    const fetchProfile = async (user: any) => {
      if (user) {
        const groupUtils = await import('./firebase/groupUtils');
        const profile = await groupUtils.getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    };
    if (!hasSignedOut) {
      signOut(auth).finally(() => {
        sessionStorage.setItem('signedOutOnServerStart', 'true');
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user);
          fetchProfile(user);
          setIsLoading(false);
        });
        return () => unsubscribe();
      });
    } else {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        fetchProfile(user);
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      {/* Protected Routes */}
      <Route path="/dashboard" element={user ? <AuthenticatedLayout><Dashboard /></AuthenticatedLayout> : <Navigate to="/login" />} />
      <Route path="/upload" element={user ? <AuthenticatedLayout><UploadFile /></AuthenticatedLayout> : <Navigate to="/login" />} />
      <Route path="/explore" element={user ? <AuthenticatedLayout><DataExplorer /></AuthenticatedLayout> : <Navigate to="/login" />} />
      <Route path="/visualize" element={user ? <AuthenticatedLayout><Visualization /></AuthenticatedLayout> : <Navigate to="/login" />} />
      <Route path="/reports" element={user ? <AuthenticatedLayout><Reports /></AuthenticatedLayout> : <Navigate to="/login" />} />
      <Route path="/history" element={user ? <AuthenticatedLayout><History /></AuthenticatedLayout> : <Navigate to="/login" />} />
      <Route path="/settings" element={user ? <AuthenticatedLayout><Settings /></AuthenticatedLayout> : <Navigate to="/login" />} />
      <Route path="/admin" element={user && userProfile?.role === 'admin' ? <AuthenticatedLayout><AdminDashboard /></AuthenticatedLayout> : <Navigate to="/dashboard" />} />
      <Route path="/profile" element={user ? <AuthenticatedLayout><UserProfile /></AuthenticatedLayout> : <Navigate to="/login" />} />
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : (
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
          <Navbar />
          <main>
            <Hero />
            <Features />
            <HowItWorks />
            <Statistics />
            <Testimonials />
            <Pricing />
            <FAQ />
            <CTA />
          </main>
          <Footer />
        </div>
      )} />
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404 - Page Not Found</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">The page you're looking for doesn't exist.</p>
            <button 
              onClick={() => navigate('/')} 
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default App;