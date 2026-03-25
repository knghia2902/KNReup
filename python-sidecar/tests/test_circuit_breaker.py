import pytest
import httpx
import asyncio
from unittest.mock import patch
from app.engines.translation.openai_engine import OpenAITranslation

def test_circuit_breaker_retries():
    engine = OpenAITranslation(
        api_key="key1, key2, key3",
        model="gpt-4o-mini"
    )

    assert engine.api_keys == ["key1", "key2", "key3"]
    assert engine.current_key_idx == 0

    mock_429 = httpx.Response(429, request=httpx.Request("POST", "https://api.openai.com/v1/chat/completions"))
    mock_200 = httpx.Response(
        200, 
        request=httpx.Request("POST", "https://api.openai.com/v1/chat/completions"),
        json={"choices": [{"message": {"content": "Translated config"}}]}
    )

    async def run_test():
        with patch("httpx.AsyncClient.post") as mock_post:
            async def side_effect(*args, **kwargs):
                if mock_post.call_count <= 2:
                    return mock_429
                return mock_200
                
            mock_post.side_effect = side_effect
            
            result = await engine.translate("Hello", "en", "vi")
            
            assert result == "Translated config"
            assert engine.current_key_idx == 2  
            assert mock_post.call_count == 3
            
    asyncio.run(run_test())
