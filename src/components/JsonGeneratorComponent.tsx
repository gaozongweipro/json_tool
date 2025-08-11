import React, { useState, useCallback, useMemo } from 'react'
import { Layout, Card, Button, Space, message, Spin, Tabs } from 'antd'
import { PlayCircleOutlined, DownloadOutlined, ClearOutlined, CodeOutlined, AppstoreOutlined, ToolOutlined } from '@ant-design/icons'
import { JsonGeneratorComponentProps, GenerationRule, GenerationResult } from '../types'
import { JsonGenerator } from '../core/JsonGenerator'
import { RuleEditor } from './RuleEditor'
import { JsonPreview } from './JsonPreview'
import { ExportPanel } from './ExportPanel'
import VisualRuleBuilder from './VisualRuleBuilder'
import BusinessRuleBuilder from './BusinessRuleBuilder'
import { createSampleRule } from '../utils'

const { Content, Sider } = Layout

export const JsonGeneratorComponent: React.FC<JsonGeneratorComponentProps> = ({
  initialRule,
  config = {},
  onGenerate,
  onExport,
  className,
  style
}) => {
  const [rule, setRule] = useState<GenerationRule>(
    initialRule || createSampleRule()
  )
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [siderCollapsed, setSiderCollapsed] = useState(false)

  // 创建生成器实例
  const generator = useMemo(() => new JsonGenerator(config), [config])

  // 生成JSON数据
  const handleGenerate = useCallback(async () => {
    if (!rule.template || rule.count <= 0) {
      message.error('请检查规则配置')
      return
    }

    setLoading(true)
    try {
      const result = await generator.generate(rule)
      setGenerationResult(result)
      message.success(`成功生成 ${result.data.length} 条数据`)
      onGenerate?.(result)
    } catch (error) {
      message.error(`生成失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }, [rule, generator, onGenerate])

  // 清空结果
  const handleClear = useCallback(() => {
    setGenerationResult(null)
  }, [])

  // 导出数据
  const handleExport = useCallback((options: any) => {
    if (!generationResult?.data) {
      message.error('没有可导出的数据')
      return
    }
    onExport?.(generationResult.data, options)
  }, [generationResult, onExport])

  return (
    <div className={className} style={style}>
      <Layout style={{ minHeight: '600px', background: '#f5f5f5' }}>
        <Sider
          width={1000}
          collapsible
          collapsed={siderCollapsed}
          onCollapse={setSiderCollapsed}
          style={{
            background: '#fff',
            borderRight: '1px solid #f0f0f0'
          }}
        >
          <div style={{ padding: '16px' }}>
            <Card
              title="规则配置"
              size="small"
              extra={
                <Space>
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={handleGenerate}
                    loading={loading}
                    disabled={!rule.template || rule.count <= 0}
                  >
                    生成
                  </Button>
                </Space>
              }
            >
              <Tabs
                defaultActiveKey="business"
                items={[
                  {
                    key: 'business',
                    label: (
                      <span>
                        <ToolOutlined />
                        业务数据生成
                      </span>
                    ),
                    children: (
                      <BusinessRuleBuilder
                        rule={rule}
                        onChange={setRule}
                      />
                    )
                  },
                  {
                    key: 'visual',
                    label: (
                      <span>
                        <AppstoreOutlined />
                        可视化编辑
                      </span>
                    ),
                    children: (
                      <VisualRuleBuilder
                        rule={rule}
                        onChange={setRule}
                      />
                    )
                  },
                  {
                    key: 'json',
                    label: (
                      <span>
                        <CodeOutlined />
                        JSON模板
                      </span>
                    ),
                    children: (
                      <RuleEditor
                        rule={rule}
                        onChange={setRule}
                      />
                    )
                  }
                ]}
              />
            </Card>
          </div>
        </Sider>

        <Content style={{ padding: '16px' }}>
          <Card
            title="数据预览"
            size="small"
            extra={
              <Space>
                {generationResult && (
                  <>
                    <ExportPanel
                      data={generationResult.data}
                      onExport={handleExport}
                    />
                    <Button
                      icon={<ClearOutlined />}
                      onClick={handleClear}
                    >
                      清空
                    </Button>
                  </>
                )}
              </Space>
            }
            style={{ height: '100%' }}
            styles={{ body: { height: 'calc(100% - 57px)', padding: 0 } }}
          >
            <Spin spinning={loading}>
              {generationResult ? (
                <JsonPreview
                  data={generationResult.data}
                  loading={loading}
                  showMetadata
                />
              ) : (
                <div
                  style={{
                    height: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: '16px'
                  }}
                >
                  点击"生成"按钮开始生成JSON数据
                </div>
              )}
            </Spin>
          </Card>
        </Content>
      </Layout>
    </div>
  )
}

export default JsonGeneratorComponent