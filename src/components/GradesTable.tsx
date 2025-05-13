import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from './LoadingSpinner';
import { Edit, Save, X, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Grade {
  id?: string;
  subject: string;
  grades: number[];
  average: number;
  student_id?: string;
}

interface Student {
  id: string;
  full_name: string;
}

export function GradesTable() {
  const { profile } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingGrade, setEditingGrade] = useState<{index: number, subject: string} | null>(null);
  const [newGradeValue, setNewGradeValue] = useState<number>(0);
  const [newSubject, setNewSubject] = useState('');
  const [showAddSubject, setShowAddSubject] = useState(false);

  const isTeacher = profile?.role === 'teacher';
  const isStudent = profile?.role === 'student';

  useEffect(() => {
    if (isTeacher) {
      fetchStudents();
    } else {
      fetchGrades();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentGrades(selectedStudent);
    }
  }, [selectedStudent]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'student')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Не удалось загрузить список студентов');
      setLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', profile?.id);
      
      if (error) throw error;
      
      const formattedGrades = data?.map(grade => ({
        id: grade.id,
        subject: grade.subject,
        grades: grade.grades || [],
        average: calculateAverage(grade.grades || [])
      })) || [];

      setGrades(formattedGrades);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching grades:', err);
      setError('Не удалось загрузить оценки');
      setLoading(false);
    }
  };

  const fetchStudentGrades = async (studentId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      const formattedGrades = data?.map(grade => ({
        id: grade.id,
        subject: grade.subject,
        grades: grade.grades || [],
        average: calculateAverage(grade.grades || []),
        student_id: grade.student_id
      })) || [];

      setGrades(formattedGrades);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching student grades:', err);
      setError('Не удалось загрузить оценки студента');
      setLoading(false);
    }
  };

  const calculateAverage = (grades: number[]): number => {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc, grade) => acc + grade, 0);
    return Number((sum / grades.length).toFixed(1));
  };

  const handleEditGrade = (index: number, subject: string) => {
    const grade = grades.find(g => g.subject === subject);
    if (grade) {
      setEditingGrade({ index, subject });
      setNewGradeValue(grade.grades[index]);
    }
  };

  const handleSaveGrade = async () => {
    if (!editingGrade || !selectedStudent) return;
    
    try {
      const grade = grades.find(g => g.subject === editingGrade.subject);
      if (!grade) return;

      const newGrades = [...grade.grades];
      newGrades[editingGrade.index] = newGradeValue;

      const { error } = await supabase
        .from('grades')
        .update({ grades: newGrades })
        .eq('id', grade.id);

      if (error) throw error;

      toast.success('Оценка обновлена');
      fetchStudentGrades(selectedStudent);
      setEditingGrade(null);
    } catch (err) {
      console.error('Error updating grade:', err);
      toast.error('Не удалось обновить оценку');
    }
  };

  const handleAddGrade = async (subject: string) => {
    try {
      const grade = grades.find(g => g.subject === subject);
      if (!grade) return;

      const newGrades = [...grade.grades, 4];

      const { error } = await supabase
        .from('grades')
        .update({ grades: newGrades })
        .eq('id', grade.id);

      if (error) throw error;

      toast.success('Оценка добавлена');
      fetchStudentGrades(selectedStudent);
    } catch (err) {
      console.error('Error adding grade:', err);
      toast.error('Не удалось добавить оценку');
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.trim() || !selectedStudent) return;

    try {
      const { error } = await supabase
        .from('grades')
        .insert([{
          subject: newSubject,
          student_id: selectedStudent,
          grades: []
        }]);

      if (error) throw error;

      toast.success('Предмет добавлен');
      setNewSubject('');
      setShowAddSubject(false);
      fetchStudentGrades(selectedStudent);
    } catch (err) {
      console.error('Error adding subject:', err);
      toast.error('Не удалось добавить предмет');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-start">
        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div>
      {isTeacher && (
        <div className="mb-6">
          <label htmlFor="student-select" className="block text-sm font-medium text-gray-700 mb-1">
            Выберите студента
          </label>
          <select
            id="student-select"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Выберите студента...</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {(isStudent || (isTeacher && selectedStudent)) && (
        <div className="space-y-4">
          {isTeacher && selectedStudent && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddSubject(!showAddSubject)}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md"
              >
                <Plus className="w-4 h-4 mr-1" />
                Добавить предмет
              </button>
            </div>
          )}

          {showAddSubject && (
            <div className="bg-white p-4 rounded-md shadow">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Название предмета"
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <button
                  onClick={handleAddSubject}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  Добавить
                </button>
                <button
                  onClick={() => setShowAddSubject(false)}
                  className="px-4 py-2 border rounded-md"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Предмет</th>
                  <th className="px-4 py-2 text-center">Оценки</th>
                  <th className="px-4 py-2 text-center">Средний балл</th>
                  {isTeacher && <th className="px-4 py-2 text-center">Действия</th>}
                </tr>
              </thead>
              <tbody>
                {grades.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{item.subject}</td>
                    <td className="px-4 py-2 text-center">
                      {item.grades.map((grade, i) => (
                        editingGrade && editingGrade.subject === item.subject && editingGrade.index === i ? (
                          <span key={i} className="inline-flex items-center mx-1">
                            <input
                              type="number"
                              min="2"
                              max="5"
                              value={newGradeValue}
                              onChange={(e) => setNewGradeValue(Number(e.target.value))}
                              className="w-12 p-1 border rounded text-center"
                            />
                            <button 
                              onClick={handleSaveGrade}
                              className="ml-1 text-green-600 hover:text-green-800"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setEditingGrade(null)}
                              className="ml-1 text-red-600 hover:text-red-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ) : (
                          <span
                            key={i}
                            className={`inline-block mx-1 px-2 py-1 rounded ${
                              grade === 5
                                ? 'bg-green-100 text-green-800'
                                : grade === 4
                                ? 'bg-blue-100 text-blue-800'
                                : grade === 3
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            } ${isTeacher ? 'cursor-pointer hover:opacity-80' : ''}`}
                            onClick={() => isTeacher && handleEditGrade(i, item.subject)}
                          >
                            {grade}
                          </span>
                        )
                      ))}
                    </td>
                    <td className="px-4 py-2 text-center font-medium">
                      {item.average}
                    </td>
                    {isTeacher && (
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleAddGrade(item.subject)}
                          className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          Добавить оценку
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}