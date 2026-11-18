# 20. APK de Android con Capacitor y Gradle (etapa 8)

La app se empaqueta como APK **desde la terminal, sin Android Studio**: Capacitor
copia la aplicacion web compilada dentro de un proyecto Android, y el **Gradle
Wrapper** de ese proyecto arma el APK. El APK lleva adentro todos los archivos de la
app: no depende del servidor de desarrollo de la computadora, solo de internet para
hablar con Supabase.

Pruebas y verificaciones: [21. Registro de pruebas de la etapa 8](21-registro-de-pruebas-etapa8.md).

---

## 20.1 Versiones usadas

Registradas en la computadora donde se armo el APK (Linux). Son las que piden las
versiones de Capacitor y del plugin de Android que genera Capacitor.

| Herramienta | Version | De donde sale |
|---|---|---|
| Node.js | 22.22.0 | Capacitor 8 pide Node 22 o mas nuevo |
| npm | 10.9.4 | viene con Node |
| Vue / Vite | 3.5 / 6.4.3 | `package.json` |
| Quasar | **no se usa** (ver 20.2) | — |
| Capacitor (`@capacitor/core`, `cli`, `android`) | 8.6.2 | `package.json`, version exacta |
| `@capacitor/app` (boton Atras y enlaces) | 8.1.2 | `package.json`, version exacta |
| JDK | OpenJDK 21.0.12 | Capacitor 8 y el plugin de Android 8.13 piden JDK 21 |
| Gradle Wrapper | 8.14.3 | `android/gradle/wrapper/gradle-wrapper.properties` |
| Android Gradle Plugin (AGP) | 8.13.0 | `android/build.gradle` |
| Android SDK Command-line Tools | 23.0 | `cmdline-tools;latest` |
| Android SDK Platform-Tools (adb) | 37.0.1 | `platform-tools` |
| Plataforma Android | API 36 (Android 16) | `platforms;android-36` = `compileSdkVersion` |
| Build-Tools | 35.0.0 | `build-tools;35.0.0` (la que usa AGP 8.13) |
| `minSdkVersion` / `targetSdkVersion` | 24 (Android 7.0) / 36 | `android/variables.gradle` |

**Compatibilidad verificada:** Capacitor 8.6 → AGP 8.13 → Gradle 8.14.3 (AGP 8.13 pide
Gradle 8.13 o mas nuevo) → JDK 21 (AGP pide 17 o mas; Capacitor 8 pide 21) → SDK 36.
Con esas versiones `assembleDebug` y `assembleRelease` terminan sin errores.

Para ver las versiones en otra computadora:

```bash
node -v && npm -v && npx cap --version && java -version
cd android && ./gradlew --version          # Windows: gradlew.bat --version
sdkmanager --list_installed
```

---

## 20.2 Capacitor sin Quasar

La consigna habla de "agregar el modo Capacitor al proyecto Quasar". **Sintaxia no usa
Quasar**: es Vue 3 + Vite desde la etapa 1, y migrarla obligaria a rehacer todas las
pantallas solo para empaquetarla. El modo Capacitor de Quasar hace exactamente lo
mismo que los comandos de Capacitor, asi que se usaron esos directamente:

| Con Quasar | En Sintaxia |
|---|---|
| `quasar mode add capacitor` | `npm install @capacitor/core @capacitor/android @capacitor/cli` + `capacitor.config.json` + `npx cap add android` |
| `src-capacitor/` | `android/` (proyecto Android) y `capacitor.config.json` |
| `quasar build -m capacitor -T android` | `npm run android:web` (compila con Vite y sincroniza) + `./gradlew assembleDebug` |

---

## 20.3 Instalar el JDK y el SDK (una sola vez)

No hace falta Android Studio ni instalar Gradle: el Wrapper del proyecto baja la
version correcta solo.

### Linux

```bash
# 1. JDK 21
sudo apt install openjdk-21-jdk

# 2. Command-line tools del SDK (de https://developer.android.com/studio#command-line-tools-only)
mkdir -p ~/Android/Sdk/cmdline-tools
unzip commandlinetools-linux-*_latest.zip -d /tmp/ct
mv /tmp/ct/cmdline-tools ~/Android/Sdk/cmdline-tools/latest

# 3. Rutas (agregar al final de ~/.bashrc para que queden)
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# 4. Licencias y paquetes
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-36" "build-tools;35.0.0"
```

### Windows (PowerShell)

