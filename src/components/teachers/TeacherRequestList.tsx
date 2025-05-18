import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TeacherRequest {
  id: string;
  full_name: string;
  email: string;
  motivation: string;
  documents?: any;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export function TeacherRequestList() {
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teacher_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setProcessingId(id);
      
      const { error } = await supabase
        .from('teacher_requests')
        .update({ 
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Заявка ${status === 'approved' ? 'одобрена' : 'отклонена'}`);
      fetchRequests();
    } catch (err) {
      console.error('Error processing request:', err);
      toast.error('Не удалось обработать заявку');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-start">
        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
        <div>{error}</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Нет новых заявок на получение статуса преподавателя
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div 
          key={request.id} 
          className="bg-white rounded-lg shadow-md p-4"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium">{request.full_name}</h3>
              <p className="text-gray-600">{request.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Отправлено: {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {request.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleRequest(request.id, 'approved')}
                    disabled={processingId === request.id}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleRequest(request.id, 'rejected')}
                    disabled={processingId === request.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <span className={`px-2 py-1 text-sm rounded-full ${
                  request.status === 'approved' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {request.status === 'approved' ? 'Одобрено' : 'Отклонено'}
                </span>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700">Мотивация:</h4>
            <p className="mt-1 text-gray-600">{request.motivation}</p>
          </div>
          
          {request.documents && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700">Документы:</h4>
              <div className="mt-1 space-y-1">
                {Object.entries(request.documents).map(([key, value]) => (
                  <a
                    key={key}
                    href={value as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    {key}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}