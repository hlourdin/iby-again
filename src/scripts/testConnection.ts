import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function testConnection() {
  console.log('Testing Firebase connection...');
  console.log('Firebase config:', {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  });

  try {
    const testCollection = collection(db, 'owed-kind-of-stuff');
    console.log('Collection reference created successfully');

    const snapshot = await getDocs(testCollection);
    console.log('Successfully connected to Firestore!');
    console.log(`Found ${snapshot.size} documents in the collection`);
    
    snapshot.forEach(doc => {
      console.log('Document:', doc.id, '=>', doc.data());
    });
  } catch (error) {
    console.error('Error connecting to Firestore:', error);
    process.exit(1);
  }
}

testConnection(); 