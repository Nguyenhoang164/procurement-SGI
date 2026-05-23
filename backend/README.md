# SGI Procurement Backend

Backend API for the SGI Procurement System, built with Spring Boot and configured to run with MySQL by default.

## Stack

- Java 17+
- Spring Boot 3.5.14
- Spring Data JPA / Hibernate
- Spring Security + JWT
- Flyway
- MySQL 8.x
- Gradle Wrapper

## Project Structure

```text
backend/
├── src/
│   └── main/
│       ├── java/com/sgiprocurement/
│       │   ├── config/
│       │   ├── controller/
│       │   ├── dto/
│       │   ├── exception/
│       │   ├── model/
│       │   ├── repository/
│       │   ├── service/
│       │   └── SgiProcurementApplication.java
│       └── resources/
│           ├── application.properties
│           └── db/migration/
├── build.gradle
├── settings.gradle
├── gradlew
└── gradlew.bat
```

## Prerequisites

- Java 17 or higher
- MySQL 8.x

## Database Configuration

Application uses these environment variables, with defaults shown below:

```bash
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sgi_procurement
DB_USERNAME=root
DB_PASSWORD=
```

The JDBC URL enables `createDatabaseIfNotExist=true`, so the database can be created automatically if the MySQL user has permission.

## Run

Windows:

```powershell
.\gradlew.bat bootRun
```

macOS/Linux:

```bash
./gradlew bootRun
```

Application base URL:

```text
http://localhost:8080/api
```

## Test

Windows:

```powershell
.\gradlew.bat test
```

macOS/Linux:

```bash
./gradlew test
```

## Database Migrations

Flyway migrations are under:

```text
src/main/resources/db/migration
```
