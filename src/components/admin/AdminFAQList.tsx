import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FAQ } from '../../types/university';
import { Edit, Trash2, HelpCircle, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';

interface AdminFAQListProps {
  onEdit: (id: string) => void;
}

export function AdminFAQList({ onEdit }: AdminFAQListProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('faq')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setFaqs(data || []);
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError('Не удалось загрузить список FAQ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот FAQ?')) {
      return;
    }

    try {
      setDeleteLoading(id);
      
      const { error } = await supabase
        .from('faq')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update the list after deletion
      setFaqs(faqs.filter(faq => faq.id !== id));
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      alert('Не удалось удалить FAQ');
    } finally {
      setDeleteLoading(null);
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

  if (faqs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
        Список FAQ пуст. Добавьте новый FAQ.
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
                Вопрос
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ответ
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {faqs.map((faq) => (
              <tr key={faq.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <HelpCircle className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
                    <div className="text-sm font-medium text-gray-900">{faq.question}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 line-clamp-2">{faq.answer}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(faq.id)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(faq.id)}
                    disabled={deleteLoading === faq.id}
                    className={`text-red-600 hover:text-red-900 ${deleteLoading === faq.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {deleteLoading === faq.id ? (
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