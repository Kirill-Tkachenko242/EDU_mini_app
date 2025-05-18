import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function TeacherRequestForm() {
  const { profile } = useAuth();
  const [motivation, setMotivation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!motivation.trim()) {
      setError('Пожалуйста, укажите вашу мотивацию');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { error: requestError } = await supabase
        .from('teacher_requests')
        .insert([{
          user_id: profile?.id,
          full_name: profile?.full_name || '',
          email: (await supabase.auth.getUser()).data.user?.email || '',
          motivation: motivation.trim()
        }]);

      if (requestError) throw requestError;

      toast.success('Заявка успешно отправлена');
      setMotivation('');
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('Не удалось отправить заявку');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Запрос на получение статуса преподавателя</h2>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="motivation" className="block text-sm font-medium text-gray-700 mb-1">
            Мотивация*
          </label>
          <textarea
            id="motivation"
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Опишите, почему вы хотите стать преподавателем..."
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Отправить заявку
            </>
          )}
        </button>
      </form>
    </div>
  );
}