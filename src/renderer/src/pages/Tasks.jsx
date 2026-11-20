import { useState } from 'react'
import {
  Button,
  Card,
  Checkbox,
  Empty,
  Input,
  List,
  Progress,
  Segmented,
  Select,
  Space,
  Tag
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
  ProjectOutlined
} from '@ant-design/icons'

export default function Tasks({
  projectList = [],
  activeProjectId,
  onMenuChange,
  onAddTask,
  onToggleTask,
  onDeleteTask
}) {
  // 初始选中的项目：优先使用跳转时指定的项目，否则默认第一个项目
  const [selectedId, setSelectedId] = useState(activeProjectId || projectList[0]?.id || null)
  const [taskInput, setTaskInput] = useState('')
  const [filter, setFilter] = useState('all')

  // 无可用项目时给出引导
  if (projectList.length === 0) {
    return (
      <div className="renwuguanli">
        <div className="yemianbiaoti">
          <h2>任务管理清单</h2>
          <span className="yemianfubiao">拆解实训阶段目标，标记完成情况并实时统计进度</span>
        </div>
        <Empty style={{ marginTop: 60 }} description="暂无可用项目，请先创建实训项目">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => onMenuChange && onMenuChange('projects')}
          >
            前往项目管理
          </Button>
        </Empty>
      </div>
    )
  }

  // 选中项失效时自动回退到第一个项目，避免出现空白页
  const currentProject = projectList.find((item) => item.id === selectedId) || projectList[0]
  const allTasks = currentProject.tasks || []
  const totalCount = allTasks.length
  const completedCount = allTasks.filter((item) => item.completed).length
  const pendingCount = totalCount - completedCount
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  const visibleTasks = allTasks.filter((task) => {
    if (filter === 'done') return task.completed
    if (filter === 'active') return !task.completed
    return true
  })

  // 添加任务：父组件负责生成任务对象并持久化，这里只传递任务标题
  const handleCreateTask = () => {
    const title = taskInput.trim()
    if (!title || !onAddTask) return
    onAddTask(currentProject.id, title)
    setTaskInput('')
  }

  // 切换任务完成状态
  const handleToggle = (taskId) => {
    if (onToggleTask) {
      onToggleTask(currentProject.id, taskId)
    }
  }

  // 删除任务
  const handleDelete = (taskId) => {
    if (onDeleteTask) {
      onDeleteTask(currentProject.id, taskId)
    }
  }

  return (
    <div className="renwuguanli">
      {/* 1. 顶部操作栏与项目选择器 */}
      <div className="yemianbiaoti-hengxiang">
        <div className="yemianbiaoti">
          <h2>任务管理清单</h2>
          <span className="yemianfubiao">拆解实训阶段目标，标记完成情况并实时统计进度</span>
        </div>
        <Space>
          <span className="qiehuanbiaoshi">
            <ProjectOutlined style={{ marginRight: 6 }} />
            切换所属项目：
          </span>
          <Select
            value={currentProject.id}
            onChange={(id) => setSelectedId(id)}
            style={{ width: 260 }}
            options={projectList.map((item) => ({
              label: item.name,
              value: item.id
            }))}
          />
        </Space>
      </div>

      {/* 2. 当前选中项目的基本信息与实时进度看板 */}
      <Card className="renwukinpian" styles={{ body: { padding: 20 } }}>
        <div className="renwukapian-toubu">
          <div className="renwukapian-mingcheng">
            <span className="renwuxiangmumingcheng">{currentProject.name}</span>
            <Tag color="blue">{currentProject.course}</Tag>
          </div>
          <div className="renwutongji">
            <span>
              总任务：<b>{totalCount}</b> 项
            </span>
            <span className="fengefu">|</span>
            <span className="wanchengzishu">
              已完成：<b>{completedCount}</b> 项
            </span>
            <span className="fengefu">|</span>
            <span className="daibanxiangshu">
              待推进：<b>{pendingCount}</b> 项
            </span>
          </div>
        </div>
        <Progress
          percent={percent}
          status={percent >= 100 ? 'success' : 'active'}
          strokeColor={{ '0%': '#108ee9', '100%': '#52c41a' }}
        />
      </Card>

      {/* 3. 任务快速录入 */}
      <Space.Compact style={{ width: '100%', marginBottom: 20 }}>
        <Input
          size="large"
          placeholder="输入实训待办任务，例如：完成前端页面开发与组件封装（支持按 Enter 回车键添加）"
          value={taskInput}
          onChange={(event) => setTaskInput(event.target.value)}
          onPressEnter={handleCreateTask}
          allowClear
        />
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleCreateTask}>
          添加任务
        </Button>
      </Space.Compact>

      {/* 4. 任务清单列表 */}
      <Card
        title="实训待办任务列表"
        extra={
          <Segmented
            value={filter}
            onChange={(value) => setFilter(value)}
            options={[
              { label: `全部 ${totalCount}`, value: 'all' },
              { label: `待推进 ${pendingCount}`, value: 'active' },
              { label: `已完成 ${completedCount}`, value: 'done' }
            ]}
          />
        }
        style={{ border: '1px solid #f0f0f0' }}
      >
        {visibleTasks.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              allTasks.length === 0
                ? '当前项目还没有任务，快在上方输入框添加一个吧！'
                : filter === 'done'
                  ? '当前项目还没有已完成的任务'
                  : '当前项目没有待推进的任务'
            }
          />
        ) : (
          <List
            dataSource={visibleTasks}
            renderItem={(task) => (
              <List.Item
                key={task.id}
                actions={[
                  <Button
                    key="delete"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(task.id)}
                  >
                    删除
                  </Button>
                ]}
              >
                <div className="renwuxiangmu">
                  <Checkbox checked={task.completed} onChange={() => handleToggle(task.id)} />
                  <span className={task.completed ? 'renwumingcheng-wancheng' : 'renwumingcheng'}>
                    {task.title}
                  </span>
                  {task.completed ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                      已完成
                    </Tag>
                  ) : (
                    <Tag icon={<ClockCircleOutlined />} color="warning">
                      进行中
                    </Tag>
                  )}
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  )
}
