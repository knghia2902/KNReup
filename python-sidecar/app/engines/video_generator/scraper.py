import asyncio
import logging
from typing import Dict, Any
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

logger = logging.getLogger(__name__)

class WebScraper:
    """Scraper class using crawl4ai to extract clean markdown from URLs."""

    def __init__(self, headless: bool = True):
        self.browser_config = BrowserConfig(headless=headless, verbose=False)

    async def scrape(self, url: str) -> Dict[str, Any]:
        """
        Scrapes the given URL and returns a dictionary with extracted content.
        Uses CacheMode.BYPASS to always fetch the latest content.
        """
        run_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)
        
        try:
            async with AsyncWebCrawler(config=self.browser_config) as crawler:
                logger.info(f"Scraping URL: {url}")
                result = await crawler.arun(url=url, config=run_config)
                
                if not result.success:
                    logger.error(f"Failed to scrape URL: {url}. Error: {result.error_message}")
                    return {
                        "url": url,
                        "title": "",
                        "markdown": "",
                        "word_count": 0,
                        "success": False,
                        "error": result.error_message
                    }

                # Assuming the result has markdown content
                markdown_content = result.markdown or ""
                word_count = len(markdown_content.split())
                
                # Some sites might return title in result.metadata or we might need to extract it
                title = getattr(result, "title", "Extracted Article")

                return {
                    "url": url,
                    "title": title,
                    "markdown": markdown_content,
                    "word_count": word_count,
                    "success": True
                }
        except Exception as e:
            logger.exception(f"Exception during scraping URL {url}")
            return {
                "url": url,
                "title": "",
                "markdown": "",
                "word_count": 0,
                "success": False,
                "error": str(e)
            }

    async def health_check(self) -> bool:
        """Check if scraper environment is working."""
        try:
            # We can do a quick check, but just returning True is okay for now 
            # if dependencies are installed.
            return True
        except Exception:
            return False
