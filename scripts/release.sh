#!/bin/bash

# Emscripten Compiler GUI Release Script
# Usage: ./scripts/release.sh <version>
# Example: ./scripts/release.sh v1.0.0

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: ./scripts/release.sh <version>"
    echo "Example: ./scripts/release.sh v1.0.0"
    exit 1
fi

# Ensure version starts with 'v'
if [[ ! "$VERSION" =~ ^v ]]; then
    VERSION="v$VERSION"
fi

# Extract version number without 'v' prefix
VERSION_NUM="${VERSION#v}"

echo "🚀 Creating release $VERSION..."

# Check if CHANGELOG.md has this version
if ! grep -q "## $VERSION_NUM" CHANGELOG.md; then
    echo "❌ Error: Version $VERSION_NUM not found in CHANGELOG.md"
    echo "Please add an entry for this version first."
    exit 1
fi

# Update package.json version
echo "📝 Updating package.json version to $VERSION_NUM..."
pnpm version "$VERSION_NUM" --no-git-tag-version --allow-same-version

# Build the project
echo "📦 Building project..."
pnpm build

# Check if dist-standalone/index.html exists
if [ ! -f "dist-standalone/index.html" ]; then
    echo "❌ Error: dist-standalone/index.html not found!"
    exit 1
fi

echo "📊 File size: $(du -h dist-standalone/index.html | cut -f1)"

# Extract changelog for this version (from "## X.Y.Z" to next "##" or EOF)
CHANGELOG_SECTION=$(sed -n "/^## $VERSION_NUM$/,/^## /p" CHANGELOG.md | head -n -1 | tail -n +2)

# Create GitHub release with the file
echo "🌐 Creating GitHub release..."
gh release create "$VERSION" \
    --title "$VERSION" \
    --notes "### 📦 Download

Download \`index.html\` and open it in your browser - no server required!

### Changelog

$CHANGELOG_SECTION

---

**Full Changelog**: https://github.com/TTT1231/emccgui/commits/$VERSION
" \
    dist-standalone/index.html

# Commit version update
echo "📋 Committing version update..."
git add package.json
git commit -m "chore: bump version to $VERSION_NUM"

echo "✅ Release $VERSION created successfully!"
echo "🔗 https://github.com/TTT1231/emccgui/releases/tag/$VERSION"
echo ""
echo "⚠️  Don't forget to push: git push origin main"
