import React, { useState, useEffect } from 'react';
import { NewsCard } from './NewsCard';
import { supabase } from '../../lib/supabase';
import { NewsItem } from '../../types/university';
import { LoadingSpinner } from '../LoadingSpinner';

export function NewsList() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchNews() {
      try {
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
        setError('Не удалось загрузить новости');
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

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

  // If no news in database, show mock data
  const displayNews = news.length > 0 ? news : getMockNews();

  // Filter news based on selected category
  const filteredNews = filter === 'all' 
    ? displayNews 
    : displayNews.filter(item => item.category === filter);

  return (
    <div>
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-2 pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Все новости
          </button>
          <button
            onClick={() => setFilter('event')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filter === 'event'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
            }`}
          >
            Мероприятия
          </button>
          <button
            onClick={() => setFilter('academic')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filter === 'academic'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            }`}
          >
            Учебный процесс
          </button>
          <button
            onClick={() => setFilter('campus')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filter === 'campus'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            Кампус
          </button>
          <button
            onClick={() => setFilter('achievement')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filter === 'achievement'
                ? 'bg-yellow-600 text-white'
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            }`}
          >
            Достижения
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNews.map((item) => (
          <NewsCard key={item.id} news={item} />
        ))}
      </div>

      {filteredNews.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Новости не найдены</p>
        </div>
      )}
    </div>
  );
}

function getMockNews(): NewsItem[] {
  return [
    {
      id: '1',
      title: 'День открытых дверей университета',
      date: '15.05.2025',
      description: 'Приглашаем абитуриентов и их родителей на день открытых дверей. Вы сможете познакомиться с факультетами, задать вопросы преподавателям и узнать всё о поступлении.',
      imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      category: 'event'
    },
    {
      id: '2',
      title: 'Начало нового учебного года',
      date: '01.09.2025',
      description: 'Поздравляем всех студентов и преподавателей с началом нового учебного года! Расписание занятий доступно в личном кабинете.',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      category: 'academic'
    },
    {
      id: '3',
      title: 'Открытие нового корпуса',
      date: '10.04.2025',
      description: 'Торжественное открытие нового учебного корпуса состоится 10 апреля. В новом здании разместятся лаборатории и аудитории для студентов технических специальностей.',
      imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      category: 'campus'
    },
    {
      id: '4',
      title: 'Победа в международной олимпиаде',
      date: '20.03.2025',
      description: 'Команда наших студентов заняла первое место в международной олимпиаде по программированию. Поздравляем победителей!',
      imageUrl: 'https://images.unsplash.com/photo-1594608661623-aa0bd3a69799?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      category: 'achievement'
    },
    {
      id: '5',
      title: 'Научная конференция "Инновации в образовании"',
      date: '05.06.2025',
      description: 'Приглашаем принять участие в ежегодной научной конференции, посвященной инновационным методам в образовании. Регистрация открыта до 20 мая.',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      category: 'event'
    },
    {
      id: '6',
      title: 'Обновление библиотечного фонда',
      date: '15.02.2025',
      description: 'Университетская библиотека пополнилась новыми учебниками и научными изданиями. Теперь доступно более 5000 новых книг по различным дисциплинам.',
      imageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
      category: 'campus'
    }
  ];
}