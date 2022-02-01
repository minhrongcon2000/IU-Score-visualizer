import { Box, Paper, Button, TextField } from '@mui/material';
import { FC, SetStateAction, useRef, useState } from 'react';
import 'chart.js/auto';
import { Chart, getElementAtEvent } from 'react-chartjs-2';
import Modal from '@mui/material/Modal';
import { GridColDef, DataGrid } from '@mui/x-data-grid';

import {
  calculateGPA,
  calculateTotalCredit,
  getScoreCreditBySemester,
  getScoreByCategory,
  getScoreBySubjectID,
} from './utils';

const DashBoard: FC = ({
  studentId,
  setStudentId,
  averageScore,
  setAverageScore,
  totalCredit,
  setTotalCredit,
  scoreBySem,
  setScoreBySem,
  creditBySem,
  setCreditBySem,
  scoreByCategory,
  setScoreByCategory,
  scoreBySubjectId,
  setScoreBySubjectId,
  subjectData,
  setSubjectData,
}) => {
  const [openModal, setOpenModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [openRankModal, setOpenRankModal] = useState(false);
  const [openProgressModal, setOpenProgressModal] = useState(false);
  const [openScoreBySubjectIdIdModal, setOpenScoreBySubjectId] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState({
    color: '',
    content: '',
  });
  const [rankModalDataRows, setRankModalDataRows] = useState([]);
  const [rankModalDataCols, setRankModalDataCols] = useState([]);
  const [progressModalDataRows, setProgressDataRows] = useState([]);
  const [progressModalDataCols, setProgressDataCols] = useState([]);
  const [scoreBySubjectIdRows, setScoreBySubjectIdRows] = useState([]);
  const [scoreBySubjectIdCols, setScoreBySubjectIdCols] = useState([]);

  const category2color = {
    'A+': '#1a00c4',
    'B+': '#fff700',
    A: '#32cdfc',
    B: '#eda342',
    C: '#ff0000',
  };

  const handleUpdateBtn = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);
  const handleCloseDetailModal = () => setOpenDetailModal(false);
  const handleCloseRankModal = () => setOpenRankModal(false);
  const handleCloseProgressModal = () => setOpenProgressModal(false);
  const handleCloseScoreByStudentIdModal = () => setOpenScoreBySubjectId(false);

  const usernameChange = (event: {
    target: { value: SetStateAction<string> };
  }) => {
    setUsername(event.target.value);
  };

  const passwordChange = (event: {
    target: { value: SetStateAction<string> };
  }) => {
    setPassword(event.target.value);
  };

  const pieChartRef = useRef();
  const scoreProgressRef = useRef();
  const creditProgressRef = useRef();
  const scoreBySubjectIdRef = useRef();

  const handleDetailBtn = () => setOpenDetailModal(true);

  const handleLoginBtn = () => {
    const success = electron.ipcRenderer.login(username, password);
    const errorState = {
      color: success ? 'green' : 'red',
      content: success ? 'Login success!' : 'Login failed!',
    };
    setError(errorState);
    if (success) {
      const { username, data } = electron.ipcRenderer.getOverallData();
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
      const categoryLabels = [];
      const categoryData = [];
      const categoryBackgroundColor = [];
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
      setOpenModal(false);
    }
  };

  const detailedRows =
    subjectData.length !== 0
      ? subjectData.map(
          (item: {
            subject_id: string;
            subject_name: string;
            credit: number;
            numeric_final_score: number;
            categorical_final_score: string;
          }) => ({
            id: item.subject_id,
            subject_name: item.subject_name,
            credit: item.credit,
            final_score: item.numeric_final_score,
            rank: item.written_final_score,
          })
        )
      : [];

  const detailedColumns: GridColDef[] =
    detailedRows.length !== 0
      ? Object.keys(detailedRows[0]).map((item) => ({
          field: item,
          headerName: item,
          width: item === 'subject_name' ? 300 : 150,
        }))
      : [];

  const getDataByRank = (data, rank) => {
    const dataByRank = data
      .filter((item) => item.written_final_score === rank)
      .map((item) => ({
        id: item.subject_id,
        subject_name: item.subject_name,
        credit: item.credit,
        final_score: item.numeric_final_score,
        rank: item.written_final_score,
      }));

    const columns = Object.keys(dataByRank[0]).map((item) => ({
      field: item,
      headerName: item,
      width: item === 'subject_name' ? 300 : 150,
    }));
    return { rows: dataByRank, columns };
  };

  const getDataBySemester = (data, semester) => {
    const dataBySemester = data
      .filter((item) => item.semester === semester)
      .map((item) => ({
        id: item.subject_id,
        subject_name: item.subject_name,
        credit: item.credit,
        final_score: item.numeric_final_score,
        semester: item.semester,
      }));

    const columns = Object.keys(dataBySemester[0]).map((item) => ({
      field: item,
      headerName: item,
      width: item === 'subject_name' ? 300 : 150,
    }));
    return { rows: dataBySemester, columns };
  };

  const getDataBySubjectId = (data, subject_id) => {
    const dataBySubjectId = data
      .filter((item) => item.subject_id.slice(0, 2) === subject_id)
      .map((item) => ({
        id: item.subject_id,
        subject_name: item.subject_name,
        credit: item.credit,
        final_score: item.numeric_final_score,
      }));

    const columns = Object.keys(dataBySubjectId[0]).map((item) => ({
      field: item,
      headerName: item,
      width: item === 'subject_name' ? 300 : 150,
    }));
    return { rows: dataBySubjectId, columns };
  };

  const handlePieChartClick = (event) => {
    const elements = getElementAtEvent(pieChartRef.current, event);
    if (elements.length === 0) return;
    const { index } = elements[0];
    const rank = scoreByCategory.labels[index];
    const { rows, columns } = getDataByRank(subjectData, rank);
    setRankModalDataRows(rows);
    setRankModalDataCols(columns);
    setOpenRankModal(true);
  };

  const handleScoreProgressClick = (event) => {
    const elements = getElementAtEvent(scoreProgressRef.current, event);
    if (elements.length === 0) return;
    const { index } = elements[0];
    const semester = scoreBySem.labels[index];
    const { rows, columns } = getDataBySemester(subjectData, semester);
    setProgressDataCols(columns);
    setProgressDataRows(rows);
    setOpenProgressModal(true);
  };

  const handleCreditProgressClick = (event) => {
    const elements = getElementAtEvent(creditProgressRef.current, event);
    if (elements.length === 0) return;
    const { index } = elements[0];
    const semester = creditBySem.labels[index];
    const { rows, columns } = getDataBySemester(subjectData, semester);
    setProgressDataCols(columns);
    setProgressDataRows(rows);
    setOpenProgressModal(true);
  };

  const handleRadarClick = (event) => {
    const elements = getElementAtEvent(scoreBySubjectIdRef.current, event);
    if (elements.length === 0) return;
    const { index } = elements[0];
    const subject_id = scoreBySubjectId.labels[index];
    const validSubject = subjectData.filter((item) => item.numeric_final_score);
    const { rows, columns } = getDataBySubjectId(validSubject, subject_id);
    setScoreBySubjectIdCols(columns);
    setScoreBySubjectIdRows(rows);
    setOpenScoreBySubjectId(true);
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

  return (
    <>
      <h1 style={{ fontFamily: 'Roboto', marginLeft: '3%' }}>
        Basic information
      </h1>
      <Box
        display="grid"
        gridTemplateColumns="1fr 1fr 1fr 1fr"
        color="white"
        fontFamily="Roboto"
        fontWeight="300"
        gap={5}
        marginLeft="3%"
        marginRight="3%"
        marginTop="3%"
      >
        <Paper elevation={1}>
          <Box display="grid" justifyContent="center" alignItems="center">
            <p
              style={{
                textAlign: 'center',
                marginBottom: 0,
              }}
            >
              Student ID
            </p>
            <p style={{ textAlign: 'center', fontSize: '1.5rem' }}>
              {studentId}
            </p>
          </Box>
        </Paper>

        <Paper elevation={1}>
          <Box display="grid" justifyContent="center" alignItems="center">
            <p
              style={{
                textAlign: 'center',
                marginBottom: 0,
              }}
            >
              GPA
            </p>
            <p style={{ textAlign: 'center', fontSize: '1.5rem' }}>
              {averageScore}/100
            </p>
          </Box>
        </Paper>

        <Paper elevation={1}>
          <Box display="grid" justifyContent="center" alignItems="center">
            <p
              style={{
                textAlign: 'center',
                marginBottom: 0,
              }}
            >
              Total credit
            </p>
            <p style={{ textAlign: 'center', fontSize: '1.5rem' }}>
              {totalCredit}
            </p>
          </Box>
        </Paper>

        <Box
          display="flex"
          flexDirection="column"
          justifyContent="space-around"
        >
          <Button variant="contained" onClick={handleUpdateBtn}>
            Update...
          </Button>
          <Button variant="outlined" onClick={handleDetailBtn}>
            View Detail...
          </Button>
          <Modal
            open={openModal}
            onClose={handleCloseModal}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box sx={modalStyle}>
              <h1 style={{ fontFamily: 'Roboto' }}>Login form</h1>
              <TextField
                id="outlined-basic"
                label="Username"
                variant="outlined"
                fullWidth
                onChange={usernameChange}
                required
              />
              <TextField
                id="outlined-basic"
                label="Password"
                variant="outlined"
                type="password"
                fullWidth
                sx={{
                  marginTop: '10px',
                }}
                onChange={passwordChange}
                required
              />
              {error.color !== '' && (
                <p style={{ color: error.color }}>{error.content}</p>
              )}
              <Button
                variant="contained"
                sx={{ marginTop: '10px' }}
                fullWidth
                onClick={handleLoginBtn}
              >
                Login
              </Button>
            </Box>
          </Modal>
          <Modal
            open={openDetailModal}
            onClose={handleCloseDetailModal}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box
              sx={{
                ...modalStyle,
                height: '50vh',
                width: '80vw',
              }}
            >
              {subjectData.length !== 0 && (
                <DataGrid
                  rows={detailedRows}
                  columns={detailedColumns}
                  pageSize={5}
                  rowsPerPageOptions={[5]}
                />
              )}
            </Box>
          </Modal>
        </Box>
      </Box>

      <Box
        display="grid"
        gridTemplateColumns="1.5fr 1fr"
        gridTemplateAreas={`"score_progress score"
            "credit_progress score"`}
        gap={3}
        margin="3%"
      >
        <Paper
          style={{
            gridArea: 'score_progress',
            padding: '5%',
          }}
        >
          {Object.keys(scoreBySem).length !== 0 && (
            <>
              <Chart
                type="line"
                data={scoreBySem}
                options={{
                  plugins: {
                    title: {
                      display: true,
                      text: 'GPA over semester',
                    },
                    legend: {
                      display: false,
                    },
                  },
                }}
                ref={scoreProgressRef}
                redraw
                onClick={handleScoreProgressClick}
              />
              <Modal
                open={openProgressModal}
                onClose={handleCloseProgressModal}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              >
                <Box
                  sx={{
                    ...modalStyle,
                    height: '50vh',
                    width: '80vw',
                  }}
                >
                  {subjectData.length !== 0 && (
                    <DataGrid
                      pageSize={5}
                      rowsPerPageOptions={[5]}
                      columns={progressModalDataCols}
                      rows={progressModalDataRows}
                    />
                  )}
                </Box>
              </Modal>
            </>
          )}
        </Paper>
        <Paper
          style={{
            gridArea: 'score',
            alignSelf: 'center',
            justifySelf: 'center',
            height: '98%',
            padding: '0.5%',
          }}
        >
          {Object.keys(scoreByCategory).length > 0 && (
            <>
              <Chart
                type="doughnut"
                data={scoreByCategory}
                style={{
                  height: '50%',
                }}
                options={{
                  plugins: {
                    title: {
                      display: true,
                      text: 'Score by category',
                    },
                  },
                }}
                ref={pieChartRef}
                onClick={handlePieChartClick}
                redraw
              />
              <Modal
                open={openRankModal}
                onClose={handleCloseRankModal}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              >
                <Box
                  sx={{
                    ...modalStyle,
                    height: '50vh',
                    width: '80vw',
                  }}
                >
                  {subjectData.length !== 0 && (
                    <DataGrid
                      pageSize={5}
                      rowsPerPageOptions={[5]}
                      columns={rankModalDataCols}
                      rows={rankModalDataRows}
                    />
                  )}
                </Box>
              </Modal>
            </>
          )}
        </Paper>
        <Paper
          style={{
            gridArea: 'credit_progress',
            padding: '5%',
          }}
        >
          {Object.keys(creditBySem).length !== 0 && (
            <Chart
              type="line"
              data={creditBySem}
              options={{
                plugins: {
                  title: {
                    display: true,
                    text: 'Total credit over semester',
                  },
                  legend: {
                    display: false,
                  },
                },
              }}
              ref={creditProgressRef}
              redraw
              onClick={handleCreditProgressClick}
            />
          )}
        </Paper>
      </Box>
      <Box
        style={{
          height: '100vh',
        }}
      >
        <h1 style={{ fontFamily: 'Roboto', marginLeft: '3%' }}>
          Strengths and weaknesses
        </h1>
        <Paper
          style={{
            margin: 'auto',
            height: '90vh',
            width: '50vw',
          }}
        >
          {Object.keys(scoreBySubjectId).length > 0 && (
            <>
              <Chart
                type="radar"
                data={scoreBySubjectId}
                options={{
                  plugins: {
                    title: {
                      display: true,
                      text: 'Score by department',
                    },
                    legend: {
                      display: false,
                    },
                  },
                  maintainAspectRatio: false,
                }}
                redraw
                height="100vh"
                ref={scoreBySubjectIdRef}
                onClick={handleRadarClick}
              />
              <Modal
                open={openScoreBySubjectIdIdModal}
                onClose={handleCloseScoreByStudentIdModal}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              >
                <Box
                  sx={{
                    ...modalStyle,
                    height: '50vh',
                    width: '80vw',
                  }}
                >
                  {subjectData.length !== 0 && (
                    <DataGrid
                      pageSize={5}
                      rowsPerPageOptions={[5]}
                      columns={scoreBySubjectIdCols}
                      rows={scoreBySubjectIdRows}
                    />
                  )}
                </Box>
              </Modal>
            </>
          )}
        </Paper>
      </Box>
    </>
  );
};

export default DashBoard;
