import json
import time
from typing import List, Dict, Any
from firecrawl import FirecrawlApp
import os
from datetime import datetime


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
    except Exception as e:
        return []


def scrape_page_content(url: str, api_key: str = "api key") -> Dict[str, Any]:
    try:
        app = FirecrawlApp(api_key=api_key)
        scrape_result = app.scrape(url)
        
        if scrape_result:
            if hasattr(scrape_result, 'data'):
                data = scrape_result.data
            elif hasattr(scrape_result, 'markdown') or hasattr(scrape_result, 'content'):
                data = scrape_result
            else:
                raise Exception("No data returned from Firecrawl")
            
            content = (getattr(data, 'markdown', '') or 
                      getattr(data, 'content', '') or 
                      getattr(data, 'html', ''))
            
            return {
                'url': url,
                'content': content,
                'status': 'success'
            }
        else:
            raise Exception("No data returned from Firecrawl")
    except Exception as e:
        return {
            'url': url,
            'error': str(e),
            'scraped_at': datetime.now().isoformat(),
            'status': 'failed'
        }


def structure_community_data(community_description: str, scraped_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    successful_scrapes = [data for data in scraped_data if data.get('status') == 'success']
    
    sources = []
    for data in successful_scrapes:
        if data.get('content'):
            sources.append({
                'url': data['url'],
                'text': data['content']
            })
    
    return {
        'community_description': community_description,
        'sources': sources,
        'combined_text': ' '.join([source['text'] for source in sources])
    }


def save_community_data(data: Dict[str, Any], community_description: str) -> str:
    os.makedirs('data', exist_ok=True)
    
    safe_filename = "".join(c for c in community_description if c.isalnum() or c in (' ', '-', '_')).rstrip()
    safe_filename = safe_filename.replace(' ', '_').lower()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"data/community_{safe_filename}_{timestamp}.json"
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    return filename


def scrape_community(community_description: str, max_links: int = 10, api_key: str = "api key") -> str:
    links = search_community_links(community_description, max_links, api_key)
    
    if not links:
        return ""
    
    scraped_data = []
    for link in links:
        data = scrape_page_content(link, api_key)
        scraped_data.append(data)
        time.sleep(1)
    
    structured_data = structure_community_data(community_description, scraped_data)
    output_file = save_community_data(structured_data, community_description)
    
    return output_file


"""if __name__ == "__main__":
    community_desc = "liberal millenials"
    firecrawl_api_key = "[INSERT_KEY]"
    output_path = scrape_community(community_desc, max_links=10, api_key=firecrawl_api_key)"""