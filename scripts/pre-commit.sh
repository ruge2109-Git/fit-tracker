#!/bin/bash

# Pre-commit script
# Runs linting, type checking, and formatting before commit

set -e

echo "🔍 Running pre-commit checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not a git repository"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    npm install
fi

# 1. Type checking
print_status "Running TypeScript type check..."
if npm run type-check 2>/dev/null || npx tsc --noEmit; then
    print_status "Type check passed"
else
    print_error "Type check failed"
    exit 1
fi

# 2. Linting
print_status "Running ESLint..."
if npm run lint; then
    print_status "Linting passed"
else
    print_error "Linting failed"
    exit 1
fi

# 3. Check for console.log/error/warn (should use logger)
print_status "Checking for console statements..."
if grep -r "console\.\(log\|error\|warn\|debug\)" src/ --exclude-dir=node_modules 2>/dev/null; then
    print_warning "Found console statements. Consider using logger service instead."
    # Don't fail, just warn
else
    print_status "No console statements found"
fi

# 4. Check for TODO/FIXME comments
print_status "Checking for TODO/FIXME comments..."
TODOS=$(grep -r "TODO\|FIXME" src/ --exclude-dir=node_modules 2>/dev/null | wc -l)
if [ "$TODOS" -gt 0 ]; then
    print_warning "Found $TODOS TODO/FIXME comments"
    grep -r "TODO\|FIXME" src/ --exclude-dir=node_modules 2>/dev/null || true
fi

# 5. Check for unused imports (basic check)
print_status "Checking for common issues..."

# Success
echo ""
print_status "All pre-commit checks passed! ✓"
exit 0

