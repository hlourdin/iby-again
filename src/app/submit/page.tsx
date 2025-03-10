'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, FirestoreError } from 'firebase/firestore';
import type { Beverage } from '@/types/beverage';
import { useRouter } from 'next/navigation';

export default function SubmitBeverage() {
  const router = useRouter();
  const [formData, setFormData] = useState<Omit<Beverage, 'id' | 'date' | 'isPaid'>>({
    owedBy: '',
    owedTo: '',
    beverageName: '',
    reason: '',
  });
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus({ type: null, message: '' });

    try {
      console.log('Preparing to submit beverage data...');
      const beverageData: Omit<Beverage, 'id'> = {
        ...formData,
        date: new Date(),
        isPaid: false,
      };
      console.log('Beverage data to be submitted:', beverageData);

      console.log('Creating collection reference...');
      const collectionRef = collection(db, 'owed-bevarages');
      console.log('Collection reference created, attempting to add document...');

      const docRef = await addDoc(collectionRef, {
        ...beverageData,
        // Ensure date is properly serialized for Firestore
        date: beverageData.date.toISOString(),
      });
      
      console.log('Document successfully added with ID:', docRef.id);
      setSubmitStatus({
        type: 'success',
        message: `Beverage successfully added! Document ID: ${docRef.id}`
      });
      
      // Reset form
      setFormData({
        owedBy: '',
        owedTo: '',
        beverageName: '',
        reason: '',
      });

      // Wait a moment to show success message, then redirect
      setTimeout(() => {
        router.push('/');
      }, 1500);
      
    } catch (error) {
      console.error('Detailed submission error:', error);
      const errorMessage = error instanceof FirestoreError 
        ? error.message 
        : 'An unexpected error occurred';
      setSubmitStatus({
        type: 'error',
        message: errorMessage
      });
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-md mx-auto bg-white/10 p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6">Submit Owed Beverage</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="owedBy" className="block text-sm font-medium mb-1">
              Owed By
            </label>
            <input
              type="text"
              id="owedBy"
              value={formData.owedBy}
              onChange={(e) => setFormData({ ...formData, owedBy: e.target.value })}
              className="w-full p-2 rounded border bg-black/10 border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

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
            />
          </div>

          <div>
            <label htmlFor="beverageName" className="block text-sm font-medium mb-1">
              Beverage Name
            </label>
            <input
              type="text"
              id="beverageName"
              value={formData.beverageName}
              onChange={(e) => setFormData({ ...formData, beverageName: e.target.value })}
              className="w-full p-2 rounded border bg-black/10 border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium mb-1">
              Reason (Optional)
            </label>
            <textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full p-2 rounded border bg-black/10 border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Submit
          </button>
        </form>

        {submitStatus.type && (
          <div
            className={`mt-4 p-3 rounded ${
              submitStatus.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}
          >
            {submitStatus.message}
          </div>
        )}
      </div>
    </div>
  );
} 