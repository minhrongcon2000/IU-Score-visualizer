import { FC, useEffect, useState } from 'react';
import './App.css';
import 'chart.js/auto';
import DashBoard from './components/DashBoard';
import {
  calculateGPA,
  calculateTotalCredit,
  getScoreByCategory,
  getScoreBySubjectID,
  getScoreCreditBySemester,
} from './components/utils';

const App: FC = () => {
  const [averageScore, setAverageScore] = useState(0);
  const [studentId, setStudentId] = useState('');
  const [totalCredit, setTotalCredit] = useState(0);
  const [scoreBySem, setScoreBySem] = useState({});
  const [creditBySem, setCreditBySem] = useState({});
  const [scoreByCategory, setScoreByCategory] = useState({});
  const [scoreBySubjectId, setScoreBySubjectId] = useState({});
  const [subjectData, setSubjectData] = useState([]);

  const category2color = {
    'A+': '#1a00c4',
    'B+': '#fff700',
    A: '#32cdfc',
    B: '#eda342',
    C: '#ff0000',
  };

  useEffect(() => {
    const { username, data } = electron.ipcRenderer.getOverallData();
    if (data.length > 0) {
      const validSubject = data.filter(
        (item: { subject_id: string; numeric_final_score: number }) =>
          !item.subject_id.startsWith('PT') && item.numeric_final_score
      );
      const newTotalCredit = calculateTotalCredit(validSubject);
      const newAverageScore = calculateGPA(validSubject);
      const [sem2score, sem2credit] = getScoreCreditBySemester(validSubject);
      const category2freq = getScoreByCategory(validSubject);
      const subject2score = getScoreBySubjectID(validSubject);

      const newScoreBySubjectId = {
        labels: Object.keys(subject2score),
        datasets: [
          {
            data: Object.values(subject2score),
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgb(255, 99, 132)',
          },
        ],
      };

      const newScoreBySem = {
        labels: Object.keys(sem2score),
        datasets: [
          { data: Object.values(sem2score), borderColor: 'rgb(75, 192, 192)' },
        ],
      };

      let categoryLabels = [];
      let categoryData = [];
      let categoryBackgroundColor = [];
      const displayOrder = ['A+', 'A', 'B+', 'B', 'C'];

      for (const category of displayOrder) {
        categoryLabels.push(category);
        categoryData.push(category2freq[category]);
        categoryBackgroundColor.push(category2color[category]);
      }

      const newScoreByCategory = {
        labels: categoryLabels,
        datasets: [
          {
            data: categoryData,
            backgroundColor: categoryBackgroundColor,
          },
        ],
      };
      const newCreditBySem = {
        labels: Object.keys(sem2credit),
        datasets: [
          { data: Object.values(sem2credit), borderColor: 'rgb(75, 192, 192)' },
        ],
      };
      setTotalCredit(newTotalCredit);
      setStudentId(username);
      setScoreBySem(newScoreBySem);
      setCreditBySem(newCreditBySem);
      setAverageScore(newAverageScore.toPrecision(3));
      setScoreByCategory(newScoreByCategory);
      setScoreBySubjectId(newScoreBySubjectId);
      setSubjectData(validSubject);
    }
  }, []);

  return (
    <div className="container">
      <header>
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto&display=swap"
          rel="stylesheet"
        />
      </header>
      <DashBoard
        studentId={studentId}
        setStudentId={setStudentId}
        averageScore={averageScore}
        setAverageScore={setAverageScore}
        totalCredit={totalCredit}
        setTotalCredit={setTotalCredit}
        scoreBySem={scoreBySem}
        setScoreBySem={setScoreBySem}
        creditBySem={creditBySem}
        setCreditBySem={setCreditBySem}
        scoreByCategory={scoreByCategory}
        setScoreByCategory={setScoreByCategory}
        scoreBySubjectId={scoreBySubjectId}
        setScoreBySubjectId={setScoreBySubjectId}
        subjectData={subjectData}
        setSubjectData={setSubjectData}
      />
    </div>
  );
};

export default App;
