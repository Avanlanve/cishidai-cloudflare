# cishidai-cloudflare

一个基于 Cloudflare Workers 的最小 Worker（纯脚本，无静态资源目录），通过 Workers Builds 连接 Git 仓库自动部署。

## 目录结构

```
cishidai-cloudflare/
├── wrangler.jsonc   # Worker 配置
├── index.js         # Worker 入口，导出 fetch 处理器
├── .gitignore
└── README.md
```

`wrangler.jsonc` 只保留三个字段，`main` 指向仓库根目录的 `index.js`：

```jsonc
{
  "name": "cishidai-cloudflare",
  "main": "index.js",
  "compatibility_date": "2026-11-16"
}
```

`name` 必须与 Cloudflare 控制台里的 Worker 名一致，否则 Workers Builds 会拒绝构建。`main` 是相对仓库根目录的路径；若把脚本移到 `src/`，需同步改成 `src/index.js`。

入口脚本默认导出一个带 `fetch` 处理器的对象：

```js
export default {
  async fetch(request, env) {
    return new Response("Hello world");
  },
};
```

## 部署

Cloudflare 控制台 → Workers & Pages → 连接 Git 仓库，构建配置：

- 部署命令：`npx wrangler deploy`
- 构建命令：留空（本项目无构建步骤）
- 生产分支：`main`

部署成功后访问 `<worker-name>.<subdomain>.workers.dev`，或在控制台绑定自定义域名。

本地预览：

```bash
npx wrangler dev
# 打开 http://localhost:8787
```

## 为什么去掉 assets

原先配置含 `"assets": { "directory": "./public" }`，但仓库里没有 `public/` 目录，Wrangler 会直接终止部署：

```
[ERROR] The directory specified by the "assets.directory" field in your configuration file does not exist:
  /opt/buildhome/repo/public
```

两条修法：保留静态站就在 `public/` 放至少一个文件；改用纯 Worker 就删除 `assets`，并让 `main` 指向真实存在的脚本。本仓库采用后者，因此**不再需要 `public/` 目录**，而 `index.js` 必须存在于 `main` 指定的路径。Git 不追踪空目录，入口脚本文件同样不能省。

构建日志里的 `No build output detected to cache. Skipping.`、`No dependencies detected to cache. Skipping.` 与 `npm warn exec ... wrangler@4.x` 都是无构建步骤、无依赖项目的正常提示，不是错误。

## 后续扩展

- 需要静态资源：加回 `assets.directory`，并确保该目录至少有一个文件；可用 `run_worker_first` 指定哪些路径优先走 Worker。
- 需要存储与能力：按需配置 KV、D1、R2 等绑定；敏感值用 `npx wrangler secret put <KEY>` 写入，不要放进 `vars`。
- 需要定时任务：在 `index.js` 中增加 `scheduled()` 处理器，并在配置里加 `triggers.crons`。
