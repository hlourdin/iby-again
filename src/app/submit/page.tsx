'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function Submit() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    owedTo: '',
    beverageName: '',
    reason: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'owed-bevarages'), {
        ...formData,
        owedBy: user?.email || '',
        isPaid: false,
        createdAt: new Date().toISOString(),
      });

      setSuccess('Beverage added successfully!');
      setFormData({
        owedTo: '',
        beverageName: '',
        reason: '',
      });
    } catch (error) {
      console.error('Error adding beverage:', error);
      setError('Failed to add beverage');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Add New Beverage</h1>
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300"
          >
            ← Back to List
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="owedTo" className="block text-sm font-medium mb-1">
                Owed To
              </label>
              <input
                type="text"
                id="owedTo"
                value={formData.owedTo}
                onChange={(e) => setFormData({ ...formData, owedTo: e.target.value })}
                className="w-full p-2 rounded border bg-black/10 border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="beverageName" className="block text-sm font-medium mb-1">
                Beverage
              </label>
              <select
                id="beverageName"
                value={formData.beverageName}
                onChange={(e) => setFormData({ ...formData, beverageName: e.target.value })}
                className="w-full p-2 rounded border bg-black/10 border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              >
                <option value="">Select a beverage</option>
                <option value="Beer">Beer</option>
                <option value="Wine">Wine</option>
                <option value="Cocktail">Cocktail</option>
                <option value="Coffee">Coffee</option>
                <option value="Tea">Tea</option>
                <option value="Soda">Soda</option>
                <option value="Water">Water</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium mb-1">
                Reason
              </label>
              <input
                type="text"
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full p-2 rounded border bg-black/10 border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Optional"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Beverage'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 