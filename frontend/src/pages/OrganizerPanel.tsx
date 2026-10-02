import { extractTextFromPDF } from '../utils/pdfExtractor';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function OrganizerPanel() {
  const { examCode } = useParams();
  
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsedKey, setParsedKey] = useState<Record<string, string> | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const token = localStorage.getItem(`admin_${examCode}`);

  useEffect(() => {
    if (!token) {
      setError('Unauthorized. Only the creator can view this page on this device.');
      return;
    }
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/exams/${examCode}/organizer?token=${token}`);
        const json = await res.json();
        if (json.success) setData(json);
        else setError(json.error);
      } catch (err) {
        setError('Network error');
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000); // Auto refresh
    return () => clearInterval(interval);
  }, [examCode, token]);

  const handleUploadKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('token', token!);
    
    try {
      const res = await fetch(`/api/exams/${examCode}/upload-key`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success) setParsedKey(json.parsedKey);
      else alert(json.error);
    } catch (err) {
      alert('Error uploading key');
    } finally {
      setUploading(false);
    }
  };

  const handleRelease = async () => {
    if (!parsedKey) return;
    setReleasing(true);
    try {
      const res = await fetch(`/api/exams/${examCode}/release-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, confirmedKey: parsedKey })
      });
      const json = await res.json();
      if (json.success) {
        alert('Results released successfully!');
        window.location.reload();
      } else alert(json.error);
    } catch (err) {
      alert('Error releasing results');
    } finally {
      setReleasing(false);
    }
  };

  if (error) return <div className="p-10 text-center text-red-600 font-medium">{error}</div>;
  if (!data) return <div className="p-10 text-center">Loading...</div>;

  const { exam, participants } = data;
  const allSubmitted = participants.length > 0 && participants.every((p: any) => p.status === 'SUBMITTED');

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-2xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Exam: {exam.name}</h2>
          <p className="text-gray-500 font-mono">Code: {examCode}</p>
        </div>
        <span className={`px-3 py-1 rounded text-sm font-semibold ${exam.status === 'RESULTS' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
          {exam.status}
        </span>
      </div>

      <h3 className="font-semibold text-lg mb-4 text-gray-700 border-b pb-2">
        Participants ({participants.filter((p: any) => p.status === 'SUBMITTED').length}/{participants.length} Submitted)
      </h3>
      
      {participants.length === 0 ? (
        <p className="text-gray-400 mb-8 italic">No participants have joined yet.</p>
      ) : (
        <ul className="space-y-2 mb-8">
          {participants.map((p: any) => (
            <li key={p.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100">
              <span className="font-medium text-gray-800">{p.name}</span>
              {exam.status === 'RESULTS' ? (
                <span className="font-bold text-blue-600">Score: {p.score}</span>
              ) : (
                <span className={`text-sm font-semibold ${p.status === 'SUBMITTED' ? 'text-green-600' : 'text-orange-500'}`}>
                  {p.status === 'SUBMITTED' ? 'Submitted' : 'In Progress'}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {exam.status === 'OPEN' && allSubmitted && !parsedKey && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 text-center">
          <p className="mb-4 text-blue-800 font-medium">All participants have submitted.</p>
          
          <button 
            type="button" 
            onClick={() => setShowGuide(!showGuide)}
            className="text-sm text-blue-600 font-medium hover:underline mb-4 inline-block"
          >
            {showGuide ? 'Hide Format Guide' : 'View Answer Key Format Guide'}
          </button>
          
          {showGuide && (
            <div className="mb-6 p-4 bg-white border border-blue-200 rounded text-sm text-gray-700 font-mono text-left whitespace-pre-wrap">
              <p className="font-bold text-gray-900 mb-2">Answer Key PDF Format:</p>
              {'1. A\n2. C\n3. B\n\nOr:\nQ1 - A\nQ2 - C\n\nOr simply:\n1 A\n2 C'}
            </div>
          )}

          <form onSubmit={handleUploadKey} className="flex flex-col items-center gap-4">
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" 
            />
            <button disabled={uploading || !file} type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50">
              {uploading ? 'Uploading...' : 'Upload Answer Key PDF'}
            </button>
          </form>
        </div>
      )}

      {parsedKey && (
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h4 className="font-bold text-yellow-800 mb-4">Answer Key Detected</h4>
          <div className="max-h-60 overflow-y-auto mb-4 bg-white p-4 border border-yellow-100 rounded text-left">
            {Object.entries(parsedKey).map(([q, ans]) => (
              <div key={q} className="flex gap-4 border-b border-gray-50 py-1">
                <span className="text-gray-500 w-12">Q{q}</span>
                <span className="font-bold text-gray-800">→ {ans as string}</span>
              </div>
            ))}
          </div>
          <button onClick={handleRelease} disabled={releasing} className="w-full bg-yellow-600 text-white px-6 py-3 rounded font-bold hover:bg-yellow-700 disabled:opacity-50">
            {releasing ? 'Releasing...' : 'Confirm Answer Key & Release Results'}
          </button>
        </div>
      )}
    </div>
  );
}
