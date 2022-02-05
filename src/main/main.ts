/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import fs from 'fs';
import cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

const getHTML = async (username: string, password: string) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://edusoftweb.hcmiu.edu.vn/default.aspx?page=dangnhap', {
    waitUntil: 'domcontentloaded',
  });
  await page.type(
    "input[name='ctl00$ContentPlaceHolder1$ctl00$txtTaiKhoa']",
    username
  );
  await page.type(
    "input[name='ctl00$ContentPlaceHolder1$ctl00$txtMatKhau']",
    password
  );
  await page.click("input[name='ctl00$ContentPlaceHolder1$ctl00$btnDangNhap']");
  await page.waitForNavigation();
  await page.click('#ctl00_menu_xemdiemthi > .center > a > span');
  await page.waitForSelector('#ctl00_ContentPlaceHolder1_ctl00_div1');
  const html = await page.evaluate(() => document.querySelector('*').outerHTML);
  await browser.close();
  return html;
};

const processRawHTML = (html: string) => {
  const $ = cheerio.load(html);
  // eslint-disable-next-line prefer-const
  let rawData = [];
  $('tr').each((_index, element) => {
    if (element.attribs.class && element.attribs.class.endsWith('diem')) {
      // eslint-disable-next-line prefer-const
      let rawDataItem: string[] = [];
      $(element)
        .find('.Label')
        .each((_childIndex, childElement) => {
          rawDataItem.push($(childElement).text());
        });
      rawData.push(rawDataItem);
    }
  });

  rawData[0] = [
    'subject_index',
    'subject_id',
    'subject_name',
    'credit',
    'inclass_percent',
    'midterm_percent',
    'final_percent',
    'inclass_score',
    'midterm_exam',
    'final_exam',
    'numeric_final_score_1',
    'numeric_final_score',
    'written_final_score_1',
    'written_final_score',
  ];

  // eslint-disable-next-line prefer-const
  let processedData = [];
  const columnName = rawData[0];
  let semCounter = 1;
  let trueSemCounter = 1;
  let semName = '';

  function isBlank(str: string) {
    return !str || /^\s*$/.test(str);
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const item of rawData.slice(1)) {
    if (item.length === 1) {
      semName = `Semester ${trueSemCounter}`;
      semCounter += 1;
      if (semCounter % 3 !== 0) trueSemCounter += 1;
    } else {
      // eslint-disable-next-line prefer-const
      let itemInfo = {};
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < item.length; i++) {
        let itemValue = isBlank(item[i]) || item[i] === 'NA' ? '' : item[i];
        if (itemValue.length > 0) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: Unreachable code error
          if (columnName[i] === 'credit') itemValue = parseInt(itemValue, 10);
          else if (
            [
              'inclass_percent',
              'midterm_percent',
              'final_percent',
              'inclass_score',
              'midterm_exam',
              'final_exam',
              'numeric_final_score_1',
              'numeric_final_score',
            ].includes(columnName[i])
          )
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: Unreachable code error
            itemValue = parseFloat(itemValue);
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: Unreachable code error
        itemInfo[columnName[i]] = itemValue;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: Unreachable code error
        itemInfo.semester = semName;
      }
      processedData.push(itemInfo);
    }
  }

  return processedData;
};

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('login', async (event, arg) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: Unreachable code error
  // eslint-disable-next-line prefer-const
  let config = JSON.parse(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Unreachable code error
    fs.readFileSync(
      app.isPackaged
        ? path.join(process.resourcesPath, 'assets/config.json')
        : path.join(__dirname, '../../assets/config.json')
    )
  );
  const { username, password } = arg;
  const dataDir = app.isPackaged
    ? path.join(process.resourcesPath, 'assets/student_data.json')
    : path.join(__dirname, '../../assets/student_data.json');
  try {
    const html = await getHTML(username, password);
    const processedData = processRawHTML(html);
    config = {
      ...config,
      username,
      dataDir,
    };
    fs.writeFileSync(
      app.isPackaged
        ? path.join(process.resourcesPath, 'assets/config.json')
        : path.join(__dirname, '../../assets/config.json'),
      JSON.stringify(config, null, 2)
    );
    fs.writeFileSync(dataDir, JSON.stringify(processedData, null, 2));
    event.returnValue = true;
  } catch (err) {
    event.returnValue = false;
  }
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
ipcMain.on('overview', (event, _arg) => {
  const config = JSON.parse(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: Unreachable code error
    fs.readFileSync(
      app.isPackaged
        ? path.join(process.resourcesPath, 'assets/config.json')
        : path.join(__dirname, '../../assets/config.json')
    )
  );
  const data = fs.existsSync(config.dataDir)
    ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: Unreachable code error
      JSON.parse(fs.readFileSync(config.dataDir))
    : [];
  event.returnValue = { username: config.username, data };
});

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
