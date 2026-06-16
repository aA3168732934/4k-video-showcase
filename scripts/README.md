# Airtable → products.json 同步脚本

## 功能
从 Airtable 拉取数据，自动生成 `data/products.json`

## 准备
1. 在 Airtable 创建 Base，包含 Products 表
2. 字段设计见下文
3. 获取 Airtable API Key（https://airtable.com/account）
4. 获取 Base ID（在 Airtable URL 中，形如 appXXXXXXXXX）

## Airtable 字段设计
| 字段名 | 类型 | 必填 | 说明 |
|---|---|---|---|
| id | Auto number | 是 | 产品 ID |
| title_en | Single line text | 是 | 英文标题 |
| title_ar | Single line text | 是 | 阿拉伯文标题 |
| description_en | Long text | 否 | 英文描述 |
| description_ar | Long text | 否 | 阿拉伯文描述 |
| thumbnail | URL | 是 | 缩略图链接 |
| preview_video | URL | 否 | 预览视频链接 |
| price | Number | 是 | 价格 |
| currency | Single select | 否 | 货币 |
| duration | Single line text | 否 | 时长，如 00:45 |
| resolution | Single line text | 否 | 分辨率 |
| featured | Checkbox | 否 | 是否精选 |
| in_stock | Checkbox | 是 | 是否在售 |

## 使用方法

### 本地运行
```bash
# 安装依赖
pip install requests

# 设置环境变量
export AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
export AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
export AIRTABLE_TABLE_NAME=Products

# 运行
python scripts/sync.py
```

### GitHub Actions / Gitee Go 自动运行
脚本会读取环境变量，自动生成 products.json

## 输出示例
脚本会生成符合格式的 `data/products.json`，网站会自动读取新数据。
