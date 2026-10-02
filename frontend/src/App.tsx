import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreateExam from './pages/CreateExam';
import JoinExam from './pages/JoinExam';
import ExamScreen from './pages/ExamScreen';
import OrganizerPanel from './pages/OrganizerPanel';
import ResultsScreen from './pages/ResultsScreen';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">MCQ EXAM</h1>
        </header>
        <main className="flex-grow p-6 flex items-start justify-center">
          <div className="w-full max-w-4xl">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreateExam />} />
              <Route path="/join" element={<JoinExam />} />
              <Route path="/exam/:examCode" element={<ExamScreen />} />
              <Route path="/organizer/:examCode" element={<OrganizerPanel />} />
              <Route path="/results/:examCode" element={<ResultsScreen />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
