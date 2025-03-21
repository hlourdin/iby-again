'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, FirestoreError, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Beverage {
  id: string;
  owedBy: string;
  owedTo: string;
  beverageName: string;
  reason?: string;
  isPaid: boolean;
  createdAt: string;
}

type FilterStatus = 'all' | 'pending' | 'redeemed';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<string>('Loading beverages...');
  const [beverages, setBeverages] = useState<Beverage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }

    if (user) {
      fetchBeverages();
    }
  }, [user, authLoading, router]);

  const fetchBeverages = async () => {
    try {
      const collectionRef = collection(db, 'owed-bevarages');
      const beveragesQuery = query(collectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(beveragesQuery);
      
      const beveragesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Beverage[];

      setBeverages(beveragesList);
      setConnectionStatus(`Found ${querySnapshot.size} beverages`);
      setError(null);
    } catch (error) {
      console.error('Error fetching beverages:', error);
      const errorMessage = error instanceof FirestoreError 
        ? error.message 
        : 'An unexpected error occurred';
      setError(errorMessage);
      setConnectionStatus('Failed to load beverages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeem = async (beverageId: string) => {
    try {
      setUpdatingId(beverageId);
      const beverageRef = doc(db, 'owed-bevarages', beverageId);
      await updateDoc(beverageRef, {
        isPaid: true
      });
      
      await fetchBeverages();
      
      setConnectionStatus('Successfully redeemed!');
      setTimeout(() => {
        setConnectionStatus(`Found ${beverages.length} beverages`);
      }, 2000);
    } catch (error) {
      console.error('Error redeeming beverage:', error);
      const errorMessage = error instanceof FirestoreError 
        ? error.message 
        : 'Failed to redeem beverage';
      setError(errorMessage);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
    }
  };

  const filteredBeverages = beverages.filter(beverage => {
    const matchesStatus = filterStatus === 'all' 
      || (filterStatus === 'pending' && !beverage.isPaid)
      || (filterStatus === 'redeemed' && beverage.isPaid);

    if (!matchesStatus) return false;

    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      (beverage.owedBy?.toLowerCase() || '').includes(searchLower) ||
      (beverage.owedTo?.toLowerCase() || '').includes(searchLower) ||
      (beverage.beverageName?.toLowerCase() || '').includes(searchLower) ||
      (beverage.reason?.toLowerCase() || '').includes(searchLower)
    );
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto text-center">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <main className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">IOYO - I owe you one</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="text-blue-400 hover:text-blue-300"
            >
              Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="text-red-400 hover:text-red-300"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <Link
            href="/submit"
            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            + New Beverage
          </Link>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none ${
                filterStatus === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none ${
                filterStatus === 'pending'
                  ? 'bg-yellow-500/30 text-yellow-400'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('redeemed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none ${
                filterStatus === 'redeemed'
                  ? 'bg-green-500/30 text-green-400'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }`}
            >
              Redeemed
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, beverage, or reason..."
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 
                focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                placeholder-white/50 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 
                  hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
            <p className="text-red-500">{error}</p>
          </div>
        ) : filteredBeverages.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-lg">
            <p className="text-gray-400">
              {beverages.length === 0
                ? 'No beverages found. Add your first one!'
                : searchQuery
                ? 'No beverages match your search'
                : `No ${filterStatus} beverages found.`}
            </p>
          </div>
        ) : (
          <div className="bg-white/5 rounded-lg overflow-hidden overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/10">
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold">Owed By</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold">Owed To</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold">Beverage</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold hidden sm:table-cell">Reason</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold">Created</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredBeverages.map((beverage) => (
                    <tr key={beverage.id} className="hover:bg-white/5">
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">{beverage.owedBy}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">{beverage.owedTo}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">{beverage.beverageName}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm hidden sm:table-cell">{beverage.reason || '-'}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        {new Date(beverage.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          beverage.isPaid 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {beverage.isPaid ? 'Redeemed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        {!beverage.isPaid && (
                          <button
                            onClick={() => handleRedeem(beverage.id)}
                            disabled={updatingId === beverage.id}
                            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap
                              ${updatingId === beverage.id
                                ? 'bg-gray-500 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 transition-colors'
                              } text-white`}
                          >
                            {updatingId === beverage.id ? 'Redeeming...' : 'Redeem'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 text-center text-xs sm:text-sm text-gray-400">
          {connectionStatus}
          {filteredBeverages.length !== beverages.length && (
            <span> • Showing {filteredBeverages.length} of {beverages.length} beverages</span>
          )}
        </div>
      </main>
    </div>
  );
}
