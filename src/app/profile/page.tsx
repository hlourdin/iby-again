'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { updateProfile, updateEmail, updatePassword, User } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, DocumentData } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserProfile {
  displayName: string;
  email: string;
  createdAt: string;
  totalBeverages: number;
  pendingBeverages: number;
  redeemedBeverages: number;
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user) {
      fetchUserProfile();
    }
  }, [user, authLoading, router]);

  const fetchUserProfile = async () => {
    try {
      // Get beverages stats
      const beveragesRef = collection(db, 'owed-bevarages');
      const beveragesSnapshot = await getDocs(beveragesRef);
      const beverages = beveragesSnapshot.docs.map((doc) => doc.data() as DocumentData);

      const stats = {
        totalBeverages: beverages.length,
        pendingBeverages: beverages.filter((b: any) => !b.isPaid).length,
        redeemedBeverages: beverages.filter((b: any) => b.isPaid).length,
      };

      setProfile({
        displayName: user!.displayName || '',
        email: user!.email || '',
        createdAt: user!.metadata.creationTime || '',
        ...stats,
      });

      setFormData({
        displayName: user!.displayName || '',
        email: user!.email || '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setFormData({
      displayName: user!.displayName || '',
      email: user!.email || '',
      newPassword: '',
      confirmPassword: '',
    });
    setHasChanges(false);
    setError(null);
    setSuccess(null);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setFormData({
      displayName: user!.displayName || '',
      email: user!.email || '',
      newPassword: '',
      confirmPassword: '',
    });
    setHasChanges(false);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !hasChanges) return;

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      // Update profile
      if (formData.displayName !== user!.displayName) {
        await updateProfile(user!, { displayName: formData.displayName });
      }

      // Update email if changed
      if (formData.email !== user!.email) {
        await updateEmail(user!, formData.email);
      }

      // Update password if provided
      if (formData.newPassword) {
        await updatePassword(user!, formData.newPassword);
      }

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setHasChanges(false);
      await fetchUserProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(
        error.code === 'auth/email-already-in-use'
          ? 'This email is already in use'
          : error.code === 'auth/requires-recent-login'
          ? 'Please sign in again to update your profile'
          : 'Failed to update profile'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto text-center">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Profile</h1>
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300"
          >
            ← Back to Beverages
          </Link>
        </div>

        <div className="bg-white/10 rounded-lg p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
              <p className="text-green-500">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium mb-1">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                className="w-full p-2 rounded border bg-black/10 border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                disabled={!isEditing || isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 rounded border bg-black/10 border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                disabled={!isEditing || isSubmitting}
              />
            </div>

            {isEditing && (
              <>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                    New Password (optional)
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded border bg-black/10 border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded border bg-black/10 border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
              </>
            )}

            <div className="flex gap-4">
              {isEditing ? (
                <>
                  <button
                    type="submit"
                    disabled={isSubmitting || !hasChanges}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelClick}
                    disabled={isSubmitting}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleEditClick}
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-white/10">
            <h2 className="text-lg font-semibold mb-4">Account Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{profile?.totalBeverages || 0}</div>
                <div className="text-sm text-gray-400">Total Beverages</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{profile?.pendingBeverages || 0}</div>
                <div className="text-sm text-gray-400">Pending</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{profile?.redeemedBeverages || 0}</div>
                <div className="text-sm text-gray-400">Redeemed</div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <h2 className="text-lg font-semibold mb-4">Account Details</h2>
            <div className="space-y-2 text-sm text-gray-400">
              <p>Member since: {new Date(profile?.createdAt || '').toLocaleDateString()}</p>
              <p>User ID: {user?.uid}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 