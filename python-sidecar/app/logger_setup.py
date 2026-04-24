import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logging():
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    # Định nghĩa các file log và loggers tương ứng
    categories = {
        "downloader": ["app.engines.downloader", "app.routes.downloader"],
        "pipeline": ["app.pipeline_runner", "app.routes.pipeline", "app.engines.output"],
        "tts": ["app.engines.tts"],
        "translation": ["app.engines.translation"],
        "api": ["app.routes", "uvicorn"],
    }

    # Hàm tạo handler
    def create_handler(filename):
        handler = RotatingFileHandler(os.path.join(log_dir, filename), maxBytes=10*1024*1024, backupCount=5, encoding="utf-8")
        handler.setFormatter(formatter)
        return handler

    # Các handler
    handlers = {
        name: create_handler(f"{name}.log") for name in categories.keys()
    }
    handlers["system"] = create_handler("system.log")

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    # Đặt root logger (tất cả các log đều chạy qua đây nếu không bị chặn)  
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Loại bỏ các handler có sẵn của root để tránh duplicate
    if root_logger.handlers:
        root_logger.handlers.clear()
        
    root_logger.addHandler(console_handler)
    root_logger.addHandler(handlers["system"])

    # Hàm lấy file handler phù hợp dựa trên tên logger
    class RouterFilter(logging.Filter):
        def __init__(self, cat_name):
            super().__init__()
            self.cat_name = cat_name
            self.prefixes = categories[cat_name]

        def filter(self, record):
            # Kiểm tra xem log có thuộc về category này không
            for prefix in self.prefixes:
                if record.name.startswith(prefix):
                    return True
            return False
            
    class SystemExcludeFilter(logging.Filter):
        def filter(self, record):
            # System log nhận mọi thứ trừ những log đã được định tuyến vào các file cụ thể (ngoại trừ uvicorn access log có thể quá nhiều)
            for cat, prefixes in categories.items():
                for prefix in prefixes:
                    if record.name.startswith(prefix):
                        return False
            return True

    handlers["system"].addFilter(SystemExcludeFilter())

    # Gắn handler và filter vào root (thay vì gắn vào từng logger cụ thể để tránh miss log từ các thư viện con)
    for cat_name, handler in handlers.items():
        if cat_name != "system":
            handler.addFilter(RouterFilter(cat_name))
            root_logger.addHandler(handler)

    # Silence noisy loggers
    for logger_name in ["stanza", "argostranslate", "argos-translate", "urllib3"]:
        l = logging.getLogger(logger_name)
        l.setLevel(logging.ERROR)
        l.propagate = False
