import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { NewsItem } from '../../types/university';
import { AlertCircle, Check } from 'lucide-react';

interface NewsFormProps {
  newsId?: string;
  onSuccess: () => void;
}

export function NewsForm({ newsId, onSuccess }: NewsFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(formatDate(new Date()));
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState<'event' | 'academic' | 'campus' | 'achievement' | 'other'>('event');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (newsId) {
      setIsEditing(true);
      fetchNews(newsId);
    }
  }, [newsId]);

  function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const fetchNews = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setTitle(data.title);
        setDescription(data.description);
        setDate(data.date);
        setImageUrl(data.imageUrl || '');
        setCategory(data.category);
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Не удалось загрузить данные новости');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError('Введите заголовок новости');
      return false;
    }
    if (!description.trim()) {
      setError('Введите описание новости');
      return false;
    }
    if (!date) {
      setError('Выберите дату публикации');
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

    const newsData: Partial<NewsItem> = {
      title,
      description,
      date,
      imageUrl: imageUrl || undefined,
      category
    };

    try {
      let result;
      
      if (isEditing) {
        result = await supabase
          .from('news')
          .update(newsData)
          .eq('id', newsId);
      } else {
        result = await supabase
          .from('news')
          .insert([newsData]);
      }

      if (result.error) {
        throw result.error;
      }

      setSuccess(true);
      
      if (!isEditing) {
        // Reset form after successful creation
        setTitle('');
        setDescription('');
        setDate(formatDate(new Date()));
        setImageUrl('');
        setCategory('event');
      }
      
      // Notify parent component
      onSuccess();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving news:', err);
      setError('Не удалось сохранить новость');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? 'Редактирование новости' : 'Добавление новой новости'}
      </h2>
      
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
            {isEditing ? 'Новость успешно обновлена' : 'Новость успешно добавлена'}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Заголовок*
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Заголовок новости"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Категория*
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="event">Мероприятие</option>
            <option value="academic">Учебный процесс</option>
            <option value="campus">Кампус</option>
            <option value="achievement">Достижение</option>
            <option value="other">Другое</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Дата*
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
            URL изображения
          </label>
          <input
            type="url"
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Описание*
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Подробное описание новости"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {loading ? 'Сохранение...' : isEditing ? 'Сохранить изменения' : 'Добавить новость'}
        </button>
      </form>
    </div>
  );
}