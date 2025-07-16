#!/bin/bash

# Ping script to check all RiddleMeThis services
echo "🏥 RiddleMeThis Health Check"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check service health
check_service() {
    local name="$1"
    local url="$2"
    local timeout="${3:-5}"
    
    printf "%-25s" "$name:"
    
    if response=$(curl -s -m $timeout "$url" 2>/dev/null); then
        if echo "$response" | grep -q "healthy\|<!DOCTYPE html\|<html"; then
            echo -e "${GREEN}✅ UP${NC}"
            
            # Extract version info if it's an API
            if echo "$response" | grep -q "version"; then
                version=$(echo "$response" | jq -r '.version // empty' 2>/dev/null)
                gitSha=$(echo "$response" | jq -r '.gitSha // empty' 2>/dev/null)
                env=$(echo "$response" | jq -r '.environment // empty' 2>/dev/null)
                if [ -n "$version" ]; then
                    echo "                         Version: $version | SHA: $gitSha | Env: $env"
                fi
            fi
        else
            echo -e "${YELLOW}⚠️  RESPONSE${NC}"
        fi
    else
        echo -e "${RED}❌ DOWN${NC}"
    fi
}

# Function to check if local server is running
check_local() {
    local name="$1"
    local url="$2"
    
    printf "%-25s" "$name:"
    
    if curl -s -m 2 "$url" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ RUNNING${NC}"
        # Get version info for local API
        if [[ "$url" == *"8787"* ]]; then
            response=$(curl -s -m 2 "$url/health" 2>/dev/null)
            if [ $? -eq 0 ]; then
                version=$(echo "$response" | jq -r '.version // empty' 2>/dev/null)
                gitSha=$(echo "$response" | jq -r '.gitSha // empty' 2>/dev/null)
                env=$(echo "$response" | jq -r '.environment // empty' 2>/dev/null)
                if [ -n "$version" ]; then
                    echo "                         Version: $version | SHA: $gitSha | Env: $env"
                fi
            fi
        fi
    else
        echo -e "${BLUE}💤 NOT RUNNING${NC}"
    fi
}

echo ""
echo "🏠 Local Development:"
check_local "Local API" "http://localhost:8787"
check_local "Local Web" "http://localhost:5173"

echo ""
echo "🧪 Development (Remote):"
check_service "Dev API" "https://riddle-me-this-api-dev.benmiriello.workers.dev/health"

echo ""
echo "🚀 Production:"
check_service "Prod API (Workers)" "https://riddle-me-this-api.benmiriello.workers.dev/health"
check_service "Prod API (Custom)" "https://api.riddlemethis.io/health"
check_service "Prod Web" "https://riddlemethis.io/"

echo ""
echo "📊 Version Sync Check:"
# Get current git SHA
current_sha=$(git rev-parse HEAD 2>/dev/null | cut -c1-7)
if [ -n "$current_sha" ]; then
    echo "Local Git SHA: $current_sha"
    
    # Check production version
    prod_response=$(curl -s -m 5 "https://api.riddlemethis.io/health" 2>/dev/null)
    if [ $? -eq 0 ]; then
        prod_sha=$(echo "$prod_response" | jq -r '.gitSha // empty' 2>/dev/null)
        if [ -n "$prod_sha" ]; then
            if [ "$current_sha" = "$prod_sha" ]; then
                echo -e "Local ($current_sha) ${GREEN}= ${NC}Production ($prod_sha)"
            else
                # Count how many commits local is ahead of production
                ahead_count=$(git rev-list --count ${prod_sha}..HEAD 2>/dev/null || echo "0")
                # Count how many commits production is ahead of local  
                behind_count=$(git rev-list --count HEAD..${prod_sha} 2>/dev/null || echo "0")
                
                if [ "$ahead_count" != "0" ] && [ "$behind_count" = "0" ]; then
                    echo -e "Local ($current_sha) ${GREEN}> ${NC}Production ($prod_sha) by $ahead_count commits"
                elif [ "$behind_count" != "0" ] && [ "$ahead_count" = "0" ]; then
                    echo -e "Local ($current_sha) ${YELLOW}< ${NC}Production ($prod_sha) by $behind_count commits"
                else
                    echo -e "Local ($current_sha) ${NC}≠ ${NC}Production ($prod_sha) (diverged)"
                fi
            fi
        fi
    fi
fi
