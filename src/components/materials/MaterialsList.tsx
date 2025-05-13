import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Material, DEFAULT_CATEGORIES } from '../../types/materials';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  Search,
  Filter,
  Download,
  FileText,
  BookOpen,
  PenTool,
  GraduationCap,
  File,
  Calendar,
  User,
  Lock,
  Globe,
  Loader2
} from 'lucide-react';
import { LoadingSpinner } from '../LoadingSpinner';
import { toast } from 'sonner';

export function MaterialsList() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const { profile } = useAuth();

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin';

  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError('Не удалось загрузить материалы');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (material: Material) => {
    try {
      // Cache the download URL in localStorage
      const cachedUrl = localStorage.getItem(`download_${material.id}`);
      if (cachedUrl && Date.now() - JSON.parse(cachedUrl).timestamp < 3600000) { // 1 hour cache
        window.open(JSON.parse(cachedUrl).url, '_blank');
        return;
      }

      // In a real app, we would generate a signed URL here
      localStorage.setItem(`download_${material.id}`, JSON.stringify({
        url: material.fileUrl,
        timestamp: Date.now()
      }));
      
      window.open(material.fileUrl, '_blank');
      toast.success('Загрузка файла начата');
    } catch (err) {
      console.error('Error downloading file:', err);
      toast.error('Ошибка при загрузке файла');
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'lectures':
        return <BookOpen className="w-5 h-5" />;
      case 'practice':
        return <PenTool className="w-5 h-5" />;
      case 'assignments':
        return <FileText className="w-5 h-5" />;
      case 'exams':
        return <GraduationCap className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Memoize filtered and sorted materials
  const filteredMaterials = useMemo(() => {
    return materials
      .filter(material => {
        const matchesSearch = material.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                            material.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
        const matchesCategory = !selectedCategory || material.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.title.localeCompare(b.title);
          case 'size':
            return b.fileSize - a.fileSize;
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [materials, debouncedSearch, selectedCategory, sortBy]);

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

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по названию или описанию..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Все категории</option>
              {DEFAULT_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">По дате</option>
              <option value="name">По названию</option>
              <option value="size">По размеру</option>
            </select>
          </div>
        </div>
      </div>

      {/* Materials list with virtualization for large lists */}
      <div className="bg-white rounded-lg shadow-md divide-y">
        {filteredMaterials.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Материалы не найдены
          </div>
        ) : (
          filteredMaterials.map((material) => (
            <div key={material.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getIcon(material.category)}
                    <h3 className="text-lg font-medium text-gray-900">
                      {material.title}
                    </h3>
                    {material.accessLevel === 'restricted' ? (
                      <Lock className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Globe className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  
                  {material.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {material.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {(() => {
                        // supabase отдаёт created_at
                        const ts = (material as any).created_at ?? material.createdAt;
                        const date = ts ? new Date(ts) : null;
                        if (!date || isNaN(date.getTime())) {
                          return '—';               // или любой плейсхолдер
                        }
                        return formatDistanceToNow(date, {
                          addSuffix: true,
                          locale: ru
                        });
                      })()}
                    </span>

                    
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {material.authorId || 'Система'}
                    </span>
                    
                    <span className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {formatFileSize(material.fileSize)}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDownload(material)}
                  className="ml-4 p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                  title="Скачать"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}