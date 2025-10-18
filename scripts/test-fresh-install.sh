#!/bin/bash

echo "🧪 Testing fresh installation process..."

# Create a temporary directory for testing
TEST_DIR="/tmp/betaflow-test-$(date +%s)"
echo "📁 Creating test directory: $TEST_DIR"

# Copy current project to test directory
cp -r . "$TEST_DIR"
cd "$TEST_DIR"

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Testing database setup..."
npm run setup-db

echo "🔧 Testing TypeScript compilation..."
npx tsc --noEmit

echo "🏗️ Testing build process..."
npm run build

echo "✅ Fresh installation test completed successfully!"
echo "📁 Test directory: $TEST_DIR"
echo "🧹 Clean up with: rm -rf $TEST_DIR"
