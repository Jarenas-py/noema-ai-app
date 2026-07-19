# Noema — Connect Better, Not More

An ambient AI companion designed for intentional digital disconnection. Noema acts as a quiet interface between you and the people who matter — filtering noise, surfacing meaning, and staying out of your way otherwise.

> Encrypted · On-device · Silent by default

---

## 🌐 Live Website

The web app is live and hosted on Vercel:

**[https://noema-ai-app.vercel.app](https://noema-ai-app.vercel.app)**

Built with **TanStack Start**, React 19, and Vite, and automatically deployed from the `main` branch of this repository.

---

## 📱 Android App

Noema is also available as a native Android wrapper around the live web app, using a WebView-based shell.

There are two ways to get the Android app:

### Option 1 — Download the prebuilt APK
The Android source code and a prebuilt `.apk` are kept on a separate branch to keep the mobile project isolated from the web deployment:

👉 **[`noema_mobileApp` branch](https://github.com/Jarenas-py/noema-ai-app/tree/noema_mobileApp)**

Download the `.apk` file directly from that branch and install it on your Android device (you'll need to allow installs from unknown sources if it's not distributed via the Play Store).

### Option 2 — Build it yourself from source
If you'd rather build the Android app from source:

```bash
# Clone the repository
git clone https://github.com/Jarenas-py/noema-ai-app.git
cd noema-ai-app

# Switch to the Android source branch
git checkout noema_mobileApp
```

Then open the project folder in **Android Studio**:

1. **File → Open** → select the cloned folder
2. Let Gradle sync finish
3. Make sure you have **Android API 33** (or higher) installed via **Tools → SDK Manager**
4. Select an emulator or physical device running **API 33+**
5. Click **Run ▶** to build and install the app

The app is a lightweight WebView shell that loads the live site directly — any updates pushed to the web app's `main` branch are reflected automatically the next time the app is opened, no rebuild required.

---

## 🗂️ Repository Structure

This repository uses separate branches for separate concerns:

| Branch | Contents |
|---|---|
| `main` | Web application source (React, TanStack Start, Vite) — deployed to Vercel |
| `noema_mobileApp` | Android Studio project source + prebuilt `.apk` |

---

## 🛠️ Tech Stack

**Web**
- [TanStack Start](https://tanstack.com/start) (SSR framework)
- [TanStack Router](https://tanstack.com/router)
- React 19
- Vite
- Tailwind CSS
- Radix UI components

**Android**
- Java
- Android WebView (min SDK 24, tested/built with API 33+)
  
---

## 🙋 About

This project was built with [Lovable](https://lovable.dev).
