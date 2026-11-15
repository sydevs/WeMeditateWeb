#!/bin/bash

# Launches Chrome with remote debugging enabled, for the Playwright MCP's --cdp-endpoint mode.
# Usage: ./scripts/chrome-debug.sh [port]

PORT=${1:-9222}
DEBUG_PROFILE="/tmp/chrome-debug-profile"

# Find the Chrome executable
if [ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
    CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
else
    echo "❌ Chrome not found. Please install Google Chrome."
    exit 1
fi

echo "🔍 Checking if Chrome is already running on port $PORT..."

# Check whether the port is already in use
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

# Wait a moment for old processes to exit
sleep 1

# Launch Chrome with debugging enabled
"$CHROME_PATH" \
    --remote-debugging-port=$PORT \
    --user-data-dir="$DEBUG_PROFILE" \
    --no-first-run \
    --no-default-browser-check \
    about:blank > /dev/null 2>&1 &

CHROME_PID=$!

# Wait for Chrome to start and the debugging port to open
echo "⏳ Waiting for Chrome to start..."
for i in {1..10}; do
    sleep 1
    if curl -s http://localhost:$PORT/json/version > /dev/null 2>&1; then
        echo ""
        echo "✅ Chrome is running with remote debugging enabled!"
        echo "🌐 Debug endpoint: http://localhost:$PORT"
        echo "🔍 Chrome PID: $CHROME_PID"
        echo ""
        echo "💡 Point the Playwright MCP at it with --cdp-endpoint http://localhost:$PORT (see MCP_USAGE.md)."
        echo "💡 To stop Chrome, run: kill $CHROME_PID"
        exit 0
    fi
    echo -n "."
done

echo ""
echo "⚠️  Chrome started but debugging port may not be ready yet."
echo "🔍 Chrome PID: $CHROME_PID"
echo "💡 Try running: curl http://localhost:$PORT/json/version"
