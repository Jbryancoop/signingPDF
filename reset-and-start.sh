#!/bin/bash

echo "🔄 Resetting and starting PDF Signer environment..."

# Kill any existing processes on our ports
echo "🛑 Killing existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
lsof -ti:4001 | xargs kill -9 2>/dev/null || true
lsof -ti:4400 | xargs kill -9 2>/dev/null || true
lsof -ti:4401 | xargs kill -9 2>/dev/null || true
lsof -ti:4500 | xargs kill -9 2>/dev/null || true
lsof -ti:4501 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:9099 | xargs kill -9 2>/dev/null || true
lsof -ti:9199 | xargs kill -9 2>/dev/null || true

# Kill any firebase or next processes
pkill -f "firebase" 2>/dev/null || true
pkill -f "next" 2>/dev/null || true
pkill -f "node.*dev" 2>/dev/null || true

echo "⏳ Waiting for processes to terminate..."
sleep 3

# Clear Next.js cache
echo "🧹 Clearing Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache

# Clear Firebase emulator data
echo "🧹 Clearing Firebase emulator data..."
rm -rf firebase-debug.log
rm -rf firestore-debug.log
rm -rf ui-debug.log

echo "🚀 Starting Firebase emulators..."
firebase emulators:start --only auth,firestore,storage &
FIREBASE_PID=$!

echo "⏳ Waiting for Firebase emulators to start..."
sleep 10

echo "🚀 Starting Next.js development server..."
npm run dev &
NEXTJS_PID=$!

echo "✅ Environment started!"
echo "📱 Next.js: http://localhost:3000"
echo "🔥 Firebase UI: http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $FIREBASE_PID 2>/dev/null || true
    kill $NEXTJS_PID 2>/dev/null || true
    
    # Kill any remaining processes
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:4000 | xargs kill -9 2>/dev/null || true
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    lsof -ti:9099 | xargs kill -9 2>/dev/null || true
    lsof -ti:9199 | xargs kill -9 2>/dev/null || true
    
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
