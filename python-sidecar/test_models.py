import asyncio
from app.engines.translation.openai_engine import OpenAITranslation
from app.engines.translation.ollama import OllamaTranslation

async def test_openai():
    engine = OpenAITranslation(api_key="sk-569e687ef4aae4e1-h1vmyh-217baa1c", base_url="https://9router.khacnghia.xyz/v1", model="knghia-v1")
    res = await engine.translate("Hello, how are you?", "en", "vi")
    print("9Router (OpenAI) Response:", res)

async def test_ollama():
    engine = OllamaTranslation(url="http://localhost:11434", model="gemma4:e4b")
    res = await engine.translate("Hello, how are you?", "en", "vi")
    print("Ollama Response:", res)

async def main():
    print("Testing 9Router...")
    try:
        await test_openai()
    except Exception as e:
        print("9Router error:", e)

    print("\nTesting Ollama...")
    try:
        await test_ollama()
    except Exception as e:
        print("Ollama error:", e)

if __name__ == "__main__":
    asyncio.run(main())
