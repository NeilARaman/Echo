import requests
import time
import os
from datetime import datetime
from typing import List, Dict, Any


def scrape_guardian_api(query: str, api_key: str, max_articles: int = 20) -> List[Dict[str, Any]]:
    articles = []
    url = "https://content.guardianapis.com/search"
    
    params = {
        'q': query,
        'api-key': api_key,
        'show-fields': 'headline,trailText,bodyText,byline,publication',
        'show-tags': 'keyword',
        'page-size': min(max_articles, 50),
        'order-by': 'relevance'
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        for item in data.get('response', {}).get('results', []):
            fields = item.get('fields', {})
            articles.append({
                'title': fields.get('headline', ''),
                'content': fields.get('bodyText', ''),
                'summary': fields.get('trailText', ''),
                'author': fields.get('byline', ''),
                'url': item.get('webUrl', ''),
                'date': item.get('webPublicationDate', ''),
                'source': 'The Guardian',
                'tags': [tag.get('webTitle', '') for tag in item.get('tags', [])]
            })
            
    except Exception as e:
        print(f"Guardian API error: {e}")
    
    return articles


def scrape_nyt_api(query: str, api_key: str, max_articles: int = 20) -> List[Dict[str, Any]]:
    articles = []
    url = "https://api.nytimes.com/svc/search/v2/articlesearch.json"
    
    params = {
        'q': query,
        'api-key': api_key,
        'sort': 'relevance',
        'page': 0
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        for doc in data.get('response', {}).get('docs', [])[:max_articles]:
            articles.append({
                'title': doc.get('headline', {}).get('main', ''),
                'content': doc.get('lead_paragraph', '') + ' ' + doc.get('snippet', ''),
                'summary': doc.get('abstract', ''),
                'author': ', '.join([person.get('firstname', '') + ' ' + person.get('lastname', '') 
                                   for person in doc.get('byline', {}).get('person', [])]),
                'url': doc.get('web_url', ''),
                'date': doc.get('pub_date', ''),
                'source': 'New York Times',
                'section': doc.get('section_name', ''),
                'keywords': [kw.get('value', '') for kw in doc.get('keywords', [])]
            })
            
    except Exception as e:
        print(f"NYT API error: {e}")
    
    return articles


def scrape_event_registry_api(query: str, api_key: str, max_articles: int = 20) -> List[Dict[str, Any]]:
    articles = []
    url = "https://eventregistry.org/api/v1/article/getArticles"
    
    params = {
        'apiKey': api_key,
        'keyword': query,
        'lang': 'eng',
        'articlesPage': 1,
        'articlesCount': min(max_articles, 100),
        'articlesSortBy': 'rel',
        'includeArticleTitle': True,
        'includeArticleBasicInfo': True,
        'includeArticleBody': True,
        'includeSourceTitle': True,
        'articleBodyLen': 300
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if 'articles' not in data or 'results' not in data['articles']:
            print(f"Event Registry: No articles found. Response keys: {data.keys()}")
            return articles
        
        for article in data['articles']['results']:
            articles.append({
                'title': article.get('title', ''),
                'content': article.get('body', ''),
                'summary': article.get('body', '')[:200] + '...' if article.get('body') else '',
                'author': ', '.join([author.get('name', '') for author in article.get('authors', [])]),
                'url': article.get('url', ''),
                'date': article.get('date', '') + 'T' + article.get('time', '') if article.get('date') else '',
                'source': article.get('source', {}).get('title', '') if article.get('source') else '',
                'language': article.get('lang', ''),
                'sentiment': article.get('sentiment', 0)
            })
            
    except Exception as e:
        print(f"Event Registry API error: {e}")
    
    return articles


def scrape_gdelt_api(query: str, max_articles: int = 20) -> List[Dict[str, Any]]:
    articles = []
    url = "https://api.gdeltproject.org/api/v2/doc/doc"
    
    params = {
        'query': query,
        'mode': 'artlist',
        'maxrecords': min(max_articles, 75),
        'format': 'json',
        'sort': 'relevance'
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        for article in data.get('articles', []):
            articles.append({
                'title': article.get('title', ''),
                'content': article.get('content', ''),
                'summary': article.get('content', '')[:200] + '...' if article.get('content') else '',
                'author': '',
                'url': article.get('url', ''),
                'date': article.get('seendate', ''),
                'source': article.get('domain', ''),
                'language': article.get('language', '')
            })
            
    except Exception as e:
        print(f"GDELT API error: {e}")
    
    return articles

def scrape_fact_check_sources(topic: str, apis: Dict[str, str], max_per_source: int = 10) -> str:
    all_articles = []
    
    if 'guardian' in apis:
        print("Fetching Guardian articles...")
        guardian_articles = scrape_guardian_api(topic, apis['guardian'], max_per_source)
        all_articles.extend(guardian_articles)
        time.sleep(1)
    
    if 'nyt' in apis:
        print("Fetching NYT articles...")
        nyt_articles = scrape_nyt_api(topic, apis['nyt'], max_per_source)
        all_articles.extend(nyt_articles)
        time.sleep(1)
    
    if 'event_registry' in apis:
        print("Fetching Event Registry articles...")
        event_registry_articles = scrape_event_registry_api(topic, apis['event_registry'], max_per_source)
        all_articles.extend(event_registry_articles)
        time.sleep(1)
    
    if 'gdelt' in apis or len(apis) == 0:
        print("Fetching GDELT articles...")
        gdelt_articles = scrape_gdelt_api(topic, max_per_source)
        all_articles.extend(gdelt_articles)
        time.sleep(1)
    
    fact_check_text = []
    for article in all_articles:
        if article.get('content'):
            fact_check_text.append(f"Source: {article.get('source', 'Unknown')}")
            fact_check_text.append(f"Title: {article.get('title', '')}")
            fact_check_text.append(f"Content: {article.get('content', '')}")
            fact_check_text.append("---")
    
    os.makedirs('data', exist_ok=True)
    safe_topic = "".join(c for c in topic if c.isalnum() or c in (' ', '-', '_')).replace(' ', '_').lower()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"data/factcheck_{safe_topic}_{timestamp}.txt"
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write('\n'.join(fact_check_text))
    
    print(f"Fact-check data saved to: {filename}")
    print(f"Total articles collected: {len(all_articles)}")
    
    return filename


if __name__ == "__main__":
    topic = "climate change" # will be input by user
    
    api_keys = {
        'guardian': 'a008b18d-7491-4958-bdfe-43b74f92a7f2',
        # 'nyt': 'ZSkBk8Z4or8ALFyGX5d9dlSeGLxNZV0L',
        # 'event_registry': 'dac9c971-aa15-4e28-bbb9-896de890c315', 
        # 'gdelt': True,  # keyless
    }
    
    if api_keys:
        output_file = scrape_fact_check_sources(topic, api_keys, max_per_source=15)
    else:
        print("Add API keys to run the scraper")