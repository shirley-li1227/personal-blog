请创建一个 Node.js + Express 后端项目：
1. 初始化项目，安装 express、wrangler（Pages）、better-sqlite3（本地）、jsonwebtoken、bcryptjs 等依赖；数据库使用 Cloudflare D1（SQLite）
2. 创建基本的项目结构：src/routes（路由）、src/controllers（控制器）、src/models（数据模型）、src/middleware（中间件）、src/config（配置）
3. 配置数据库连接

根据 database.md 中的设计，创建数据库表的 SQL 语句。然后创建一个初始化脚本，自动创建这些表。

实现用户注册和登录功能：
注册接口（POST /api/auth/register）：
- 接收 username、email、password
- 验证参数（用户名 3-20 字符，邮箱格式正确，密码至少 6 位）
- 检查用户名和邮箱是否已存在
- 密码用 bcrypt 加密
- 保存到数据库
- 返回成功信息
登录接口（POST /api/auth/login）：
- 接收 username、password
- 验证用户是否存在
- 验证密码是否正确
- 生成 JWT token（有效期 7 天）
- 返回 token 和用户信息

实现文章的增删改查功能：
创建文章（POST /api/posts）：
- 需要登录（验证 JWT token）
- 接收 title、content、category、tags、cover
- author_id 从 token 中获取
- 保存到数据库
- 返回文章信息
获取文章列表（GET /api/posts）：
- 支持分页（page、pageSize）
- 支持分类筛选（category）
- 支持搜索（keyword，搜索标题和内容）
- 返回文章列表和总数
获取文章详情（GET /api/posts/:id）：
- 返回文章详情
- 浏览次数 +1
更新文章（PUT /api/posts/:id）：
- 需要登录
- 只能更新自己的文章
- 更新指定字段
删除文章（DELETE /api/posts/:id）：
- 需要登录
- 只能删除自己的文章

创建 React + TypeScript + Vite 前端项目，安装 react-router-dom、axios、react-markdown 等依赖。配置路由：
- / 首页（文章列表）
- /post/:id 文章详情
- /write 写文章（需要登录）
- /profile 个人中心（需要登录）
- /login 登录
- /register 注册

实现用户认证功能：
1. 创建 AuthContext，管理登录状态和用户信息
2. Token 存储在 localStorage
3. 封装 axios，自动在请求头添加 token
4. 创建 ProtectedRoute 组件，保护需要登录的页面
5. 实现登录和注册页面

实现首页文章列表：
1. 获取文章列表，显示标题、封面、分类、作者、时间
2. 支持分页，每页 10 条
3. 支持分类筛选（顶部分类标签）
4. 支持搜索（搜索框）
5. 点击文章跳转到详情页

实现文章详情页：
1. 根据 ID 获取文章详情
2. 使用 react-markdown 渲染文章内容
3. 显示作者信息、发布时间、浏览次数
4. 如果是自己的文章，显示编辑和删除按钮

实现写文章页：
1. 使用之前做的 Markdown 编辑器
2. 输入标题、选择分类、添加标签、上传封面
3. 左侧编辑，右侧实时预览
4. 保存按钮，调用创建文章接口
5. 如果是编辑模式，加载已有文章数据

