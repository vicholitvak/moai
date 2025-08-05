#!/usr/bin/env tsx

// Script to check if Firebase indexes are ready
// Run with: npx tsx scripts/checkIndexStatus.ts

import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase/client';

async function checkIndexStatus() {
  console.log('🔍 Checking Firebase index status...\n');
  
  try {
    // Test the dishes index (cookerId + createdAt)
    console.log('Testing dishes index (cookerId + createdAt)...');
    const testQuery = query(
      collection(db, 'dishes'),
      where('cookerId', '==', 'test-cook-id'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const startTime = Date.now();
    await getDocs(testQuery);
    const endTime = Date.now();
    
    console.log('✅ Dishes index is ready!');
    console.log(`   Query executed in ${endTime - startTime}ms`);
    
  } catch (error) {
    if ((error as any).code === 'failed-precondition' && (error as any).message.includes('index')) {
      console.log('⏳ Dishes index is still building...');
      console.log('   This is normal and can take several minutes.');
      console.log('   The app will use fallback methods until the index is ready.');
      
      // Extract the console link if available
      const match = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
      if (match) {
        console.log(`   Check status: ${match[0]}`);
      }
    } else {
      console.log('❌ Error testing index:', error.message);
    }
  }
  
  console.log('\n💡 Tip: Run this script periodically to check if indexes are ready.');
  console.log('   Once ready, dish pages will load faster with direct database queries.');
}

checkIndexStatus().catch(console.error);