import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ResultsScreen() {
  const { examCode } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const participantId = localStorage.getItem(`participant_${examCode}`);

  useEffect(() => {
    if (!participantId) {
      navigate('/join');
      return;
    }
    
    // Quick polling to wait for RESULTS status
    const fetchData = async () => {
      try {
        // Fetch exam to check status
        const exRes = await fetch(`/api/exams/${examCode}`);
        const exam = await exRes.json();
        
        if (exam.status === 'RESULTS') {
          // Fetch participant details
          // To be secure, we need an endpoint to get participant result by ID without admin token.
          const pRes = await fetch(`/api/exams/${examCode}/result?participantId=${participantId}`);
          const pData = await pRes.json();
          if (pData.success) {
            setData({ exam, result: pData.result, key: pData.key });
          } else setError(pData.error);
        } else {
          setError('Waiting for organizer to release results...');
        }
      } catch (err) {
        setError('Network error');
      }
    };
    
    fetchData();
    const int = setInterval(fetchData, 5000);
    return () => clearInterval(int);
  }, [examCode, participantId, navigate]);

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center bg-white rounded shadow-sm border border-gray-100">
        <h3 className="text-xl font-medium text-gray-800 animate-pulse">{error || 'Loading...'}</h3>
      </div>
    );
  }

  const { exam, result, key } = data;
  const percentage = Math.round((result.totalCorrect / exam.numQuestions) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center border-t-4 border-t-green-500">
        <h2 className="text-xl font-bold text-gray-500 tracking-widest uppercase mb-2">{exam.name}</h2>
        <h3 className="text-3xl font-bold text-gray-800 mb-6">{result.name}</h3>
        
        <div className="text-6xl font-bold text-green-600 mb-2">{result.totalCorrect} / {exam.numQuestions}</div>
        <div className="text-2xl text-gray-500 mb-8">{percentage}%</div>
        
        <div className="flex justify-center gap-8 text-sm text-gray-600">
          <div className="flex flex-col"><span className="font-bold text-green-600 text-lg">{result.totalCorrect}</span> Correct</div>
          <div className="flex flex-col"><span className="font-bold text-red-500 text-lg">{result.totalWrong}</span> Wrong</div>
          <div className="flex flex-col"><span className="font-bold text-gray-400 text-lg">{result.totalUnanswered}</span> Unanswered</div>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg mb-6 border-b pb-2">Question Review</h3>
        <div className="space-y-6">
          {exam.questions.map((q: any) => {
            const pAns = result.answers[q.id];
            const cAns = key[q.id];
            const isCorrect = pAns === cAns;
            
            return (
              <div key={q.id} className="p-4 bg-gray-50 rounded border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                    Q{q.id} {isCorrect ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-700 font-medium">{q.question}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                  <div className="p-2 bg-white rounded border">
                    <span className="text-gray-500 text-xs block uppercase tracking-wider">Your Answer</span>
                    <span className="font-bold text-gray-800">{pAns || 'Not Answered'}</span>
                  </div>
                  <div className="p-2 bg-green-50 rounded border border-green-100">
                    <span className="text-green-700 text-xs block uppercase tracking-wider">Correct Answer</span>
                    <span className="font-bold text-green-800">{cAns}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
