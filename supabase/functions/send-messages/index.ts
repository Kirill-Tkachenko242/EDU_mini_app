import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { VK } from 'npm:vk-io@4.9.1';

// Интерфейс для учителя
interface Teacher {
  id: string;
  fullName: string;
  vk_id?: string;
  is_active: boolean;
}

// Интерфейс для записи в логе
interface MessageLog {
  teacher_id: string;
  status: 'success' | 'error';
  error_message?: string;
  sent_at: Date;
}

// Константы для API
const VK_TOKEN = Deno.env.get('VK_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!VK_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Необходимые переменные окружения не установлены');
}

// Инициализация клиентов
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const vk = new VK({ token: VK_TOKEN });

// Основная функция для отправки сообщений
Deno.serve(async (req: Request) => {
  try {
    // CORS заголовки
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Проверяем метод
    if (req.method !== 'POST') {
      return new Response('Метод не поддерживается', { status: 405 });
    }

    // Получаем данные запроса
    const { message } = await req.json();
    if (!message) {
      return new Response('Текст сообщения обязателен', { status: 400 });
    }

    // Получаем список активных учителей
    const { data: teachers, error: teachersError } = await supabase
      .from('professors')
      .select('id, fullName, vk_id')
      .eq('is_active', true)
      .not('vk_id', 'is', null);

    if (teachersError) {
      throw new Error(`Ошибка получения списка учителей: ${teachersError.message}`);
    }

    const results: MessageLog[] = [];

    // Отправляем сообщения каждому учителю
    for (const teacher of teachers) {
      try {
        if (!teacher.vk_id) {
          results.push({
            teacher_id: teacher.id,
            status: 'error',
            error_message: 'ID ВКонтакте не указан',
            sent_at: new Date(),
          });
          continue;
        }

        // Отправляем сообщение
        await vk.api.messages.send({
          peer_id: Number(teacher.vk_id),
          message: message,
          random_id: Math.floor(Math.random() * 1000000),
        });

        // Записываем успешную отправку
        results.push({
          teacher_id: teacher.id,
          status: 'success',
          sent_at: new Date(),
        });
      } catch (error) {
        // Записываем ошибку
        results.push({
          teacher_id: teacher.id,
          status: 'error',
          error_message: error.message,
          sent_at: new Date(),
        });
      }
    }

    // Сохраняем логи в базу данных
    const { error: logError } = await supabase
      .from('message_logs')
      .insert(results);

    if (logError) {
      console.error('Ошибка сохранения логов:', logError);
    }

    // Возвращаем результаты
    return new Response(
      JSON.stringify({
        total: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        logs: results,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});