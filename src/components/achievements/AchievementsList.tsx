import React, { useState, useEffect } from 'react';
import { Award, Trophy, AlignCenterVertical as Certificate, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Achievement, Statistics } from '../../types/university';
import { LoadingSpinner } from '../LoadingSpinner';

export function AchievementsList() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch achievements
        const { data: achievementsData, error: achievementsError } = await supabase
          .from('achievements')
          .select('*')
          .order('year', { ascending: false });

        if (achievementsError) {
          throw achievementsError;
        }

        // Fetch statistics
        const { data: statsData, error: statsError } = await supabase
          .from('statistics')
          .select('*');

        if (statsError && statsError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" which is fine, we'll use mock data
          throw statsError;
        }

        setAchievements(achievementsData || []);
        setStatistics(statsData && statsData.length > 0 ? statsData[0] : null);
      } catch (err) {
        console.error('Error fetching achievements data:', err);
        setError('Не удалось загрузить данные о достижениях');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
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

  // Use mock data if no data in database
  const displayAchievements = achievements.length > 0 ? achievements : getMockAchievements();
  const displayStatistics = statistics || getMockStatistics();

  return (
    <div className="space-y-8">
      {/* Statistics Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Университет в цифрах</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard 
            icon={<Award className="w-8 h-8 text-yellow-500" />}
            value={displayStatistics.totalAwards}
            label="Наград и премий"
          />
          <StatCard 
            icon={<Trophy className="w-8 h-8 text-blue-500" />}
            value={displayStatistics.internationalRanking}
            label="Место в рейтинге"
            prefix="#"
          />
          <StatCard 
            icon={<Certificate className="w-8 h-8 text-green-500" />}
            value={displayStatistics.foundationYear}
            label="Год основания"
          />
          <StatCard 
            icon={<TrendingUp className="w-8 h-8 text-purple-500" />}
            value={displayStatistics.totalStudents}
            label="Студентов"
            suffix="+"
          />
          <StatCard 
            icon={<Award className="w-8 h-8 text-red-500" />}
            value={displayStatistics.totalProfessors}
            label="Преподавателей"
            suffix="+"
          />
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Достижения и награды</h2>
        <div className="space-y-6">
          {displayAchievements.map((achievement) => (
            <div key={achievement.id} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex items-start">
                <div className="mr-4">
                  {achievement.type === 'award' && <Trophy className="w-8 h-8 text-yellow-500" />}
                  {achievement.type === 'certificate' && <Certificate className="w-8 h-8 text-green-500" />}
                  {achievement.type === 'competition' && <Award className="w-8 h-8 text-blue-500" />}
                  {achievement.type === 'ranking' && <TrendingUp className="w-8 h-8 text-purple-500" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{achievement.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{achievement.year} год</p>
                  <p className="text-gray-700">{achievement.description}</p>
                  {achievement.imageUrl && (
                    <img 
                      src={achievement.imageUrl} 
                      alt={achievement.title} 
                      className="mt-3 max-h-40 rounded-md"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Часто задаваемые вопросы</h2>
        <div className="space-y-4">
          {getMockFAQs().map((faq, index) => (
            <details key={index} className="group">
              <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-3 bg-gray-50 rounded-md hover:bg-gray-100">
                <span>{faq.question}</span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" width="24" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </span>
              </summary>
              <p className="text-gray-600 mt-3 p-3">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
}

function StatCard({ icon, value, label, prefix = '', suffix = '' }: StatCardProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-800">{prefix}{value}{suffix}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function getMockAchievements(): Achievement[] {
  return [
    {
      id: '1',
      title: 'Лучший университет года',
      description: 'Награда за выдающиеся достижения в области образования и науки',
      year: 2024,
      type: 'award',
      imageUrl: 'https://images.unsplash.com/photo-1523289333742-be1143f6b766?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: '2',
      title: 'Международная аккредитация программ',
      description: 'Получена международная аккредитация для 5 образовательных программ',
      year: 2023,
      type: 'certificate'
    },
    {
      id: '3',
      title: 'Победа в международной олимпиаде по программированию',
      description: 'Команда студентов заняла первое место среди 150 университетов мира',
      year: 2023,
      type: 'competition'
    },
    {
      id: '4',
      title: 'Топ-100 лучших университетов мира',
      description: 'Университет вошел в сотню лучших вузов по версии международного рейтинга',
      year: 2022,
      type: 'ranking'
    },
    {
      id: '5',
      title: 'Грант на исследования в области искусственного интеллекта',
      description: 'Получен грант в размере 5 миллионов рублей на исследования в области ИИ',
      year: 2022,
      type: 'award'
    }
  ];
}

function getMockStatistics(): Statistics {
  return {
    totalStudents: 15000,
    totalProfessors: 850,
    totalAwards: 127,
    internationalRanking: 78,
    foundationYear: 1945
  };
}

function getMockFAQs() {
  return [
    {
      question: 'Как поступить в университет?',
      answer: 'Для поступления необходимо подать документы через портал Госуслуги или лично в приемную комиссию. Список необходимых документов: паспорт, аттестат, результаты ЕГЭ, медицинская справка. Подробную информацию можно получить на сайте приемной комиссии.'
    },
    {
      question: 'Какие формы обучения доступны?',
      answer: 'Университет предлагает очную, очно-заочную и заочную формы обучения. Также доступны программы дистанционного образования по ряду направлений.'
    },
    {
      question: 'Предоставляется ли общежитие иногородним студентам?',
      answer: 'Да, университет предоставляет места в общежитии иногородним студентам. Распределение мест происходит на конкурсной основе с учетом социального положения студента и удаленности от места постоянного проживания.'
    },
    {
      question: 'Какие стипендии доступны для студентов?',
      answer: 'В университете действуют академические, социальные, именные и повышенные стипендии. Размер академической стипендии зависит от успеваемости студента. Также доступны стипендии Президента РФ и Правительства РФ для особо отличившихся студентов.'
    },
    {
      question: 'Есть ли программы международного обмена?',
      answer: 'Да, университет сотрудничает с более чем 50 зарубежными вузами. Студенты могут участвовать в программах обмена продолжительностью от одного семестра до года. Также доступны программы двойных дипломов с ведущими европейскими университетами.'
    }
  ];
}