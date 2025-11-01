#!/bin/bash

# Script to launch Chrome with remote debugging enabled for Puppeteer MCP
# Usage: ./scripts/chrome-debug.sh [port]

PORT=${1:-9222}
DEBUG_PROFILE="/tmp/chrome-debug-profile"

# Try to find Chrome installation
if [ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
    CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
elif [ -f "$HOME/.cache/puppeteer/chrome/mac_arm-131.0.6778.204/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" ]; then
    CHROME_PATH="$HOME/.cache/puppeteer/chrome/mac_arm-131.0.6778.204/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
else
    echo "❌ Chrome not found. Please install Google Chrome or ensure Puppeteer Chrome is available."
    exit 1
fi

echo "🔍 Checking if Chrome is already running on port $PORT..."

# Check if port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ Chrome is already running on port $PORT"
    echo "🌐 Debug endpoint: http://localhost:$PORT"
    exit 0
fi

echo "🚀 Launching Chrome with remote debugging on port $PORT..."
echo "📁 Using profile: $DEBUG_PROFILE"
echo "🔧 Chrome path: $CHROME_PATH"
echo ""

# Kill any existing Chrome processes to avoid conflicts
pkill -f "Google Chrome" 2>/dev/null
pkill -f "Chrome for Testing" 2>/dev/null

# Wait a moment for processes to clean up
sleep 1

# Launch Chrome with debugging enabled
"$CHROME_PATH" \
    --remote-debugging-port=$PORT \
    --user-data-dir="$DEBUG_PROFILE" \
    --no-first-run \
    --no-default-browser-check \
    about:blank > /dev/null 2>&1 &

CHROME_PID=$!

# Wait for Chrome to start and debugging port to be available
echo "⏳ Waiting for Chrome to start..."
for i in {1..10}; do
    sleep 1
    if curl -s http://localhost:$PORT/json/version > /dev/null 2>&1; then
        echo ""
        echo "✅ Chrome is running with remote debugging enabled!"
        echo "🌐 Debug endpoint: http://localhost:$PORT"
        echo "🔍 Chrome PID: $CHROME_PID"
        echo ""
        echo "💡 You can now use Puppeteer MCP to connect to this Chrome instance."
        echo "💡 To stop Chrome, run: kill $CHROME_PID"
        exit 0
    fi
    echo -n "."
done

echo ""
echo "⚠️  Chrome started but debugging port may not be ready yet."
echo "🔍 Chrome PID: $CHROME_PID"
echo "💡 Try running: curl http://localhost:$PORT/json/version"
