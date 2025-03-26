import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Achievement } from '../../types/university';
import { Edit, Trash2, Award, Trophy, AlignCenterVertical as Certificate, TrendingUp, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';

interface AdminAchievementsListProps {
  onEdit: (id: string) => void;
}

export function AdminAchievementsList({ onEdit }: AdminAchievementsListProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('year', { ascending: false });

      if (error) {
        throw error;
      }

      setAchievements(data || []);
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError('Не удалось загрузить список достижений');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы у verены, что хотите удалить это достижение?')) {
      return;
    }

    try {
      setDeleteLoading(id);
      
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update the list after deletion
      setAchievements(achievements.filter(achievement => achievement.id !== id));
    } catch (err) {
      console.error('Error deleting achievement:', err);
      alert('Не удалось удалить достижение');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'award':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'certificate':
        return <Certificate className="w-5 h-5 text-green-500" />;
      case 'competition':
        return <Award className="w-5 h-5 text-blue-500" />;
      case 'ranking':
        return <TrendingUp className="w-5 h-5 text-purple-500" />;
      default:
        return <Award className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'award':
        return 'Награда';
      case 'certificate':
        return 'Сертификат';
      case 'competition':
        return 'Соревнование';
      case 'ranking':
        return 'Рейтинг';
      default:
        return 'Другое';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
        Список достижений пуст. Добавьте новое достижение.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Тип
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Название
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Год
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Описание
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {achievements.map((achievement) => (
              <tr key={achievement.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getTypeIcon(achievement.type)}
                    <span className="ml-2 text-sm text-gray-900">{getTypeName(achievement.type)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{achievement.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{achievement.year}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 line-clamp-2">{achievement.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(achievement.id)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(achievement.id)}
                    disabled={deleteLoading === achievement.id}
                    className={`text-red-600 hover:text-red-900 ${deleteLoading === achievement.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {deleteLoading === achievement.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}