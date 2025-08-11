import React, { useState, useCallback } from 'react'
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Divider,
  Typography,
  Row,
  Col,
  Tag,
  Modal,
  message,
  Steps,
  Alert,
  Table,
  Switch
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import { Rule } from '../types'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { Step } = Steps

// 业务字段配置
interface BusinessField {
  id: string
  name: string
  label: string
  type: 'fixed' | 'sequence' | 'category' | 'range' | 'template'
  required: boolean
  config: any
}

// 数据生成策略
interface GenerationStrategy {
  type: 'single' | 'batch' | 'cross'
  config: any
}

interface BusinessRuleBuilderProps {
  rule: Rule
  onChange: (rule: Rule) => void
}

// 预定义的业务场景模板
const BUSINESS_TEMPLATES = {
  device: {
    name: '设备批量录入',
    description: '适用于批量录入设备、传感器等硬件设备',
    fields: [
      { name: 'deviceId', label: '设备ID', type: 'sequence', required: true },
      { name: 'deviceName', label: '设备名称', type: 'template', required: true },
      { name: 'deviceType', label: '设备类型', type: 'category', required: true },
      { name: 'location', label: '安装位置', type: 'category', required: false },
      { name: 'serialNumber', label: '序列号', type: 'sequence', required: true }
    ]
  },
  user: {
    name: '用户批量录入',
    description: '适用于批量录入用户、员工等人员信息',
    fields: [
      { name: 'userId', label: '用户ID', type: 'sequence', required: true },
      { name: 'username', label: '用户名', type: 'template', required: true },
      { name: 'department', label: '部门', type: 'category', required: true },
      { name: 'role', label: '角色', type: 'category', required: true },
      { name: 'email', label: '邮箱', type: 'template', required: false }
    ]
  },
  product: {
    name: '产品批量录入',
    description: '适用于批量录入产品、商品等物品信息',
    fields: [
      { name: 'productId', label: '产品ID', type: 'sequence', required: true },
      { name: 'productName', label: '产品名称', type: 'template', required: true },
      { name: 'category', label: '产品类别', type: 'category', required: true },
      { name: 'price', label: '价格', type: 'range', required: true },
      { name: 'sku', label: 'SKU编码', type: 'sequence', required: true }
    ]
  }
}

// 字段类型配置
const FIELD_TYPE_CONFIGS = {
  fixed: {
    label: '固定值',
    description: '所有记录使用相同的固定值',
    icon: '📌',
    configFields: ['value']
  },
  sequence: {
    label: '序列递增',
    description: '按指定规则递增的序列号',
    icon: '🔢',
    configFields: ['prefix', 'start', 'step', 'suffix']
  },
  category: {
    label: '分类选择',
    description: '从预定义的分类列表中选择',
    icon: '📋',
    configFields: ['options', 'distribution']
  },
  range: {
    label: '范围值',
    description: '在指定范围内生成数值',
    icon: '📊',
    configFields: ['min', 'max', 'precision']
  },
  template: {
    label: '模板字符串',
    description: '使用模板生成动态内容',
    icon: '📝',
    configFields: ['template']
  }
}

