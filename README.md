# 我们的账本

两人共用的记账 PWA：多币种记账（CNY / SGD / GBP，自动按汇率折算成人民币汇总）、Supabase 云端实时同步、一键导出 Markdown 备份。

## 首次搭建步骤

### 1. 安装依赖并本地运行

```bash
npm install
npm run dev
```

打开 http://localhost:3000，手机浏览器访问局域网地址后可以"添加到主屏幕"当 App 用。

### 2. 初始化 Supabase 数据库

`.env.local` 已经配置好 Supabase 的 URL 和 Key。接下来去 [Supabase 控制台](https://supabase.com) 打开你的项目：

1. 左侧 **SQL Editor** → New query，粘贴并执行 [`supabase/schema.sql`](supabase/schema.sql) 里的建表 + RLS 语句
2. 在 App 里，两人各自打开 `/login` 页面，用邮箱+密码 **注册** 一个账号（如果 Supabase 项目开启了邮箱确认，需要先去邮箱点确认链接）
3. 回到 Supabase 控制台 **Authentication → Users**，复制两个用户的 UUID
4. 回到 **SQL Editor**，执行（把占位符换成实际值）：

   ```sql
   insert into ledgers (name, base_currency) values ('我们的账本', 'CNY')
   returning id;
   -- 记下返回的 id，作为下面的 <ledger-id>

   insert into ledger_members (ledger_id, user_id, display_name) values
     ('<ledger-id>', '<user-1-uuid>', '你的称呼'),
     ('<ledger-id>', '<user-2-uuid>', '对方的称呼');
   ```

5. 两人重新登录 App，首页应该能看到账本数据了（初始为空）

### 3. 日常使用

- **记一笔**：底部导航"记一笔"，选支出/收入、币种、分类，非人民币会自动按当天汇率折算
- **首页**：本月收支汇总、支出分类占比，双方记账实时同步显示
- **明细**：所有交易按时间倒序列出，标注谁记的
- **导出**：选范围（本月/本季度/全部）生成 Markdown 文件下载，可以直接丢给 AI 分析消费情况，也建议定期导出存本地做备份。首页超过 30 天没导出会有提醒条

## 技术栈

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase（Postgres + Auth + Realtime）
- 汇率数据来自 [Frankfurter](https://www.frankfurter.app/)（免费、无需 key），首次查询会缓存到 `exchange_rates` 表

## 目录结构

```
app/
  page.tsx                  首页汇总
  login/page.tsx            登录/注册
  transactions/page.tsx     交易明细
  transactions/new/page.tsx 记一笔
  export/page.tsx           导出备份
  components/                NavBar、备份提醒条
lib/
  supabase.ts                Supabase client
  AuthProvider.tsx           登录状态 + 账本 id 的 Context
  exchangeRate.ts             汇率查询/缓存
  exportMarkdown.ts           生成导出用的 Markdown
  reminder.ts                 备份提醒的本地状态
  useTransactions.ts          交易数据查询 + 实时订阅
  useMembers.ts                账本成员名称查询
supabase/schema.sql            数据库建表 + RLS 脚本
```
