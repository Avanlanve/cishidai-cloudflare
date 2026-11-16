# cishidai-cloudflare

一个基于 Cloudflare Workers 静态资产（Static Assets）的最小站点，通过 Workers Builds 连接 Git 仓库自动部署。

## 目录结构

```
cishidai-cloudflare/
├── wrangler.jsonc       # Worker 配置，assets.directory 指向 ./public
├── .gitignore
├── README.md
└── public/
    └── index.html       # 站点首页
```

`wrangler.jsonc` 是 assets-only Worker（纯静态站点），因此不需要 `main` 字段：

```jsonc
{
  "name": "cishidai-cloudflare",
  "compatibility_date": "2026-11-14",
  "assets": {
    "directory": "./public"
  }
}
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

## 曾经踩到的问题

`assets.directory` 指向 `./public`，但仓库里没有提交这个目录，部署会直接失败：

```
[ERROR] The directory specified by the "assets.directory" field in your configuration file does not exist:
  /opt/buildhome/repo/public
```

要点：

1. `public/` 目录**必须至少包含一个文件**。Git 不追踪空目录，只在本机建空文件夹再推送无效。
2. 目录名与大小写要与 `assets.directory` 完全一致；构建环境的工作目录是仓库根目录。
3. 构建日志里的 `No build output detected to cache. Skipping.` 与 `No dependencies detected to cache. Skipping.` 是纯静态、无依赖项目的正常提示，不是错误。
4. `npm warn exec ... wrangler@4.x` 表示构建环境每次临时安装 Wrangler，属正常行为；如需固定版本，可把 `wrangler` 加入 `devDependencies` 并附 `package-lock.json`。

## 后续扩展

- 自定义 404：在 `assets` 中加入 `"not_found_handling": "404-page"`，并创建 `public/404.html`。
- 增加后端接口：添加 `main`（如 `src/index.js`）导出 `fetch` 处理器，并用 `run_worker_first` 指定哪些路径优先走 Worker。
- 存储与能力：按需配置 KV、D1、R2 等绑定，敏感值用 `npx wrangler secret put <KEY>` 写入，不要放进 `vars`。
