# 🚀 Guía de Instalación - HomeCare Project

## ✅ Requisitos del Sistema

Tu sistema actual:
- ✅ **Java:** v17.0.17 (instalado) → ⚠️ Necesitas Java 23
- ✅ **Node.js:** v24.13.0 (instalado) → ⚠️ Necesitas Node v20 LTS
- ❌ **Maven:** No instalado

---

## 📥 Paso 1: Instalar Java 23 (Backend)

### Opción A: Adoptium Temurin (Recomendado)

**Link de descarga:**
https://adoptium.net/temurin/releases/?version=23

**Pasos:**
1. Haz clic en el link de arriba
2. Selecciona:
   - **Version:** 23
   - **Operating System:** Windows
   - **Architecture:** x64
   - **Package Type:** JDK
   - **Image Type:** .msi (installer)
3. Descarga y ejecuta el instalador `.msi`
4. Durante la instalación:
   - ✅ Marca "Set JAVA_HOME variable"
   - ✅ Marca "Add to PATH"
   - ✅ Marca "Associate .jar files"
5. Clic en "Install"

**Verificar instalación:**
```powershell
# Cierra y reabre PowerShell, luego ejecuta:
java -version
# Debería mostrar: openjdk version "23.x.x"
```

### Opción B: Oracle JDK 23

**Link de descarga:**
https://www.oracle.com/java/technologies/downloads/#java23

**Pasos:**
1. Descarga "Windows x64 Installer"
2. Ejecuta el instalador
3. Sigue el asistente de instalación
4. Reinicia PowerShell

---

## 📥 Paso 2: Instalar Node.js v20 LTS (Frontend)

### Opción A: Node.js Official (Recomendado)

**Link de descarga:**
https://nodejs.org/en/download

**Pasos:**
1. Haz clic en el link de arriba
2. Descarga **"20.x LTS"** → Windows Installer (.msi) → 64-bit
3. Ejecuta el instalador
4. Durante la instalación:
   - ✅ Acepta todos los defaults
   - ✅ Marca "Automatically install necessary tools"
5. Clic en "Install"

**Verificar instalación:**
```powershell
# Cierra y reabre PowerShell, luego ejecuta:
node --version
# Debería mostrar: v20.x.x
npm --version
# Debería mostrar: 10.x.x
```

### Opción B: nvm-windows (Para manejar múltiples versiones)

Si quieres mantener Node v24 y v20 al mismo tiempo:

**Link de descarga:**
https://github.com/coreybutler/nvm-windows/releases

**Pasos:**
1. Descarga `nvm-setup.exe` de la última release
2. Ejecuta el instalador
3. Después de instalar:
```powershell
# Instalar Node v20
nvm install 20.11.0

# Usar Node v20
nvm use 20.11.0

# Verificar
node --version
```

---

## 📥 Paso 3: Instalar Maven (Opcional - para compilar backend)

### Opción A: Apache Maven Binary

**Link de descarga:**
https://maven.apache.org/download.cgi

**Pasos:**
1. Descarga "apache-maven-3.9.x-bin.zip"
2. Extrae en `C:\Program Files\Apache\maven`
3. Agregar Maven a PATH:
```powershell
# Abrir PowerShell como administrador:
[Environment]::SetEnvironmentVariable(
    "Path",
    [Environment]::GetEnvironmentVariable("Path", "Machine") + ";C:\Program Files\Apache\maven\bin",
    "Machine"
)
```
4. Reiniciar PowerShell
5. Verificar:
```powershell
mvn --version
```

### Opción B: No instalar Maven (Usar JAR existente)

**Si no quieres instalar Maven**, puedes usar el JAR que ya está compilado:
- Ya tienes el JAR en: `backend\target\homecare-backend-1.0.0.jar`
- Solo necesitas Java 23 para ejecutarlo

---

## 🚀 Ejecutar el Proyecto (después de instalar)

### Backend (Spring Boot)

```powershell
# Navegar al directorio backend
cd "C:\Users\PC\Desktop\HOME CARE\backend"

# Opción 1: Ejecutar JAR existente (requiere Java 23)
java -jar target\homecare-backend-1.0.0.jar

# Opción 2: Si instalaste Maven
mvn spring-boot:run
```

**El backend estará en:** http://localhost:8080

### Frontend (React Native / Expo)

```powershell
# Navegar al directorio frontend
cd "C:\Users\PC\Desktop\HOME CARE\frontend"

# Limpiar cache
npm cache clean --force
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Reinstalar dependencias con Node v20
npm install --legacy-peer-deps

# Iniciar aplicación
npm start
```

**Opciones para ver la app:**
- 📱 **Escanear QR** con la app Expo Go en tu teléfono
- 🌐 **Presionar 'w'** para abrir en navegador web
- 📲 **Presionar 'a'** para abrir en emulador Android (si tienes Android Studio)
- 🍎 **Presionar 'i'** para abrir en simulador iOS (solo Mac)

---

## 🎯 Resumen de Links de Descarga

| Herramienta | Link Directo |
|-------------|--------------|
| **Java 23** | https://adoptium.net/temurin/releases/?version=23 |
| **Node.js v20 LTS** | https://nodejs.org/en/download |
| **Maven (opcional)** | https://maven.apache.org/download.cgi |
| **nvm-windows (opcional)** | https://github.com/coreybutler/nvm-windows/releases |

---

## ⚠️ Notas Importantes

1. **Reinicia PowerShell** después de cada instalación para que los cambios en PATH surtan efecto
2. **Java 23 es OBLIGATORIO** para el backend - no funcionará con Java 17
3. **Node v20 LTS es OBLIGATORIO** para el frontend - no funcionará con Node v24
4. Si tienes problemas, ejecuta PowerShell **como Administrador**

---

## 🆘 Troubleshooting

### Error: "java -version" sigue mostrando Java 17

**Solución:**
```powershell
# Ver todas las versiones de Java instaladas
Get-ChildItem "C:\Program Files\Java"
Get-ChildItem "C:\Program Files\Eclipse Adoptium"

# Configurar JAVA_HOME manualmente
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-23.0.x-hotspot", "Machine")
```

### Error: "node --version" sigue mostrando v24

**Solución:**
```powershell
# Desinstalar Node v24 desde Panel de Control
# Luego instalar Node v20 LTS
```

### El frontend da error de permisos

**Solución:**
```powershell
# Ejecutar PowerShell como Administrador
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## ✅ Verificación Final

Después de instalar todo, ejecuta estos comandos:

```powershell
# Verificar Java
java -version
# Debe mostrar: openjdk version "23.x.x"

# Verificar Node
node --version
# Debe mostrar: v20.x.x

# Verificar npm
npm --version
# Debe mostrar: 10.x.x

# (Opcional) Verificar Maven
mvn --version
# Debe mostrar: Apache Maven 3.9.x
```

Si todos muestran las versiones correctas, ¡estás listo! 🎉
