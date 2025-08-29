from . import Session as _Session
def session():
    """API sugar to look familiar."""
    return _Session()
