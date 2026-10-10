# AllInOne 2.0: B2B Medical Marketplace

A full-stack **React Native** mobile app with **24 screens** that connects **Medical Stores** and **Medical Agencies** on one marketplace. Customers (Medical Stores) can browse products, add them to a cart and place orders. Sellers (Medical Agencies) can list and manage their products. Authentication, database, file storage and server-side logic run on **Appwrite**.

📱 **[Download the Android APK](https://github.com/Mohd-Ammar-Qureshi/AllInOne_2.0/releases/latest)** | 💼 **[Watch the demo on LinkedIn](https://lnkd.in/p/dbejJnGz)**

---

## 📸 Screenshots

<!-- Add 3-4 screenshots here, for example: login, seller dashboard, product list, cart -->
_Coming soon_

---

## ✨ Features

- 🔐 **Authentication**
  - User registration, login and logout
  - Role-based flows for **Customer** and **Seller**
  - Protected navigation based on login state and role

- 🏪 **Seller tools**
  - Add, edit and delete products
  - Upload product images

- 🛒 **Customer tools**
  - Browse products
  - Search and filter products
  - Cart and order workflow

- ☁️ **Appwrite backend**
  - Authentication, Database, Storage and Functions

- 🗂️ **State management**
  - Redux Toolkit for auth, products, cart and orders

- 📱 **24 screens**
  - Covers authentication, seller product management, browsing, cart and orders

- 🎨 **UI**
  - Reusable components
  - Dark and light theme

---

## 🛠️ Tech Stack

| Technology       | Purpose                               |
| ---------------- | ------------------------------------- |
| React Native     | Mobile application                    |
| TypeScript       | Type safety                           |
| Redux Toolkit    | State management                      |
| React Navigation | Navigation and protected routes       |
| Appwrite         | Auth, Database, Storage and Functions |

---

## 🏗️ Project Structure

```text
AllInOne_2.0/
├── android/
├── ios/
├── functions/              # Appwrite Functions
├── src/
│   ├── components/
│   ├── screens/
│   ├── navigation/
│   ├── services/
│   ├── store/
│   └── ...
├── __tests__/
├── appwrite.config.json
├── .env.example
├── package.json
└── tsconfig.json
```

The frontend talks to Appwrite through a service layer, so backend logic stays out of the UI components.

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/Mohd-Ammar-Qureshi/AllInOne_2.0.git
cd AllInOne_2.0
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your own Appwrite values (endpoint, project ID, database and collection IDs).

> Never commit real API keys, secrets or private credentials to GitHub.

### 4. Start Metro

```bash
npm start
```

### 5. Run on Android

```bash
npm run android
```

---

## 📱 Platform

Developed and tested on **Android**. iOS configuration is included in the React Native project.

---

## 🚀 Future Improvements

- Offline support
- Push notifications
- Better loading and error states
- Automated tests
- iOS release

---

## 📚 What This Project Demonstrates

- React Native development with TypeScript
- Role-based authentication and protected navigation
- CRUD operations, image uploads, search/filter, cart and orders
- Appwrite Auth, Database, Storage and Functions
- Redux Toolkit state management
- Modular, component-based architecture across 24 screens

---

## 👨‍💻 Developer

**Mohd Ammar Qureshi**: Frontend & React Native Developer

<<<<<<< HEAD
Web & Mobile Developer focused on:

* JavaScript
* React
* React Native
* Node.js
* Appwrite
* Tailwind CSS

### GitHub
[github.com/Mohd-Ammar-Qureshi](https://github.com/Mohd-Ammar-Qureshi)

---

## 🔗 Links

📱 **Download APK:** [Latest release](https://github.com/Mohd-Ammar-Qureshi/AllInOne_2.0/releases/latest)
  
💼 **LinkedIn post / demo:** [Watch on LinkedIn](https://lnkd.in/p/dbejJnGz)

👤 **Developer:** [Mohd Ammar Qureshi](https://www.linkedin.com/in/ammar-qureshi858)

---

## ⭐ Support

If you find this project useful or interesting, consider giving the repository a ⭐ on GitHub.
=======
- [LinkedIn](https://www.linkedin.com/in/ammar-qureshi858)
- [GitHub](https://github.com/Mohd-Ammar-Qureshi)
- ammarq858@gmail.com
>>>>>>> 2169022 (Update AllInOne)
