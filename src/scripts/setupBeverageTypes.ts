import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import type { BeverageType } from '@/types/beverage';

const initialBeverageTypes = [
  { name: 'Coffee' },
  { name: 'Tea' },
  { name: 'Beer' },
  { name: 'Soft Drink' },
  { name: 'Energy Drink' },
  { name: 'Juice' },
  { name: 'Water' },
  { name: 'Hot Chocolate' },
  { name: 'Smoothie' },
  { name: 'Milkshake' },
];

async function setupBeverageTypes() {
  console.log('Starting beverage types setup...');
  
  try {
    // Reference to the collection
    const beverageCollection = collection(db, 'owed-kind-of-stuff');
    console.log('Collection reference created');

    // Check existing beverage types
    console.log('Checking existing beverage types...');
    const existingTypes = await getDocs(beverageCollection);
    console.log(`Found ${existingTypes.size} existing beverage types`);
    
    const existingNames = new Set(existingTypes.docs.map(doc => doc.data().name));

    // Add only new beverage types
    let addedCount = 0;
    let skippedCount = 0;

    for (const beverageType of initialBeverageTypes) {
      if (!existingNames.has(beverageType.name)) {
        try {
          await addDoc(beverageCollection, beverageType);
          console.log(`✓ Added beverage type: ${beverageType.name}`);
          addedCount++;
        } catch (error) {
          console.error(`✗ Failed to add ${beverageType.name}:`, error);
        }
      } else {
        console.log(`- Skipping existing beverage type: ${beverageType.name}`);
        skippedCount++;
      }
    }

    console.log('\nSetup Summary:');
    console.log(`Added: ${addedCount} beverage types`);
    console.log(`Skipped: ${skippedCount} existing types`);
    console.log('Setup completed!');
  } catch (error) {
    console.error('Error during setup:', error);
    process.exit(1);
  }
}

// Run the setup
setupBeverageTypes(); 