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
  Popover,
  Modal,
  message
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  DragOutlined,
  SettingOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'
import { Rule } from '../types'
import VisualGuide from './VisualGuide'

const { Title, Text } = Typography
const { Option } = Select

interface FieldConfig {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  generator: string
  params: Record<string, any>
  children?: FieldConfig[]
}

interface LoopConfig {
  id: string
  type: 'for' | 'each' | 'nested' | 'cross'
  params: Record<string, any>
  template: FieldConfig[]
}

interface VisualRuleBuilderProps {
  rule: Rule
  onChange: (rule: Rule) => void
}

const FIELD_GENERATORS = {
  uuid: { label: 'UUID', params: [] },
  randomString: { 
    label: '随机字符串', 
    params: [{ name: 'length', type: 'number', default: 8 }] 
  },
  randomInt: { 
    label: '随机整数', 
    params: [
      { name: 'min', type: 'number', default: 1 },
      { name: 'max', type: 'number', default: 100 }
    ] 
  },
  randomFloat: { 
    label: '随机小数', 
    params: [
      { name: 'min', type: 'number', default: 0 },
      { name: 'max', type: 'number', default: 100 },
      { name: 'precision', type: 'number', default: 2 }
    ] 
  },
  randomChoice: { 
    label: '随机选择', 
    params: [{ name: 'options', type: 'array', default: [] }] 
  },
  randomDate: { 
    label: '随机日期', 
    params: [
      { name: 'start', type: 'string', default: '2020-01-01' },
      { name: 'end', type: 'string', default: '2024-12-31' },
      { name: 'format', type: 'string', default: 'YYYY-MM-DD' }
    ] 
  },
  static: { 
    label: '固定值', 
    params: [{ name: 'value', type: 'any', default: '' }] 
  },
  increment: {
    label: '递增序号',
    params: [{ name: 'start', type: 'number', default: 1 }]
  },
  objectField: {
    label: '对象字段',
    params: [{ name: 'fieldName', type: 'string', default: 'name' }]
  },
  rangeValue: {
    label: '范围值',
    params: []
  },
  template: {
    label: '模板字符串',
    params: [{ name: 'template', type: 'string', default: '' }]
  }
}

const LOOP_TYPES = {
  for: { 
    label: '数值循环', 
    params: [
      { name: 'start', type: 'number', default: 0 },
      { name: 'end', type: 'number', default: 10 },
      { name: 'step', type: 'number', default: 1 }
    ] 
  },
  each: { 
    label: '数组遍历', 
    params: [{ name: 'array', type: 'array', default: [] }] 
  },
  nested: { 
    label: '嵌套循环', 
    params: [] 
  },
  cross: {
    label: '交叉循环',
    params: [
      { name: 'objectList', type: 'array', default: [] },
      { name: 'rangeStart', type: 'number', default: 1 },
      { name: 'rangeEnd', type: 'number', default: 10 },
      { name: 'rangeStep', type: 'number', default: 1 }
    ]
  }
}

