# Speak Spectrum Web Application

Speak Spectrum is a cutting-edge web application designed to transform the way you analyze educational videos. By using advanced services from Azure Cognitive Services, Speak Spectrum takes an uploaded video, creates an automatic transcript, and provides critical analytics about each speaker's sentiment and talk-time.

## Features:

1. **Automatic Transcript Generation:** The application processes the uploaded video to extract its audio and utilizes Azure Cognitive Services' Speech to Text API to generate a transcript.
2. **Speaker Analytics:** Obtain insights about each speaker's sentiment and talk-time using Azure's Text Analytics API & AI Video Indexer.
3. **Support for Multiple Speakers:** The application is optimized to analyze videos with at least three participants.

## Tech Stack:

- **Frontend:** Angular.js
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **External Services:** Azure Cognitive Services (Speech to Text API, Text Analytics API & AI Video Indexer)

## Getting Started:

### Prerequisites:

Ensure you have Node.js, Angular CLI and PostgreSQL set up on your system.

### Steps to Run:

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   ```

2. **Install Dependencies**

   Navigate to the backend directory and install the necessary dependencies:

   ```bash
   cd backend
   npm install
   ```

   Next, navigate to the frontend directory and install the required packages:

   ```bash
   cd frontend
   npm install
   ```

3. **Start the Backend Server**

   ```bash
   cd backend
   node server.js
   ```

4. **Start the Frontend Application**
   ```bash
   cd frontend
   ng serve
   ```

### Using the Application:

1. **Transcript Section:** Begin by uploading your video in the Transcript section. The application will process the video and present you with a detailed transcript.

2. **Analytics Section:** Once the transcript is ready, navigate to the Analytics section for a deeper dive.
   - **Text Analytics:** Provides sentiment analysis derived from the generated transcript.
   - **Video Analytics:** Offers insights such as talk-time for each speaker using Azure's AI Video Indexer.

## Acknowledgments:

Thanks to Azure Cognitive Services for providing the powerful APIs used in this application.
