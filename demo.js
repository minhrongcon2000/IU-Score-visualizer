const { PythonShell } = require('python-shell');

PythonShell.run(
  'python/data_crawler.py',
  {
    args: ['--username', 'ITDSIU18012', '--password', 'hminh2610'],
  },
  (err, results) => {
    if (err) throw err;
    // eslint-disable-next-line no-console
    console.log(results);
  }
);
