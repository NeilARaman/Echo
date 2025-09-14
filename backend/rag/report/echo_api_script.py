import json
import requests
from dotenv import load_dotenv
import os
import sys

# Configuration
load_dotenv()
API_KEY = os.getenv("ECHO_KEY")
API_URL = "https://api.anthropic.com/v1/messages"

SYSTEM_PROMPT = """You are Echo, an AI editorial assistant that synthesizes specialist analyses into concise summary reports for journalists.

## Input Format
You'll receive JSON with these keys:
- `agent_scores`: {agent_name: {clarity, accuracy, engagement, novelty, risk, average}} (scores 0-10)
- `consensus_suggestions`: [{suggestion, impact_score, effort_score, mentioned_by_count}]
- `consensus_risks`: [{risk, severity_score, mitigation, mentioned_by_count}]
- `quickest_wins`: [{suggestion, impact_score, effort_score, mentioned_by_count}]
- `audience_data`: {audience_discussion: "text"}
- `meta`: {overall_readiness, category_averages}

## Data Consolidation
Before analysis, consolidate duplicate/similar items:
- Group suggestions with similar meaning, sum mentioned_by_count
- Group risks with similar meaning, use highest severity_score, sum mentioned_by_count
- Use the most comprehensive wording for consolidated items

## Output Format: JSON

```json
{
  "executive_summary": {
    "overall_readiness_score": "X.XX/10",
    "key_findings": [
      "Main factual/risk finding",
      "Main language/framing/accessibility finding", 
      "Overall article potential"
    ],
    "top_priority": "Single actionable sentence for highest severity risk"
  },
  "key_insights": {
    "most_common_suggestions": "1-2 sentence summary of dominant themes from consolidated suggestions",
    "quickest_wins": [
      "List suggestions with impact_score ≥7 AND effort_score ≤3"
    ],
    "primary_risks": {
      "summary": "1-2 sentence summary of consolidated risk patterns", 
      "top_risks": [
        {
          "risk": "consolidated risk description",
          "severity": X,
          "mitigation": "mitigation strategy"
        }
      ]
    },
    "focus_area": "One sentence improvement for lowest category_averages score",
    "agent_perspectives": {
      "highest_rated": "Agent with highest average + why based on their strong categories",
      "lowest_rated": "Agent with lowest average + why based on their weak categories"
    },
    "predicted_discussion": "Single sentence capturing main theme from audience_discussion"
  }
}
```

## Processing Rules
- **Overall Readiness**: Use meta.overall_readiness directly
- **Agent Comparison**: Use pre-calculated agent.average scores
- **Quickest Wins**: Filter suggestions where impact_score ≥7 AND effort_score ≤3
- **Top Risks**: Order consolidated risks by severity_score, include top 2-3
- **Focus Area**: Target category with lowest score in meta.category_averages
- **Consolidation**: Merge similar risks/suggestions, prioritize highest mentioned_by_count

## Key Rules
- Consolidate similar items before analysis
- Use exact scores from input data
- Extract main discussion theme from audience text
- Output valid JSON only
- Be concise and actionable"""

def load_json_file(file_path):
    """Load JSON data from file"""
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: File {file_path} not found")
        return None
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in {file_path}")
        return None

def call_claude_api(json_data):
    """Send data to Claude API and get response"""
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        "anthropic-version": "2023-06-01"
    }
    
    payload = {
        "model": "claude-3-5-haiku-20241022", 
        "max_tokens": 2000,
        "system": SYSTEM_PROMPT,
        "messages": [
            {
                "role": "user",
                "content": json.dumps(json_data, indent=2)
            }
        ]
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"API Error: {e}")
        return None

def save_response(response, output_file="echo_report.json"):
    """Save Claude's response to file"""
    try:
        # Extract the content from Claude's response
        content = response['content'][0]['text']
        
        # Try to parse as JSON (Claude should return JSON)
        try:
            parsed_content = json.loads(content)
            with open(output_file, 'w') as f:
                json.dump(parsed_content, f, indent=2)
            #print(f"✅ Report saved to {output_file}")
        except json.JSONDecodeError:
            # If not JSON, save as text
            with open(output_file.replace('.json', '.txt'), 'w') as f:
                f.write(content)
            #print(f"✅ Report saved as text to {output_file.replace('.json', '.txt')}")
            
    except Exception as e:
        print(f"Error saving response: {e}")

def main(json_file_path):
    # Load JSON data
    #print(f"📁 Loading {JSON_FILE_PATH}...")
    json_data = load_json_file(json_file_path)
    
    if not json_data:
        return
    
    #print("🤖 Sending to Claude API...")
    
    # Call Claude API
    response = call_claude_api(json_data)
    
    if response:
        #print("✅ Received response from Claude")
        save_response(response)
        
        # Print the response to console too
        #print("\n📊 Echo Report:")
        #print("=" * 50)
        print(response['content'][0]['text'])
    else:
        print("❌ Failed to get response from Claude")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python echo_api_script.py <json_file_path>")
        sys.exit(1)
    sys.exit(main(sys.argv[1]))