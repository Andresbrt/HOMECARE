# Script para iniciar backend y frontend en ventanas separadas

# Inicia el backend en una nueva ventana
Start-Process powershell -ArgumentList 'cd "C:\Users\PC\Desktop\HOME CARE\backend"; & "C:\tools\apache-maven-3.9.9\bin\mvn.cmd" spring-boot:run "-Dspring-boot.run.profiles=dev" "-DskipTests"' -WindowStyle Normal

# Espera 5 segundos para dar tiempo a que el backend arranque
Start-Sleep -Seconds 5

# Inicia el frontend en otra nueva ventana
Start-Process powershell -ArgumentList 'cd "C:\Users\PC\Desktop\HOME CARE\mobile"; npx expo start' -WindowStyle Normal
