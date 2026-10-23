#!/bin/sh
# Start the blog admin desktop app (dev mode, `npm run admin:app`) when you log in to macOS.
#
#   npm run admin:startup:mac          add it as a LaunchAgent
#   npm run admin:startup:mac:remove   take it out again
#
# It runs in the background and writes its output to admin/startup.log.
# Launch agents don't get your shell's PATH (nvm, Homebrew, ~/.cargo/bin), so the PATH you run this
# with is saved into the agent. Run it again after switching Node versions.
set -e

repo=$(cd "$(dirname "$0")/.." && pwd)
label=com.portfolio.blogadmin.startup
plist="$HOME/Library/LaunchAgents/$label.plist"

if [ "$1" = "--remove" ]; then
    if [ -f "$plist" ]; then rm "$plist"; echo "Removed $plist"
    else echo 'Blog Admin is not set to start on login.'; fi
    exit 0
fi

npm=$(command -v npm)
# drop the node_modules/.bin entries `npm run` adds
path=$(printf '%s' "$PATH" | tr ':' '\n' | grep -v '/node_modules/' | paste -sd: -)
log="$repo/admin/startup.log"

mkdir -p "$(dirname "$plist")"
cat > "$plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$label</string>
    <key>ProgramArguments</key>
    <array>
        <string>$npm</string>
        <string>run</string>
        <string>admin:app</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$repo</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>$path</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$log</string>
    <key>StandardErrorPath</key>
    <string>$log</string>
</dict>
</plist>
EOF

echo "Blog Admin will start when you log in: $plist"
echo "Output goes to $log"
