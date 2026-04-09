import argostranslate.translate

def test_argos():
    try:
        text_to_translate = "Hey, everybody. Today, I want to tell you a story about Tom."
        translated = argostranslate.translate.translate(text_to_translate, "en", "vi")
        print("\n--- TEST ARGOS OFFLINE TRANSLATOR ---")
        print(f"Source (EN): {text_to_translate}")
        print(f"Target (VI): {translated}")
        print("-------------------------------------\n")
    except Exception as e:
        print(f"Test Failed: {e}")

if __name__ == "__main__":
    test_argos()
