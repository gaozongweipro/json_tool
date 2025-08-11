import React from 'react'
import { Card, Steps, Typography, Space, Tag, Alert } from 'antd'
import {
  UserOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography
const { Step } = Steps

export const VisualGuide: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <Title level={3}>可视化编辑器使用指南</Title>
      
      <Alert
        message="提示"
        description="可视化编辑器让您无需编写代码即可创建复杂的JSON生成规则，适合非技术人员使用。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Steps
        direction="vertical"
        current={-1}
        items={[
          {
            title: '填写基本信息',
            description: (
              <div>
                <Paragraph>
                  首先填写规则的基本信息：
                </Paragraph>
                <ul>
                  <li><Text strong>规则名称：</Text>为您的规则起一个有意义的名字</li>
                  <li><Text strong>规则ID：</Text>系统会自动生成，也可以手动指定</li>
                  <li><Text strong>生成数量：</Text>指定要生成多少条JSON数据</li>
                  <li><Text strong>规则描述：</Text>简要说明这个规则的用途</li>
                </ul>
              </div>
            ),
            icon: <UserOutlined />
          },
          {
            title: '配置字段',
            description: (
              <div>
                <Paragraph>
                  添加您需要的JSON字段：
                </Paragraph>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>字段类型：</Text>
                    <Space>
                      <Tag color="blue">字符串</Tag>
                      <Tag color="green">数字</Tag>
                      <Tag color="orange">布尔值</Tag>
                      <Tag color="purple">数组</Tag>
                      <Tag color="red">对象</Tag>
                    </Space>
                  </div>
                  <div>
                    <Text strong>生成器类型：</Text>
                    <Space wrap>
                      <Tag>UUID</Tag>
                      <Tag>随机字符串</Tag>
                      <Tag>随机整数</Tag>
                      <Tag>随机小数</Tag>
                      <Tag>随机选择</Tag>
                      <Tag>随机日期</Tag>
                      <Tag>固定值</Tag>
                    </Space>
                  </div>
                </Space>
              </div>
            ),
            icon: <SettingOutlined />
          },
          {
            title: '设置循环（可选）',
            description: (
              <div>
                <Paragraph>
                  如果需要生成重复或关联的数据，可以添加循环：
                </Paragraph>
                <ul>
                  <li><Text strong>数值循环：</Text>按数值范围循环，如1到10</li>
                  <li><Text strong>数组遍历：</Text>遍历指定的数组，如部门列表</li>
                  <li><Text strong>嵌套循环：</Text>多层循环，生成复杂的层级数据</li>
                  <li><Text strong>交叉循环：</Text>对象列表与数值范围的交叉遍历，生成笛卡尔积数据</li>
                </ul>
                <Alert
                  message="循环示例"
                  description="比如要为每个部门生成3个员工，可以设置部门数组遍历 + 数值循环(1-3)；要生成传感器数据的交叉组合，可以使用交叉循环：传感器列表 × 数值范围"
                  type="success"
                  showIcon
                  style={{ marginTop: 8 }}
                />
              </div>
            ),
            icon: <PlayCircleOutlined />
          },
          {
            title: '生成规则',
            description: (
              <div>
                <Paragraph>
                  配置完成后，点击"生成规则"按钮：
                </Paragraph>
                <ul>
                  <li>系统会自动将您的配置转换为JSON模板</li>
                  <li>生成的规则会同步到JSON模板编辑器</li>
                  <li>您可以在两种编辑模式间自由切换</li>
                  <li>最后点击"生成数据"开始生成JSON</li>
                </ul>
              </div>
            ),
            icon: <CheckCircleOutlined />
          }
        ]}
      />
      
      <Card title="常用场景示例" style={{ marginTop: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>用户数据生成：</Text>
            <Text type="secondary">姓名(随机选择) + 年龄(随机整数) + 邮箱(随机字符串)</Text>
          </div>
          <div>
            <Text strong>订单数据生成：</Text>
            <Text type="secondary">订单ID(UUID) + 金额(随机小数) + 状态(随机选择)</Text>
          </div>
          <div>
            <Text strong>组织架构数据：</Text>
            <Text type="secondary">部门循环 + 员工循环，生成每个部门的员工列表</Text>
          </div>
          <div>
            <Text strong>产品目录数据：</Text>
            <Text type="secondary">分类循环 + 产品循环，生成分类下的产品信息</Text>
          </div>
          <div>
            <Text strong>传感器监测数据：</Text>
            <Text type="secondary">使用交叉循环，传感器列表 × 时间范围，生成所有传感器的监测记录</Text>
          </div>
          <div>
            <Text strong>设备配置数据：</Text>
            <Text type="secondary">设备类型列表 × 配置参数范围，生成设备的所有配置组合</Text>
          </div>
        </Space>
      </Card>
      
      <Card title="小贴士" style={{ marginTop: 16 }}>
        <ul>
          <li>可以随时在"JSON模板"和"可视化编辑"标签间切换</li>
          <li>复杂的嵌套结构建议使用JSON模板编辑器</li>
          <li>简单的数据生成推荐使用可视化编辑器</li>
          <li>生成的规则可以保存和复用</li>
        </ul>
      </Card>
    </div>
  )
}

export default VisualGuide