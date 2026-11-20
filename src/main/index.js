import { app, shell, BrowserWindow, ipcMain, dialog, Menu, screen } from 'electron'
import { join, dirname } from 'path'
import { promises as fs, existsSync, readFileSync, writeFileSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// 本地数据文件路径：C:\Users\<user>\AppData\Roaming\<appName>\usy-data.json
const shujuWenjianLujing = join(app.getPath('userData'), 'usy-data.json')

// 窗口尺寸记忆文件，用于下次启动恢复上次的窗口位置与大小
const chuangkouZhuangtaiLujing = join(app.getPath('userData'), 'window-state.json')

// 默认初始项目数据（首次运行没有本地文件时初始化为空列表）
const chushiXiangmuShuju = []

// 保存主窗口引用，便于单实例聚焦与状态保存
let mainWindow = null

// 读取上次关闭时保存的窗口位置与大小
function duquChuangkouZhuangtai() {
  try {
    if (!existsSync(chuangkouZhuangtaiLujing)) return null
    const zhuangtai = JSON.parse(readFileSync(chuangkouZhuangtaiLujing, 'utf-8'))
    if (typeof zhuangtai.width !== 'number' || typeof zhuangtai.height !== 'number') {
      return null
    }
    return zhuangtai
  } catch (err) {
    console.log('-------', '读取窗口状态失败，使用默认窗口尺寸：', err)
    return null
  }
}

// 校验记忆的窗口位置是否仍落在当前显示器可见区域内
function zhuangtaiZaipingmuNei(zhuangtai) {
  if (typeof zhuangtai.x !== 'number' || typeof zhuangtai.y !== 'number') return false
  return screen.getAllDisplays().some((xianshiqi) => {
    const { x, y, width, height } = xianshiqi.workArea
    return (
      zhuangtai.x >= x - 60 &&
      zhuangtai.y >= y - 60 &&
      zhuangtai.x + zhuangtai.width <= x + width + 60 &&
      zhuangtai.y + zhuangtai.height <= y + height + 60
    )
  })
}

// 关闭窗口时记录窗口位置与大小（最小化 / 最大化时不记录）
function baocunChuangkouZhuangtai(chuangkou) {
  try {
    if (!chuangkou || chuangkou.isDestroyed()) return
    if (chuangkou.isMinimized() || chuangkou.isMaximized() || chuangkou.isFullScreen()) return
    const { x, y, width, height } = chuangkou.getBounds()
    writeFileSync(chuangkouZhuangtaiLujing, JSON.stringify({ x, y, width, height }), 'utf-8')
  } catch (err) {
    console.log('-------', '保存窗口状态失败：', err)
  }
}

// 注册系统底层 IPC 处理函数（遵循 ltb-backend-style 规范）
function zhuceXitongIpc() {
  // 1. 调用 Windows 原生文件夹选择窗口
  ipcMain.handle('dialog:selectFolder', async () => {
    console.log('+++++++', '主进程接收到原生文件夹选择请求')
    const jieguo = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: '选择本地实训项目所在文件夹'
    })

    if (jieguo.canceled || !jieguo.filePaths.length) {
      console.log('+++++++', '用户取消了文件夹选择')
      return ''
    }

    const xuanzhongLujing = jieguo.filePaths[0]
    console.log('+++++++', '用户选中文件夹路径：', xuanzhongLujing)
    return xuanzhongLujing
  })

  // 2. 唤起 Windows 资源管理器打开指定目录
  ipcMain.handle('shell:openFolder', async (_, mubiaoLujing) => {
    console.log('*-*-*-*', '主进程接收到唤起文件夹请求：', mubiaoLujing)
    if (!mubiaoLujing || mubiaoLujing === '待关联本地文件夹') {
      return { success: false, message: '尚未关联有效的本地项目文件夹路径！' }
    }

    try {
      const cuowuXinxi = await shell.openPath(mubiaoLujing)
      if (cuowuXinxi) {
        console.log('*-*-*-*', '唤起文件夹失败：', cuowuXinxi)
        return { success: false, message: cuowuXinxi }
      }
      console.log('*-*-*-*', '已成功在 Windows 资源管理器中打开：', mubiaoLujing)
      return { success: true }
    } catch (err) {
      console.log('*-*-*-*', '打开文件夹发生异常：', err)
      return { success: false, message: err.message }
    }
  })

  // 3. 从本地磁盘读取项目与任务 JSON 数据
  ipcMain.handle('data:load', async () => {
    console.log('-------', '主进程读取本地数据文件：', shujuWenjianLujing)
    try {
      // 若本地文件不存在，自动创建并写入初始预置数据
      if (!existsSync(shujuWenjianLujing)) {
        console.log('-------', '本地数据文件尚不存在，创建并写入初始数据')
        await fs.mkdir(dirname(shujuWenjianLujing), { recursive: true })
        const chushiJson = JSON.stringify(chushiXiangmuShuju, null, 2)
        await fs.writeFile(shujuWenjianLujing, chushiJson, 'utf-8')
        return chushiXiangmuShuju
      }

      // 读取并解析已有数据
      const wenjianNgr = await fs.readFile(shujuWenjianLujing, 'utf-8')
      const jiexiShuju = JSON.parse(wenjianNgr)
      if (!Array.isArray(jiexiShuju)) {
        console.log('-------', '本地数据格式不是数组，降级返回初始数据')
        return chushiXiangmuShuju
      }
      console.log('-------', '成功读取本地数据，项目条数：', jiexiShuju.length)
      return jiexiShuju
    } catch (err) {
      console.log('-------', '读取本地数据发生异常，降级返回初始数据：', err)
      return chushiXiangmuShuju
    }
  })

  // 4. 将最新项目与任务数据安全保存到本地磁盘（先写临时文件再替换，避免写入中断损坏数据）
  ipcMain.handle('data:save', async (_, xiangmuLiebiao) => {
    console.log('=======', '主进程开始保存数据到本地文件：', shujuWenjianLujing)
    if (!Array.isArray(xiangmuLiebiao)) {
      return { success: false, message: '数据格式不正确，必须是项目数组' }
    }

    try {
      await fs.mkdir(dirname(shujuWenjianLujing), { recursive: true })
      const shujuWb = JSON.stringify(xiangmuLiebiao, null, 2)
      const linshiLujing = `${shujuWenjianLujing}.tmp`
      await fs.writeFile(linshiLujing, shujuWb, 'utf-8')
      await fs.rename(linshiLujing, shujuWenjianLujing)
      console.log('=======', '本地数据保存成功，项目总数：', xiangmuLiebiao.length)
      return { success: true }
    } catch (err) {
      console.log('=======', '本地数据保存失败：', err)
      return { success: false, message: err.message }
    }
  })
}

