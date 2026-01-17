#!/bin/bash
# Book Buddy Comprehensive Test Suite
# Tests each personality with various conversation flows

AVAILABLE_BOOKS='[
  {"id":"1","title":"Big Nate","author":"Lincoln Peirce","genre":"Humor","description":"A kid who thinks he is destined for greatness"},
  {"id":"2","title":"Dog Man","author":"Dav Pilkey","genre":"Comics/Humor","description":"Half dog, half cop, all hero"},
  {"id":"3","title":"Diary of a Wimpy Kid","author":"Jeff Kinney","genre":"Humor","description":"The struggles of middle school life"},
  {"id":"4","title":"Percy Jackson","author":"Rick Riordan","genre":"Fantasy/Adventure","description":"A boy discovers he is a Greek demigod"},
  {"id":"5","title":"Harry Potter","author":"J.K. Rowling","genre":"Fantasy","description":"A wizard boy goes to magic school"},
  {"id":"6","title":"Goosebumps","author":"R.L. Stine","genre":"Horror","description":"Scary stories for kids"},
  {"id":"7","title":"Magic Tree House","author":"Mary Pope Osborne","genre":"Adventure","description":"Time-traveling siblings on adventures"},
  {"id":"8","title":"Captain Underpants","author":"Dav Pilkey","genre":"Humor","description":"Two pranksters and their superhero principal"},
  {"id":"9","title":"Wings of Fire","author":"Tui T. Sutherland","genre":"Fantasy","description":"Dragons in an epic war"},
  {"id":"10","title":"Hatchet","author":"Gary Paulsen","genre":"Survival","description":"A boy survives alone in the wilderness"}
]'

READING_HISTORY='[
  {"title":"Unstoppable Us","author":"Yuval Noah Harari","genre":"Non-fiction","rating":5,"status":"completed"}
]'

OUTPUT_DIR="tests/book-buddy/results"
mkdir -p "$OUTPUT_DIR"

run_test() {
  local personality=$1
  local test_name=$2
  local messages=$3
  local output_file="$OUTPUT_DIR/${personality}_${test_name}.json"

  echo "Running: $personality - $test_name"

  npx convex run ai:libraryChat "{\"messages\":$messages,\"personality\":\"$personality\",\"readingHistory\":$READING_HISTORY,\"availableBooks\":$AVAILABLE_BOOKS}" 2>&1 > "$output_file"

  # Check for buddy-response format
  if grep -q "buddy-response" "$output_file"; then
    echo "  ✓ Has buddy-response format"
  else
    echo "  ✗ MISSING buddy-response format!"
  fi

  # Check for suggestedReplies
  if grep -q "suggestedReplies" "$output_file"; then
    echo "  ✓ Has suggestedReplies"
  else
    echo "  ✗ MISSING suggestedReplies!"
  fi
}

echo "=========================================="
echo "Book Buddy Test Suite"
echo "=========================================="
echo ""

for personality in luna dash hagrid; do
  echo ""
  echo "Testing: $personality"
  echo "------------------------------------------"

  # Test 1: Funny request
  run_test "$personality" "01_funny" '[{"role":"user","content":"I want something funny"}]'

  # Test 2: Adventure request
  run_test "$personality" "02_adventure" '[{"role":"user","content":"Show me adventure books"}]'

  # Test 3: Spooky/scary request
  run_test "$personality" "03_spooky" '[{"role":"user","content":"I want something spooky and scary"}]'

  # Test 4: Short books request
  run_test "$personality" "04_short" '[{"role":"user","content":"I want short books that are quick to read"}]'

  # Test 5: Series request
  run_test "$personality" "05_series" '[{"role":"user","content":"I want a long series I can get into"}]'

  # Test 6: Magical/fantasy request
  run_test "$personality" "06_magical" '[{"role":"user","content":"Show me magical books with wizards and spells"}]'

  # Test 7: Surprise me
  run_test "$personality" "07_surprise" '[{"role":"user","content":"Surprise me with something good!"}]'

  # Test 8: Multi-turn - funny then pranks
  run_test "$personality" "08_multiturn_pranks" '[{"role":"user","content":"I want something funny"},{"role":"assistant","content":"```buddy-response\n{\"message\":\"What kind of funny?\",\"suggestedReplies\":[{\"label\":\"Pranks\",\"fullText\":\"pranks\"}],\"books\":[]}\n```"},{"role":"user","content":"Pranks and mischief!"}]'

  # Test 9: Rejection scenario
  run_test "$personality" "09_rejection" '[{"role":"user","content":"I want funny books"},{"role":"assistant","content":"```buddy-response\n{\"message\":\"School stories?\",\"suggestedReplies\":[],\"books\":[]}\n```"},{"role":"user","content":"No, not school stuff. Something else."}]'

  # Test 10: Comics/graphic novels
  run_test "$personality" "10_comics" '[{"role":"user","content":"I want comics or graphic novels with pictures"}]'

done

echo ""
echo "=========================================="
echo "Test Complete! Results in: $OUTPUT_DIR"
echo "=========================================="
