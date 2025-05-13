import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { AlertCircle, Save, X, MessageSquare, History, Loader2 } from 'lucide-react';

interface GradeInputProps {
  studentId: string;
  subjectId: string;
  onSuccess?: () => void;
}

interface Subject {
  id: string;
  name: string;
}

export function GradeInput({ studentId, subjectId, onSuccess }: GradeInputProps) {
  const [score, setScore] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [gradeHistory, setGradeHistory] = useState<any[]>([]);
  const [showCommentInput, setShowCommentInput] = useState(false);

  useEffect(() => {
    if (showHistory) {
      fetchGradeHistory();
    }
  }, [showHistory]);

  const fetchGradeHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', studentId)
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGradeHistory(data || []);
    } catch (err) {
      console.error('Error fetching grade history:', err);
      toast.error('Не удалось загрузить историю оценок');
    }
  };

  const handleSubmit = async () => {
    if (score < 2 || score > 5) {
      setError('Оценка должна быть от 2 до 5');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: gradeError } = await supabase
        .from('grades')
        .insert([{
          student_id: studentId,
          subject_id: subjectId,
          score,
          comment: comment.trim() || null,
          teacher_id: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (gradeError) throw gradeError;

      toast.success('Оценка успешно сохранена');
      onSuccess?.();

      // Reset form
      setScore(0);
      setComment('');
      setShowCommentInput(false);
    } catch (err) {
      console.error('Error saving grade:', err);
      setError('Не удалось сохранить оценку');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-1">
            Оценка
          </label>
          <input
            type="number"
            id="score"
            min="2"
            max="5"
            value={score || ''}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setShowCommentInput(!showCommentInput)}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <MessageSquare className="w-4 h-4 mr-1" />
          {showCommentInput ? 'Скрыть комментарий' : 'Добавить комментарий'}
        </button>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <History className="w-4 h-4 mr-1" />
          {showHistory ? 'Скрыть историю' : 'Показать историю'}
        </button>
      </div>

      {showCommentInput && (
        <div className="mb-4">
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
            Комментарий
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Добавьте комментарий к оценке..."
          />
        </div>
      )}

      {showHistory && (
        <div className="mb-4 border rounded-md overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h3 className="text-sm font-medium text-gray-700">История оценок</h3>
          </div>
          <div className="divide-y">
            {gradeHistory.map((grade) => (
              <div key={grade.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    grade.score >= 4 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {grade.score}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(grade.created_at).toLocaleDateString()}
                  </span>
                </div>
                {grade.comment && (
                  <p className="mt-1 text-sm text-gray-600">{grade.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            setScore(0);
            setComment('');
            setShowCommentInput(false);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <X className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}