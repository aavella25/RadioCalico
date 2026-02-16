#!/bin/bash
# Security scanning script for Radio Calico
# Runs npm audit and generates security reports

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 Radio Calico Security Scanner${NC}"
echo ""

# Parse command line arguments
COMMAND=${1:-scan}
FIX_MODE=${2:-}

case $COMMAND in
  scan)
    echo -e "${BLUE}📊 Running npm audit...${NC}"
    echo ""

    # Run npm audit and capture exit code
    if npm audit --json > audit-report.json 2>&1; then
      AUDIT_EXIT_CODE=0
    else
      AUDIT_EXIT_CODE=$?
    fi

    # Display human-readable report
    echo -e "${BLUE}Security Audit Report:${NC}"
    npm audit

    # Parse JSON report for summary
    if command -v jq &> /dev/null; then
      echo ""
      echo -e "${BLUE}📈 Vulnerability Summary:${NC}"
      jq -r '.metadata.vulnerabilities | "  Critical: \(.critical)\n  High: \(.high)\n  Moderate: \(.moderate)\n  Low: \(.low)\n  Info: \(.info)\n  Total: \(.total)"' audit-report.json
    fi

    echo ""
    echo -e "${GREEN}✅ Audit report saved to: audit-report.json${NC}"

    # Exit with audit exit code
    exit $AUDIT_EXIT_CODE
    ;;

  fix)
    echo -e "${YELLOW}⚠️  Attempting to fix vulnerabilities...${NC}"
    echo ""

    if [ "$FIX_MODE" == "--force" ]; then
      echo -e "${RED}🔧 Running npm audit fix --force (may introduce breaking changes)${NC}"
      read -p "Are you sure? (y/N) " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm audit fix --force
        echo ""
        echo -e "${GREEN}✅ Force fix applied. Please test your application!${NC}"
      else
        echo -e "${YELLOW}❌ Cancelled${NC}"
        exit 1
      fi
    else
      echo -e "${BLUE}🔧 Running npm audit fix (safe fixes only)${NC}"
      npm audit fix
      echo ""
      echo -e "${GREEN}✅ Safe fixes applied${NC}"
    fi

    # Run audit again to show remaining issues
    echo ""
    echo -e "${BLUE}📊 Running audit again to check remaining issues...${NC}"
    npm audit || true
    ;;

  report)
    echo -e "${BLUE}📄 Generating detailed security report...${NC}"

    # Generate JSON report
    npm audit --json > audit-report.json 2>&1 || true

    # Generate markdown report
    cat > SECURITY_REPORT.md <<EOF
# Security Audit Report
Generated: $(date)

## Summary

EOF

    if command -v jq &> /dev/null; then
      echo "### Vulnerability Counts" >> SECURITY_REPORT.md
      echo "" >> SECURITY_REPORT.md
      jq -r '.metadata.vulnerabilities | "- **Critical**: \(.critical)\n- **High**: \(.high)\n- **Moderate**: \(.moderate)\n- **Low**: \(.low)\n- **Info**: \(.info)\n- **Total**: \(.total)"' audit-report.json >> SECURITY_REPORT.md
      echo "" >> SECURITY_REPORT.md

      # Add dependencies count
      echo "### Dependencies" >> SECURITY_REPORT.md
      echo "" >> SECURITY_REPORT.md
      jq -r '.metadata.dependencies | "- **Total**: \(.total)\n- **Production**: \(.prod)\n- **Development**: \(.dev)\n- **Optional**: \(.optional)"' audit-report.json >> SECURITY_REPORT.md
      echo "" >> SECURITY_REPORT.md
    fi

    # Add full audit output
    echo "## Full Audit Output" >> SECURITY_REPORT.md
    echo "" >> SECURITY_REPORT.md
    echo '```' >> SECURITY_REPORT.md
    npm audit >> SECURITY_REPORT.md 2>&1 || true
    echo '```' >> SECURITY_REPORT.md

    echo ""
    echo -e "${GREEN}✅ Security reports generated:${NC}"
    echo "   - audit-report.json (machine-readable)"
    echo "   - SECURITY_REPORT.md (human-readable)"
    ;;

  check-production)
    echo -e "${BLUE}🐳 Scanning production dependencies only...${NC}"
    echo ""
    npm audit --production
    ;;

  *)
    echo "Radio Calico - Security Scanner"
    echo ""
    echo "Usage: ./security-scan.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  scan                Run security audit and save report"
    echo "  fix                 Apply safe security fixes"
    echo "  fix --force         Apply all fixes (may break compatibility)"
    echo "  report              Generate detailed security reports"
    echo "  check-production    Audit production dependencies only"
    echo ""
    echo "Examples:"
    echo "  ./security-scan.sh scan"
    echo "  ./security-scan.sh fix"
    echo "  ./security-scan.sh fix --force"
    echo "  ./security-scan.sh report"
    echo "  ./security-scan.sh check-production"
    ;;
esac
