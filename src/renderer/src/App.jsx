import { useState, useEffect, useRef } from 'react'
import { Layout, message } from 'antd'

// 导入业务组件与样式
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Tasks from './pages/Tasks'
import './App.css'

const { Header, Content } = Layout

// 各页面标题，用于顶部信息栏展示
const pageTitles = {
  dashboard: '工作台首页',
  projects: '项目管理',
  tasks: '任务管理'
}

// 格式化今天的日期，展示在顶部信息栏右侧
function getTodayText() {
  const now = new Date()
  const week = ['日', '一', '二', '三', '四', '五', '六']
  return `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 · 星期${week[now.getDay()]}`
}

export default function App() {
  // 当前选中的菜单项
  const [current, setCurrent] = useState('dashboard')

  // 从首页 / 项目卡片跳转到任务页时，指定要选中的项目
  const [activeProjectId, setActiveProjectId] = useState(null)

  // 1. 项目数据源（第五节课改为从本地 JSON 文件异步恢复，不再写死假数据）
  const [projects, setProjects] = useState([])

  // 保存失败提示只弹一次，避免每次操作都重复打扰用户
  const cunChuCuowuRef = useRef(false)

  // 启动时从 Electron 主进程加载本地持久化数据
  useEffect(() => {
    const jiazaiBendiShuju = async () => {
      if (!window.api?.loadData) {
        console.log('-------', '当前环境未挂载 Electron API，跳过本地读取')
        return
      }
      try {
        const bendiShuju = await window.api.loadData()
        console.log('+++++++', '启动读取本地数据成功，项目数：', bendiShuju?.length)
        if (Array.isArray(bendiShuju)) {
          // 兼容旧数据：补齐缺失的任务列表字段
          const guifanShuju = bendiShuju.map((item) => ({
            ...item,
            tasks: Array.isArray(item.tasks) ? item.tasks : []
          }))
          setProjects(guifanShuju)
        }
      } catch (err) {
        console.log('-------', '读取本地数据失败：', err)
      }
    }

    jiazaiBendiShuju()
  }, [])

  // 统一更新状态并同步持久化到本地磁盘
  const gengxinBingBaocun = async (zuixinLiebiao) => {
    setProjects(zuixinLiebiao)
    if (!window.api?.saveData) {
      return
    }
    try {
      const jieguo = await window.api.saveData(zuixinLiebiao)
      console.log('=======', '本地数据持久化保存结果：', jieguo)
      if (!jieguo?.success && !cunChuCuowuRef.current) {
        cunChuCuowuRef.current = true
        message.error('本地数据保存失败，请检查数据目录是否具有写入权限')
      }
    } catch (err) {
      console.log('=======', '本地数据保存失败：', err)
      if (!cunChuCuowuRef.current) {
        cunChuCuowuRef.current = true
        message.error('本地数据保存失败，请检查数据目录是否具有写入权限')
      }
    }
  }

  // 2. 新增项目处理函数
  const handleAddProject = (newProject) => {
    console.log('-------', '主组件接收到新项目：', newProject)
    const projectWithTasks = {
      ...newProject,
      tasks: newProject.tasks || []
    }
    const zuixinLiebiao = [projectWithTasks, ...projects]
    gengxinBingBaocun(zuixinLiebiao)
  }

  // 3. 编辑项目：保留原任务列表与创建时间，仅更新表单字段
  const handleUpdateProject = (updatedProject) => {
    console.log('-------', '主组件更新项目信息：', updatedProject)
    const zuixinLiebiao = projects.map((item) =>
      item.id === updatedProject.id
        ? {
            ...item,
            ...updatedProject,
            tasks: Array.isArray(updatedProject.tasks) ? updatedProject.tasks : item.tasks || []
          }
        : item
    )
    gengxinBingBaocun(zuixinLiebiao)
  }

  // 4. 删除项目：连同项目下的任务一并移除
  const handleDeleteProject = (projectId) => {
    console.log('-------', '主组件删除项目：', projectId)
    const zuixinLiebiao = projects.filter((item) => item.id !== projectId)
    gengxinBingBaocun(zuixinLiebiao)
    setActiveProjectId((prevId) => (prevId === projectId ? null : prevId))
  }

  // 5. 新增任务处理函数
  const handleAddTask = (projectId, taskTitle) => {
    console.log('-------', '主组件接收到新增任务：', { projectId, taskTitle })
    const newTask = {
      id: `t_${Date.now()}`,
      title: taskTitle,
      completed: false
    }
    const zuixinLiebiao = projects.map((item) => {
      if (item.id === projectId) {
        return {
          ...item,
          tasks: [newTask, ...(item.tasks || [])]
        }
      }
      return item
    })
    gengxinBingBaocun(zuixinLiebiao)
  }

  // 6. 切换任务完成状态（勾选 / 取消勾选）
  const handleToggleTask = (projectId, taskId) => {
    console.log('-------', '主组件切换任务完成状态：', { projectId, taskId })
    const zuixinLiebiao = projects.map((item) => {
      if (item.id === projectId) {
        return {
          ...item,
          tasks: (item.tasks || []).map((task) =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          )
        }
      }
      return item
    })
    gengxinBingBaocun(zuixinLiebiao)
  }

  // 7. 删除任务处理函数
  const handleDeleteTask = (projectId, taskId) => {
    console.log('-------', '主组件删除任务：', { projectId, taskId })
    const zuixinLiebiao = projects.map((item) => {
      if (item.id === projectId) {
        return {
          ...item,
          tasks: (item.tasks || []).filter((task) => task.id !== taskId)
        }
      }
      return item
    })
    gengxinBingBaocun(zuixinLiebiao)
  }

  // 接收菜单切换事件
  const handleMenuChange = (key) => {
    console.log('-------', '切换主菜单选项：', key)
    setCurrent(key)
    // 通过侧边栏直接进入任务页时，取消指定项目，默认展示第一个项目
    if (key !== 'tasks') {
      setActiveProjectId(null)
    }
  }

  // 从首页或项目卡片跳转到指定项目的任务清单
  const handleOpenProjectTasks = (projectId) => {
    setActiveProjectId(projectId)
    setCurrent('tasks')
  }

  return (
    <Layout className="zhuomianbuju">
      {/* 1. 左侧独立菜单组件 */}
      <Sidebar current={current} onMenuChange={handleMenuChange} />

      {/* 2. 右侧主体区域 */}
      <Layout>
        {/* 顶部信息栏 */}
        <Header className="dingbutoubu">
          <div className="dingbutoubu-zuo">
            <span className="dingbutoubu-biaoti">{pageTitles[current]}</span>
            <span className="dingbutoubu-fubiao">USY 项目制教学桌面工作平台</span>
          </div>
          <span className="dingbutoubu-shijian">{getTodayText()}</span>
        </Header>

        {/* 内容主体卡片 */}
        <Content className="neirongquyu">
          {current === 'dashboard' && (
            <Dashboard
              projectList={projects}
              onMenuChange={handleMenuChange}
              onOpenProject={handleOpenProjectTasks}
              onToggleTask={handleToggleTask}
            />
          )}
          {current === 'projects' && (
            <Projects
              projectList={projects}
              onAddProject={handleAddProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              onOpenProject={handleOpenProjectTasks}
            />
          )}
          {current === 'tasks' && (
            <Tasks
              projectList={projects}
              activeProjectId={activeProjectId}
              onMenuChange={handleMenuChange}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
            />
          )}
        </Content>
      </Layout>
    </Layout>
  )
}
