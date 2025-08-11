import React, { useState, useMemo } from 'react'
import { Table, Card, Tabs, Statistic, Row, Col, Pagination, Switch, Space } from 'antd'
import { FileTextOutlined, TableOutlined, BarChartOutlined } from '@ant-design/icons'
import Editor from '@monaco-editor/react'
import { JsonPreviewProps } from '../types'
import { formatFileSize } from '../utils'

const { TabPane } = Tabs

export const JsonPreview: React.FC<JsonPreviewProps> = ({
  data,
  loading = false,
  pageSize = 50,
  showMetadata = false
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'json' | 'table'>('table')
  const [prettify, setPrettify] = useState(true)

  // 分页数据
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return data.slice(start, end)
  }, [data, currentPage, pageSize])

  // 表格列配置
  const tableColumns = useMemo(() => {
    if (data.length === 0) return []

    // 获取所有可能的字段
    const allFields = new Set<string>()
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => allFields.add(key))
      }
    })

    return Array.from(allFields).map(field => ({
      title: field,
      dataIndex: field,
      key: field,
      width: 150,
      ellipsis: true,
      render: (value: any) => {
        if (value === null || value === undefined) {
          return <span style={{ color: '#999' }}>null</span>
        }
        if (typeof value === 'object') {
          return <span style={{ color: '#666' }}>{JSON.stringify(value)}</span>
        }
        return String(value)
      }
    }))
  }, [data])

  // 统计信息
  const statistics = useMemo(() => {
    if (data.length === 0) return null

    const totalSize = JSON.stringify(data).length
    const avgSize = totalSize / data.length
    
    // 字段统计
    const fieldStats: Record<string, { count: number; types: Set<string> }> = {}
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.entries(item).forEach(([key, value]) => {
          if (!fieldStats[key]) {
            fieldStats[key] = { count: 0, types: new Set() }
          }
          fieldStats[key].count++
          fieldStats[key].types.add(typeof value)
        })
      }
    })

    return {
      totalCount: data.length,
      totalSize,
      avgSize,
      fieldCount: Object.keys(fieldStats).length,
      fieldStats
    }
  }, [data])

  // JSON字符串
  const jsonString = useMemo(() => {
    if (viewMode !== 'json') return ''
    return prettify 
      ? JSON.stringify(paginatedData, null, 2)
      : JSON.stringify(paginatedData)
  }, [paginatedData, viewMode, prettify])

  if (data.length === 0) {
    return (
      <div style={{ 
        height: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#999'
      }}>
        暂无数据
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {showMetadata && statistics && (
        <Card size="small" style={{ marginBottom: '16px' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="总记录数"
                value={statistics.totalCount}
                prefix={<FileTextOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="数据大小"
                value={formatFileSize(statistics.totalSize)}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均大小"
                value={formatFileSize(statistics.avgSize)}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="字段数量"
                value={statistics.fieldCount}
                prefix={<TableOutlined />}
              />
            </Col>
          </Row>
        </Card>
      )}

      <Tabs
        activeKey={viewMode}
        onChange={(key) => setViewMode(key as 'json' | 'table')}
        tabBarExtraContent={
          <Space>
            {viewMode === 'json' && (
              <Space>
                <span>格式化:</span>
                <Switch
                  checked={prettify}
                  onChange={setPrettify}
                  size="small"
                />
              </Space>
            )}
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={data.length}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
              }
              size="small"
            />
          </Space>
        }
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <TabPane
          tab={
            <span>
              <TableOutlined />
              表格视图
            </span>
          }
          key="table"
          style={{ height: '100%' }}
        >
          <Table
            columns={tableColumns}
            dataSource={paginatedData.map((item, index) => ({
              ...item,
              key: `${currentPage}-${index}`
            }))}
            pagination={false}
            loading={loading}
            scroll={{ x: 'max-content', y: 400 }}
            size="small"
            bordered
          />
        </TabPane>

        <TabPane
          tab={
            <span>
              <FileTextOutlined />
              JSON视图
            </span>
          }
          key="json"
          style={{ height: '100%' }}
        >
          <div style={{ height: '400px', border: '1px solid #d9d9d9' }}>
            <Editor
              language="json"
              value={jsonString}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 12,
                lineNumbers: 'on',
                folding: true,
                wordWrap: 'on'
              }}
            />
          </div>
        </TabPane>

        {showMetadata && statistics && (
          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                统计信息
              </span>
            }
            key="stats"
          >
            <Card title="字段统计" size="small">
              <Table
                columns={[
                  { title: '字段名', dataIndex: 'field', key: 'field' },
                  { title: '出现次数', dataIndex: 'count', key: 'count' },
                  { title: '覆盖率', dataIndex: 'coverage', key: 'coverage' },
                  { title: '数据类型', dataIndex: 'types', key: 'types' }
                ]}
                dataSource={Object.entries(statistics.fieldStats).map(([field, stats]) => ({
                  key: field,
                  field,
                  count: stats.count,
                  coverage: `${((stats.count / statistics.totalCount) * 100).toFixed(1)}%`,
                  types: Array.from(stats.types).join(', ')
                }))}
                pagination={false}
                size="small"
              />
            </Card>
          </TabPane>
        )}
      </Tabs>
    </div>
  )
}

export default JsonPreview