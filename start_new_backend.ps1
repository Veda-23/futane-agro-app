$env:JAVA_HOME = "C:\Users\Vedant\.jdks\openjdk-19.0.2"
$jar = "C:\Users\Vedant\.gemini\antigravity-ide\scratch\futane-agro-app\backend\target\futane-agro-app-0.0.1-SNAPSHOT.jar"
& "$env:JAVA_HOME\bin\java.exe" -jar $jar `
  "--spring.profiles.active=uat" `
  "--server.port=5561" `
  "--spring.datasource.url=jdbc:mysql://localhost:3306/futane_erp_uat?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC" `
  "--spring.datasource.username=root" `
  "--spring.datasource.password=Vedant" `
  "--spring.liquibase.enabled=false" `
  "--spring.jpa.hibernate.ddl-auto=none" 2>&1
