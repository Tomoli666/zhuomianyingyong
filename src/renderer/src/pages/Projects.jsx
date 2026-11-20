import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  Tag,
  Space,
  Empty,
  message,
  Popconfirm,
  Progress
} from 'antd'
import {
  PlusOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  EditOutlined,
  DeleteOutlined,
  RightOutlined
} from '@ant-design/icons'

// 项目管理页组件：支持新建、编辑、删除项目，以及关联本地目录并在资源管理器中打开
export default function Projects({
  projectList = [],
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onOpenProject
}) {
  // 控制项目弹窗的显示与隐藏
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 当前正在编辑的项目；为 null 表示新建模式
  const [editingProject, setEditingProject] = useState(null)

  // Ant Design 表单实例（用于手动重置与回填表单字段）
  const [form] = Form.useForm()

  // 打开“新建项目”弹窗
  const handleOpenCreate = () => {
    setEditingProject(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  // 打开“编辑项目”弹窗并回填已有数据
  const handleOpenEdit = (project) => {
    setEditingProject(project)
    form.setFieldsValue({
      name: project.name,
      course: project.course,
      description:
        project.description === '暂无简介描述' || project.description === '暂无项目简介'
          ? ''
          : project.description,
      folderPath: project.folderPath === '待关联本地文件夹' ? '' : project.folderPath
    })
    setIsModalOpen(true)
  }

  // 取消关闭弹窗
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProject(null)
    form.resetFields()
  }

  // 调用 Electron 原生窗口选择本地文件夹
  const handleXuanzeMulu = async () => {
    if (!window.api?.selectFolder) {
      message.warning('当前环境不支持原生文件夹选择')
      return
    }
    const xuanzhongLujing = await window.api.selectFolder()
    console.log('+++++++', '选择本地项目文件夹返回：', xuanzhongLujing)
    if (xuanzhongLujing) {
      form.setFieldsValue({ folderPath: xuanzhongLujing })
    }
  }

  // 调用 Electron 在 Windows 资源管理器中打开项目目录
  const handleDakaiMulu = async (mubiaoLujing) => {
    console.log('*-*-*-*', '点击打开本地项目目录：', mubiaoLujing)
    if (!window.api?.openFolder) {
      message.warning('当前环境不支持打开本地目录')
      return
    }
    const jieguo = await window.api.openFolder(mubiaoLujing)
    if (!jieguo?.success) {
      message.warning(jieguo?.message || '打开目录失败，请检查文件夹路径是否存在')
    }
  }

  // 表单校验通过后提交：根据 editingProject 判断是新建还是更新
  const handleFormFinish = (values) => {
    const muluLujing = values.folderPath ? values.folderPath.trim() : ''

    // 表单公共字段
    const jichuShuju = {
      name: values.name.trim(),
      course: values.course.trim(),
      description: values.description?.trim() || '暂无简介描述',
      folderPath: muluLujing || '待关联本地文件夹'
    }

    if (editingProject) {
      // 编辑模式：保留原有 id、任务列表与创建时间
      if (onUpdateProject) {
        onUpdateProject({ ...editingProject, ...jichuShuju })
      }
      message.success('项目信息已更新')
    } else {
      // 新建模式：补全 id、创建时间与空任务列表
      if (onAddProject) {
        onAddProject({
          id: `p_${Date.now()}`,
          ...jichuShuju,
          createdAt: new Date().toISOString().split('T')[0],
          tasks: []
        })
      }
      message.success('项目创建成功')
    }

    handleCloseModal()
  }

  // 删除项目（Popconfirm 已做二次确认）
  const handleDeleteProject = (project) => {
    if (onDeleteProject) {
      onDeleteProject(project.id)
    }
    message.success(`已删除项目「${project.name}」`)
  }

  return (
    <div className="xiangmuguanli">
      {/* 1. 顶部操作栏 */}
      <div className="yemianbiaoti-hengxiang">
        <div className="yemianbiaoti">
          <h2>我的教学项目</h2>
          <span className="yemianfubiao">共管理 {projectList.length} 个进行中的实训项目</span>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
          新建项目
        </Button>
      </div>

      {/* 2. 项目卡片网格列表（无数据时展示友好空状态引导） */}
      {projectList.length === 0 ? (
        <Empty
          style={{ marginTop: 60 }}
          description="暂无教学实训项目，点击下方按钮创建第一个项目！"
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            新建项目
          </Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {projectList.map((item) => {
            const taskList = item.tasks || []
            const total = taskList.length
            const done = taskList.filter((task) => task.completed).length
            const percent = total === 0 ? 0 : Math.round((done / total) * 100)

            return (
              <Col xs={24} sm={12} lg={8} key={item.id}>
                <Card
                  hoverable
                  className="xiangmukapian"
                  title={<span className="xiangmukapian-biaoti">{item.name}</span>}
                  extra={<Tag color="blue">{item.course}</Tag>}
                >
                  {/* 项目简介 */}
                  <p className="xiangmujianjie">{item.description}</p>

                  {/* 任务进度 */}
                  <div className="xiangmujindu">
                    <div className="xiangmujindu-toubu">
                      <span>任务进度</span>
                      <span>
                        {done} / {total} 项
                      </span>
                    </div>
                    <Progress
                      percent={percent}
                      size="small"
                      status={percent === 100 ? 'success' : 'active'}
                      strokeColor={{ '0%': '#108ee9', '100%': '#52c41a' }}
                    />
                  </div>

                  {/* 本地目录展示与一键打开按钮 */}
                  <div className="xiangmuwenjian">
                    <FolderOutlined />
                    <span title={item.folderPath}>{item.folderPath}</span>
                    <Button
                      type="link"
                      size="small"
                      icon={<FolderOpenOutlined />}
                      onClick={() => handleDakaiMulu(item.folderPath)}
                      style={{ padding: 0, flexShrink: 0 }}
                    >
                      打开目录
                    </Button>
                  </div>

                  {/* 卡片操作区 */}
                  <div className="xiangmucaozuo">
                    <Button
                      type="link"
                      size="small"
                      onClick={() => onOpenProject && onOpenProject(item.id)}
                    >
                      查看任务 <RightOutlined />
                    </Button>
                    <Space size={0}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenEdit(item)}
                      >
                        编辑
                      </Button>
                      <Popconfirm
                        title="确定删除该项目吗？"
                        description="项目下的所有任务将一并删除，且无法恢复"
                        okText="删除"
                        cancelText="取消"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDeleteProject(item)}
                      >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}

      {/* 3. 新建 / 编辑项目弹窗 */}
      <Modal
        title={editingProject ? '编辑教学实训项目' : '新建教学实训项目'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        okText={editingProject ? '保存修改' : '创建'}
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleFormFinish}>
          <Form.Item
            label="项目名称"
            name="name"
            rules={[{ required: true, whitespace: true, message: '请输入项目名称！' }]}
          >
            <Input placeholder="例如：金融数据上链存证系统" maxLength={50} />
          </Form.Item>

          <Form.Item
            label="所属课程"
            name="course"
            rules={[{ required: true, whitespace: true, message: '请输入所属课程名称！' }]}
          >
            <Input placeholder="例如：区块链技术原理及应用" maxLength={50} />
          </Form.Item>

          <Form.Item label="本地项目目录">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="folderPath" noStyle>
                <Input placeholder="请点击右侧按钮选择项目文件夹（选填）" />
              </Form.Item>
              <Button icon={<FolderOpenOutlined />} onClick={handleXuanzeMulu}>
                选择文件夹
              </Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item label="项目简介" name="description">
            <Input.TextArea
              rows={3}
              maxLength={200}
              showCount
              placeholder="简要描述项目的核心目标、技术栈或成果要求（选填）"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
