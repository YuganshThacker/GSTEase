#!/bin/bash

# Quick pgAdmin Setup Script

echo "======================================"
echo "pgAdmin Setup for GSTEaseSuite"
echo "======================================"
echo ""

# Check if pgAdmin is already installed
if [ -d "/Applications/pgAdmin 4.app" ]; then
    echo "✅ pgAdmin 4 is already installed!"
    echo ""
    echo "Opening pgAdmin..."
    open -a "pgAdmin 4"
else
    echo "❌ pgAdmin 4 is not installed."
    echo ""
    echo "Please install pgAdmin 4:"
    echo "1. Visit: https://www.pgadmin.org/download/pgadmin-4-macos/"
    echo "2. Download the latest .dmg file"
    echo "3. Install it to Applications folder"
    echo ""
    echo "Or install via Homebrew (may take longer):"
    echo "   brew install --cask pgadmin4"
    exit 1
fi

echo ""
echo "======================================"
echo "Connection Details for pgAdmin"
echo "======================================"
echo "Host:     localhost"
echo "Port:     5432"
echo "Database: gstease"
echo "Username: yugansh  ⚠️  USE THIS! NOT 'postgres'"
echo "Password: (leave BLANK)"
echo ""
echo "======================================"
echo "Next Steps:"
echo "======================================"
echo "1. In pgAdmin, right-click 'Servers'"
echo "2. Select 'Create' → 'Server'"
echo "3. General tab: Name = 'GSTEaseSuite'"
echo "4. Connection tab: Enter the details above"
echo "5. Save and connect!"
echo ""
echo "Then navigate to:"
echo "Servers → GSTEaseSuite → Databases → gstease → Schemas → public → Tables"
echo ""
echo "You'll see all 15 tables! 🎉"
echo ""
