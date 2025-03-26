import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertCircle, Check } from 'lucide-react';

interface FAQFormProps {
  faqId?: string;
  onSuccess: () => void;
}

export function FAQForm({ faqId, onSuccess }: FAQFormProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (faqId) {
      setIsEditing(true);
      fetchFAQ(faqId);
    }
  }, [faqId]);

  const fetchFAQ = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('faq')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setQuestion(data.question);
        setAnswer(data.answer);
      }
    } catch (err) {
      console.error('Error fetching FAQ:', err);
      setError('Не удалось загрузить данные FAQ');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!question.trim()) {
      setError('Введите вопрос');
      return false;
    }
    if (!answer.trim()) {
      setError('Введите ответ');
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

    const faqData = {
      question,
      answer
    };

    try {
      let result;
      
      if (isEditing) {
        result = await supabase
          .from('faq')
          .update(faqData)
          .eq('id', faqId);
      } else {
        result = await supabase
          .from('faq')
          .insert([faqData]);
      }

      if (result.error) {
        throw result.error;
      }

      setSuccess(true);
      
      if (!isEditing) {
        // Reset form after successful creation
        setQuestion('');
        setAnswer('');
      }
      
      // Notify parent component
      onSuccess();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving FAQ:', err);
      setError('Не удалось сохранить FAQ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? 'Редактирование FAQ' : 'Добавление нового FAQ'}
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
            {isEditing ? 'FAQ успешно обновлен' : 'FAQ успешно добавлен'}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
            Вопрос*
          </label>
          <input
            type="text"
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Введите вопрос"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
            Ответ*
          </label>
          <textarea
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Введите ответ на вопрос"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {loading ? 'Сохранение...' : isEditing ? 'Сохранить изменения' : 'Добавить FAQ'}
        </button>
      </form>
    </div>
  );
}