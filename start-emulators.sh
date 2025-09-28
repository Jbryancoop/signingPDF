#!/bin/bash

echo "🔥 Starting Firebase Emulators for PDF Signer..."
echo ""
echo "This will start:"
echo "  - Authentication Emulator on port 9099"
echo "  - Firestore Emulator on port 8080" 
echo "  - Storage Emulator on port 9199"
echo "  - Emulator UI on port 4000"
echo ""

# Set Java PATH
export PATH="/opt/homebrew/opt/openjdk@11/bin:$PATH"

# Kill any existing emulator processes
pkill -f "firebase emulators"

# Start the emulators
firebase emulators:start --only auth,firestore,storage --project pdfsignature-b4b30
