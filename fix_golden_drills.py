import json
import os
import re

def fix_question_text(q):
    question = q.get('question', '')
    original_question = question
    
    # Find where options start by looking for pattern: ": a." or ". a." or "? a."
    # This handles both "known as: a." and "factor? a." formats
    match = re.search(r'([.?:!]\s+)(a\.\s+)', question)
    
    if not match:
        return False
    
    # Get the position where 'a.' starts
    a_start = match.start(2)  # Position of 'a.'
    
    # Extract stem (everything before 'a.')
    stem = question[:a_start].rstrip('.:? ').strip()
    
    # Extract options text (from 'a.' to end)
    options_text = question[a_start:].strip()
    
    # Split into individual options using ' b.', ' c.', ' d.' as delimiters
    opt_parts = re.split(r'\s+(?=[b-d]\.)', options_text)
    cleaned_options = [opt.strip() for opt in opt_parts if opt.strip()]
    
    # Safety check: must have 3+ options
    if len(cleaned_options) < 3:
        print(f"   ⚠️  Only {len(cleaned_options)} options found, skipping")
        return False
    
    print(f"   ✅ Fixed: '{original_question[:60]}...'")
    print(f"      → Stem: '{stem}'")
    print(f"      → Options: {len(cleaned_options)}")
    
    # Update question object
    q['question'] = stem
    q['options'] = cleaned_options
    
    return True

def process_file(input_path, output_path):
    print(f"\nProcessing: {os.path.basename(input_path)}")
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        modified = False
        fixed_count = 0
        
        if isinstance(data, list):
            for i, q in enumerate(data):
                if fix_question_text(q):
                    modified = True
                    fixed_count += 1

        if modified:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"  💾 Saved {fixed_count} fixed questions")
        else:
            print(f"  ⏭️  No changes needed")
            
    except Exception as e:
        print(f"  ❌ Error: {e}")

if __name__ == "__main__":
    input_folder = "public/data"
    output_folder = "public/data/golden-drills-fixed"
    
    print("=" * 60)
    print(" FIXING GOLDEN DRILLS BATCH 4 & 6")
    print("=" * 60)
    
    # Process only batch-4 and batch-6
    for i in [4, 6]:
        filename = f"batch-{i}.json"
        input_path = os.path.join(input_folder, filename)
        output_path = os.path.join(output_folder, filename)
        
        if os.path.exists(input_path):
            process_file(input_path, output_path)
        else:
            print(f"⚠️  {filename} not found")
    
    print("\n✅ Done! Check your app now.")