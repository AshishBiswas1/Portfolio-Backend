# Ashish Biswas Portfolio - Backend API (`Portfolio-Backend`)

## Project Overview
The **`Portfolio-Backend`** repository provides the core RESTful API and server-side infrastructure for the Ashish Biswas portfolio platform. Built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**, it handles data persistence, authentication, file upload processing via **Cloudinary**, visitor telemetry tracking, and integration with an external Python Machine Learning microservice.

---

## How It Works
1. **Express Server Architecture (`server.js`, `app.js`)**: Configures CORS middleware, security headers, rate limiting, and centralized error handling (`errorController.js`).
2. **Database Models (`models/`)**: Mongoose schemas defining MongoDB collections for User Profiles, Qualifications, Internships/Experiences, Projects, Technical Skills, Resume Data, Contact Messages, and Visitor Analytics.
3. **Cloudinary Asset Pipeline**: Handles single and multi-file upload streams for project preview images, offer letters, and recommendation letters using `multer` memory storage.
4. **Machine Learning Microservice Integration (`util/pythonMlClient.js`)**: Sends project descriptions and skill datasets to the Python ML microservice to automatically calculate relevance, impact, and confidence scores.
5. **Visitor Telemetry Tracking (`visitorController.js`)**: Automatically logs visitor pageviews, IP metadata, section dwell times, and hit counts to MongoDB.

---

## Built Features
- **Project Management API**: Full CRUD endpoints for portfolio projects supporting multiple image uploads, single image updates/replacements, live links, and ML impact score evaluation.
- **Experience / Internship API**: Dynamic management of internship records, including multi-part document attachments (offer letters and recommendation letters).
- **Academic Qualifications API**: Endpoints for updating educational history, institutions, fields of study, and academic scores.
- **Technical Skills API**: Endpoints for organizing skills into categories and updating proficiency metrics.
- **Visitor Hit & Telemetry Tracker**: API routes for real-time tracking of visitor traffic, referrer sources, and page hit counters.
- **Authentication & Security**: JWT-based authentication for administrative routes with password hashing and route protection.

---

## Website Description
This backend service powers the dynamic data flow for the entire portfolio website. It supplies the frontend with real-time portfolio content stored in MongoDB Atlas, processes admin dashboard edits instantaneously, securely handles media uploads, and keeps track of visitor engagement statistics.

---

## Environment Variables & Security Note

> [!NOTE]  
> All secret keys, database credentials, and third-party API keys have been omitted from this repository and documentation for security compliance.

### Required Environment Variables (Structure Only)
```env
PORT=<SERVER_PORT>
NODE_ENV=<development|production>
DATABASE=<MONGODB_ATLAS_CONNECTION_STRING>
DATABASE_PASSWORD=<MONGODB_DATABASE_PASSWORD>
JWT_SECRET=<JWT_SIGNING_SECRET_KEY>
JWT_EXPIRES_IN=<JWT_EXPIRATION_TIME>
CLOUDINARY_CLOUD_NAME=<CLOUDINARY_CLOUD_NAME>
CLOUDINARY_API_KEY=<CLOUDINARY_API_KEY>
CLOUDINARY_API_SECRET=<CLOUDINARY_API_SECRET>
PYTHON_ML_SERVICE_URL=<PYTHON_ML_MICROSERVICE_ENDPOINT>
```