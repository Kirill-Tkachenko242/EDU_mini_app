import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, DEFAULT_CATEGORIES } from '../../types/materials';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Upload,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Lock,
  Globe,
  Info,
  RefreshCw
} from 'lucide-react';

interface MaterialUploadProps {
  onSuccess?: () => void;
}

export function MaterialUpload({ onSuccess }: MaterialUploadProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [accessLevel, setAccessLevel] = useState<'public' | 'restricted'>('public');
  const [allowedGroups, setAllowedGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useAuth();

  useEffect(() => {
    if (error) setError('');
  }, [title, description, category, file, accessLevel]);

  const validateForm = () => {
    if (!title.trim()) {
      setError('Введите название материала');
      return false;
    }
    if (!category) {
      setError('Выберите категорию');
      return false;
    }
    if (!file) {
      setError('Выберите файл');
      return false;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError(`Неподдерживаемый формат файла. Разрешены только: ${ALLOWED_FILE_TYPES.map(type => type.split('/')[1]).join(', ')}`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`Файл слишком большой (максимум ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setUploadProgress(0);

    try {
      if (!file) throw new Error('Файл не выбран');

      // Generate unique filename while preserving extension
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${profile?.id}/${fileName}`;

      // Upload file to Supabase Storage with explicit content type
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData, error: urlError } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath);

      if (urlError) {
        throw urlError;
      }

      const publicUrl = urlData.publicUrl;

      // Create material record
      const { error: dbError } = await supabase
        .from('materials')
        .insert([{
          title,
          description: description || undefined,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          category,
          author_id: profile?.id,
          access_level: accessLevel,
          allowed_groups: allowedGroups
        }]);

      if (dbError) {
        await supabase.storage
          .from('materials')
          .remove([filePath]);
        throw dbError;
      }

      toast.success('Материал успешно загружен');
      onSuccess?.();

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setFile(null);
      setAccessLevel('public');
      setAllowedGroups([]);
      setUploadProgress(0);
      setRetryCount(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Error uploading material:', err);
      if (err.message?.includes('bucket')) {
        setError('Ошибка конфигурации хранилища. Пожалуйста, обратитесь к администратору.');
      } else if (err.message?.includes('mime type')) {
        setError('Ошибка формата файла. Пожалуйста, убедитесь, что файл соответствует разрешенным типам.');
      } else {
        setError('Не удалось загрузить материал. Пожалуйста, проверьте подключение к интернету и попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Загрузка материала</h2>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      <div className="mb-4 rounded-md bg-blue-50 p-4 flex items-start">
        <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p>Поддерживаемые форматы файлов:</p>
          <ul className="list-disc list-inside mt-1">
            <li>Документы: PDF, DOC, DOCX</li>
            <li>Таблицы: XLS, XLSX</li>
            <li>Презентации: PPT, PPTX</li>
            <li>Текст: TXT</li>
          </ul>
          <p className="mt-1">Максимальный размер файла: 50MB</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Название*
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Название материала"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Описание
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Краткое описание материала"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Категория*
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Выберите категорию</option>
            {DEFAULT_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Уровень доступа
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="public"
                checked={accessLevel === 'public'}
                onChange={(e) => setAccessLevel(e.target.value as 'public')}
                className="mr-2"
              />
              <Globe className="w-4 h-4 mr-1 text-green-500" />
              Публичный
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="restricted"
                checked={accessLevel === 'restricted'}
                onChange={(e) => setAccessLevel(e.target.value as 'restricted')}
                className="mr-2"
              />
              <Lock className="w-4 h-4 mr-1 text-amber-500" />
              Ограниченный
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Файл*
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Загрузить файл</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="sr-only"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  />
                </label>
                <p className="pl-1">или перетащите его сюда</p>
              </div>
              <p className="text-xs text-gray-500">
                До 50MB (.pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt)
              </p>
            </div>
          </div>
          {file && (
            <div className="mt-2 flex items-center justify-between p-2 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm text-gray-600">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-2">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500">
                  Загружено {uploadProgress}%
                </p>
                {retryCount > 0 && (
                  <p className="text-xs text-amber-600 flex items-center">
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Попытка {retryCount}/3
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Загрузить материал
            </>
          )}
        </button>
      </form>
    </div>
  );
}