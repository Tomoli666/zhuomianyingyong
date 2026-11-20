import { Button, Card, Checkbox, Col, Empty, Progress, Row, Space, Statistic, Tag } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  ProjectOutlined,
  ReadOutlined,
  RightOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined
} from '@ant-design/icons'
import './Dashboard.css'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

function getTodayText() {
  const now = new Date()
  const week = ['日', '一', '二', '三', '四', '五', '六']
  return `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 星期${week[now.getDay()]}`
}

// 工作台首页：实训进度概览、项目看板、待推进任务与快捷入口
export default function Dashboard({ projectList = [], onMenuChange, onOpenProject, onToggleTask }) {
  // 汇总全部项目与任务数据
  const projectCount = projectList.length
  let taskCount = 0
  let completedCount = 0
  const pendingTasks = []

  projectList.forEach((project) => {
    const taskList = project.tasks || []
    taskCount += taskList.length
    taskList.forEach((task) => {
      if (task.completed) {
        completedCount += 1
      } else {
        pendingTasks.push({
          ...task,
          projectId: project.id,
          projectName: project.name
        })
      }
    })
  })

  const pendingCount = taskCount - completedCount
  const percent = taskCount === 0 ? 0 : Math.round((completedCount / taskCount) * 100)

  const handleJump = (menuKey) => {
    if (onMenuChange) {
      onMenuChange(menuKey)
    }
  }

  const handleOpenProject = (projectId) => {
    if (onOpenProject) {
      onOpenProject(projectId)
    } else {
      handleJump('tasks')
    }
  }

  return (
    <div className="gongzuotaishouye">
      {/* 1. 欢迎横幅与整体完成率 */}
      <Card className="shouyebanner">
        <div className="banner-neirong">
          <div className="banner-zuo">
            <h2 className="banner-biaoti">{getGreeting()}，欢迎回到实训工作台</h2>
            <span className="banner-fubiao">
              {getTodayText()} · 当前共 {projectCount} 个实训项目，{pendingCount} 项任务待推进
            </span>
          </div>
          <div className="banner-you">
            <Progress
              type="circle"
              percent={percent}
              size={112}
              strokeWidth={7}
              strokeColor="#ffffff"
              trailColor="rgba(255, 255, 255, 0.3)"
              format={(value) => <span className="banner-jindu">{value}%</span>}
            />
            <span className="banner-jindubiaoshi">整体完成率</span>
          </div>
        </div>
      </Card>

      {/* 2. 四大核心数据指标 */}
      <Row gutter={[16, 16]} className="tongjikaquyu">
        <Col xs={24} sm={12} lg={6}>
          <Card className="tongjikaxiangmu">
            <Statistic
              title="实训项目总数"
              value={projectCount}
              suffix="个"
              prefix={<ProjectOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="tongjikarenwu">
            <Statistic
              title="实训任务总数"
              value={taskCount}
              suffix="项"
              prefix={<ThunderboltOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="tongjikawancheng">
            <Statistic
              title="已完成任务"
              value={completedCount}
              suffix="项"
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="tongjikajindu">
            <Statistic
              title="待推进任务"
              value={pendingCount}
              suffix="项"
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 3. 项目进度看板 + 待办与快捷入口 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <ProjectOutlined style={{ color: '#1677ff' }} />
                <span>实训项目推进进度</span>
              </Space>
            }
            extra={
              <Button type="link" size="small" onClick={() => handleJump('projects')}>
                全部项目 <RightOutlined />
              </Button>
            }
            className="jindukanbanquyu"
          >
            {projectList.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无进行中的实训项目，请先创建项目"
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleJump('projects')}
                >
                  去创建项目
                </Button>
              </Empty>
            ) : (
              <div className="xiangmuliebiao">
                {projectList.map((project) => {
                  const taskList = project.tasks || []
                  const total = taskList.length
                  const done = taskList.filter((task) => task.completed).length
                  const projectPercent = total === 0 ? 0 : Math.round((done / total) * 100)

                  return (
                    <div key={project.id} className="xiangmutiaomu">
                      <div className="xiangmutoubu">
                        <div className="xiangmutoubu-zuo">
                          <span className="xiangmumingcheng">{project.name}</span>
                          <Tag color="blue">{project.course}</Tag>
                        </div>
                        <Button
                          type="link"
                          size="small"
                          onClick={() => handleOpenProject(project.id)}
                        >
                          查看任务
                        </Button>
                      </div>
                      <Progress
                        percent={projectPercent}
                        status={projectPercent === 100 ? 'success' : 'active'}
                        strokeColor={{ '0%': '#108ee9', '100%': '#52c41a' }}
                      />
                      <div className="xiangmutongji">
                        <span>
                          已完成：<b>{done}</b> / {total} 项
                        </span>
                        <span className="fengefu">|</span>
                        <span className={projectPercent === 100 ? 'wanchengzishu' : 'jinduzishu'}>
                          完成度：<b>{projectPercent}%</b>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Card
              title={
                <Space>
                  <ThunderboltOutlined style={{ color: '#722ed1' }} />
                  <span>快捷工作通道</span>
                </Space>
              }
              className="kuaijiequyu"
            >
              <Space orientation="vertical" style={{ width: '100%' }} size={12}>
                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => handleJump('projects')}
                >
                  创建新实训项目
                </Button>
                <Button
                  block
                  size="large"
                  icon={<UnorderedListOutlined />}
                  onClick={() => handleJump('tasks')}
                >
                  进入任务清单管理
                </Button>
              </Space>
            </Card>

            <Card
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                  <span>待推进任务</span>
                </Space>
              }
              extra={<span className="daituijintishi">共 {pendingCount} 项</span>}
              className="daitiaokaquyu"
            >
              {pendingTasks.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={taskCount === 0 ? '还没有任务，先去添加一项吧' : '全部任务已完成'}
                />
              ) : (
                <div className="daitiaoliebiao">
                  {pendingTasks.slice(0, 5).map((task) => (
                    <div key={`${task.projectId}-${task.id}`} className="daitiaoxiang">
                      <Checkbox
                        checked={false}
                        onChange={() => onToggleTask && onToggleTask(task.projectId, task.id)}
                      />
                      <div className="daitiaoxinxi">
                        <span className="daitiaomingcheng">{task.title}</span>
                        <Tag color="blue">{task.projectName}</Tag>
                      </div>
                    </div>
                  ))}
                  {pendingTasks.length > 5 && (
                    <Button type="link" block onClick={() => handleJump('tasks')}>
                      查看全部 {pendingTasks.length} 项待办 <RightOutlined />
                    </Button>
                  )}
                </div>
              )}
            </Card>

            <Card className="tishikinpian">
              <div className="tishibiaoti">
                <ReadOutlined style={{ marginRight: 6 }} />
                项目制实训小贴士
              </div>
              <p className="tishineirong">
                首页数据与「项目管理」「任务管理」实时联动：在任务清单中完成一项任务，这里的进度与统计会自动刷新，并保存到本地。
              </p>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  )
}
