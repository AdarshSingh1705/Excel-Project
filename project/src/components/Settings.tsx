import React from 'react';
import Navbar from './DashboardNavbar';
import { auth } from '../firebase/config';
import { onAuthStateChanged, updateProfile, updatePassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
const Settings: React.FC = () => {
  const [profile, setProfile] = React.useState({
    name: '',
    email: '',
    password: '',
    photo: '',
    instagram: '',
    linkedin: '',
    facebook: '',
    leetcode: '',
    bio: '',
    about: '',
    phone: '',
    profession: '',
    address: '',
    interests: [] as string[],
  });

  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let unsubscribe = () => {};
    unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;
      setProfile((prev) => ({ ...prev, email: currentUser.email || '', name: currentUser.displayName || '', photo: currentUser.photoURL || '' }));
      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile((prev) => ({
            ...prev,
            instagram: data.instagram || '',
            linkedin: data.linkedin || '',
            facebook: data.facebook || '',
            leetcode: data.leetcode || '',
            bio: data.bio || '',
            about: data.about || '',
            phone: data.phone || '',
            profession: data.profession || '',
            address: data.address || '',
            interests: Array.isArray(data.interests) ? data.interests : [],
          }));
        }
      } catch (err) {
        setError('Failed to fetch profile.');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  // Interests tag input helpers
  const handleAddInterest = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const val = e.currentTarget.value.trim();
      if (!profile.interests.includes(val)) {
        setProfile(prev => ({ ...prev, interests: [...prev.interests, val] }));
      }
      e.currentTarget.value = '';
    }
  };
  const handleRemoveInterest = (interest: string) => {
    setProfile(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
  };
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && auth.currentUser) {
      const file = e.target.files[0];
      setSaving(true);
      setError('');
      setSuccess('');
      try {
        const storage = getStorage();
        const storageRef = ref(storage, `profile_photos/${auth.currentUser.uid}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        setProfile(prev => ({ ...prev, photo: url }));
        await updateProfile(auth.currentUser, { photoURL: url });
        setSuccess('Profile photo updated!');
      } catch (err) {
        setError('Failed to upload photo.');
      }
      setSaving(false);
    }
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');
    try {
      if (!auth.currentUser) throw new Error('Not authenticated');
      // Update Auth profile
      await updateProfile(auth.currentUser, { displayName: profile.name, photoURL: profile.photo });
      // Update password if provided
      if (profile.password) {
        await updatePassword(auth.currentUser, profile.password);
      }
      // Update Firestore profile
      const db = getFirestore();
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        instagram: profile.instagram,
        linkedin: profile.linkedin,
        facebook: profile.facebook,
        leetcode: profile.leetcode,
        bio: profile.bio,
        about: profile.about,
        phone: profile.phone,
        profession: profile.profession,
        address: profile.address,
        interests: profile.interests,
      }, { merge: true });
      // Add notification for profile update
      await addDoc(collection(db, 'notifications'), {
        userId: auth.currentUser.uid,
        type: 'profile_update',
        message: 'Your profile was updated.',
        date: new Date(),
        read: false,
      });
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    }
    setSaving(false);
  };


  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-200 via-white to-blue-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl p-10 flex flex-col items-center border border-indigo-100 dark:border-gray-800">
          <h1 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-400 mb-6 text-center tracking-tight drop-shadow">Settings</h1>
          <form className="w-full space-y-6" onSubmit={handleSave}>
            {/* Profile Photo */}
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 mb-2">
                <img
                  src={profile.photo || 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff'}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-indigo-200 dark:border-indigo-700 shadow"
                />
                <label className="absolute bottom-0 right-0 bg-indigo-600 dark:bg-indigo-500 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-all">
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  <span className="text-xs">Edit</span>
                </label>
              </div>
            </div>
            {/* Name, Email, Phone, Profession, Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  placeholder="Your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  placeholder="Your phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Profession</label>
                <input
                  type="text"
                  name="profession"
                  value={profile.profession}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  placeholder="Your profession"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Address</label>
                <input
                  type="text"
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  placeholder="Your address"
                />
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Interests</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {profile.interests.map((interest) => (
                  <span key={interest} className="flex items-center bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 px-3 py-1 rounded-full text-sm">
                    {interest}
                    <button type="button" className="ml-2 text-indigo-400 hover:text-red-500" onClick={() => handleRemoveInterest(interest)}>&times;</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                onKeyDown={handleAddInterest}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                placeholder="Type and press Enter to add interest"
              />
            </div>
            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Change Password</label>
              <input
                type="password"
                name="password"
                value={profile.password}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                placeholder="New password"
              />
            </div>
            {/* Social Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Instagram</label>
                <input
                  type="url"
                  name="instagram"
                  value={profile.instagram}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  placeholder="Instagram profile link"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">LinkedIn</label>
                <input
                  type="url"
                  name="linkedin"
                  value={profile.linkedin}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  placeholder="LinkedIn profile link"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Facebook</label>
                <input
                  type="url"
                  name="facebook"
                  value={profile.facebook}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  placeholder="Facebook profile link"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">LeetCode</label>
                <input
                  type="url"
                  name="leetcode"
                  value={profile.leetcode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  placeholder="LeetCode profile link"
                />
              </div>
            </div>
            {/* Bio */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Bio</label>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                placeholder="Short bio (e.g. Data Scientist, Excel Enthusiast)"
              />
            </div>
            {/* About */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">About</label>
              <textarea
                name="about"
                value={profile.about}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                placeholder="Tell us about yourself..."
              />
            </div>
            {/* Save Button & Feedback */}
            <div className="flex flex-col items-center">
              <button
                type="submit"
                className="px-8 py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition-all duration-300 disabled:opacity-60"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {success && <div className="mt-2 text-green-600 dark:text-green-400">{success}</div>}
              {error && <div className="mt-2 text-red-600 dark:text-red-400">{error}</div>}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
export default Settings;
