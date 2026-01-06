import json
import os
import sys
import re
from typing import Dict, Any, List
from statistics import mean

# Define allowed base directories for file operations
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ALLOWED_BASE_DIRS = [
    os.path.normpath(os.path.join(SCRIPT_DIR, "..", "..", "data")),  # backend/data
    os.path.normpath(os.path.join(SCRIPT_DIR, "..")),  # backend/rag
]

def get_safe_path(user_input: str, check_exists: bool = True) -> str:
    """Securely resolve a file path, preventing path traversal attacks.
    
    Args:
        user_input: The user-provided file path
        check_exists: Whether to verify the path exists
        
    Returns:
        A safe, validated absolute path
        
    Raises:
        ValueError: If path is invalid or outside allowed directories
    """
    # Reject obvious traversal attempts
    if '..' in user_input or (user_input.startswith('/') and os.name == 'nt'):
        raise ValueError("Invalid path: traversal patterns not allowed")
    
    # Only allow alphanumeric, underscores, hyphens, dots, and path separators
    if not re.match(r'^[\w\-./\\]+$', user_input):
        raise ValueError("Invalid path: contains disallowed characters")
    
    # Resolve to real path (follows symlinks, normalizes)
    real_path = os.path.realpath(user_input)
    
    # Verify the path exists if required
    if check_exists and not os.path.exists(real_path):
        raise ValueError(f"Path not found: {user_input}")
    
    # Verify path is within an allowed directory
    is_allowed = False
    for base_dir in ALLOWED_BASE_DIRS:
        real_base = os.path.realpath(base_dir)
        if real_path.startswith(real_base + os.sep) or real_path == real_base:
            is_allowed = True
            break
    
    if not is_allowed:
        raise ValueError("Access denied: path is outside allowed directories")
    
    # Return a fresh string constructed from the validated path
    return str(real_path)

