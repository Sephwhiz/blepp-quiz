import json
import os
import re

# 1. Dictionary for broken words (from your screenshot)
WORD_FIXES = {
    "h yp omanic": "hypomanic",
    "ma j or": "major",
    "c y cloth y mic": "cyclothymic",
    "p s y chotic": "psychotic",
    "b ipolar": "bipolar",
    "schiz ophrenia": "schizophrenia",
    "d issociative": "dissociative",
    "obsess ive": "obsessive",
    "compul sive": "compulsive",
    "dis order": "disorder",
    "symp tom": "symptom",
    "diag nosis": "diagnosis",
    "ther apy": "therapy",
    "cogn itive": "cognitive",
    "behav ioral": "behavioral",
}

def clean_text(text):
    if not isinstance(text, str):
        return text
    for broken, fixed in WORD_FIXES.items():
        text = text.replace(broken, fixed)
    return text

def extract_and_clean_question(q):
    """
    Checks if options are embedded in the question text and moves them to options array.
    Returns True if modifications were made.
    """
    question_text = q.get('question', '')
    existing_options = q.get('options', [])
    
    # Regex to find patterns like "a. Text b. Text c. Text d. Text" at the end of a string
    option_pattern = r'\s+[a-d]\.\s+[^a-d\.]+?(?=\s+[a-d]\.|$)'
    matches = re.findall(option_pattern, question_text)
    
    modified = False
    
    # If we found embedded options AND the existing options array is empty or short
    if matches and len(existing_options) < 2:
        print(f"   Extracting embedded options from: '{question_text[:60]}...'")
        
        # Clean up the extracted options
        new_options = [clean_text(opt.strip()) for opt in matches]
        
        # Remove the embedded options from the question text
        first_match = matches[0]
        clean_question = question_text.split(first_match)[0].strip()
        
        # Update the question object
        q['question'] = clean_text(clean_question)
        q['options'] = new_options
        modified = True
        
        # Try to preserve correct_answer if it was a letter
        if 'correct_answer' in q:
            ans = q['correct_answer']
            if isinstance(ans, str) and ans.lower() in ['a','b','c','d']:
                idx = ord(ans.lower()) - ord('a')
                if idx < len(new_options):
                    q['correct_answer'] = idx 
    else:
        # Just clean the text normally if no extraction needed
        old_q = q.get('question', '')
        q['question'] = clean_text(old_q)
        if old_q != q['question']:
            modified = True
            
        old_opts = q.get('options', [])
        q['options'] = [clean_text(opt) for opt in old_opts]
        if old_opts != q['options']:
            modified = True

    # Clean explanation too
    if 'explanation' in q:
        old_exp = q['explanation']
        q['explanation'] = clean_text(old_exp)
        if old_exp != q['explanation']:
            modified = True
            
    return modified

def process_json_file(input_path, output_path):
    print(f"Processing: {os.path.basename(input_path)}")
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        file_modified = False
        if isinstance(data, list):
            for q in data:
                if extract_and_clean_question(q):
                    file_modified = True

        if file_modified:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"  ✅ Saved cleaned version to: {output_path}")
        else:
            print(f"  ⏭️  No changes needed. Copying original...")
            # Still copy it so the cleaned folder has all files
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
    except Exception as e:
        print(f"  ❌ Error processing {input_path}: {e}")

if __name__ == "__main__":
    input_folder = "public/data"
    output_folder = "public/data/cleaned" 
    
    if not os.path.exists(input_folder):
        print(f"❌ Input folder not found: {input_folder}")
    else:
        print(f" Cleaning files from '{input_folder}' → '{output_folder}'\n")
        
        count = 0
        for filename in sorted(os.listdir(input_folder)):
            if filename.endswith(".json"):
                input_path = os.path.join(input_folder, filename)
                output_path = os.path.join(output_folder, filename)
                process_json_file(input_path, output_path)
                count += 1
                
        print(f"\n🎉 Done! Processed {count} files.")
        print(f" Your cleaned files are safely in: {output_folder}/")
        print(f"💾 Original files in {input_folder}/ are UNTOUCHED.")