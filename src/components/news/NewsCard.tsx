import React from 'react';
import { Calendar, Tag } from 'lucide-react';
import { NewsItem } from '../../types/university';

interface NewsCardProps {
  news: NewsItem;
}

export function NewsCard({ news }: NewsCardProps) {
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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {news.imageUrl && (
        <div className="h-48 overflow-hidden">
          <img 
            src={news.imageUrl} 
            alt={news.title} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(news.category)}`}>
            <span className="flex items-center">
              <Tag className="w-3 h-3 mr-1" />
              {getCategoryName(news.category)}
            </span>
          </div>
          <div className="text-sm text-gray-500 flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {news.date}
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">{news.title}</h3>
        <p className="text-gray-600 text-sm line-clamp-3">{news.description}</p>
      </div>
    </div>
  );
}