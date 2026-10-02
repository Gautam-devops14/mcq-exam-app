import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ExamScreen() {
  const { examCode } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const participantId = localStorage.getItem(`participant_${examCode}`);

  useEffect(() => {
    if (!participantId) {
      navigate('/join');
      return;
    }

    const fetchExam = async () => {
      try {
        const res = await fetch(`/api/exams/${examCode}`);
        const data = await res.json();
        if (res.ok) {
          if (data.status === 'RESULTS') {
            navigate(`/results/${examCode}`);
            return;
          }
          setExam(data);
          const saved = localStorage.getItem(`answers_${examCode}`);
          if (saved) setAnswers(JSON.parse(saved));
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [examCode, participantId, navigate]);

  const saveAnswers = async (newAnswers: Record<string, string>, isSubmit = false) => {
    localStorage.setItem(`answers_${examCode}`, JSON.stringify(newAnswers));
    try {
      await fetch(`/api/exams/${examCode}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, answers: newAnswers, isSubmit })
      });
    } catch (e) {
      console.error('Failed to sync answers to backend');
    }
  };

  const handleSelect = (questionId: string, optionKey: string) => {
    const newAnswers = { ...answers, [questionId]: optionKey };
    setAnswers(newAnswers);
    saveAnswers(newAnswers, false);
  };
  
  const handleClearAnswer = (questionId: string) => {
    const newAnswers = { ...answers };
    delete newAnswers[questionId];
    setAnswers(newAnswers);
    saveAnswers(newAnswers, false);
  };

  const handleSubmit = async () => {
    const total = exam.questions.length;
    const answered = Object.keys(answers).length;
    const confirmSubmit = window.confirm(`Are you sure you want to submit?\n\nAnswered: ${answered} / ${total}\nUnanswered: ${total - answered}`);
    
    if (confirmSubmit) {
      setSubmitting(true);
      await saveAnswers(answers, true);
      alert('Exam Submitted Successfully\n\nYour result will be available after the organizer releases the answer key.');
      navigate('/');
    }
  };

  if (loading) return <div className="text-center py-20">Loading exam...</div>;
  if (error || !exam) return <div className="text-center py-20 text-red-600">{error || 'Exam not found'}</div>;

  const question = exam.questions[currentIndex];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h2 className="font-bold text-lg text-gray-800">{exam.name}</h2>
        {exam.duration && <span className="font-mono font-bold text-gray-700">{exam.duration} mins</span>}
      </div>
      
      <div className="p-6 min-h-[300px]">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">Question {currentIndex + 1} of {exam.questions.length}</p>
          {answers[question.id] && (
            <button 
              onClick={() => handleClearAnswer(question.id)}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Clear Selection
            </button>
          )}
        </div>
        <h3 className="text-xl mb-6 text-gray-800 font-medium whitespace-pre-wrap">{question.question}</h3>
        
        <div className="space-y-3">
          {Object.entries(question.options).map(([key, text]) => (
            <label key={key} className="flex items-center p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
              <input 
                type="radio" 
                name={`q-${question.id}`} 
                checked={answers[question.id] === key}
                onChange={() => handleSelect(question.id, key)}
                className="mr-3 h-4 w-4 text-blue-600" 
              />
              <span>{key}. {text as string}</span>
            </label>
          ))}
        </div>
        
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button 
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(c => c - 1)}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          
          {currentIndex === exam.questions.length - 1 ? (
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Submit Exam
            </button>
          ) : (
            <button 
              onClick={() => setCurrentIndex(c => c + 1)}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Next
            </button>
          )}
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex flex-wrap gap-2">
        {exam.questions.map((q: any, i: number) => {
          const isCurrent = i === currentIndex;
          const isAnswered = !!answers[q.id];
          let btnClass = 'bg-white border-gray-300 text-gray-600';
          if (isCurrent) btnClass = 'bg-blue-600 text-white border-blue-600';
          else if (isAnswered) btnClass = 'bg-green-100 text-green-800 border-green-200';
          
          return (
            <button 
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-8 h-8 rounded text-sm border font-medium ${btnClass}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
