"""Dev runner — chạy FastAPI trên port 8008 với hot-reload."""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8008,
        reload=True,
        log_level="warning"
    )
