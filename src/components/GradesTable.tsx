import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from './LoadingSpinner';
import { Edit, Save, X, AlertCircle } from 'lucide-react';

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
  const [editingGrade, setEditingGrade] = useState<{index: number, subject: string, value: number} | null>(null);
  const [newGradeValue, setNewGradeValue] = useState<number>(0);
  const [savingGrade, setSavingGrade] = useState(false);

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
      
      // Try to fetch grades from the database
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', profile?.id);
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      // If we have grades in the database, use them
      if (data && data.length > 0) {
        const formattedGrades = data.map(grade => ({
          id: grade.id,
          subject: grade.subject,
          grades: grade.grades || [],
          average: calculateAverage(grade.grades || [])
        }));
        setGrades(formattedGrades);
      } else {
        // Otherwise use mock data
        setGrades(getMockGrades());
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching grades:', err);
      setError('Не удалось загрузить оценки');
      setGrades(getMockGrades());
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
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data && data.length > 0) {
        const formattedGrades = data.map(grade => ({
          id: grade.id,
          subject: grade.subject,
          grades: grade.grades || [],
          average: calculateAverage(grade.grades || []),
          student_id: grade.student_id
        }));
        setGrades(formattedGrades);
      } else {
        // Use mock data but assign the student ID
        const mockData = getMockGrades().map(grade => ({
          ...grade,
          student_id: studentId
        }));
        setGrades(mockData);
      }
      
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
    return sum / grades.length;
  };

  const handleEditGrade = (index: number, subject: string, value: number) => {
    setEditingGrade({ index, subject, value });
    setNewGradeValue(value);
  };

  const handleCancelEdit = () => {
    setEditingGrade(null);
  };

  const handleSaveGrade = async () => {
    if (!editingGrade || !selectedStudent) return;
    
    try {
      setSavingGrade(true);
      
      // Find the grade object
      const gradeIndex = grades.findIndex(g => g.subject === editingGrade.subject);
      if (gradeIndex === -1) return;
      
      // Create a copy of the grades array
      const updatedGrades = [...grades];
      const gradeObj = {...updatedGrades[gradeIndex]};
      
      // Update the specific grade
      const gradesArray = [...gradeObj.grades];
      gradesArray[editingGrade.index] = newGradeValue;
      
      // Update the grade object
      gradeObj.grades = gradesArray;
      gradeObj.average = calculateAverage(gradesArray);
      updatedGrades[gradeIndex] = gradeObj;
      
      // Update the database
      if (gradeObj.id) {
        // Update existing grade
        const { error } = await supabase
          .from('grades')
          .update({
            grades: gradesArray
          })
          .eq('id', gradeObj.id);
          
        if (error) throw error;
      } else {
        // Insert new grade
        const { error } = await supabase
          .from('grades')
          .insert([{
            subject: gradeObj.subject,
            grades: gradesArray,
            student_id: selectedStudent
          }]);
          
        if (error) throw error;
      }
      
      // Update state
      setGrades(updatedGrades);
      setEditingGrade(null);
    } catch (err) {
      console.error('Error saving grade:', err);
      setError('Не удалось сохранить оценку');
    } finally {
      setSavingGrade(false);
    }
  };

  const handleAddGrade = async (subject: string) => {
    try {
      // Find the grade object
      const gradeIndex = grades.findIndex(g => g.subject === subject);
      if (gradeIndex === -1) return;
      
      // Create a copy of the grades array
      const updatedGrades = [...grades];
      const gradeObj = {...updatedGrades[gradeIndex]};
      
      // Add a new grade (default to 4)
      const gradesArray = [...gradeObj.grades, 4];
      
      // Update the grade object
      gradeObj.grades = gradesArray;
      gradeObj.average = calculateAverage(gradesArray);
      updatedGrades[gradeIndex] = gradeObj;
      
      // Update the database
      if (gradeObj.id) {
        // Update existing grade
        const { error } = await supabase
          .from('grades')
          .update({
            grades: gradesArray
          })
          .eq('id', gradeObj.id);
          
        if (error) throw error;
      } else {
        // Insert new grade
        const { error } = await supabase
          .from('grades')
          .insert([{
            subject: gradeObj.subject,
            grades: gradesArray,
            student_id: selectedStudent
          }]);
          
        if (error) throw error;
      }
      
      // Update state
      setGrades(updatedGrades);
    } catch (err) {
      console.error('Error adding grade:', err);
      setError('Не удалось добавить оценку');
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

  if (isTeacher && students.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
        Нет доступных студентов для просмотра оценок.
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
                            disabled={savingGrade}
                            className="ml-1 text-green-600 hover:text-green-800"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={handleCancelEdit}
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
                          onClick={() => isTeacher && handleEditGrade(i, item.subject, grade)}
                        >
                          {grade}
                        </span>
                      )
                    ))}
                  </td>
                  <td className="px-4 py-2 text-center font-medium">
                    {item.average.toFixed(1)}
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
      )}
    </div>
  );
}

function getMockGrades(): Grade[] {
  return [
    { subject: 'Математика', grades: [4, 5, 4, 5, 4], average: 4.4 },
    { subject: 'Русский язык', grades: [5, 4, 5, 5, 5], average: 4.8 },
    { subject: 'Физика', grades: [4, 4, 3, 4, 4], average: 3.8 },
    { subject: 'История', grades: [5, 5, 4, 5, 5], average: 4.8 },
    { subject: 'Английский язык', grades: [4, 5, 4, 4, 5], average: 4.4 },
  ];
}