class EchoDataExtractor:
    """Extract and transform analysis data for Echo editorial assistant."""
    
    def __init__(self):
        self.impact_effort_mapping = {
            "high": 8, "medium": 5, "low": 2
        }
        
    def extract_agent_scores(self, editorial_data: Dict) -> Dict[str, Dict[str, float]]:
        """Extract agent scores from per_bot ratings, including agent average."""
        agent_scores = {}
        
        per_bot = editorial_data.get("per_bot", {})
        
        for bot_id, bot_data in per_bot.items():
            # Get bot name from the bots list
            bot_name = self._get_bot_name(editorial_data, bot_id)
            ratings = bot_data.get("ratings", {})
            
            # Convert ratings to scores (assuming they're already 1-10)
            scores = {}
            for category, score in ratings.items():
                if isinstance(score, (int, float)):
                    scores[category] = float(score)
            # Calculate agent average if there are any scores
            if scores:
                scores["average"] = mean(scores.values())
            agent_scores[bot_name] = scores
        
        return agent_scores
    
    def _get_bot_name(self, editorial_data: Dict, bot_id: str) -> str:
        """Get human-readable bot name from bot_id."""
        bots = editorial_data.get("bots", [])
        for bot in bots:
            if bot.get("id") == bot_id:
                return bot.get("name", bot_id)
        return bot_id
    
    def extract_consensus_suggestions(self, editorial_data: Dict) -> List[Dict]:
        """Extract and score suggestions from rollup data."""
        suggestions = []
        
        # Get consensus suggestions from rollup
        consensus_suggestions = editorial_data.get("rollup", {}).get("consensus_suggestions", [])
        
        for suggestion_data in consensus_suggestions:
            suggestion_text = suggestion_data.get("item", "")
            count = suggestion_data.get("count", 1)
            
            # Look for the original suggestion in per_bot data to get impact/effort
            impact_score, effort_score = self._find_suggestion_scores(editorial_data, suggestion_text)
            
            suggestions.append({
                "suggestion": suggestion_text,
                "impact_score": impact_score,
                "effort_score": effort_score,
                "mentioned_by_count": count
            })
        
        return suggestions
    
    def _find_suggestion_scores(self, editorial_data: Dict, suggestion_text: str) -> tuple:
        """Find impact and effort scores for a suggestion by searching per_bot data."""
        per_bot = editorial_data.get("per_bot", {})
        
        # Default scores
        impact_score = 5
        effort_score = 5
        
        # Search through bot suggestions
        for bot_data in per_bot.values():
            suggestions = bot_data.get("suggestions", [])
            for suggestion in suggestions:
                if suggestion.get("text", "").lower() in suggestion_text.lower():
                    # Found the suggestion, extract scores
                    impact = suggestion.get("impact", "medium")
                    effort = suggestion.get("effort", "medium")
                    
                    impact_score = self.impact_effort_mapping.get(impact, 5)
                    effort_score = self.impact_effort_mapping.get(effort, 5)
                    break
        
        return impact_score, effort_score
    
    def extract_consensus_risks(self, editorial_data: Dict) -> List[Dict]:
        """Extract risks from rollup and per_bot data."""
        risks = []
        
        # Get consensus risks from rollup
        consensus_risks = editorial_data.get("rollup", {}).get("consensus_risks", [])
        
        for risk_data in consensus_risks:
            risk_text = risk_data.get("item", "")
            count = risk_data.get("count", 1)
            
            # Find detailed risk info in per_bot data
            severity_score, mitigation = self._find_risk_details(editorial_data, risk_text)
            
            risks.append({
                "risk": risk_text,
                "severity_score": severity_score,
                "mitigation": mitigation,
                "mentioned_by_count": count
            })
        
        return risks
    
    def _find_risk_details(self, editorial_data: Dict, risk_text: str) -> tuple:
        """Find severity and mitigation for a risk by searching per_bot data."""
        per_bot = editorial_data.get("per_bot", {})
        
        # Default values
        severity_score = 5
        mitigation = "Review and address as needed"
        
        # Search through bot risks
        for bot_data in per_bot.values():
            risks = bot_data.get("risks", [])
            for risk in risks:
                if risk.get("issue", "").lower() in risk_text.lower():
                    severity_score = risk.get("severity", 5)
                    mitigation = risk.get("mitigation", mitigation)
                    break
        
        return severity_score, mitigation
    
    def extract_audience_data(self, audience_data: Dict) -> Dict[str, str]:
        """Extract audience discussion themes."""
        audience_discussion_parts = []
        
        per_audience = audience_data.get("per_audience", {})
        
        for persona_id, persona_data in per_audience.items():
            takeaway = persona_data.get("persona_takeaway", "")
            stance = persona_data.get("stance", "neutral")
            
            if takeaway:
                audience_discussion_parts.append(f"{stance.capitalize()}: {takeaway}")
        
        # Also include top concerns and questions
        rollup = audience_data.get("rollup", {})
        top_concerns = rollup.get("top_concerns", [])[:3]  # Top 3 concerns
        top_questions = rollup.get("top_questions", [])[:3]  # Top 3 questions
        
        concerns_text = "; ".join([concern["item"] for concern in top_concerns])
        questions_text = "; ".join([q["item"] for q in top_questions])
        
        discussion = " | ".join(audience_discussion_parts)
        
        if concerns_text:
            discussion += f" | Key concerns: {concerns_text}"
        if questions_text:
            discussion += f" | Key questions: {questions_text}"
        
        return {
            "audience_discussion": discussion,
            "avg_trust": rollup.get("avg_scores", {}).get("trust", 7.0),
            "avg_relevance": rollup.get("avg_scores", {}).get("relevance", 8.0),
            "avg_share_intent": rollup.get("avg_scores", {}).get("share_intent", 7.0)
        }
    
    def calculate_averages(self, agent_scores: Dict) -> Dict[str, float]:
        """Calculate average scores across all agents and categories."""
        all_scores = []
        category_scores = {}
        
        for agent, categories in agent_scores.items():
            for category, score in categories.items():
                all_scores.append(score)
                if category not in category_scores:
                    category_scores[category] = []
                category_scores[category].append(score)
        
        averages = {
            "overall_average": mean(all_scores) if all_scores else 0,
            "by_category": {cat: mean(scores) for cat, scores in category_scores.items()}
        }
        
        return averages
    
    def transform_to_echo_format(self, safe_file_path: str) -> Dict[str, Any]:
        """Main function to transform analysis file to Echo format.
        
        Args:
            safe_file_path: A pre-validated file path from get_safe_path()
        """
        # Load the analysis file (path already validated)
        with open(safe_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Extract the editorial and audience sections
        editorial_data = data.get("editorial", {})
        audience_data = data.get("audience", {})
        
        # Transform data
        agent_scores = self.extract_agent_scores(editorial_data)
        consensus_suggestions = self.extract_consensus_suggestions(editorial_data)
        consensus_risks = self.extract_consensus_risks(editorial_data)
        audience_info = self.extract_audience_data(audience_data)
        
        # Calculate averages
        averages = self.calculate_averages(agent_scores)

        # Calculate readiness: overall_average minus 0.3 per risk with severity >= 8
        high_severity_risks = [r for r in consensus_risks if r.get("severity_score", 0) >= 7]
        readiness = averages["overall_average"] - 0.2 * len(high_severity_risks)

        quickest_wins = [s for s in consensus_suggestions if s["effort_score"] <= 3 and s["impact_score"] >= 7]
        if len(quickest_wins) > 5:
            quickest_wins = sorted(quickest_wins, key=lambda x: -x["impact_score"])[:5]
        if len(quickest_wins) == 0:
            quickest_wins = consensus_suggestions[:3]  # Fallback to top 3 suggestions
        
        # Build Echo format
        echo_data = {
            "agent_scores": agent_scores,
            "consensus_suggestions": consensus_suggestions,
            "consensus_risks": consensus_risks,
            "quickest_wins": quickest_wins,
            "audience_data": audience_info,
            "meta": {
                "source_file": safe_file_path,
                "overall_average": averages["overall_average"],
                "overall_readiness": readiness,
                "category_averages": averages["by_category"],
                "total_agents": len(agent_scores),
                "total_suggestions": len(consensus_suggestions),
                "total_risks": len(consensus_risks),
                "original_timestamp": data.get("meta", {}).get("timestamp_utc", "")
            }
        }
        
        return echo_data
    
    def save_echo_data(self, echo_data: Dict, safe_output_path: str):
        """Save the transformed data to a file.
        
        Args:
            echo_data: The data to save
            safe_output_path: A pre-validated file path from get_safe_path()
        """
        with open(safe_output_path, 'w', encoding='utf-8') as f:
            json.dump(echo_data, f, indent=2, ensure_ascii=False)
        print(f"Echo data saved to: {safe_output_path}")
    
    def print_summary(self, echo_data: Dict):
        """Print a summary of the extracted data."""
        meta = echo_data["meta"]
        
        print("="*60)
        print("ECHO DATA EXTRACTION SUMMARY")
        print("="*60)
        print(f"Source: {meta['source_file']}")
        print(f"Overall Average Score: {meta['overall_average']:.2f}/10")
        print(f"Total Agents: {meta['total_agents']}")
        print(f"Total Suggestions: {meta['total_suggestions']}")
        print(f"Total Risks: {meta['total_risks']}")
        
        print(f"\nCategory Averages:")
        for category, avg in meta['category_averages'].items():
            print(f"  {category}: {avg:.2f}")
        
        print(f"\nTop Risks by Severity:")
        risks = sorted(echo_data['consensus_risks'], key=lambda x: x['severity_score'], reverse=True)[:3]
        for risk in risks:
            print(f"  • {risk['risk']} (Severity: {risk['severity_score']})")
        
        print(f"\nHigh Impact Suggestions:")
        suggestions = sorted(echo_data['consensus_suggestions'], key=lambda x: x['impact_score'], reverse=True)[:3]
        for suggestion in suggestions:
            print(f"  • {suggestion['suggestion']} (Impact: {suggestion['impact_score']})")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Extract Echo-compatible data from analysis files")
    parser.add_argument('input_file', help='Input analysis JSON file')
    parser.add_argument('-o', '--output', help='Output file for Echo data (optional)')
    parser.add_argument('-s', '--summary', action='store_true', help='Print summary')
    parser.add_argument('-p', '--pretty', action='store_true', help='Pretty print the Echo data')
    
    args = parser.parse_args()
    
    # Validate input file path to prevent path traversal
    try:
        safe_input_path = get_safe_path(args.input_file, check_exists=True)
    except ValueError as e:
        print(f"Error: {e}")
        return 1
    
    try:
        extractor = EchoDataExtractor()
        echo_data = extractor.transform_to_echo_format(safe_input_path)
        
        # Save to file if requested
        if args.output:
            # Validate output path (allow non-existent for new files)
            try:
                safe_output_path = get_safe_path(args.output, check_exists=False)
            except ValueError as e:
                print(f"Error: {e}")
                return 1
            extractor.save_echo_data(echo_data, safe_output_path)
        
        # Print summary if requested
        if args.summary:
            extractor.print_summary(echo_data)
        
        # Pretty print if requested
        if args.pretty:
            print("\nECHO FORMAT DATA:")
            print("-" * 40)
            print(json.dumps(echo_data, indent=2, ensure_ascii=False))
        
        # If no output file specified, print to stdout
        if not args.output and not args.pretty:
            print(json.dumps(echo_data, ensure_ascii=False))
            
    except Exception as e:
        print(f"Error processing file: {e}")
        return 1
    
    return 0

# Example usage in a script:
def extract_and_run_echo(analysis_folder_name: str, i: int):
    """Helper function to extract data and run Echo in one step.
    
    Args:
        analysis_folder_name: Path to the analysis folder (must be within allowed directories)
        i: The artifact index number (must be non-negative integer)
    """
    # Validate folder path and ensure i is a positive integer
    if not isinstance(i, int) or i < 0:
        raise ValueError("Artifact index must be a non-negative integer")
    
    # Validate and resolve folder path using get_safe_path
    safe_folder = get_safe_path(analysis_folder_name, check_exists=True)
    if not os.path.isdir(safe_folder):
        raise ValueError(f"Path is not a valid directory")
    
    extractor = EchoDataExtractor()
    analysis_file_name = f"rag_{i}.json"
    analysis_file_path = os.path.join(safe_folder, analysis_file_name)
    
    # Validate the input file path
    safe_input = get_safe_path(analysis_file_path, check_exists=True)
    echo_data = extractor.transform_to_echo_format(safe_input)

    # Save to "llmready_i.json" in the analysis folder
    output_file = os.path.join(safe_folder, f"llmready_{i}.json")
    safe_output = get_safe_path(output_file, check_exists=False)
    with open(safe_output, 'w', encoding='utf-8') as f:
        json.dump(echo_data, f, indent=2, ensure_ascii=False)
    
    print(f"Echo data saved to: {safe_output}")
    
    echo_script_path = os.path.join(os.path.dirname(__file__), 'echo_api_script.py')

    response_file = None
    # If Echo script provided, run it
    if os.path.exists(echo_script_path):
        import subprocess
        result = subprocess.run([
            'python3', echo_script_path, safe_output
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print(result.stdout)
            # Save response to response_i.json
            response_file_path = os.path.join(safe_folder, f"response_{i}.json")
            safe_response = get_safe_path(response_file_path, check_exists=False)
            with open(safe_response, 'w', encoding='utf-8') as resp_f:
                resp_f.write(result.stdout)
            print(f"Echo response saved to: {safe_response}")
            response_file = safe_response
        else:
            print("Error running Echo:", result.stderr)
    else:
        print(f"Echo script not found at {echo_script_path}")
    
    return output_file, response_file

"""if __name__ == "__main__":
    # Example usage
    extract_and_run_echo("../../data/community_2025-09-13T18-48-29-962Z", 5)"""
