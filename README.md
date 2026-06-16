# 4K Video Showcase - 部署说明

## 项目结构

```
4k-showcase/
├── index.html              # 主页面（自动读取 config 和 products）
├── style.css               # 样式
├── config.json             # 全局配置（WhatsApp、Pixel、品牌信息）
├── data/
│   └── products.json       # 产品数据
├── scripts/
│   └── sync.py             # Airtable 同步脚本（可选）
├── .gitee/
│   └── workflows/
│       └── sync.yml        # Gitee Go 自动化配置
└── README.md
```

## 快速开始

### 1. 修改配置
编辑 `config.json`，替换：
- `whatsapp_url` 你的 WhatsApp 链接
- `facebook.pixel_id` 你的 Pixel ID
- `site.name_en` 你的品牌英文名
- `site.name_ar` 你的品牌阿拉伯文名

### 2. 添加产品
编辑 `data/products.json`，每个产品包含：
- `id` 数字编号
- `title_en` `title_ar` 中英文标题
- `description_en` `description_ar` 中英文描述
- `thumbnail` 缩略图 URL
- `preview_video` 预览视频 URL（YouTube/Vimeo）
- `price` 价格
- `currency` 货币
- `duration` 时长
- `resolution` 分辨率
- `tags` 标签数组
- `featured` 是否精选
- `in_stock` 是否在售

### 3. 部署到 Gitee Pages
1. 把代码 push 到 Gitee 仓库
2. 进入仓库 → 服务 → Gitee Pages
3. 启动服务
4. 访问分配的域名

## 高级功能

### Airtable 同步（推荐）
- 把 Airtable 当作产品后台
- 修改 Airtable 数据 → 触发 Gitee Go → 自动更新网站

### 域名绑定
- 在 Gitee Pages 设置中绑定自己的域名
- DNS 解析到 Gitee 提供的 CNAME

## 关键技术

- **静态网站**：无后端，加载速度 1-2 秒
- **双语切换**：基于 localStorage，刷新保留
- **Facebook Pixel**：追踪 PageView、Lead、Contact 事件
- **响应式**：移动端友好（中东 90% 手机访问）
- **SEO 友好**：可被 Facebook 抓取预览
