import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertCircle, Check } from 'lucide-react';

interface StatisticsFormProps {
  onSuccess: () => void;
}

export function StatisticsForm({ onSuccess }: StatisticsFormProps) {
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalProfessors, setTotalProfessors] = useState(0);
  const [totalAwards, setTotalAwards] = useState(0);
  const [internationalRanking, setInternationalRanking] = useState(0);
  const [foundationYear, setFoundationYear] = useState(1945);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [statsId, setStatsId] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('statistics')
        .select('*');

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && data.length > 0) {
        const stats = data[0];
        setStatsId(stats.id);
        setTotalStudents(stats.totalstudents || 0);
        setTotalProfessors(stats.totalprofessors || 0);
        setTotalAwards(stats.totalawards || 0);
        setInternationalRanking(stats.internationalranking || 0);
        setFoundationYear(stats.foundationyear || 1945);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Не удалось загрузить статистику');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (totalStudents < 0) {
      setError('Количество студентов не может быть отрицательным');
      return false;
    }
    if (totalProfessors < 0) {
      setError('Количество преподавателей не может быть отрицательным');
      return false;
    }
    if (totalAwards < 0) {
      setError('Количество наград не может быть отрицательным');
      return false;
    }
    if (internationalRanking < 0) {
      setError('Рейтинг не может быть отрицательным');
      return false;
    }
    if (foundationYear < 1700 || foundationYear > new Date().getFullYear()) {
      setError('Введите корректный год основания');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    const statisticsData = {
      totalstudents: totalStudents,
      totalprofessors: totalProfessors,
      totalawards: totalAwards,
      internationalranking: internationalRanking,
      foundationyear: foundationYear
    };

    try {
      let result;
      
      if (statsId) {
        result = await supabase
          .from('statistics')
          .update(statisticsData)
          .eq('id', statsId);
      } else {
        result = await supabase
          .from('statistics')
          .insert([statisticsData]);
      }

      if (result.error) {
        throw result.error;
      }

      setSuccess(true);
      onSuccess();
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving statistics:', err);
      setError('Не удалось сохранить статистику');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Обновление статистики университета</h2>
      
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4 flex items-start">
          <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-700">
            Статистика успешно обновлена
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="totalStudents" className="block text-sm font-medium text-gray-700 mb-1">
              Количество студентов
            </label>
            <input
              type="number"
              id="totalStudents"
              value={totalStudents}
              onChange={(e) => setTotalStudents(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="totalProfessors" className="block text-sm font-medium text-gray-700 mb-1">
              Количество преподавателей
            </label>
            <input
              type="number"
              id="totalProfessors"
              value={totalProfessors}
              onChange={(e) => setTotalProfessors(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="totalAwards" className="block text-sm font-medium text-gray-700 mb-1">
              Количество наград
            </label>
            <input
              type="number"
              id="totalAwards"
              value={totalAwards}
              onChange={(e) => setTotalAwards(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="internationalRanking" className="block text-sm font-medium text-gray-700 mb-1">
              Международный рейтинг
            </label>
            <input
              type="number"
              id="internationalRanking"
              value={internationalRanking}
              onChange={(e) => setInternationalRanking(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="foundationYear" className="block text-sm font-medium text-gray-700 mb-1">
              Год основания
            </label>
            <input
              type="number"
              id="foundationYear"
              value={foundationYear}
              onChange={(e) => setFoundationYear(parseInt(e.target.value) || 1945)}
              min="1700"
              max={new Date().getFullYear()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {loading ? 'Сохранение...' : 'Сохранить статистику'}
          </button>
        </div>
      </form>
    </div>
  );
}