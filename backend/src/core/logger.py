import logging
import sys

LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"


def setup_logging():
    logger = logging.getLogger("ids_platform")
    logger.setLevel(logging.INFO)
    logger.propagate = False

    # Uvicorn reloads can import modules more than once; keep handlers single-copy.
    if logger.handlers:
        return logger

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(logging.Formatter(LOG_FORMAT))
    logger.addHandler(console_handler)

    is_pytest_process = any("pytest" in arg.lower() for arg in sys.argv)
    if not is_pytest_process:
        file_handler = logging.FileHandler("app.log", encoding="utf-8")
        file_handler.setFormatter(logging.Formatter(LOG_FORMAT))
        logger.addHandler(file_handler)

    return logger


logger = setup_logging()
