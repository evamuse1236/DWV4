import re
import random

def rewrite_misconception(line):
    # Remove the double prefix "Misconception: Misconception: "
    line = re.sub(r'^\s*- Misconception: Misconception: ', '', line)
    
    # Capitalize the first letter if it's lowercase (common issue in the original file)
    if line and line[0].islower():
        line = line[0].upper() + line[1:]

    # Apply specific grammatical fixes
    line = line.replace("You this is", "This is")
    line = line.replace("You variables are", "Variables are")
    line = line.replace("You rhombuses", "Rhombuses")
    line = line.replace("You not all", "Not all")
    line = line.replace("You equal sides", "Equal sides")
    line = line.replace("You definition", "Definition")
    line = line.replace("You category membership", "Category membership")
    line = line.replace("You triangle is", "A triangle is")
    line = line.replace("You square is", "A square is")
    line = line.replace("You quadrilaterals", "Quadrilaterals")
    line = line.replace("You rectangles", "Rectangles")
    line = line.replace("You parallelograms", "Parallelograms")
    line = line.replace("You linear units", "Linear units")
    line = line.replace("You square units", "Square units")
    line = line.replace("You degrees", "Degrees")
    line = line.replace("You less than", "Less than")
    line = line.replace("You equality", "Equality")
    line = line.replace("You strict less-than", "Strict less-than")
    line = line.replace("You both endpoint", "Both endpoint")
    line = line.replace("You an inequality", "An inequality")

    # Tone adjustments
    starters = [
        "So close! ", "Almost! ", "Hmm... ", "Oops! ", "Good try! ", 
        "Not quite, but good thinking! ", "Close one! ", "Ah, nearly there! "
    ]
    
    # Logic to choose a starter based on the content or just random cycle
    starter = random.choice(starters)

    # Convert "You [verb]" to softer phrasing
    # regex to find "You" followed by a verb (simplified heuristic: word ending in 'ed' or 'd')
    # or generally just "You [verb]" structure.
    # To be safe and simple, let's just prepend the starter and soften the "You" where possible.
    
    # Most common pattern: "You [verb]..." -> "It looks like you [verb]..."
    if line.startswith("You "):
        line = "It looks like " + line[0].lower() + line[1:]
    
    return f"  - Misconception: {starter}{line}"

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    for line in lines:
        if "Misconception: Misconception:" in line:
            new_lines.append(rewrite_misconception(line))
        else:
            new_lines.append(line)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    file_path = "c:\\WProjects\\DW\\diagnostic-v2-readable.md"
    process_file(file_path)
    print("Done rewriting misconceptions.")
