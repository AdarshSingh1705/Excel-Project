import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth } from '../firebase/config';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import {
  User, Mail, Save, Edit2, Phone, Briefcase, MapPin, Upload as UploadIcon
} from 'lucide-react';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const animationVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        setDisplayName(currentUser.displayName || '');
        setEmail(currentUser.email || '');
        setPhotoURL(currentUser.photoURL || '');
        setPhone(currentUser.phoneNumber || '');
        const fetchProfile = async () => {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfession(data.profession || '');
            setAddress(data.address || '');
            setPhone(data.phone || currentUser.phoneNumber || '');
          } else {
            setProfession('');
            setAddress('');
          }
        };
        fetchProfile();
      } else {
        setEditMode(false);
        setDisplayName('');
        setEmail('');
        setPhotoURL('');
        setPhone('');
        setProfession('');
        setAddress('');
        setPhotoFile(null);
        setSuccess('');
        setError('');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (auth.currentUser) {
        let newPhotoURL = photoURL;
        if (photoFile) {
          const storage = getStorage();
          const storageRef = ref(storage, `profile_photos/${auth.currentUser.uid}`);
          await uploadBytes(storageRef, photoFile);
          newPhotoURL = await getDownloadURL(storageRef);
          setPhotoURL(newPhotoURL);
        }
        // Always update Firebase Auth profile
        await updateProfile(auth.currentUser, {
          displayName,
          photoURL: newPhotoURL,
        });
        // Always update Firestore with all fields
        const db = getFirestore();
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          displayName,
          email: auth.currentUser.email,
          phone,
          profession,
          address,
          photoURL: newPhotoURL,
        }, { merge: true });
        setSuccess('Profile updated successfully!');
        setEditMode(false);
      }
    } catch (err) {
      setError('Failed to update profile.');
    }
    setSaving(false);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setPhotoFile(file);
    setPhotoUploading(true);
    setError('');
    setSuccess('');
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `profile_photos/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPhotoURL(url);
      setPhotoFile(null);
      await updateProfile(auth.currentUser!, { photoURL: url });
      setSuccess('Profile photo updated!');
    } catch (err) {
      setError('Failed to upload photo.');
    }
    setPhotoUploading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-t-indigo-600 border-indigo-200 rounded-full animate-spin"></div>
      </div>
    );
  }
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={animationVariants}
      className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mt-10"
    >
      <div className="flex items-center mb-8">
        <div className="relative w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-4 overflow-hidden group">
          {photoURL ? (
            <img
              src={photoURL}
              alt="Profile"
              className="w-full h-full object-cover rounded-full border-2 border-indigo-200 dark:border-indigo-700 transition-all duration-300 group-hover:opacity-80"
            />
          ) : (
            <User className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          )}
          <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-40 cursor-pointer transition-all duration-300 rounded-full">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
              disabled={photoUploading}
            />
            <span className="text-white opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs font-medium">
              <UploadIcon className="w-4 h-4" /> Change
            </span>
          </label>
          {photoUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-full">
              <svg className="animate-spin h-6 w-6 text-indigo-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">User Profile</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Manage your account information</p>
        </div>
      </div>
      <form onSubmit={handleSave} className="space-y-6">
        {/* Name */}
        <div className="relative">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
          <div className="flex items-center">
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-300"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              disabled={!editMode}
              required
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <User className="w-5 h-5" />
            </span>
            {!editMode && (
              <button
                type="button"
                className="ml-2 p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300"
                onClick={() => setEditMode(true)}
                aria-label="Edit Name"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {/* Email */}
        <div className="relative">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Email</label>
          <div className="flex items-center">
            <input
              type="email"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-300"
              value={email}
              disabled
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail className="w-5 h-5" />
            </span>
          </div>
        </div>
        {/* Phone */}
        <div className="relative">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Phone</label>
          <div className="flex items-center">
            <input
              type="tel"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-300"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              disabled={!editMode}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Phone className="w-5 h-5" />
            </span>
          </div>
        </div>
        {/* Profession */}
        <div className="relative">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Profession</label>
          <div className="flex items-center">
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-300"
              value={profession}
              onChange={e => setProfession(e.target.value)}
              disabled={!editMode}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Briefcase className="w-5 h-5" />
            </span>
          </div>
        </div>
        {/* Address */}
        <div className="relative">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Address</label>
          
          <div className="flex items-center">
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-300"
              value={address}
              onChange={e => setAddress(e.target.value)}
              disabled={!editMode}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <MapPin className="w-5 h-5" />
            </span>
          </div>
        </div>
        {/* Save button and feedback */}
        {editMode && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-medium flex items-center justify-center gap-2 transition-all duration-300"
            disabled={saving}
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </motion.button>
        )}
        {success && <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">{success}</div>}
        {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
      </form>
    </motion.div>
  );
};

export default UserProfile;
