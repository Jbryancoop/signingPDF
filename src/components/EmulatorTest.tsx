"use client";

import { useState } from 'react';
import { auth, db, storage } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function EmulatorTest() {
  const [status, setStatus] = useState('Ready to test');
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTests = async () => {
    setStatus('Running tests...');
    setResults([]);
    
    try {
      // Test 1: Auth Emulator
      addResult('🔐 Testing Auth emulator...');
      const testEmail = `test${Date.now()}@example.com`;
      const testPassword = 'testpassword123';
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        addResult(`✅ Auth: User created successfully (${userCredential.user.uid})`);
        
        // Sign out and sign back in
        await auth.signOut();
        await signInWithEmailAndPassword(auth, testEmail, testPassword);
        addResult('✅ Auth: Sign in successful');
      } catch (authError: any) {
        addResult(`❌ Auth: ${authError.message}`);
      }

      // Test 2: Firestore Emulator
      addResult('🔥 Testing Firestore emulator...');
      try {
        const testDoc = doc(db, 'test', 'emulator-test');
        await setDoc(testDoc, {
          message: 'Hello from emulator test!',
          timestamp: new Date(),
          testId: Date.now()
        });
        addResult('✅ Firestore: Document written successfully');
        
        const docSnap = await getDoc(testDoc);
        if (docSnap.exists()) {
          addResult(`✅ Firestore: Document read successfully (${docSnap.data().message})`);
        } else {
          addResult('❌ Firestore: Document not found after write');
        }
      } catch (firestoreError: any) {
        addResult(`❌ Firestore: ${firestoreError.message}`);
      }

      // Test 3: Storage Emulator
      addResult('📁 Testing Storage emulator...');
      try {
        const testFile = new Blob(['Hello from storage test!'], { type: 'text/plain' });
        const storageRef = ref(storage, `test/emulator-test-${Date.now()}.txt`);
        
        const snapshot = await uploadBytes(storageRef, testFile);
        addResult('✅ Storage: File uploaded successfully');
        
        const downloadURL = await getDownloadURL(snapshot.ref);
        addResult(`✅ Storage: Download URL generated (${downloadURL.substring(0, 50)}...)`);
      } catch (storageError: any) {
        addResult(`❌ Storage: ${storageError.message}`);
      }

      setStatus('Tests completed!');
      addResult('🎉 All emulator tests finished');
      
    } catch (error: any) {
      addResult(`❌ General error: ${error.message}`);
      setStatus('Tests failed');
    }
  };

  return (
    <div className="card bg-base-100 shadow-lg border border-base-300 max-w-2xl mx-auto">
      <div className="card-body">
        <h2 className="card-title">🧪 Firebase Emulator Test</h2>
        <p className="text-base-content/70">
          Test Firebase emulators to ensure they're working correctly.
        </p>
        
        <div className="alert alert-info">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Status: {status}</span>
        </div>

        <button 
          onClick={runTests}
          className="btn btn-primary"
          disabled={status === 'Running tests...'}
        >
          {status === 'Running tests...' ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Running Tests...
            </>
          ) : (
            'Run Emulator Tests'
          )}
        </button>

        {results.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <div className="bg-base-200 p-4 rounded-lg max-h-64 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
