import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Phone, 
  Newspaper, 
  HelpCircle, 
  GraduationCap, 
  User,
  BookOpen
} from 'lucide-react';

const menuItems = [
  { icon: Calendar, text: 'Расписание', path: '/schedule' },
  { icon: GraduationCap, text: 'Успеваемость', path: '/grades' },
  { icon: BookOpen, text: 'Материалы', path: '/materials' },
  { icon: User, text: 'Мой профиль', path: '/profile' },
  { icon: Phone, text: 'Контакты', path: '/contacts' },
  { icon: Newspaper, text: 'Новости', path: '/news' },
  { icon: HelpCircle, text: 'FAQ', path: '/faq' },
];

export function MainMenu() {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
          >
            <Icon className="w-8 h-8 mb-2 text-blue-600" />
            <span className="text-gray-800 font-medium text-center">{item.text}</span>
          </Link>
        );
      })}
    </div>
  );
}