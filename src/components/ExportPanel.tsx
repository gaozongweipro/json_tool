import React, { useState, useCallback } from 'react'
import { Button, Dropdown, Modal, Form, Input, Select, Switch, Space, InputNumber, message } from 'antd'
import { DownloadOutlined, SettingOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { ExportPanelProps, ExportOptions } from '../types'
import { exportToJson, exportToJsonl, exportToCsv, formatFileSize } from '../utils'

const { Option } = Select

export const ExportPanel: React.FC<ExportPanelProps> = ({
  data,
  onExport,
  disabled = false
}) => {
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    filename: 'data',
    compress: false,
    splitFiles: false,
    maxRecordsPerFile: 1000
  })

  // 快速导出菜单
  const quickExportItems: MenuProps['items'] = [
    {
      key: 'json',
      label: 'JSON格式',
      onClick: () => handleQuickExport('json')
    },
    {
      key: 'jsonl',
      label: 'JSONL格式',
      onClick: () => handleQuickExport('jsonl')
    },
    {
      key: 'csv',
      label: 'CSV格式',
      onClick: () => handleQuickExport('csv')
    },
    {
      type: 'divider'
    },
    {
      key: 'custom',
      label: '自定义导出...',
      icon: <SettingOutlined />,
      onClick: () => setModalVisible(true)
    }
  ]

  // 快速导出
  const handleQuickExport = useCallback((format: 'json' | 'jsonl' | 'csv') => {
    const options: ExportOptions = {
      format,
      filename: `data.${format === 'jsonl' ? 'jsonl' : format}`,
      compress: false,
      splitFiles: false
    }

    handleExport(options)
  }, [data])

  // 执行导出
  const handleExport = useCallback((options: ExportOptions) => {
    try {
      if (data.length === 0) {
        message.warning('没有可导出的数据')
        return
      }

      // 如果需要分割文件
      if (options.splitFiles && options.maxRecordsPerFile && data.length > options.maxRecordsPerFile) {
        const chunks = []
        for (let i = 0; i < data.length; i += options.maxRecordsPerFile) {
          chunks.push(data.slice(i, i + options.maxRecordsPerFile))
        }

        chunks.forEach((chunk, index) => {
          const filename = `${options.filename}_part${index + 1}.${options.format}`
          exportData(chunk, { ...options, filename })
        })

        message.success(`数据已分割为 ${chunks.length} 个文件导出`)
      } else {
        exportData(data, options)
        message.success('导出成功')
      }

      onExport(data, options)
    } catch (error) {
      message.error(`导出失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [data, onExport])

  // 实际导出数据
  const exportData = useCallback((exportData: any[], options: ExportOptions) => {
    switch (options.format) {
      case 'json':
        exportToJson(exportData, options.filename, true)
        break
      case 'jsonl':
        exportToJsonl(exportData, options.filename)
        break
      case 'csv':
        exportToCsv(exportData, options.filename)
        break
      default:
        throw new Error(`不支持的导出格式: ${options.format}`)
    }
  }, [])

  // 自定义导出
  const handleCustomExport = useCallback(() => {
    form.validateFields().then(values => {
      const options: ExportOptions = {
        ...exportOptions,
        ...values,
        filename: values.filename || 'data'
      }
      
      handleExport(options)
      setModalVisible(false)
    })
  }, [form, exportOptions])

  // 计算预估文件大小
  const estimatedSize = React.useMemo(() => {
    if (data.length === 0) return '0 Bytes'
    
    const sampleSize = JSON.stringify(data.slice(0, Math.min(10, data.length))).length
    const avgItemSize = sampleSize / Math.min(10, data.length)
    const totalSize = avgItemSize * data.length
    
    return formatFileSize(totalSize)
  }, [data])

  return (
    <>
      <Dropdown
        menu={{ items: quickExportItems }}
        disabled={disabled || data.length === 0}
        placement="bottomRight"
      >
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          disabled={disabled || data.length === 0}
        >
          导出数据
        </Button>
      </Dropdown>

      <Modal
        title="自定义导出"
        open={modalVisible}
        onOk={handleCustomExport}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={exportOptions}
          onValuesChange={(_, allValues) => setExportOptions({ ...exportOptions, ...allValues })}
        >
          <Form.Item
            name="format"
            label="导出格式"
            rules={[{ required: true, message: '请选择导出格式' }]}
          >
            <Select>
              <Option value="json">JSON - 标准JSON数组格式</Option>
              <Option value="jsonl">JSONL - 每行一个JSON对象</Option>
              <Option value="csv">CSV - 逗号分隔值格式</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="filename"
            label="文件名"
            rules={[{ required: true, message: '请输入文件名' }]}
          >
            <Input placeholder="不包含扩展名" />
          </Form.Item>

          <Form.Item name="splitFiles" valuePropName="checked">
            <Switch /> 分割大文件
          </Form.Item>

          {exportOptions.splitFiles && (
            <Form.Item
              name="maxRecordsPerFile"
              label="每个文件最大记录数"
              rules={[{ required: true, message: '请输入每个文件最大记录数' }]}
            >
              <InputNumber
                min={1}
                max={100000}
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}

          <div style={{ 
            background: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '4px',
            marginTop: '16px'
          }}>
            <Space direction="vertical" size="small">
              <div><strong>导出预览:</strong></div>
              <div>记录数量: {data.length.toLocaleString()} 条</div>
              <div>预估大小: {estimatedSize}</div>
              {exportOptions.splitFiles && exportOptions.maxRecordsPerFile && data.length > exportOptions.maxRecordsPerFile && (
                <div>将分割为: {Math.ceil(data.length / exportOptions.maxRecordsPerFile)} 个文件</div>
              )}
            </Space>
          </div>
        </Form>
      </Modal>
    </>
  )
}

export default ExportPanel