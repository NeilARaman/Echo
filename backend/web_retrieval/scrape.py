import time
import re
from typing import List
from firecrawl import FirecrawlApp
import os
from datetime import datetime


def clean_content(text: str) -> str:
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Skip common non-body text patterns
        skip_patterns = [
            r'!\[.*\]\(.*\)',  # Images
            r'https?://',  # URLs
            r'Sign up|Subscribe|Newsletter',  # Newsletter prompts
            r'Share|Tweet|Facebook|LinkedIn',  # Social sharing
            r'Cookie|Privacy Policy|Terms',  # Legal text
            r'Menu|Navigation|Home|About|Contact',  # Navigation
            r'Copyright|©|\(c\)',  # Copyright
            r'Advertisement|Sponsored|Ad ',  # Ads
            r'\.pdf\)|\.jpg\)|\.png\)',  # File extensions
            r'^[\[\(].*[\]\)]$',  # Text in brackets/parentheses only
            r'wp-content|uploads',  # WordPress paths
        ]
        
        should_skip = False
        for pattern in skip_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                should_skip = True
                break
        
        if not should_skip and len(line) > 10:  # Keep lines with substantial content
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)


def search_community_links(community_description: str, max_results: int = 10, api_key: str = "api key") -> List[str]:
    try:
        app = FirecrawlApp(api_key=api_key)
        search_query = f"{community_description} demographics community characteristics"
        search_results = app.search(search_query, limit=max_results)
        
        links = []
        if search_results and hasattr(search_results, 'web') and search_results.web:
            for result in search_results.web:
                if hasattr(result, 'url'):
                    links.append(result.url)
        
        return links[:max_results]
    except Exception:
        return []


def scrape_page_content(url: str, api_key: str = "api key") -> str:
    try:
        app = FirecrawlApp(api_key=api_key)
        scrape_result = app.scrape(url)
        
        if scrape_result:
            if hasattr(scrape_result, 'data'):
                data = scrape_result.data
            elif hasattr(scrape_result, 'markdown') or hasattr(scrape_result, 'content'):
                data = scrape_result
            else:
                return ""
            
            content = (getattr(data, 'markdown', '') or 
                      getattr(data, 'content', '') or 
                      getattr(data, 'html', ''))
            
            return content
        else:
            return ""
    except Exception:
        return ""


def save_community_text(text_content: str, community_description: str) -> str:
    os.makedirs('data', exist_ok=True)
    
    safe_filename = "".join(c for c in community_description if c.isalnum() or c in (' ', '-', '_')).rstrip()
    safe_filename = safe_filename.replace(' ', '_').lower()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"data/community_{safe_filename}_{timestamp}.txt"
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(text_content)
    
    return filename


def scrape_community(community_description: str, max_links: int = 10, api_key: str = "api key") -> str:
    links = search_community_links(community_description, max_links, api_key)
    
    if not links:
        return ""
    
    all_text = []
    for link in links:
        print("scraping link")
        content = scrape_page_content(link, api_key)
        if content:
            cleaned_content = clean_content(content)
            if cleaned_content:
                all_text.append(cleaned_content)
                all_text.append("\n\n")
        time.sleep(1)
    
    combined_text = ''.join(all_text)
    output_file = save_community_text(combined_text, community_description)
    
    return output_file


"""if __name__ == "__main__":
    community_desc = "liberal millenials"
    firecrawl_api_key = "[INSERT_KEY]"
    output_path = scrape_community(community_desc, max_links=10, api_key=firecrawl_api_key)"""