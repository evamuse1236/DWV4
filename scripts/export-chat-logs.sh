#!/bin/bash
# Export AI chat logs from Convex to a JSON file

OUTPUT_FILE="ai-chat-logs-$(date +%Y-%m-%d-%H%M%S).json"

echo "Exporting AI chat logs..."
npx convex run chatLogs:getRecent --args '{"limit": 500}' > "$OUTPUT_FILE"

if [ -f "$OUTPUT_FILE" ]; then
  echo "Logs exported to: $OUTPUT_FILE"
  echo "Total entries: $(grep -c '"type"' "$OUTPUT_FILE" || echo "0")"
else
  echo "Export failed"
fi
