import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { NewsItem } from '../../types/university';
import { Edit, Trash2, Calendar, Tag, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';

interface AdminNewsListProps {
  onEdit: (id: string) => void;
}

export function AdminNewsList({ onEdit }: AdminNewsListProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setNews(data || []);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Не удалось загрузить список новостей');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту новость?')) {
      return;
    }

    try {
      setDeleteLoading(id);
      
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update the list after deletion
      setNews(news.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting news:', err);
      alert('Не удалось удалить новость');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'event':
        return 'bg-purple-100 text-purple-800';
      case 'academic':
        return 'bg-blue-100 text-blue-800';
      case 'campus':
        return 'bg-green-100 text-green-800';
      case 'achievement':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'event':
        return 'Мероприятие';
      case 'academic':
        return 'Учебный процесс';
      case 'campus':
        return 'Кампус';
      case 'achievement':
        return 'Достижение';
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

  if (news.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
        Список новостей пуст. Добавьте новую новость.
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
                Заголовок
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Категория
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата
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
            {news.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{item.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                    <Tag className="w-3 h-3 mr-1" />
                    {getCategoryName(item.category)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                    {item.date}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 line-clamp-2">{item.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(item.id)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteLoading === item.id}
                    className={`text-red-600 hover:text-red-900 ${deleteLoading === item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {deleteLoading === item.id ? (
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