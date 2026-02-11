import os
import math

def split_file(input_file, output_dir, num_parts=8):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    total_lines = len(lines)
    target_lines = math.ceil(total_lines / num_parts)
    
    parts = []
    current_part = []
    
    # We want to split at logical boundaries.
    # Safe boundaries: 
    # - Before "## Module"
    # - Before "### Standard"
    # - Before "#### Q"
    
    # We will try to get as close to target_lines as possible, then look for the next safe boundary.
    
    i = 0
    part_num = 1
    
    while i < total_lines:
        line = lines[i]
        current_part.append(line)
        i += 1
        
        # Check if we should split
        if len(current_part) >= target_lines:
            # Look ahead for a safe boundary
            # We continue adding lines until we hit a boundary line
            # But we must be careful not to go too far.
            # Ideally we want to stop BEFORE the next boundary.
            
            # Identify if the *next* line is a boundary
            # If so, we can close this part.
            
            if i < total_lines:
                next_line = lines[i]
                is_boundary = next_line.startswith("## ") or next_line.startswith("### ") or next_line.startswith("#### ")
                
                # If we are at a boundary (next line is a header), OR if we have exceeded target by a lot (to avoid infinite search)
                if is_boundary:
                    # Write current part
                    output_file = os.path.join(output_dir, f"diagnostic-part-{part_num}.md")
                    with open(output_file, 'w', encoding='utf-8') as f_out:
                        f_out.writelines(current_part)
                    
                    print(f"Written {output_file} ({len(current_part)} lines)")
                    parts.append(output_file)
                    current_part = []
                    part_num += 1
                    
                    # If we have reached the last part, just dump the rest
                    if part_num == num_parts:
                        # Just read the rest
                        current_part.extend(lines[i:])
                        output_file = os.path.join(output_dir, f"diagnostic-part-{part_num}.md")
                        with open(output_file, 'w', encoding='utf-8') as f_out:
                            f_out.writelines(current_part)
                        print(f"Written {output_file} ({len(current_part)} lines)")
                        break
        
    # If there's anything left (should catch edge cases) and we haven't hit the break above
    if current_part and part_num <= num_parts: # though break above handles the last part
         output_file = os.path.join(output_dir, f"diagnostic-part-{part_num}.md")
         with open(output_file, 'w', encoding='utf-8') as f_out:
             f_out.writelines(current_part)
         print(f"Written {output_file} ({len(current_part)} lines)")

if __name__ == "__main__":
    split_file("c:\\WProjects\\DW\\diagnostic-v2-readable.md", "c:\\WProjects\\DW\\readable")
