import json
import os
import re

# --- CONFIGURATION ---
OUTPUT_DIR = "public/data/golden-drills-fixed"
RAW_DATA_DIR = "raw_data"
QUESTIONS_PER_BATCH = 100

all_questions = []

def add_question(subject, q_text, choices, correct_idx, explanation):
    # Ensure choices is always a list of 4 strings
    if len(choices) != 4:
        return False # Skip if we really can't get 4 choices
    
    all_questions.append({
        "subject": subject,
        "question": q_text.strip(),
        "options": [c.strip() for c in choices], # App expects 'options'
        "choices": [c.strip() for c in choices], # Keep 'choices' for compatibility
        "correctAnswer": correct_idx,
        "explanation": explanation.strip()
    })
    return True

def clean_explanation(text):
    if not text: return ""
    pattern = r'^\s*The\s+answer\s+is\s+[A-D]\.\s*'
    return re.sub(pattern, '', text, flags=re.IGNORECASE).strip()

def parse_answer_key(key_text):
    keys = {}
    current_subj = None
    current_set = None
    
    lines = key_text.split('\n')
    for line in lines:
        line = line.strip()
        if not line: continue
        
        if "Industrial-Organizational Psychology" in line and "Set" in line:
            current_subj = "IO"; current_set = "A" if "Set A" in line else "B"
        elif "Abnormal Psychology" in line and "Set" in line:
            current_subj = "AbPsy"; current_set = "A" if "Set A" in line else "B"
        elif "Developmental Psychology" in line and "Set" in line:
            current_subj = "DevPsy"; current_set = "A" if "Set A" in line else "B"
        elif "Psychological Assessment" in line and "Set" in line:
            current_subj = "PsyAs"; current_set = "A" if "Set A" in line else "B"
            
        match = re.match(r'^(\d+)\.\s+The answer is ([A-D])\.\s+(.*)', line)
        if match and current_subj:
            q_num = int(match.group(1))
            ans_letter = match.group(2)
            explanation = clean_explanation(match.group(3))
            ans_idx = ord(ans_letter) - ord('A')
            keys[f"{current_subj}_{current_set}_{q_num}"] = (ans_idx, explanation)
    return keys

def parse_questions(text, subject_code, set_name, answer_keys):
    # Split by question number (e.g., "1.", "2.")
    # Use a lookahead to keep the delimiter
    raw_blocks = re.split(r'\n(?=\d+\.\s)', text)
    
    count = 0
    skipped = []
    
    for block in raw_blocks:
        block = block.strip()
        if not block: continue
        
        # Extract Question Number
        num_match = re.match(r'^(\d+)\.\s+', block)
        if not num_match: continue
        q_num = int(num_match.group(1))
        
        # Remove the number from the block for easier parsing
        content = block[num_match.end():]
        
        # --- AGGRESSIVE CHOICE PARSING ---
        # Strategy: Find all occurrences of a. b. c. d. (or A. B. C. D.)
        # We look for the pattern: Letter + Dot + Space
        choice_indices = [m.start() for m in re.finditer(r'[a-dA-D]\.\s', content)]
        
        choices = []
        q_text = content
        
        if len(choice_indices) >= 4:
            # We found at least 4 choices
            # The question text is everything before the first choice
            q_text = content[:choice_indices[0]].strip()
            
            # Extract choices based on indices
            for i in range(4):
                start = choice_indices[i]
                # End is either the next choice index or end of string
                end = choice_indices[i+1] if i < 3 else len(content)
                
                # Extract and clean
                choice_text = content[start:end]
                # Remove the leading "a. "
                choice_text = re.sub(r'^[a-dA-D]\.\s+', '', choice_text)
                # Collapse whitespace
                choice_text = " ".join(choice_text.split())
                choices.append(choice_text)
        
        # Validate
        if len(choices) == 4 and q_text:
            key_id = f"{subject_code}_{set_name}_{q_num}"
            if key_id in answer_keys:
                ans_idx, explanation = answer_keys[key_id]
                
                subj_map = {
                    "IO": "Industrial-Organizational Psychology",
                    "AbPsy": "Abnormal Psychology",
                    "DevPsy": "Developmental Psychology",
                    "PsyAs": "Psychological Assessment"
                }
                
                if add_question(subj_map[subject_code], q_text, choices, ans_idx, explanation):
                    count += 1
                else:
                    skipped.append(f"{subject_code} Set {set_name} Q{q_num} (Add Failed)")
            else:
                skipped.append(f"{subject_code} Set {set_name} Q{q_num} (No Key)")
        else:
            skipped.append(f"{subject_code} Set {set_name} Q{q_num} (Parse Failed: {len(choices)} choices)")

    if skipped:
        print(f"  ⚠️ Skipped {len(skipped)}: {skipped[:5]}...")
    print(f"  ✅ Parsed {count} questions for {subject_code} Set {set_name}")

def main():
    print("🚀 Starting Golden Drills Generation (Robust Parser)...")
    
    if not os.path.exists(RAW_DATA_DIR):
        print(f"❌ Folder '{RAW_DATA_DIR}' not found.")
        return

    keys_file = os.path.join(RAW_DATA_DIR, "keys.txt")
    if not os.path.exists(keys_file):
        print(f"❌ Missing {keys_file}.")
        return

    print("🔑 Parsing Answer Keys...")
    with open(keys_file, 'r', encoding='utf-8') as f:
        answer_keys = parse_answer_key(f.read())
    print(f"   Found {len(answer_keys)} keys.")

    files_to_process = [
        ("io_a.txt", "IO", "A"), ("io_b.txt", "IO", "B"),
        ("abpsy_a.txt", "AbPsy", "A"), ("abpsy_b.txt", "AbPsy", "B"),
        ("devpsy_a.txt", "DevPsy", "A"), ("devpsy_b.txt", "DevPsy", "B"),
        ("psyas_a.txt", "PsyAs", "A"), ("psyas_b.txt", "PsyAs", "B"),
    ]

    for filename, code, set_name in files_to_process:
        filepath = os.path.join(RAW_DATA_DIR, filename)
        if os.path.exists(filepath):
            print(f"\n📖 Processing {filename}...")
            with open(filepath, 'r', encoding='utf-8') as f:
                parse_questions(f.read(), code, set_name, answer_keys)
        else:
            print(f"\n⚠️ Skipping {filename}")

    print(f"\n📦 Batching {len(all_questions)} questions...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Clear old files
    for f in os.listdir(OUTPUT_DIR):
        if f.endswith(".json"): os.remove(os.path.join(OUTPUT_DIR, f))

    batch_num = 0
    for i in range(0, len(all_questions), QUESTIONS_PER_BATCH):
        batch_data = all_questions[i:i + QUESTIONS_PER_BATCH]
        filename = f"batch-{batch_num}.json"
        with open(os.path.join(OUTPUT_DIR, filename), 'w', encoding='utf-8') as f:
            json.dump(batch_data, f, indent=2, ensure_ascii=False)
        print(f"  ✅ Created {filename} ({len(batch_data)} items)")
        batch_num += 1

    print("\n🎉 Done!")

if __name__ == "__main__":
    main()