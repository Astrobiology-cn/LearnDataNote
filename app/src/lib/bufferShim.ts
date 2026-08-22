/* gray-matter 浏览器运行的最小 Buffer 垫片。
 * gray-matter@4 的解析路径只在 to-file.js 存 file.orig 时调用
 * Buffer.from(input)（其值仅被 stringify/read 等 Node 侧 API 使用），
 * 以及 utils.isBuffer 的类型判断——字符串直通即可满足。
 * 必须在 import 'gray-matter' 之前执行（ESM 按导入顺序求值）。 */
const g = globalThis as { Buffer?: unknown };
if (!g.Buffer) {
  g.Buffer = {
    from: (input: unknown) => input,
    isBuffer: () => false,
  };
}

export {};