export const BusinessRuleBuilder: React.FC<BusinessRuleBuilderProps> = ({
  rule,
  onChange
}) => {
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [fields, setFields] = useState<BusinessField[]>([])
  const [strategy, setStrategy] = useState<GenerationStrategy>({ type: 'single', config: {} })
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [editingField, setEditingField] = useState<BusinessField | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // 选择业务模板
  const selectTemplate = (templateKey: string) => {
    const template = BUSINESS_TEMPLATES[templateKey as keyof typeof BUSINESS_TEMPLATES]
    if (template) {
      setSelectedTemplate(templateKey)
      setFields(template.fields.map((field, index) => ({
        id: `field_${index}`,
        name: field.name,
        label: field.label,
        type: field.type as any,
        required: field.required,
        config: {}
      })))
      setCurrentStep(1)
    }
  }

  // 添加自定义字段
  const addField = useCallback((field: BusinessField) => {
    // 验证字段名是否重复
    const existingField = fields.find(f => f.name === field.name && f.id !== field.id)
    if (existingField) {
      message.error(`字段名 "${field.name}" 已存在，请使用不同的字段名`)
      return
    }
    
    setFields(prev => [...prev, { ...field, id: Date.now().toString() }])
    setShowFieldModal(false)
    setEditingField(null)
    message.success(`字段 "${field.label}" 添加成功`)
  }, [fields])

  // 更新字段
  const updateField = useCallback((updatedField: BusinessField) => {
    // 验证字段名是否与其他字段重复
    const existingField = fields.find(f => f.name === updatedField.name && f.id !== updatedField.id)
    if (existingField) {
      message.error(`字段名 "${updatedField.name}" 已存在，请使用不同的字段名`)
      return
    }
    
    setFields(prev => prev.map(field => 
      field.id === updatedField.id ? updatedField : field
    ))
    setShowFieldModal(false)
    setEditingField(null)
    message.success(`字段 "${updatedField.label}" 更新成功`)
  }, [fields])

  // 删除字段
  const removeField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id))
  }, [])

  // 编辑字段
  const editField = useCallback((field: BusinessField) => {
    setEditingField(field)
    setShowFieldModal(true)
  }, [])

  // 生成预览数据
  const generatePreview = useCallback(() => {
    if (fields.length === 0) {
      message.warning('请先添加字段配置')
      return
    }
    
    const sampleData = []
    
    if (strategy.type === 'cross' && strategy.config.categories && strategy.config.categories.length > 0) {
      // 交叉生成预览
      const categories = strategy.config.categories.slice(0, 3) // 最多预览3个分类
      const rangeStart = strategy.config.rangeStart || 1
      const rangeEnd = Math.min(strategy.config.rangeEnd || 3, rangeStart + 2) // 最多预览3个范围值
      
      categories.forEach((category, categoryIndex) => {
        for (let range = rangeStart; range <= rangeEnd; range++) {
          const record: any = {}
          
          fields.forEach(field => {
            switch (field.type) {
              case 'fixed':
                record[field.name] = field.config.value || '未设置值'
                break
              case 'sequence':
                const start = field.config.start || 1
                const step = field.config.step || 1
                const prefix = field.config.prefix || ''
                const suffix = field.config.suffix || ''
                const seqValue = (categoryIndex * (rangeEnd - rangeStart + 1) + range - rangeStart) * step + start
                record[field.name] = `${prefix}${seqValue}${suffix}`
                break
              case 'category':
                record[field.name] = category
                break
              case 'range':
                const min = field.config.min || 0
                const max = field.config.max || 100
                const precision = field.config.precision || 0
                const value = min + (max - min) * Math.random()
                record[field.name] = precision > 0 ? parseFloat(value.toFixed(precision)) : Math.floor(value)
                break
              case 'template':
                let template = field.config.template || '{{index}}'
                const globalIndex = categoryIndex * (rangeEnd - rangeStart + 1) + range - rangeStart + 1
                template = template.replace(/{{index}}/g, globalIndex.toString())
                template = template.replace(/{{range}}/g, range.toString())
                template = template.replace(/{{category}}/g, category)
                record[field.name] = template
                break
              default:
                record[field.name] = ''
            }
          })
          
          sampleData.push(record)
        }
      })
    } else {
      // 普通生成预览
      const count = Math.min(strategy.config.count || 5, 10) // 预览最多10条
      
      for (let i = 0; i < count; i++) {
        const record: any = {}
        
        fields.forEach(field => {
          switch (field.type) {
            case 'fixed':
              record[field.name] = field.config.value || '未设置值'
              break
            case 'sequence':
              const start = field.config.start || 1
              const step = field.config.step || 1
              const prefix = field.config.prefix || ''
              const suffix = field.config.suffix || ''
              record[field.name] = `${prefix}${start + i * step}${suffix}`
              break
            case 'category':
              const options = field.config.options || []
              if (options.length > 0) {
                record[field.name] = options[i % options.length]
              } else {
                record[field.name] = '未配置选项'
              }
              break
            case 'range':
              const min = field.config.min || 0
              const max = field.config.max || 100
              const precision = field.config.precision || 0
              const value = min + (max - min) * Math.random()
              record[field.name] = precision > 0 ? parseFloat(value.toFixed(precision)) : Math.floor(value)
              break
            case 'template':
              let template = field.config.template || '{{index}}'
              template = template.replace(/{{index}}/g, (i + 1).toString())
              record[field.name] = template
              break
            default:
              record[field.name] = ''
          }
        })
        
        sampleData.push(record)
      }
    }
    
    setPreviewData(sampleData)
    message.success(`成功生成 ${sampleData.length} 条预览数据`)
  }, [fields, strategy])

  // 导出预览数据
  const exportPreviewData = useCallback(() => {
    if (previewData.length === 0) {
      message.warning('请先生成预览数据')
      return
    }
    
    const dataStr = JSON.stringify(previewData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `preview-data-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    message.success('预览数据导出成功！')
  }, [previewData])

  // 生成最终规则
  const generateRule = useCallback(() => {
    // 验证配置
    if (fields.length === 0) {
      message.error('请至少添加一个字段')
      return
    }
    
    // 验证字段配置
    for (const field of fields) {
      if (!field.name || !field.label) {
        message.error(`字段 "${field.label || field.name || '未命名'}" 配置不完整`)
        return
      }
      
      if (field.type === 'fixed' && (field.config.value === undefined || field.config.value === '')) {
        message.error(`字段 "${field.label}" 的固定值不能为空`)
        return
      }
      
      if (field.type === 'category' && (!field.config.options || field.config.options.length === 0)) {
        message.error(`字段 "${field.label}" 的分类选项不能为空`)
        return
      }
      
      if (field.type === 'range') {
        const min = field.config.min
        const max = field.config.max
        if (min !== undefined && max !== undefined && min >= max) {
          message.error(`字段 "${field.label}" 的最小值必须小于最大值`)
          return
        }
      }
      
      if (field.type === 'template' && !field.config.template) {
        message.error(`字段 "${field.label}" 的模板字符串不能为空`)
        return
      }
    }
    
    // 验证策略配置
    if (strategy.type === 'cross') {
      if (!strategy.config.categories || strategy.config.categories.length === 0) {
        message.error('交叉生成策略需要至少一个分类')
        return
      }
      
      const rangeStart = strategy.config.rangeStart || 1
      const rangeEnd = strategy.config.rangeEnd || 10
      if (rangeStart >= rangeEnd) {
        message.error('交叉生成策略的范围起始值必须小于结束值')
        return
      }
    }
    
    const values = form.getFieldsValue()
    
    // 构建模板
    const template: any = {}
    
    if (strategy.type === 'cross' && strategy.config.categories && strategy.config.categories.length > 0) {
      // 交叉生成策略
      template['#nested'] = {
        loops: [
          {
            type: 'array',
            variable: '$category',
            array: strategy.config.categories
          },
          {
            type: 'range',
            variable: '$range',
            start: strategy.config.rangeStart || 1,
            end: strategy.config.rangeEnd || 10,
            step: strategy.config.rangeStep || 1
          }
        ],
        template: {}
      }
      
      fields.forEach(field => {
        const fieldTemplate = generateFieldTemplate(field, true)
        template['#nested'].template[field.name] = fieldTemplate
      })
    } else {
      // 普通生成策略
      fields.forEach(field => {
        const fieldTemplate = generateFieldTemplate(field, false)
        template[field.name] = fieldTemplate
      })
    }
    
    const newRule: Rule = {
      id: values.id || `business-rule-${Date.now()}`,
      name: values.name || '业务数据生成规则',
      description: values.description || '通过业务规则编辑器创建的数据生成规则',
      template,
      count: strategy.type === 'cross' 
        ? strategy.config.categories.length * (strategy.config.rangeEnd - strategy.config.rangeStart + 1) / (strategy.config.rangeStep || 1)
        : strategy.config.count || 10
    }
    
    onChange(newRule)
    message.success('业务规则生成成功！可以在JSON模板选项卡中查看生成的规则。')
  }, [form, fields, strategy, onChange])

  // 生成字段模板
  const generateFieldTemplate = (field: BusinessField, isCrossLoop: boolean) => {
    switch (field.type) {
      case 'fixed':
        return field.config.value || ''
      case 'sequence':
        const start = field.config.start || 1
        const step = field.config.step || 1
        const prefix = field.config.prefix || ''
        const suffix = field.config.suffix || ''
        if (isCrossLoop) {
          return `${prefix}{{($category.index * ${strategy.config.rangeEnd - strategy.config.rangeStart + 1} + $range - ${strategy.config.rangeStart}) * ${step} + ${start}}}${suffix}`
        } else {
          return `${prefix}{{($index - 1) * ${step} + ${start}}}${suffix}`
        }
      case 'category':
        if (isCrossLoop) {
          return '{{$category}}'
        } else {
          const options = field.config.options || []
          return `{{randomChoice(${JSON.stringify(options)})}}`
        }
      case 'range':
        const min = field.config.min || 0
        const max = field.config.max || 100
        const precision = field.config.precision || 0
        if (precision > 0) {
          return `{{randomFloat(${min}, ${max}, ${precision})}}`
        } else {
          return `{{randomInt(${min}, ${max})}}`
        }
      case 'template':
        let template = field.config.template || ''
        if (isCrossLoop) {
          template = template.replace(/{{index}}/g, '{{($category.index * ' + (strategy.config.rangeEnd - strategy.config.rangeStart + 1) + ' + $range - ' + strategy.config.rangeStart + ' + 1)}}')
          template = template.replace(/{{range}}/g, '{{$range}}')
          template = template.replace(/{{category}}/g, '{{$category}}')
        } else {
          template = template.replace(/{{index}}/g, '{{$index}}')
        }
        return template
      default:
        return ''
    }
  }

  const steps = [
    {
      title: '选择模板',
      description: '选择业务场景模板',
      icon: <SettingOutlined />
    },
    {
      title: '配置字段',
      description: '设置字段生成规则',
      icon: <PlayCircleOutlined />
    },
    {
      title: '生成策略',
      description: '选择数据生成策略',
      icon: <CheckCircleOutlined />
    },
    {
      title: '预览生成',
      description: '预览并生成规则',
      icon: <InfoCircleOutlined />
    }
  ]

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>业务数据生成器</Title>
        <Text type="secondary">
          专为生产环境设计的批量数据录入工具，支持设备、用户、产品等业务场景
        </Text>
      </div>
      
      <Steps 
        current={currentStep} 
        items={steps.map((step, index) => ({
          ...step,
          status: currentStep > index ? 'finish' : currentStep === index ? 'process' : 'wait',
          description: index === 0 ? (selectedTemplate ? `已选择${BUSINESS_TEMPLATES[selectedTemplate as keyof typeof BUSINESS_TEMPLATES]?.name || '自定义模板'}` : '选择业务场景模板') :
                      index === 1 ? `已配置 ${fields.length} 个字段` :
                      index === 2 ? (strategy.type ? `已选择${strategy.type === 'single' ? '普通' : strategy.type === 'batch' ? '批量' : '交叉'}生成` : '选择数据生成策略') :
                      previewData.length > 0 ? `已生成 ${previewData.length} 条预览` : '预览并生成规则'
        }))}
        style={{ marginBottom: 32 }}
        type="navigation"
        size="small"
      />
      
      {/* 步骤1：选择模板 */}
      {currentStep === 0 && (
        <div>
          <Title level={4}>选择业务场景模板</Title>
          <Row gutter={[16, 16]}>
            {Object.entries(BUSINESS_TEMPLATES).map(([key, template]) => (
              <Col span={8} key={key}>
                <Card
                  hoverable
                  onClick={() => selectTemplate(key)}
                  style={{
                    border: selectedTemplate === key ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    cursor: 'pointer'
                  }}
                  actions={[
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectTemplate(key);
                      }}
                    >
                      选择模板
                    </Button>
                  ]}
                >
                  <Card.Meta
                    title={template.name}
                    description={template.description}
                  />
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary">包含字段：</Text>
                    <div style={{ marginTop: 4 }}>
                      {template.fields.map(field => (
                        <Tag key={field.name} style={{ marginBottom: 4 }}>
                          {field.label}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          
          <div style={{ marginTop: 24 }}>
            <Button 
              type="dashed" 
              block 
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedTemplate('custom')
                setFields([])
                setCurrentStep(1)
              }}
            >
              自定义模板（从空白开始）
            </Button>
          </div>
        </div>
      )}
      
      {/* 步骤2：配置字段 */}
      {currentStep === 1 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4}>配置字段生成规则</Title>
            <Space>
              <Button onClick={() => setCurrentStep(0)}>上一步</Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingField(null)
                  setShowFieldModal(true)
                }}
              >
                添加字段
              </Button>
            </Space>
          </div>
          
          {fields.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <InfoCircleOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                <Title level={4} type="secondary">暂无字段配置</Title>
                <Paragraph type="secondary">
                  请先选择业务模板或点击下方按钮添加自定义字段
                </Paragraph>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setShowFieldModal(true)}
                  size="large"
                >
                  添加字段
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {fields.map(field => (
                  <Card key={field.id} size="small">
                    <Row align="middle" gutter={16}>
                      <Col span={4}>
                        <Text strong>{field.label}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>{field.name}</Text>
                      </Col>
                      <Col span={4}>
                        <Tag color="blue">
                          {FIELD_TYPE_CONFIGS[field.type].icon} {FIELD_TYPE_CONFIGS[field.type].label}
                        </Tag>
                      </Col>
                      <Col span={8}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {field.type === 'fixed' && `固定值: ${field.config.value || '未设置'}`}
                          {field.type === 'sequence' && `序列: ${field.config.prefix || ''}[${field.config.start || 1}+${field.config.step || 1}]${field.config.suffix || ''}`}
                          {field.type === 'category' && `选项: ${field.config.options?.length || 0}个`}
                          {field.type === 'range' && `范围: ${field.config.min || 0} ~ ${field.config.max || 100}`}
                          {field.type === 'template' && `模板: ${field.config.template || '未设置'}`}
                        </Text>
                      </Col>
                      <Col span={2}>
                        {field.required && <Tag color="red">必填</Tag>}
                      </Col>
                      <Col span={6}>
                        <Space>
                          <Button 
                            size="small" 
                            icon={<SettingOutlined />}
                            onClick={() => editField(field)}
                          >
                            配置
                          </Button>
                          <Button 
                            size="small" 
                            danger 
                            icon={<DeleteOutlined />}
                            onClick={() => removeField(field.id)}
                          >
                            删除
                          </Button>
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
              
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Space>
                  <Button 
                    icon={<PlusOutlined />}
                    onClick={() => setShowFieldModal(true)}
                  >
                    添加字段
                  </Button>
                  <Button type="primary" onClick={() => setCurrentStep(2)}>
                    下一步：配置生成策略
                  </Button>
                </Space>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* 步骤3：生成策略 */}
      {currentStep === 2 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4}>选择数据生成策略</Title>
            <Button onClick={() => setCurrentStep(1)}>上一步</Button>
          </div>
          
          <Row gutter={16}>
            <Col span={8}>
              <Card
                hoverable
                onClick={() => setStrategy({ type: 'single', config: { count: 10 } })}
                style={{
                  border: strategy.type === 'single' ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  cursor: 'pointer'
                }}
                actions={[
                  <Button 
                    type={strategy.type === 'single' ? 'primary' : 'default'}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStrategy({ type: 'single', config: { count: 10 } });
                    }}
                  >
                    选择策略
                  </Button>
                ]}
              >
                <Card.Meta
                  title="📄 单一生成"
                  description="按指定数量生成数据，每条记录独立生成"
                />
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">适用场景：简单数据录入</Text>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card
                hoverable
                onClick={() => setStrategy({ type: 'batch', config: { count: 10 } })}
                style={{
                  border: strategy.type === 'batch' ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  cursor: 'pointer'
                }}
                actions={[
                  <Button 
                    type={strategy.type === 'batch' ? 'primary' : 'default'}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStrategy({ type: 'batch', config: { count: 10 } });
                    }}
                  >
                    选择策略
                  </Button>
                ]}
              >
                <Card.Meta
                  title="📦 批量生成"
                  description="批量生成数据，支持批次控制和关联"
                />
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">适用场景：大量数据分批处理</Text>
                </div>
              </Card>
            </Col>
            <Col span={8}>
              <Card
                hoverable
                onClick={() => setStrategy({ 
                  type: 'cross', 
                  config: { 
                    categories: [], 
                    rangeStart: 1, 
                    rangeEnd: 10, 
                    rangeStep: 1 
                  } 
                })}
                style={{
                  border: strategy.type === 'cross' ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  cursor: 'pointer'
                }}
                actions={[
                  <Button 
                    type={strategy.type === 'cross' ? 'primary' : 'default'}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStrategy({ 
                        type: 'cross', 
                        config: { 
                          categories: [], 
                          rangeStart: 1, 
                          rangeEnd: 10, 
                          rangeStep: 1 
                        } 
                      });
                    }}
                  >
                    选择策略
                  </Button>
                ]}
              >
                <Card.Meta
                  title="🔄 交叉生成"
                  description="分类列表与数值范围交叉组合，生成笛卡尔积数据"
                />
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">适用场景：多维度组合数据</Text>
                </div>
              </Card>
            </Col>
          </Row>
          
          {strategy.type && (
            <Card title="策略配置" style={{ marginTop: 16 }}>
              <Form layout="vertical">
                {strategy.type === 'single' && (
                  <Form.Item label="生成数量">
                    <InputNumber 
                      min={1} 
                      max={10000} 
                      value={strategy.config.count}
                      onChange={value => setStrategy(prev => ({
                        ...prev,
                        config: { ...prev.config, count: value }
                      }))}
                    />
                  </Form.Item>
                )}
                
                {strategy.type === 'batch' && (
                  <>
                    <Form.Item label="生成数量">
                      <InputNumber 
                        min={1} 
                        max={10000} 
                        value={strategy.config.count}
                        onChange={value => setStrategy(prev => ({
                          ...prev,
                          config: { ...prev.config, count: value }
                        }))}
                      />
                    </Form.Item>
                    <Form.Item label="批次大小">
                      <InputNumber 
                        min={1} 
                        max={1000} 
                        value={strategy.config.batchSize || 100}
                        onChange={value => setStrategy(prev => ({
                          ...prev,
                          config: { ...prev.config, batchSize: value }
                        }))}
                      />
                    </Form.Item>
                  </>
                )}
                
                {strategy.type === 'cross' && (
                  <>
                    <Form.Item label="分类列表">
                      <Select
                        mode="tags"
                        placeholder="输入分类名称，按回车添加"
                        value={strategy.config.categories}
                        onChange={value => setStrategy(prev => ({
                          ...prev,
                          config: { ...prev.config, categories: value }
                        }))}
                      />
                    </Form.Item>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item label="范围起始">
                          <InputNumber 
                            value={strategy.config.rangeStart}
                            onChange={value => setStrategy(prev => ({
                              ...prev,
                              config: { ...prev.config, rangeStart: value }
                            }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="范围结束">
                          <InputNumber 
                            value={strategy.config.rangeEnd}
                            onChange={value => setStrategy(prev => ({
                              ...prev,
                              config: { ...prev.config, rangeEnd: value }
                            }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="步长">
                          <InputNumber 
                            min={1}
                            value={strategy.config.rangeStep}
                            onChange={value => setStrategy(prev => ({
                              ...prev,
                              config: { ...prev.config, rangeStep: value }
                            }))}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                )}
              </Form>
              
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Button type="primary" onClick={() => setCurrentStep(3)}>
                  下一步：预览生成
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
      
      {/* 步骤4：预览生成 */}
      {currentStep === 3 && (
        <div>
          <Alert
            message="预览和生成"
            description="在这里可以预览生成的数据样本，确认无误后生成最终的JSON规则。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          {/* 基本信息配置 */}
          <Card title="规则基本信息" style={{ marginBottom: 16 }}>
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="规则名称" name="name">
                    <Input placeholder="请输入规则名称" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="规则ID" name="id">
                    <Input placeholder="自动生成" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="生成数量">
                    <InputNumber 
                      min={1} 
                      max={10000} 
                      value={strategy.config.count || 10}
                      onChange={value => setStrategy(prev => ({
                        ...prev,
                        config: { ...prev.config, count: value }
                      }))}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="规则描述" name="description">
                <Input.TextArea rows={2} placeholder="请输入规则描述" />
              </Form.Item>
            </Form>
          </Card>
          
          <Card title="操作面板" style={{ marginBottom: 16 }}>
            <Space wrap>
              <Button 
                type="primary" 
                icon={<EyeOutlined />}
                onClick={generatePreview}
                size="large"
                loading={loading}
              >
                生成预览数据
              </Button>
              {previewData.length > 0 && (
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={exportPreviewData}
                  size="large"
                >
                  导出预览数据
                </Button>
              )}
              <Button 
                type="default"
                onClick={() => setCurrentStep(2)}
              >
                返回修改策略
              </Button>
              <Button 
                type="default"
                onClick={() => setCurrentStep(1)}
              >
                返回修改字段
              </Button>
            </Space>
          </Card>
          
          {/* 数据预览 */}
          {previewData.length > 0 ? (
            <Card 
              title={`预览数据 (共 ${previewData.length} 条)`}
              extra={
                <Space>
                  <Tag color="blue">策略: {strategy.type === 'single' ? '普通生成' : strategy.type === 'batch' ? '批量生成' : '交叉生成'}</Tag>
                  <Tag color="green">字段: {fields.length}个</Tag>
                  <Button 
                    icon={<DownloadOutlined />}
                    onClick={exportPreviewData}
                    size="small"
                  >
                    导出预览
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<DownloadOutlined />}
                    onClick={generateRule}
                  >
                    生成JSON规则
                  </Button>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <Table
                dataSource={previewData.slice(0, 10)}
                columns={fields.map(field => ({
                  title: field.label,
                  dataIndex: field.name,
                  key: field.name,
                  width: 150
                }))}
                pagination={false}
                scroll={{ x: true }}
                size="small"
              />
              
              {previewData.length > 10 && (
                <div style={{ marginTop: 12, textAlign: 'center' }}>
                  <Text type="secondary">
                    显示前 10 条数据，实际生成 {previewData.length} 条
                  </Text>
                </div>
              )}
            </Card>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <InfoCircleOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
                <Title level={4} type="secondary">暂无预览数据</Title>
                <Paragraph type="secondary">
                  点击上方"生成预览数据"按钮查看数据样本
                </Paragraph>
              </div>
            </Card>
          )}
        </div>
      )}
      
      {/* 字段配置模态框 */}
      <FieldConfigModal 
        visible={showFieldModal}
        field={editingField}
        onOk={(fieldData) => {
          if (editingField) {
            updateField(fieldData)
          } else {
            addField(fieldData)
          }
        }}
        onCancel={() => {
          setShowFieldModal(false)
          setEditingField(null)
        }}
      />
    </div>
  )
}

// 字段配置模态框
interface FieldConfigModalProps {
  visible: boolean
  field?: BusinessField | null
  onOk: (field: BusinessField) => void
  onCancel: () => void
}

const FieldConfigModal: React.FC<FieldConfigModalProps> = ({
  visible,
  field,
  onOk,
  onCancel
}) => {
  const [form] = Form.useForm()
  const [selectedType, setSelectedType] = useState<string>('')
  
  React.useEffect(() => {
    if (visible) {
      if (field) {
        form.setFieldsValue(field)
        setSelectedType(field.type)
      } else {
        form.resetFields()
        setSelectedType('')
      }
    }
  }, [visible, field, form])
  
  const handleOk = () => {
    form.validateFields().then(values => {
      const fieldData = {
        id: field?.id || Date.now().toString(),
        name: values.name,
        label: values.label,
        type: values.type,
        required: values.required || false,
        config: values.config || {}
      }
      
      onOk(fieldData)
      form.resetFields()
    })
  }
  
  const typeConfig = FIELD_TYPE_CONFIGS[selectedType as keyof typeof FIELD_TYPE_CONFIGS]
  
  return (
    <Modal
      title={field ? '编辑字段' : '添加字段'}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              label="字段名称" 
              name="name" 
              rules={[{ required: true, message: '请输入字段名称' }]}
            >
              <Input placeholder="如：deviceId, userName" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              label="显示标签" 
              name="label" 
              rules={[{ required: true, message: '请输入显示标签' }]}
            >
              <Input placeholder="如：设备ID, 用户名" />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={18}>
            <Form.Item 
              label="字段类型" 
              name="type" 
              rules={[{ required: true, message: '请选择字段类型' }]}
            >
              <Select 
                placeholder="选择数据生成方式" 
                onChange={setSelectedType}
              >
                {Object.entries(FIELD_TYPE_CONFIGS).map(([key, config]) => (
                  <Option key={key} value={key}>
                    {config.icon} {config.label} - {config.description}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="是否必填" name="required" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        
        {typeConfig && (
          <Card title="类型配置" size="small">
            <Alert
              message={typeConfig.description}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            {selectedType === 'fixed' && (
              <Form.Item label="固定值" name={['config', 'value']}>
                <Input placeholder="输入固定值" />
              </Form.Item>
            )}
            
            {selectedType === 'sequence' && (
              <>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="前缀" name={['config', 'prefix']}>
                      <Input placeholder="如：DEV" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="起始值" name={['config', 'start']}>
                      <InputNumber min={0} placeholder="1" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="步长" name={['config', 'step']}>
                      <InputNumber min={1} placeholder="1" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="后缀" name={['config', 'suffix']}>
                  <Input placeholder="如：-001" />
                </Form.Item>
              </>
            )}
            
            {selectedType === 'category' && (
              <Form.Item label="选项列表" name={['config', 'options']}>
                <Select mode="tags" placeholder="输入选项，按回车添加" />
              </Form.Item>
            )}
            
            {selectedType === 'range' && (
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="最小值" name={['config', 'min']}>
                    <InputNumber placeholder="0" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="最大值" name={['config', 'max']}>
                    <InputNumber placeholder="100" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="小数位" name={['config', 'precision']}>
                    <InputNumber min={0} max={10} placeholder="0" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            )}
            
            {selectedType === 'template' && (
              <>
                <Form.Item label="模板字符串" name={['config', 'template']}>
                  <Input.TextArea 
                    rows={3} 
                    placeholder="如：设备{{index}}-{{category}}" 
                  />
                </Form.Item>
                <Alert
                  message="模板变量说明"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      <li>{{index}} - 当前记录序号</li>
                      <li>{{category}} - 当前分类（交叉生成时）</li>
                      <li>{{range}} - 当前范围值（交叉生成时）</li>
                    </ul>
                  }
                  type="info"
                  showIcon
                  style={{ marginTop: 8 }}
                />
              </>
            )}
          </Card>
        )}
      </Form>
    </Modal>
  )
}

export default BusinessRuleBuilder