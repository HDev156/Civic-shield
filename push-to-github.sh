#!/bin/bash

echo "🚀 Civic Shield - Push to GitHub"
echo "================================"
echo ""

# Check if git is configured
if ! git config user.name > /dev/null 2>&1; then
    echo "⚠️  Git user not configured. Please run:"
    echo "   git config --global user.name \"Your Name\""
    echo "   git config --global user.email \"your.email@example.com\""
    exit 1
fi

echo "Current git user: $(git config user.name) <$(git config user.email)>"
echo ""

# Ask for GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ GitHub username is required"
    exit 1
fi

# Ask for repository name
read -p "Enter repository name (default: civic-shield): " REPO_NAME
REPO_NAME=${REPO_NAME:-civic-shield}

# Construct repository URL
REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

echo ""
echo "📋 Repository Details:"
echo "   Username: $GITHUB_USERNAME"
echo "   Repository: $REPO_NAME"
echo "   URL: $REPO_URL"
echo ""

# Check if remote already exists
if git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  Remote 'origin' already exists"
    EXISTING_URL=$(git remote get-url origin)
    echo "   Current URL: $EXISTING_URL"
    read -p "Do you want to update it? (y/n): " UPDATE_REMOTE
    
    if [ "$UPDATE_REMOTE" = "y" ]; then
        git remote set-url origin "$REPO_URL"
        echo "✅ Remote URL updated"
    fi
else
    # Add remote
    git remote add origin "$REPO_URL"
    echo "✅ Remote 'origin' added"
fi

echo ""
echo "🚀 Pushing to GitHub..."
echo ""

# Push to GitHub
if git push -u origin master; then
    echo ""
    echo "✅ SUCCESS! Code pushed to GitHub"
    echo ""
    echo "🎉 Your repository is now available at:"
    echo "   https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Visit your repository on GitHub"
    echo "   2. Add topics/tags for discoverability"
    echo "   3. Enable Issues if you want bug reports"
    echo "   4. Share the repository URL!"
else
    echo ""
    echo "❌ Push failed!"
    echo ""
    echo "Common issues:"
    echo "   1. Repository doesn't exist on GitHub"
    echo "      → Create it at: https://github.com/new"
    echo "      → Name: $REPO_NAME"
    echo "      → Don't initialize with README"
    echo ""
    echo "   2. Authentication failed"
    echo "      → You may need to use a Personal Access Token"
    echo "      → Create one at: https://github.com/settings/tokens"
    echo "      → Use token as password when prompted"
    echo ""
    echo "   3. Permission denied"
    echo "      → Make sure you own the repository"
    echo "      → Check repository name is correct"
fi
