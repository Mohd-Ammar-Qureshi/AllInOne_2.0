# AllInOne 2.0

A full-stack **React Native application** for securely managing and organizing personal product information in one place.

AllInOne allows users to save product details they may want to purchase in the future, including product name, description, price, image URL, and status. User authentication and cloud data storage are handled using **Appwrite**.

> **Note:** AllInOne is not an e-commerce or shopping application. It is a personal product-record and information-management application.

---

## ✨ Features

* 🔐 **User Authentication**

  * User registration and login
  * Secure Appwrite authentication
  * User-specific data

* 📝 **Product Records**

  * Add product information
  * Edit existing records
  * Delete records
  * View saved products
  * Store product name, details, price, image URL, and status

* ☁️ **Cloud Backend**

  * Appwrite authentication
  * Appwrite database
  * Cloud-based data storage

* 🎨 **Modern UI**

  * Dark and light theme
  * Responsive React Native interface
  * Reusable UI components
  * User-friendly navigation

* 🗂️ **State Management**

  * Redux Toolkit
  * Centralized application state
  * Authentication and product state management

---

## 🛠️ Tech Stack

| Technology                      | Purpose                           |
| ------------------------------- | --------------------------------- |
| React Native                    | Mobile application                |
| TypeScript                      | Type safety                       |
| Appwrite                        | Authentication & backend services |
| Redux Toolkit                   | State management                  |
| React Navigation                | Application navigation            |
| React Native UI components      | User interface                    |
| Async/Environment configuration | Application configuration         |

---

## 🏗️ Project Structure

```text
AllInOne/
├── android/
├── ios/
├── src/
│   ├── components/
│   ├── screens/
│   ├── navigation/
│   ├── services/
│   ├── store/
│   └── ...
├── __tests__/
├── .env
├── package.json
├── tsconfig.json
├── babel.config.js
└── README.md
```

The project follows a modular structure to keep authentication, navigation, services, state management, and UI components separated and maintainable.

---

## 🔐 Authentication

Authentication is implemented using **Appwrite Account services**.

The application supports:

* User registration
* User login
* User logout
* Current-user handling
* Authentication-based navigation

Authenticated users can access and manage their own product records.

---

## 📦 Product Management

Users can create personal records for products they are interested in.

Each record can contain:

* **Product Name**
* **Description / Details**
* **Price**
* **Image URL**
* **Status**
* **User ID**
* **Created / Updated timestamps**

The application provides CRUD functionality:

```text
Create → Read → Update → Delete
```

This allows users to maintain their own product information without treating the application as an online store.

---

## ☁️ Appwrite Backend

Appwrite is used as the backend service for the application.

### Services Used

* **Authentication**
* **Database**
* **Cloud Storage / File services where required**

The frontend communicates with Appwrite through service-layer code rather than placing backend logic directly inside UI components.

---

## 🔄 State Management

The application uses **Redux Toolkit** to manage application state.

Redux is used to keep important data such as:

* Authentication state
* Product records
* Loading states
* Error states
* CRUD operation states

This keeps the application state predictable and easier to maintain as the project grows.

---

## 🎨 UI & Themes

AllInOne supports both:

* ☀️ Light Mode
* 🌙 Dark Mode

The UI is built using reusable components to avoid duplicating interface logic across screens.

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/Mohd-Ammar-Qureshi/AllInOne.git
```

### 2. Navigate to the project

```bash
cd AllInOne
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the project root and add your Appwrite configuration:

```env
APPWRITE_ENDPOINT=your_appwrite_endpoint
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_DATABASE_ID=your_database_id
APPWRITE_COLLECTION_ID=your_collection_id
```

> Never commit real API keys, secrets, or private credentials to GitHub.

### 5. Start Metro

```bash
npm start
```

### 6. Run Android

```bash
npm run android
```

---

## 📱 Platform

Currently developed and tested primarily for:

* Android

iOS configuration is included in the React Native project and can be configured for development on macOS.

---

## 🚀 Future Improvements

Planned improvements may include:

* Product search and filtering
* Sorting by price/status
* Better image handling
* Product categories
* Improved validation
* Offline support
* Push notifications
* Better loading and error states
* Improved UI/UX
* Automated testing
* Production deployment

---

## 📚 What This Project Demonstrates

AllInOne demonstrates practical experience with:

* React Native application development
* TypeScript
* Component-based architecture
* React Navigation
* Redux Toolkit
* CRUD operations
* Authentication
* Appwrite integration
* Cloud database integration
* Environment configuration
* Dark/light theme implementation
* Modular project architecture

---

## 👨‍💻 Developer

**Mohd Ammar Qureshi**

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
