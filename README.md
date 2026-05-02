# iniscard

此模板提供了一个最小化的设置，使 React 在 Vite 中运行，并包含 HMR（热模块替换）和一些 ESLint 规则。

目前，有两个官方插件可用：

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) 使用 [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) 使用 [SWC](https://swc.rs/)

## React 编译器

由于对开发和构建性能的影响，此模板未启用 React 编译器。要添加它，请参阅 [此文档](https://react.dev/learn/react-compiler/installation)。

## 扩展 ESLint 配置

如果您正在开发生产应用，我们建议使用启用了类型感知 lint 规则的 TypeScript。查看 [TS 模板](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) 了解如何在项目中集成 TypeScript 和 [`typescript-eslint`](https://typescript-eslint.io)。

## 项目部署与打包

### 打包方法

1. **安装依赖**
   ```bash
   npm install
   ```

2. **构建项目**
   ```bash
   npm run build
   ```
   构建完成后，静态文件会生成在 `dist` 目录中。

### 部署方法

#### 1. 静态网站托管

将 `dist` 目录中的所有文件部署到任何静态网站托管服务，例如：

- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [GitHub Pages](https://pages.github.com/)
- [AWS S3](https://aws.amazon.com/s3/)
- [Cloudflare Pages](https://pages.cloudflare.com/)

#### 2. 部署到服务器

1. 将 `dist` 目录上传到服务器
2. 配置 Nginx 或 Apache 等 web 服务器，将根目录指向 `dist` 目录
3. 重启 web 服务器