export const VisualRuleBuilder: React.FC<VisualRuleBuilderProps> = ({
  rule,
  onChange
}) => {
  const [form] = Form.useForm()
  const [fields, setFields] = useState<FieldConfig[]>([])
  const [loops, setLoops] = useState<LoopConfig[]>([])
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [showLoopModal, setShowLoopModal] = useState(false)
  const [editingField, setEditingField] = useState<FieldConfig | null>(null)
  const [editingLoop, setEditingLoop] = useState<LoopConfig | null>(null)

  // 初始化表单和字段配置
  React.useEffect(() => {
    if (rule) {
      form.setFieldsValue({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        count: rule.count
      })
      
      // 解析现有模板中的字段和循环
      parseExistingTemplate(rule.template)
    }
  }, [rule, form])

  // 解析现有模板
  const parseExistingTemplate = (template: any) => {
    const parsedFields: FieldConfig[] = []
    const parsedLoops: LoopConfig[] = []
    
    Object.entries(template).forEach(([key, value]) => {
      if (key.startsWith('#')) {
        // 这是一个循环配置
        const loopType = key.substring(1) as 'for' | 'each' | 'nested'
        if (loopType === 'for' || loopType === 'each') {
          parsedLoops.push({
            id: Date.now().toString() + Math.random(),
            type: loopType,
            params: loopType === 'for' ? 
              { start: (value as any).start, end: (value as any).end, step: (value as any).step } :
              { array: (value as any).array },
            template: [] // 简化处理，暂不解析嵌套模板
          })
        }
      } else if (typeof value === 'string' && value.includes('{{')) {
        // 这是一个动态字段
        const match = value.match(/\{\{([^(]+)\(([^)]*)\)\}\}/)
        if (match) {
          const [, funcName, paramsStr] = match
          const params: any = {}
          
          // 简单解析参数
          if (paramsStr) {
            const paramValues = paramsStr.split(',').map(p => p.trim().replace(/"/g, ''))
            const generatorConfig = FIELD_GENERATORS[funcName as keyof typeof FIELD_GENERATORS]
            if (generatorConfig) {
              generatorConfig.params.forEach((param, index) => {
                if (paramValues[index] !== undefined) {
                  params[param.name] = param.type === 'number' ? 
                    Number(paramValues[index]) : paramValues[index]
                }
              })
            }
          }
          
          parsedFields.push({
            id: Date.now().toString() + Math.random(),
            name: key,
            type: 'string',
            generator: funcName,
            params
          })
        }
      } else {
        // 这是一个静态字段
        parsedFields.push({
          id: Date.now().toString() + Math.random(),
          name: key,
          type: typeof value,
          generator: 'static',
          params: { value }
        })
      }
    })
    
    setFields(parsedFields)
    setLoops(parsedLoops)
  }

  // 添加字段
  const addField = useCallback((field: FieldConfig) => {
    setFields(prev => [...prev, { ...field, id: Date.now().toString() }])
    setShowFieldModal(false)
    setEditingField(null)
  }, [])

  // 删除字段
  const removeField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id))
  }, [])

  // 添加循环
  const addLoop = useCallback((loop: LoopConfig) => {
    setLoops(prev => [...prev, { ...loop, id: Date.now().toString() }])
    setShowLoopModal(false)
    setEditingLoop(null)
  }, [])

  // 删除循环
  const removeLoop = useCallback((id: string) => {
    setLoops(prev => prev.filter(l => l.id !== id))
  }, [])

  // 生成JSON模板
  const generateTemplate = useCallback(() => {
    const template: any = {}
    
    // 添加基础字段
    fields.forEach(field => {
      if (field.generator === 'static') {
        template[field.name] = field.params.value
      } else if (field.generator === 'increment') {
        template[field.name] = `{{$index + ${field.params.start || 1}}}`
      } else if (field.generator === 'objectField') {
        template[field.name] = `{{$obj.${field.params.fieldName || 'name'}}}`
      } else if (field.generator === 'rangeValue') {
        template[field.name] = '{{$range}}'
      } else if (field.generator === 'template') {
        template[field.name] = field.params.template || ''
      } else {
        const params = Object.values(field.params).filter(v => v !== undefined && v !== '')
        const paramStr = params.length > 0 ? params.map(p => 
          typeof p === 'string' ? `"${p}"` : p
        ).join(', ') : ''
        template[field.name] = `{{${field.generator}(${paramStr})}}`
      }
    })
    
    // 添加循环
    loops.forEach(loop => {
      const loopTemplate: any = {}
      loop.template.forEach(field => {
        if (field.generator === 'static') {
          loopTemplate[field.name] = field.params.value
        } else if (field.generator === 'increment') {
          loopTemplate[field.name] = `{{$index + ${field.params.start || 1}}}`
        } else if (field.generator === 'objectField') {
          loopTemplate[field.name] = `{{$obj.${field.params.fieldName || 'name'}}}`
        } else if (field.generator === 'rangeValue') {
          loopTemplate[field.name] = '{{$range}}'
        } else if (field.generator === 'template') {
          loopTemplate[field.name] = field.params.template || ''
        } else {
          const params = Object.values(field.params).filter(v => v !== undefined && v !== '')
          const paramStr = params.length > 0 ? params.map(p => 
            typeof p === 'string' ? `"${p}"` : p
          ).join(', ') : ''
          loopTemplate[field.name] = `{{${field.generator}(${paramStr})}}`
        }
      })
      
      if (loop.type === 'for') {
        template[`#${loop.type}`] = {
          ...loop.params,
          template: loopTemplate
        }
      } else if (loop.type === 'each') {
        template[`#${loop.type}`] = {
          array: loop.params.array,
          template: loopTemplate
        }
      } else if (loop.type === 'cross') {
        // 交叉循环：生成嵌套循环结构
        template['#nested'] = {
          loops: [
            {
              type: 'array',
              variable: '$obj',
              array: loop.params.objectList
            },
            {
              type: 'range',
              variable: '$range',
              start: loop.params.rangeStart,
              end: loop.params.rangeEnd,
              step: loop.params.rangeStep
            }
          ],
          template: loopTemplate
        }
      }
    })
    
    return template
  }, [fields, loops])

  // 生成规则
  const generateRule = useCallback(() => {
    const values = form.getFieldsValue()
    const template = generateTemplate()
    
    const rule: Rule = {
      id: values.id || `rule-${Date.now()}`,
      name: values.name || '可视化规则',
      description: values.description || '通过可视化编辑器创建的规则',
      template,
      count: values.count || 10
    }
    
    onChange(rule)
    message.success('规则生成成功！')
  }, [form, generateTemplate, onChange])

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>可视化规则编辑器</Title>
          <Text type="secondary">
            通过拖拽和配置的方式创建JSON生成规则，无需编写代码
          </Text>
        </div>
        <Popover 
          content={<VisualGuide />} 
          title="使用指南" 
          trigger="click"
          placement="leftTop"
          overlayStyle={{ width: 600, maxHeight: 500, overflow: 'auto' }}
        >
          <Button icon={<QuestionCircleOutlined />}>使用指南</Button>
        </Popover>
      </div>
      
      <Divider />
      
      {/* 基本信息 */}
      <Card title="基本信息" style={{ marginBottom: 16 }}>
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
              <Form.Item label="生成数量" name="count">
                <InputNumber min={1} max={10000} placeholder="10" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="规则描述" name="description">
            <Input.TextArea rows={2} placeholder="请输入规则描述" />
          </Form.Item>
        </Form>
      </Card>
      
      {/* 字段配置 */}
      <Card 
        title="字段配置" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setShowFieldModal(true)}
          >
            添加字段
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        {fields.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无字段，点击上方按钮添加字段
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            {fields.map(field => (
              <Card 
                key={field.id}
                size="small"
                style={{ border: '1px dashed #d9d9d9' }}
                bodyStyle={{ padding: '12px' }}
              >
                <Row align="middle" justify="space-between">
                  <Col>
                    <Space>
                      <DragOutlined style={{ color: '#999' }} />
                      <Tag color="blue">{field.name}</Tag>
                      <Tag>{FIELD_GENERATORS[field.generator as keyof typeof FIELD_GENERATORS]?.label}</Tag>
                      {Object.keys(field.params).length > 0 && (
                        <Popover 
                          content={
                            <div>
                              {Object.entries(field.params).map(([key, value]) => (
                                <div key={key}>
                                  <Text strong>{key}:</Text> {JSON.stringify(value)}
                                </div>
                              ))}
                            </div>
                          }
                          title="参数配置"
                        >
                          <InfoCircleOutlined style={{ color: '#1890ff' }} />
                        </Popover>
                      )}
                    </Space>
                  </Col>
                  <Col>
                    <Space>
                      <Button 
                        size="small" 
                        icon={<SettingOutlined />}
                        onClick={() => {
                          setEditingField(field)
                          setShowFieldModal(true)
                        }}
                      />
                      <Button 
                        size="small" 
                        danger 
                        icon={<DeleteOutlined />}
                        onClick={() => removeField(field.id)}
                      />
                    </Space>
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        )}
      </Card>
      
      {/* 循环配置 */}
      <Card 
        title="循环配置" 
        extra={
          <Button 
            type="dashed" 
            icon={<PlusOutlined />}
            onClick={() => setShowLoopModal(true)}
          >
            添加循环
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        {loops.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无循环，点击上方按钮添加循环逻辑
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            {loops.map(loop => (
              <Card 
                key={loop.id}
                size="small"
                style={{ border: '1px dashed #52c41a' }}
                bodyStyle={{ padding: '12px' }}
              >
                <Row align="middle" justify="space-between">
                  <Col>
                    <Space>
                      <Tag color="green">{LOOP_TYPES[loop.type as keyof typeof LOOP_TYPES]?.label}</Tag>
                      <Text type="secondary">包含 {loop.template.length} 个字段</Text>
                    </Space>
                  </Col>
                  <Col>
                    <Space>
                      <Button 
                        size="small" 
                        icon={<SettingOutlined />}
                        onClick={() => {
                          setEditingLoop(loop)
                          setShowLoopModal(true)
                        }}
                      />
                      <Button 
                        size="small" 
                        danger 
                        icon={<DeleteOutlined />}
                        onClick={() => removeLoop(loop.id)}
                      />
                    </Space>
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        )}
      </Card>
      
      {/* 生成按钮 */}
      <div style={{ textAlign: 'center' }}>
        <Button type="primary" size="large" onClick={generateRule}>
          生成规则
        </Button>
      </div>
      
      {/* 字段配置模态框 */}
      <FieldConfigModal 
        visible={showFieldModal}
        field={editingField}
        onOk={addField}
        onCancel={() => {
          setShowFieldModal(false)
          setEditingField(null)
        }}
      />
      
      {/* 循环配置模态框 */}
      <LoopConfigModal 
        visible={showLoopModal}
        loop={editingLoop}
        onOk={addLoop}
        onCancel={() => {
          setShowLoopModal(false)
          setEditingLoop(null)
        }}
      />
    </div>
  )
}

// 字段配置模态框组件
interface FieldConfigModalProps {
  visible: boolean
  field?: FieldConfig | null
  onOk: (field: FieldConfig) => void
  onCancel: () => void
}

const FieldConfigModal: React.FC<FieldConfigModalProps> = ({
  visible,
  field,
  onOk,
  onCancel
}) => {
  const [form] = Form.useForm()
  const [selectedGenerator, setSelectedGenerator] = useState<string>('')
  
  React.useEffect(() => {
    if (visible) {
      if (field) {
        form.setFieldsValue(field)
        setSelectedGenerator(field.generator)
      } else {
        form.resetFields()
        setSelectedGenerator('')
      }
    }
  }, [visible, field, form])
  
  const handleOk = () => {
    form.validateFields().then(values => {
      onOk({
        id: field?.id || '',
        name: values.name,
        type: values.type,
        generator: values.generator,
        params: values.params || {}
      })
      form.resetFields()
    })
  }
  
  const generatorConfig = FIELD_GENERATORS[selectedGenerator as keyof typeof FIELD_GENERATORS]
  
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
              <Input placeholder="如：name, age, email" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="字段类型" name="type">
              <Select placeholder="选择字段类型">
                <Option value="string">字符串</Option>
                <Option value="number">数字</Option>
                <Option value="boolean">布尔值</Option>
                <Option value="array">数组</Option>
                <Option value="object">对象</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item 
          label="生成器" 
          name="generator" 
          rules={[{ required: true, message: '请选择生成器' }]}
        >
          <Select 
            placeholder="选择数据生成方式" 
            onChange={setSelectedGenerator}
          >
            {Object.entries(FIELD_GENERATORS).map(([key, config]) => (
              <Option key={key} value={key}>{config.label}</Option>
            ))}
          </Select>
        </Form.Item>
        
        {generatorConfig && generatorConfig.params.length > 0 && (
          <Card title="参数配置" size="small">
            {selectedGenerator === 'template' && (
              <Card 
                size="small" 
                style={{ marginBottom: 16, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}
              >
                <Text strong style={{ color: '#52c41a' }}>模板字符串规则说明：</Text>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">• 使用双花括号包裹变量名，如：{`{{name}}`}</Text><br/>
                  <Text type="secondary">• 循环变量：{'{{$index}}'} - 当前循环索引</Text><br/>
                  <Text type="secondary">• 对象字段：{'{{$obj.fieldName}}'} - 访问对象属性</Text><br/>
                  <Text type="secondary">• 范围值：{'{{$range}}'} - 当前范围循环值</Text><br/>
                  <Text type="secondary">• 示例："用户{'{{$index}}'}-{'{{$obj.name}}'}-编号{'{{$range}}'}"</Text>
                </div>
              </Card>
            )}
            {generatorConfig.params.map(param => (
              <Form.Item 
                key={param.name}
                label={param.name}
                name={['params', param.name]}
                initialValue={param.default}
              >
                {param.type === 'number' ? (
                  <InputNumber style={{ width: '100%' }} />
                ) : param.type === 'array' ? (
                  <Select mode="tags" placeholder="输入选项，按回车添加" />
                ) : selectedGenerator === 'template' ? (
                  <Input.TextArea 
                    rows={3} 
                    placeholder="请输入模板字符串，如：用户{$index}-{$obj.name}-编号{$range}"
                  />
                ) : (
                  <Input />
                )}
              </Form.Item>
            ))}
          </Card>
        )}
      </Form>
    </Modal>
  )
}

// 循环配置模态框组件
interface LoopConfigModalProps {
  visible: boolean
  loop?: LoopConfig | null
  onOk: (loop: LoopConfig) => void
  onCancel: () => void
}

const LoopConfigModal: React.FC<LoopConfigModalProps> = ({
  visible,
  loop,
  onOk,
  onCancel
}) => {
  const [form] = Form.useForm()
  const [selectedType, setSelectedType] = useState<string>('')
  const [templateFields, setTemplateFields] = useState<FieldConfig[]>([])
  
  React.useEffect(() => {
    if (visible) {
      if (loop) {
        form.setFieldsValue(loop)
        setSelectedType(loop.type)
        setTemplateFields(loop.template)
      } else {
        form.resetFields()
        setSelectedType('')
        setTemplateFields([])
      }
    }
  }, [visible, loop, form])
  
  const handleOk = () => {
    form.validateFields().then(values => {
      onOk({
        id: loop?.id || '',
        type: values.type,
        params: values.params || {},
        template: templateFields
      })
      form.resetFields()
      setTemplateFields([])
    })
  }
  
  const loopConfig = LOOP_TYPES[selectedType as keyof typeof LOOP_TYPES]
  
  return (
    <Modal
      title={loop ? '编辑循环' : '添加循环'}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      width={800}
    >
      <Form form={form} layout="vertical">
        <Form.Item 
          label="循环类型" 
          name="type" 
          rules={[{ required: true, message: '请选择循环类型' }]}
        >
          <Select 
            placeholder="选择循环类型" 
            onChange={setSelectedType}
          >
            {Object.entries(LOOP_TYPES).map(([key, config]) => (
              <Option key={key} value={key}>{config.label}</Option>
            ))}
          </Select>
        </Form.Item>
        
        {loopConfig && loopConfig.params.length > 0 && (
          <Card title="循环参数" size="small" style={{ marginBottom: 16 }}>
            {loopConfig.params.map(param => (
              <Form.Item 
                key={param.name}
                label={param.name}
                name={['params', param.name]}
                initialValue={param.default}
              >
                {param.type === 'number' ? (
                  <InputNumber style={{ width: '100%' }} />
                ) : param.type === 'array' ? (
                  <Select mode="tags" placeholder="输入数组项，按回车添加" />
                ) : (
                  <Input />
                )}
              </Form.Item>
            ))}
          </Card>
        )}
        
        <Card title="循环模板字段" size="small">
          <div style={{ marginBottom: 16 }}>
            <Button 
              type="dashed" 
              icon={<PlusOutlined />}
              onClick={() => {
                const newField: FieldConfig = {
                  id: Date.now().toString(),
                  name: `field_${templateFields.length + 1}`,
                  type: 'string',
                  generator: 'randomString',
                  params: { length: 8 }
                }
                setTemplateFields(prev => [...prev, newField])
              }}
            >
              添加模板字段
            </Button>
          </div>
          
          {templateFields.map((field, index) => (
            <Card 
              key={field.id}
              size="small"
              style={{ marginBottom: 8, border: '1px dashed #d9d9d9' }}
              bodyStyle={{ padding: '8px' }}
            >
              <Row align="middle" gutter={8}>
                <Col span={6}>
                  <Input 
                    placeholder="字段名" 
                    value={field.name}
                    onChange={e => {
                      const newFields = [...templateFields]
                      newFields[index].name = e.target.value
                      setTemplateFields(newFields)
                    }}
                  />
                </Col>
                <Col span={6}>
                  <Select 
                    placeholder="生成器" 
                    value={field.generator}
                    onChange={value => {
                      const newFields = [...templateFields]
                      newFields[index].generator = value
                      setTemplateFields(newFields)
                    }}
                  >
                    {Object.entries(FIELD_GENERATORS).map(([key, config]) => (
                      <Option key={key} value={key}>{config.label}</Option>
                    ))}
                  </Select>
                </Col>
                <Col span={10}>
                  <Text type="secondary">参数配置...</Text>
                </Col>
                <Col span={2}>
                  <Button 
                    size="small" 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      setTemplateFields(prev => prev.filter(f => f.id !== field.id))
                    }}
                  />
                </Col>
              </Row>
            </Card>
          ))}
        </Card>
      </Form>
    </Modal>
  )
}

export default VisualRuleBuilder