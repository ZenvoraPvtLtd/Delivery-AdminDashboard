import os
import json

def search():
    path = r"C:\Users\pc\.gemini\antigravity-ide\brain\de0cc0ef-8d0d-4881-be42-f4d5150c659d\.system_generated\logs\transcript_full.jsonl"
    if not os.path.exists(path):
        print("Transcript file not found:", path)
        return
    
    print("Transcript found! Searching for keys...")
    found_any = False
    with open(path, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f):
            if "twilio" in line.lower() or "whatsapp" in line.lower() or "auth" in line.lower() or "sid" in line.lower():
                try:
                    obj = json.loads(line)
                    content = obj.get("content", "")
                    if "AC" in content or "TWILIO" in content:
                        print(f"--- MATCH AT STEP {obj.get('step_index')} ---")
                        print(content)
                        found_any = True
                except Exception:
                    pass
    if not found_any:
        print("No Twilio keys found in transcript_full.jsonl.")

if __name__ == "__main__":
    search()
