from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ClientFlow AI Service"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "default_secret_key_for_fastapi_insights_service_development"
    BACKEND_URL: str = "http://localhost:8080/api/v1"
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
