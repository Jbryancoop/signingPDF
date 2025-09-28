#!/bin/bash

echo "🔍 Checking Firebase Emulator Status..."
echo ""

# Check Auth Emulator
if curl -s http://localhost:9099 > /dev/null; then
    echo "✅ Authentication Emulator - Running on port 9099"
else
    echo "❌ Authentication Emulator - Not running"
fi

# Check Firestore Emulator
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Firestore Emulator - Running on port 8080"
else
    echo "❌ Firestore Emulator - Not running"
fi

# Check Storage Emulator
if curl -s http://localhost:9199 > /dev/null; then
    echo "✅ Storage Emulator - Running on port 9199"
else
    echo "❌ Storage Emulator - Not running"
fi

# Check Emulator UI
if curl -s http://localhost:4000 > /dev/null; then
    echo "✅ Emulator UI - Running on port 4000"
    echo ""
    echo "🌐 Open Firebase Emulator UI: http://localhost:4000"
else
    echo "❌ Emulator UI - Not running"
fi

echo ""
echo "🚀 Your Next.js app should be running at: http://localhost:3000"

