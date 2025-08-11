import React, { useState, useCallback } from 'react'
import { Form, Input, InputNumber, Card, Button, Space, Collapse, Select, message } from 'antd'
import { PlusOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import Editor from '@monaco-editor/react'
import { RuleEditorProps } from '../types'
import { RuleEngine } from '../core/RuleEngine'

const { Panel } = Collapse
const { Option } = Select
const { TextArea } = Input

export const RuleEditor: React.FC<RuleEditorProps> = ({
  rule,
  onChange,
  functions
}) => {
  const [form] = Form.useForm()
  const [templateError, setTemplateError] = useState<string | null>(null)
  const ruleEngine = new RuleEngine()
  const allFunctions = functions || ruleEngine.getAllFunctions()

  // 处理表单变化
  const handleFormChange = useCallback((changedFields: any, allFields: any) => {
    const newRule = {
      ...rule,
      ...allFields
    }
    onChange(newRule)
  }, [rule, onChange])

  // 处理模板变化
  const handleTemplateChange = useCallback((value: string | undefined) => {
    if (!value) return
    
    try {
      const template = JSON.parse(value)
      setTemplateError(null)
      onChange({
        ...rule,
        template
      })
    } catch (error) {
      setTemplateError(error instanceof Error ? error.message : '模板格式错误')
    }
  }, [rule, onChange])



  // 预览函数帮助
  const showFunctionHelp = useCallback(() => {
    const helpText = allFunctions.map(func => {
      const params = func.params.map(p => 
        `${p.name}${p.required ? '' : '?'}: ${p.type}${p.defaultValue !== undefined ? ` = ${p.defaultValue}` : ''}`
      ).join(', ')
      return `${func.name}(${params}) - ${func.description}`
    }).join('\n')
    
    message.info({
      content: (
        <div>
          <h4>可用函数:</h4>
          <pre style={{ fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}>
            {helpText}
          </pre>
        </div>
      ),
      duration: 0
    })
  }, [allFunctions])

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={rule}
      onValuesChange={handleFormChange}
      size="small"
    >
      <Form.Item
        name="name"
        label="规则名称"
        rules={[{ required: true, message: '请输入规则名称' }]}
      >
        <Input placeholder="输入规则名称" />
      </Form.Item>

      <Form.Item
        name="description"
        label="描述"
      >
        <TextArea rows={2} placeholder="输入规则描述（可选）" />
      </Form.Item>

      <Form.Item
        name="count"
        label="生成数量"
        rules={[{ required: true, message: '请输入生成数量' }]}
      >
        <InputNumber
          min={1}
          max={100000}
          style={{ width: '100%' }}
          placeholder="输入生成数量"
        />
      </Form.Item>

      <Collapse 
        size="small" 
        ghost
        items={[
          {
            key: "template",
            label: "JSON模板",
            extra: (
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={showFunctionHelp}
              >
                函数帮助
              </Button>
            ),
            children: (
              <>
                <div style={{ border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                  <Editor
                    height="300px"
                    language="json"
                    value={JSON.stringify(rule.template, null, 2)}
                    onChange={handleTemplateChange}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 12,
                      lineNumbers: 'on',
                      folding: true,
                      wordWrap: 'on'
                    }}
                  />
                </div>
                {templateError && (
                  <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                    {templateError}
                  </div>
                )}
              </>
            )
          },


        ]}
      />
    </Form>
  )
}

export default RuleEditor