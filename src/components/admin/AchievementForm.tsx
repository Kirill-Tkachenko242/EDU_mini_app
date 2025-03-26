import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Achievement } from '../../types/university';
import { AlertCircle, Check } from 'lucide-react';

interface AchievementFormProps {
  achievementId?: string;
  onSuccess: () => void;
}

export function AchievementForm({ achievementId, onSuccess }: AchievementFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [type, setType] = useState<'award' | 'certificate' | 'competition' | 'ranking'>('award');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (achievementId) {
      setIsEditing(true);
      fetchAchievement(achievementId);
    }
  }, [achievementId]);

  const fetchAchievement = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setTitle(data.title);
        setDescription(data.description);
        setYear(data.year);
        setType(data.type);
      }
    } catch (err) {
      console.error('Error fetching achievement:', err);
      setError('Не удалось загрузить данные достижения');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError('Введите название достижения');
      return false;
    }
    if (!description.trim()) {
      setError('Введите описание достижения');
      return false;
    }
    if (!year || year < 1900 || year > new Date().getFullYear() + 1) {
      setError('Введите корректный год');
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

    const achievementData: Partial<Achievement> = {
      title,
      description,
      year,
      type
    };

    try {
      let result;
      
      if (isEditing) {
        result = await supabase
          .from('achievements')
          .update(achievementData)
          .eq('id', achievementId);
      } else {
        result = await supabase
          .from('achievements')
          .insert([achievementData]);
      }

      if (result.error) {
        throw result.error;
      }

      setSuccess(true);
      
      if (!isEditing) {
        // Reset form after successful creation
        setTitle('');
        setDescription('');
        setYear(new Date().getFullYear());
        setType('award');
      }
      
      // Notify parent component
      onSuccess();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving achievement:', err);
      setError('Не удалось сохранить достижение');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? 'Редактирование достижения' : 'Добавление нового достижения'}
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
            {isEditing ? 'Достижение успешно обновлено' : 'Достижение успешно добавлено'}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Название*
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Название достижения"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Тип достижения*
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="award">Награда</option>
            <option value="certificate">Сертификат</option>
            <option value="competition">Соревнование</option>
            <option value="ranking">Рейтинг</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
            Год*
          </label>
          <input
            type="number"
            id="year"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
            min="1900"
            max={new Date().getFullYear() + 1}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            placeholder="Подробное описание достижения"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {loading ? 'Сохранение...' : isEditing ? 'Сохранить изменения' : 'Добавить достижение'}
        </button>
      </form>
    </div>
  );
}