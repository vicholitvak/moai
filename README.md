# Moai App 🗿

Bienvenido al repositorio de Moai. Aquí encontrarás todo el código fuente y la documentación necesaria para entender, instalar y contribuir a este proyecto.

## 📝 Acerca del Proyecto

*(Aquí puedes escribir una descripción detallada de tu aplicación. ¿Qué problema resuelve? ¿Cuál es su propósito? Por ejemplo: "Moai es una plataforma que conecta a cocineros caseros con personas que buscan comida auténtica y de calidad en su vecindario.")*

---

## ✨ Características

*   **Autenticación de Usuarios:** Registro e inicio de sesión seguros con Firebase Authentication.
*   **Base de Datos en Tiempo Real:** Uso de Cloud Firestore para almacenar y sincronizar datos de manera eficiente.
*   **Lógica de Backend:** Cloud Functions para ejecutar código del lado del servidor en respuesta a eventos.
*   **Hosting:** Alojamiento web rápido y seguro con Firebase Hosting.
*   *(Añade aquí otras características importantes de tu app)*

---

## 🛠️ Construido Con

Este proyecto utiliza las siguientes tecnologías:

*   [Firebase](https://firebase.google.com/) - Plataforma de desarrollo de aplicaciones.
    *   Firebase Authentication
    *   Cloud Firestore
    *   Cloud Functions for Firebase
    *   Firebase Hosting
*   [Node.js](https://nodejs.org/) - Entorno de ejecución para JavaScript.

---

## 🚀 Empezando

Sigue estos pasos para tener una copia del proyecto funcionando en tu máquina local.

### Prerrequisitos

Asegúrate de tener instalado lo siguiente:

*   **Node.js:** [Descargar e instalar Node.js](https://nodejs.org/en/download/)
*   **Firebase CLI:**
    ```sh
    npm install -g firebase-tools
    ```

### Instalación

1.  **Clona el repositorio:**
    ```sh
    git clone https://github.com/vicholitvak/moai.git
    cd moai
    ```

2.  **Instala las dependencias del proyecto:**
    ```sh
    npm install
    ```

3.  **Instala las dependencias de las Cloud Functions:**
    ```sh
    cd functions
    npm install
    cd ..
    ```

4.  **Configura tu proyecto de Firebase:**
    *   Crea un proyecto en la [Consola de Firebase](https://console.firebase.google.com/).
    *   Conecta tu proyecto local con el de Firebase:
        ```sh
        firebase use --add
        ```

---

## ☁️ Despliegue

Para desplegar la aplicación en Firebase, ejecuta el siguiente comando desde la raíz del proyecto:

```sh
firebase deploy
```

---

## 📄 Licencia

Distribuido bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información. *(Nota: Deberías añadir un archivo LICENSE a tu proyecto si aún no lo tienes)*.