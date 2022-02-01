const calculateTotalCredit = (data: { credit: number }[]) => {
  const newTotalCredit = data
    .map((item: { credit: number }) => item.credit)
    .reduce((a: number, b: number) => a + b);
  return newTotalCredit;
};

const calculateGPA = (
  data: { credit: number; numeric_final_score: number }[]
) => {
  const newAverageScore =
    data
      .map(
        (item: { credit: number; numeric_final_score: number }) =>
          item.credit * item.numeric_final_score
      )
      .reduce((a: number, b: number) => a + b) / calculateTotalCredit(data);
  return newAverageScore;
};

const getScoreCreditBySemester = (data) => {
  let sem2score = {};
  let sem2credit = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const item of data) {
    if (!sem2score[item.semester]) {
      sem2score[item.semester] = item.numeric_final_score * item.credit;
      sem2credit[item.semester] = item.credit;
    } else {
      sem2score[item.semester] += item.numeric_final_score * item.credit;
      sem2credit[item.semester] += item.credit;
    }
  }

  for (const semester in sem2score) {
    sem2score[semester] /= sem2credit[semester];
  }
  return [sem2score, sem2credit];
};

const getScoreByCategory = (data) => {
  let category2freq = {};
  for (const item of data) {
    if (!category2freq[item.written_final_score])
      category2freq[item.written_final_score] = 1;
    else category2freq[item.written_final_score] += 1;
  }
  return category2freq;
};

const getScoreBySubjectID = (data) => {
  let subject2score = {};
  let subject2credit = {};
  for (const item of data) {
    if (!subject2score[item.subject_id.slice(0, 2)]) {
      subject2score[item.subject_id.slice(0, 2)] = item.numeric_final_score * item.credit;
      subject2credit[item.subject_id.slice(0, 2)] = item.credit;
    } else {
      subject2score[item.subject_id.slice(0, 2)] += item.numeric_final_score * item.credit;
      subject2credit[item.subject_id.slice(0, 2)] += item.credit;
    }
  }

  for(const subject in subject2score) {
    subject2score[subject] /= subject2credit[subject];
  }
  return subject2score;
};

export {
  calculateGPA,
  calculateTotalCredit,
  getScoreCreditBySemester,
  getScoreByCategory,
  getScoreBySubjectID,
};
