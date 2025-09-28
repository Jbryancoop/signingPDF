#!/bin/bash

echo "🚀 Starting PDF Signer Development Environment..."
echo ""

# Set Java PATH for Firebase emulators
export PATH="/opt/homebrew/opt/openjdk@11/bin:$PATH"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    pkill -f "firebase emulators"
    pkill -f "next dev"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup SIGINT

# Start Firebase emulators in background
echo "🔥 Starting Firebase emulators..."
firebase emulators:start --only auth,firestore,storage --project pdfsignature-b4b30 &
FIREBASE_PID=$!

# Wait for emulators to start
sleep 5

# Start Next.js dev server
echo "⚡ Starting Next.js development server..."
npm run dev &
NEXTJS_PID=$!

echo ""
echo "✅ Services started successfully!"
echo ""
echo "📱 Next.js App: http://localhost:3000"
echo "🔥 Firebase UI: http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait $FIREBASE_PID $NEXTJS_PID

