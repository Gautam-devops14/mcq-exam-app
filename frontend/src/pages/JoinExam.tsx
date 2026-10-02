import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function JoinExam() {
  const navigate = useNavigate();
  const [examCode, setExamCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const code = examCode.toUpperCase();
      
      // Check if participant already exists locally
      const existingId = localStorage.getItem(`participant_${code}`);
      
      if (existingId) {
        // Quick check for exam status
        const exRes = await fetch(`/api/exams/${code}`);
        const exData = await exRes.json();
        
        if (exData.status === 'RESULTS') {
          navigate(`/results/${code}`);
          return;
        } else if (exData.status === 'OPEN') {
          navigate(`/exam/${code}`);
          return;
        }
      }

      const res = await fetch(`/api/exams/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(`participant_${code}`, data.participantId);
        navigate(`/exam/${code}`);
      } else {
        setError(data.error || 'Failed to join exam');
      }
    } catch (err) {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Join Exam</h2>
      {error && <div className="mb-4 text-red-600 bg-red-50 p-2 rounded text-sm">{error}</div>}
      <form onSubmit={handleJoin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Code</label>
          <input 
            type="text" 
            required
            value={examCode}
            onChange={e => setExamCode(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 uppercase" 
            placeholder="e.g. CPROG-4821"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
          <input 
            type="text" 
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" 
            placeholder="e.g. Gautam"
          />
        </div>
        <button disabled={loading} type="submit" className="w-full mt-4 bg-green-600 text-white p-3 rounded-md font-semibold hover:bg-green-700 disabled:opacity-50">
          {loading ? 'Joining...' : 'Start Exam'}
        </button>
      </form>
    </div>
  );
}
