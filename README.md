# ClientFlow

ClientFlow is a production-ready, AI-powered Business Management Platform designed for Freelancers. It provides a comprehensive suite of tools to manage clients, track projects, generate professional invoices, process payments, view detailed reports, and generate AI-driven business insights.

## Project Architecture

This project is organized as a monorepo consisting of:
1. **Frontend (`clientflow_mobile`)**: Flutter mobile application built with Dart, Riverpod, Go Router, and Material 3. Follows Clean Architecture (Presentation, Domain, Data, Core).
2. **Backend (`clientflow_backend`)**: Spring Boot REST API built with Java, Spring Security, JPA/Hibernate, Maven, and JWT Authentication.
3. **AI Service (`clientflow_ai`)**: FastAPI Python service built with Pandas and Scikit-learn to run financial models and client/project insights.

---

## 📂 Complete Folder Structure

```
c:\Users\pr749\Desktop\Sem 3 Project/
├── clientflow_mobile/                  # Flutter Mobile Frontend
│   ├── android/                        # Android-specific configurations
│   ├── ios/                            # iOS-specific configurations
│   ├── web/                            # Web-specific configurations
│   ├── lib/                            # Application Source Code
│   │   ├── core/                       # Shared modules across features
│   │   │   ├── constants/              # App constants (colors, assets, APIs)
│   │   │   ├── theme/                  # M3 Dark/Light themes
│   │   │   ├── network/                # HTTP/Dio client, interceptors
│   │   │   ├── utils/                  # Formatters, helpers
│   │   │   └── errors/                 # Exceptions and failures
│   │   ├── features/                   # Feature-sliced modules
│   │   │   ├── auth/                   # Authentication & User onboarding
│   │   │   ├── clients/                # Client profiles & CRM
│   │   │   ├── projects/               # Project tracking & Time logs
│   │   │   ├── invoices/               # Invoice templates, generation
│   │   │   ├── payments/               # Payment gateways integration
│   │   │   ├── reports/                # Visual charts & financial statistics
│   │   │   └── insights/               # AI Business recommendations
│   │   │       ├── data/               # Models, remote/local datasources
│   │   │       ├── domain/             # Entities, use cases, repository contracts
│   │   │       └── presentation/       # Riverpod providers, screens, widgets
│   │   └── main.dart                   # Application entry point
│   ├── pubspec.yaml                    # Dart & Flutter dependencies
│   └── analysis_options.yaml           # Linting rules
│
├── clientflow_backend/                 # Spring Boot Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/
│   │   │   │       └── clientflow/
│   │   │   │           └── backend/
│   │   │   │               ├── config/       # Spring Boot & third-party configs
│   │   │   │               ├── controller/   # REST Controllers (Endpoints)
│   │   │   │               ├── dto/          # Data Transfer Objects
│   │   │   │               ├── entity/       # JPA Entities (PostgreSQL schema)
│   │   │   │               ├── exception/    # Custom & Global Exception Handler
│   │   │   │               ├── repository/   # Spring Data JPA repositories
│   │   │   │               ├── security/     # Spring Security, JWT filters
│   │   │   │               ├── service/      # Business logic Layer
│   │   │   │               └── BackendApplication.java  # Main entry class
│   │   │   └── resources/
│   │   │       ├── application.properties     # DB & App configurations
│   │   │       └── application-dev.properties # Dev profile credentials
│   │   └── test/                       # Unit and integration tests
│   ├── pom.xml                         # Maven dependencies and plugins
│   └── mvnw                            # Maven wrapper
│
├── clientflow_ai/                      # Python FastAPI AI Service
│   ├── app/
│   │   ├── api/                        # API routes and endpoints
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/          # Specific route handlers
│   │   │   │   └── router.py           # API Router compilation
│   │   │   └── router.py
│   │   ├── core/                       # Configurations, settings, security
│   │   ├── models/                     # ML Model metadata, pickle paths
│   │   ├── schemas/                    # Pydantic schemas (Request/Response)
│   │   ├── services/                   # Analytics, Pandas calculations, ML logic
│   │   ├── utils/                      # Helper scripts
│   │   └── main.dart / main.py         # API entry point
│   ├── requirements.txt                # Python package list
│   └── .env.example                    # Environmental configuration template
│
└── .gitignore                          # Monorepo wide ignore file
```

---

## 📦 Tech Stack & Dependency List

### 1. Frontend (`clientflow_mobile`)
Key dependencies configured in `pubspec.yaml`:
* **State Management**: `flutter_riverpod`, `riverpod_annotation`
* **Routing**: `go_router`
* **Network Client**: `dio` (for requests to backend & AI service)
* **Data Visualization**: `fl_chart`
* **Local Storage**: `shared_preferences`, `flutter_secure_storage`
* **Utilities**: `intl` (formatting currency, dates), `uuid`

### 2. Backend (`clientflow_backend`)
Key dependencies configured in `pom.xml`:
* **Core**: `spring-boot-starter-web`, `spring-boot-starter-validation`
* **Security & Auth**: `spring-boot-starter-security`, `jjwt-api`, `jjwt-impl`, `jjwt-jackson` (JWT Authentication)
* **Database**: `spring-boot-starter-data-jpa`, `postgresql` (PostgreSQL Driver)
* **Notifications**: `firebase-admin` (Firebase Cloud Messaging)
* **Cloud Storage**: `cloudinary-http44` (Cloudinary file uploads)
* **Developer Tools**: `lombok` (reduces boilerplate)

### 3. AI Service (`clientflow_ai`)
Key libraries in `requirements.txt`:
* **Web Framework**: `fastapi`, `uvicorn` (ASGI Server)
* **Data Analysis**: `pandas`, `numpy`
* **Machine Learning**: `scikit-learn`
* **HTTP Client**: `httpx` (calls to other APIs or DB if needed)
* **Environment**: `python-dotenv`, `pydantic` (validation)

---

## 🛠️ Instructions & Commands

### Git Initialization & First Push

```bash
# 1. Initialize local Git repository (Already done)
git init

# 2. Add all structured directories & configurations
git add .

# 3. Create the initial commit
git commit -m "chore: initial project architecture and setup"

# 4. Set default branch to main
git branch -M main

# 5. Link to your GitHub remote repository
git remote add origin https://github.com/YOUR_USERNAME/clientflow.git

# 6. Push to GitHub
git push -u origin main
```

### Database Connection (PostgreSQL)

To connect to your PostgreSQL database instance locally:

Using CLI (psql):
```bash
psql -h localhost -U postgres -d clientflow_db
```
*(Enter password when prompted)*

Ensure that your local database is created:
```sql
CREATE DATABASE clientflow_db;
```

### Running the Backend (Spring Boot)

1. Make sure you have Maven and Java 17+ installed.
2. Update database credentials in `clientflow_backend/src/main/resources/application.properties`.
3. Navigate to the backend directory and run:

```bash
cd clientflow_backend
./mvnw spring-boot:run
```
*(Or use `mvn spring-boot:run` if Maven is installed globally)*

### Running the AI Service (FastAPI)

1. Navigate to the AI directory:
```bash
cd clientflow_ai
```
2. Create and activate a Python virtual environment:
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```
3. Install dependencies:
```bash
pip install -r requirements.txt
```
4. Run the API server with Uvicorn:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Running the Frontend (Flutter)

1. Make sure Flutter SDK is installed and configured (`flutter doctor`).
2. Navigate to the mobile directory:
```bash
cd clientflow_mobile
```
3. Get packages:
```bash
flutter pub get
```
4. Run the app:
```bash
# List available devices
flutter devices

# Run on specific device or emulator
flutter run
```
