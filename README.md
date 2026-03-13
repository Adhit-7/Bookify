Project Structure

Bookify/
├── Backend/        # Python FastAPI server and AI processing
│   ├── main.py     # FastAPI application entry point
│   ├── venv/       # Python virtual environment
│   └── ...
├── Frontend/       # React web interface
│   ├── src/        # React source files
│   ├── package.json
│   └── ...
└── README.md

Installation

Clone the repository

bash   git clone https://github.com/Adhit-7/Bookify.git
   cd Bookify

Set up & run the Backend

Requires a Python virtual environment. On Windows:



bash   cd Backend

   # Activate the virtual environment
   .\venv\Scripts\activate

   # Install dependencies (first time only)
   pip install -r requirements.txt

   # Start the FastAPI server
   python.exe -m uvicorn main:app --reload
The backend will be running at http://127.0.0.1:8000

Set up & run the Frontend

bash   cd Frontend

   # Install dependencies (first time only)
   npm install


Author
Adhit-7
GitHub: @Adhit-7
   # Start the development server
   npm run dev
The frontend will be running at http://localhost:5173 (or as shown in your terminal)
