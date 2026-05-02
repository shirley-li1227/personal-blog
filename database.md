# 问答社区数据库设计

（物理表结构以仓库内 `migrations/0001_init.sql` 为准，以下为字段说明。）


## 用户表（users）
- id、username、email、password、avatar
- created_at

## 文章表(article)
- id、title、content（Markdown）
- cover (封面图URL)
- category(分类)
- tags: 标签（JSON 数组）
- author_id (作者ID,外键关联 users)
- views: 浏览次数
- created_at、updated_at

## 分类(category)
- id、name(分类名称)、description(分类描述)



