#!/bin/bash
# Install git hooks for automatic branch sync checking

echo "🔧 Installing git hooks..."

# Copy post-checkout hook
cp scripts/post-checkout .git/hooks/post-checkout
chmod +x .git/hooks/post-checkout

echo "✅ Git hooks installed successfully!"
echo ""
echo "📋 What this does:"
echo "   • When you checkout any branch, checks if it's behind remote"
echo "   • For riddle-me-this project: also checks for version mismatches"
echo "   • Offers to pull changes interactively"
echo ""
echo "🎯 Test it: git checkout main (or any other branch)"
