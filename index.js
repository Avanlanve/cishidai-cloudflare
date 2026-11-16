// 最小 Worker：每个 HTTP 请求都返回一段文本。
// 修改 fetch 处理器即可实现路由、接口，或通过 env 读取已配置的绑定。
export default {
  async fetch(request, env) {
    return new Response("Hello world");
  },
};
