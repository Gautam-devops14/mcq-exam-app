import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Home() {
  const [myExams, setMyExams] = useState<any[]>([]);

  useEffect(() => {
    const loadExams = async () => {
      // Find all exam codes from localStorage
      const codes = new Set<string>();
      const roles: Record<string, { isAdmin: boolean, isParticipant: boolean }> = {};
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('admin_')) {
          const code = key.replace('admin_', '');
          codes.add(code);
          roles[code] = { ...roles[code], isAdmin: true };
        }
        if (key?.startsWith('participant_')) {
          const code = key.replace('participant_', '');
          codes.add(code);
          roles[code] = { ...roles[code], isParticipant: true };
        }
      }

      if (codes.size === 0) return;

      const examsData = await Promise.all(
        Array.from(codes).map(async (code) => {
          try {
            const res = await fetch(`/api/exams/${code}`);
            if (res.ok) {
              const data = await res.json();
              return { code, name: data.name, status: data.status, role: roles[code] };
            }
          } catch (e) {
            return null;
          }
          return null;
        })
      );

      setMyExams(examsData.filter(Boolean));
    };

    loadExams();
  }, []);

  return (
    <div className="flex flex-col items-center py-10 w-full">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">MCQ Exam Platform</h2>
      <div className="flex gap-6 mb-12">
        <Link 
          to="/create" 
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition shadow-sm"
        >
          Create New Exam
        </Link>
        <Link 
          to="/join" 
          className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-md font-semibold hover:bg-gray-50 transition shadow-sm"
        >
          Join via Code
        </Link>
      </div>

      {myExams.length > 0 && (
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold mb-4 border-b pb-2 text-gray-700">Recent Exams</h3>
          <div className="space-y-3">
            {myExams.map((exam: any) => (
              <div key={exam.code} className="flex justify-between items-center p-4 bg-gray-50 rounded border border-gray-100">
                <div>
                  <h4 className="font-bold text-gray-800">{exam.name} <span className="text-sm font-normal text-gray-500 font-mono ml-2">({exam.code})</span></h4>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${exam.status === 'RESULTS' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                      {exam.status}
                    </span>
                    {exam.role.isAdmin && <span className="text-xs px-2 py-0.5 rounded font-semibold bg-blue-100 text-blue-800">Organizer</span>}
                    {exam.role.isParticipant && <span className="text-xs px-2 py-0.5 rounded font-semibold bg-yellow-100 text-yellow-800">Participant</span>}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {exam.role.isAdmin && (
                    <Link to={`/organizer/${exam.code}`} className="px-4 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 font-medium">
                      Manage
                    </Link>
                  )}
                  {exam.role.isParticipant && (
                    <Link to={exam.status === 'RESULTS' ? `/results/${exam.code}` : `/exam/${exam.code}`} className="px-4 py-2 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 font-medium">
                      {exam.status === 'RESULTS' ? 'View Result' : 'Resume Exam'}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
