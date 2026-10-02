import { extractTextFromPDF } from '../utils/pdfExtractor';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function CreateExam() {
  const navigate = useNavigate();
  const [examName, setExamName] = useState('');
  const [duration, setDuration] = useState('');
  const [numQuestions, setNumQuestions] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a question PDF');
      return;
    }
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('examName', examName);
    formData.append('duration', duration);
    formData.append('numQuestions', numQuestions);
    formData.append('pdf', file);

    try {
      const res = await fetch('/api/exams/create', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(`admin_${data.examCode}`, data.adminToken);
        alert(`Exam Created! Parsed ${data.questionsParsed} questions.`);
        navigate(`/organizer/${data.examCode}`);
      } else {
        setError(data.error || 'Failed to create exam');
      }
    } catch (err) {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Exam</h2>
      
      <button 
        type="button" 
        onClick={() => setShowGuide(!showGuide)}
        className="text-sm text-blue-600 font-medium hover:underline mb-4 inline-block"
      >
        {showGuide ? 'Hide Format Guide' : 'View PDF Format Guide'}
      </button>
      
      {showGuide && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 font-mono whitespace-pre-wrap">
          <p className="font-bold text-gray-900 mb-2">Question PDF Format:</p>
          {'Question 1\nWhat is the capital of France?\nA. London\nB. Berlin\nC. Paris\nD. Madrid\n\nQuestion 2\nWhich is correct?\nA. ...\nB. ...'}
        </div>
      )}

      {error && <div className="mb-4 text-red-600 bg-red-50 p-2 rounded text-sm">{error}</div>}
      
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name</label>
          <input 
            type="text" 
            required 
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" 
            placeholder="e.g. C Programming Test"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (optional mins)</label>
          <input 
            type="number" 
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" 
            placeholder="e.g. 60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Number of Questions</label>
          <input 
            type="number" 
            required
            value={numQuestions}
            onChange={(e) => setNumQuestions(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" 
            placeholder="e.g. 50"
          />
        </div>
        <div className="pt-4 border-t border-gray-100 mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Question PDF</label>
          <input 
            type="file" 
            accept="application/pdf" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
          />
        </div>
        <button disabled={loading} type="submit" className="w-full mt-6 bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Processing...' : 'Create Exam'}
        </button>
      </form>
    </div>
  );
}