```powershell
# 1. JDK 21: instalar Microsoft OpenJDK 21 o Eclipse Temurin 21 (instalador .msi)

# 2. Descomprimir commandlinetools-win-*_latest.zip para que quede:
#    %LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat

# 3. Rutas (permanentes para el usuario; abrir una terminal nueva despues)
setx JAVA_HOME "C:\Program Files\Microsoft\jdk-21..."   # la carpeta donde se instalo el JDK
setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
#    PATH: agregar estas dos carpetas desde "Editar las variables de entorno de esta
#    cuenta" (no con setx PATH, que puede cortar el PATH si es largo):
#      %LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\bin
#      %LOCALAPPDATA%\Android\Sdk\platform-tools

# 4. Licencias (responder "y" a cada una) y paquetes
sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-36" "build-tools;35.0.0"
```

Si Gradle no encuentra el SDK, crear `android/local.properties` (esta en
`.gitignore`) con `sdk.dir=/home/<usuario>/Android/Sdk` o, en Windows,
`sdk.dir=C\:\\Users\\<usuario>\\AppData\\Local\\Android\\Sdk`.

---

## 20.4 Configuracion de la app

| Que | Valor | Donde |
|---|---|---|
| Identificador | `com.sintaxia.app` | `capacitor.config.json` y `android/app/build.gradle` |
| Nombre | Sintaxia | `capacitor.config.json` (`android/app/src/main/res/values/strings.xml`) |
| Icono y splash | el `< >` blanco sobre verde del logo | `npm run android:recursos` los genera en `android/app/src/main/res/` |
| Version | `versionName` = `version` de `package.json` (1.0.0); `versionCode` = 1·10000 + 0·100 + 0 = 10000 | `android/app/build.gradle` la lee de `package.json`: para una version nueva se cambia **solo** `package.json` |
| Carpeta web | `dist` (lo que compila Vite) | `capacitor.config.json` → `webDir` |
| Servidor de desarrollo | **ninguno**: no hay `server.url` | `capacitor.config.json` |
| Enlaces de los correos | `sintaxia://auth/...` abre la app | `android/app/src/main/AndroidManifest.xml` y `.env.android` |
| Copia de seguridad de Android | desactivada (`allowBackup="false"`), para que la sesion guardada no salga del celular | `AndroidManifest.xml` |

### Lo que hace la app distinto dentro del APK

`src/servicios/nativo.js` (en la web no hace nada):

- **Boton Atras de Android**: vuelve a la pantalla anterior; en el inicio minimiza la
  app en lugar de cerrarla.
- **Enlaces de los correos**: confirmar la cuenta y recuperar la contraseña vuelven a
  `sintaxia://auth/auth/callback` o `sintaxia://auth/auth/nueva-clave`. Android abre la
  app y esta pasa a la pantalla equivalente, donde el cliente de Supabase canjea el
  codigo como en la web. Solo se aceptan esas dos rutas.
- **Teclado y barras del sistema**: Capacitor 8 achica la vista cuando aparece el
  teclado y deja el contenido fuera de las barras de estado y navegacion; no hizo
  falta codigo propio.

### Supabase

En el panel del proyecto, **Authentication → URL Configuration → Redirect URLs**,
agregar:

```
sintaxia://auth/**
```

Sin eso, Supabase ignora el retorno a la app y manda los enlaces al *Site URL* (la web).

---

## 20.5 Generar el APK debug (ensayos)

Desde la raiz del proyecto, con el `.env` completo (URL y clave publicable de
Supabase, ver `.env.example`):

```bash
npm install                      # la primera vez
npm run android:web              # 1) vite build --mode android  2) npx cap sync android
cd android
./gradlew assembleDebug          # Linux / macOS
gradlew.bat assembleDebug        # Windows (cmd o PowerShell: .\gradlew.bat assembleDebug)
```

En Linux tambien esta todo junto: `npm run android:debug`.

- `vite build --mode android` compila la app en `dist/` leyendo `.env` **y**
  `.env.android` (que solo agrega `VITE_URL_RETORNO_AUTH=sintaxia://auth`).
- `npx cap sync android` copia `dist/` a `android/app/src/main/assets/public/` y
  actualiza los plugins.
- La primera vez el Wrapper baja Gradle 8.14.3 y las dependencias (unos minutos).

**El APK queda en:**

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Esta firmado con la clave de depuracion que Gradle crea sola (`~/.android/debug.keystore`),
sirve para instalar y probar, **no para publicar**.

### Instalarlo en un celular

- **Con cable**: activar *Opciones de desarrollador → Depuracion USB* y
  `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.
- **Sin cable**: pasar el `.apk` al celular (Drive, cable, mensaje), abrirlo y permitir
  "instalar apps de origen desconocido" para esa app.

Para inspeccionar la app de un celular conectado: Chrome en la computadora →
`chrome://inspect` (solo en el APK debug).

---

## 20.6 Version release firmada (entrega publica)

### 1. Crear la clave de firma (una sola vez, fuera del repositorio)