function createWindow() {
  // 恢复上次窗口状态；若记忆的位置已不在当前显示器范围内，则回退为默认尺寸
  const jiyiZhuangtai = duquChuangkouZhuangtai()
  const keyiHuifu = jiyiZhuangtai && zhuangtaiZaipingmuNei(jiyiZhuangtai)

  mainWindow = new BrowserWindow({
    width: keyiHuifu ? Math.max(jiyiZhuangtai.width, 1024) : 1280,
    height: keyiHuifu ? Math.max(jiyiZhuangtai.height, 680) : 800,
    ...(keyiHuifu ? { x: jiyiZhuangtai.x, y: jiyiZhuangtai.y } : {}),
    minWidth: 1024,
    minHeight: 680,
    title: 'USY 项目教学桌面工作平台',
    icon,
    backgroundColor: '#f5f5f5',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      spellcheck: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 关闭前记录窗口位置与大小
  mainWindow.on('close', () => {
    baocunChuangkouZhuangtai(mainWindow)
  })

  // 外部链接交给系统浏览器打开，避免应用内跳转到未知页面
  mainWindow.webContents.setWindowOpenHandler((details) => {
    if (/^https?:\/\//i.test(details.url)) {
      shell.openExternal(details.url)
    }
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.usy.projectstudio')

  // 桌面端不显示默认应用菜单，交互统一在界面内完成
  Menu.setApplicationMenu(null)

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 注册主进程与系统底层 IPC 通信处理器
  zhuceXitongIpc()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