```bash
mkdir -p ~/claves-sintaxia
keytool -genkeypair -v -keystore ~/claves-sintaxia/sintaxia-release.jks \
  -alias sintaxia -keyalg RSA -keysize 2048 -validity 10000
# pide dos contraseñas y los datos del certificado
```

En Windows es el mismo comando en una sola linea (`keytool` viene con el JDK), por
ejemplo con `%USERPROFILE%\claves-sintaxia\sintaxia-release.jks`.

### 2. Resguardar la clave

- El `.jks` y sus contraseñas **nunca** van al repositorio: el `.gitignore` ignora
  `*.jks`, `*.keystore` y `firma*.properties` por si alguien se equivoca.
- Guardar **dos copias** del `.jks` (por ejemplo, la unidad del docente y un pendrive) y
  las contraseñas en un gestor de contraseñas. **Si se pierde la clave no se puede
  publicar una actualizacion de la misma app**: habria que desinstalar y cambiar el
  identificador.

### 3. Compilar la release

Los datos de la firma se pasan por variables de entorno (no quedan en ningun archivo
del proyecto):

```bash
# Linux
export SINTAXIA_KEYSTORE=~/claves-sintaxia/sintaxia-release.jks
export SINTAXIA_KEY_ALIAS=sintaxia
read -s -p "Contraseña del almacen: " SINTAXIA_KEYSTORE_PASSWORD; export SINTAXIA_KEYSTORE_PASSWORD
read -s -p "Contraseña de la clave: " SINTAXIA_KEY_PASSWORD; export SINTAXIA_KEY_PASSWORD
npm run android:web && cd android && ./gradlew assembleRelease
```

```powershell
# Windows (PowerShell)
$env:SINTAXIA_KEYSTORE = "$env:USERPROFILE\claves-sintaxia\sintaxia-release.jks"
$env:SINTAXIA_KEY_ALIAS = "sintaxia"
$env:SINTAXIA_KEYSTORE_PASSWORD = Read-Host "Contraseña del almacen"
$env:SINTAXIA_KEY_PASSWORD = Read-Host "Contraseña de la clave"
npm run android:web; cd android; .\gradlew.bat assembleRelease
```

Tambien se puede usar un archivo de propiedades **fuera del repo**
(`SINTAXIA_FIRMA=/ruta/firma.properties` con `storeFile`, `storePassword`, `keyAlias` y
`keyPassword`).

**El APK queda en** `android/app/build/outputs/apk/release/app-release.apk`. Sin la
clave configurada sale `app-release-unsigned.apk`, que Android no deja instalar.

### 4. Verificar la firma

```bash
$ANDROID_HOME/build-tools/35.0.0/apksigner verify --print-certs \
  android/app/build/outputs/apk/release/app-release.apk
```

Tiene que decir `Verified using v2 scheme ... true` y mostrar el certificado propio (no
el de depuracion). Un celular que tiene instalado el APK debug tiene que
**desinstalarlo** antes de instalar la release (estan firmados con claves distintas).

---

## 20.7 Una version nueva

1. Cambiar `version` en `package.json` (por ejemplo `1.0.1`).
2. `npm run android:web` y `assembleDebug` o `assembleRelease`.
3. El `versionCode` sube solo (10001), asi Android la instala como actualizacion.

## 20.8 Problemas comunes

| Sintoma | Causa y solucion |
|---|---|
| `SDK location not found` | Falta `ANDROID_HOME` o `android/local.properties` (20.3) |
| `Unsupported class file major version` o Gradle pide otra Java | `JAVA_HOME` apunta a un JDK que no es el 21 |
| `You have not accepted the license agreements` | `sdkmanager --licenses` |
| La app dice "Falta configurar la conexion con Supabase" | Se compilo sin `.env`. Completarlo y repetir `npm run android:web` + `assembleDebug` |
| El enlace del correo abre el navegador | Falta `sintaxia://auth/**` en *Redirect URLs*, o se compilo sin `--mode android` |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Hay instalada una version firmada con otra clave: desinstalarla |
| Cambios de la web que no aparecen | Faltó `npm run android:web` antes de Gradle |

## 20.9 Archivos

| Que | Archivo |
|---|---|
| Configuracion de Capacitor | `capacitor.config.json` |
| Proyecto Android (generado por `npx cap add android` y ajustado) | `android/` |
| Version y firma | `android/app/build.gradle` |
| Deep link y permisos | `android/app/src/main/AndroidManifest.xml` |
| Icono y splash | `scripts/generar-recursos-android.mjs` → `android/app/src/main/res/` |
| Boton Atras y enlaces | `src/servicios/nativo.js` |
| Direccion de retorno del APK | `.env.android` |
