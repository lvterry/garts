# 双 Option Artwork 生成与选择方案（含参数联动）

## 简要摘要
把首页“单预览”改为“同一次生成返回 2 个候选 artwork”，用户可点击任一候选进行选中；右侧参数面板始终展示“当前选中项”的参数；保存时只保存选中项到 gallery。  
为兼容现有调用，`/api/art/generate` 保留当前字段，并新增 `options`（长度 2）。默认选中左侧（Option A）。

## 公共接口与类型变更
1. `POST /api/art/generate` 请求体新增可选字段 `optionCount?: number`，服务端默认 `1`，并 clamp 到 `1..4`。
2. `POST /api/art/generate` 响应体新增 `options: Array<{ optionId: string; artParams: ArtParams; label: string }>`。
3. 保持兼容：`artParams` 始终等于 `options[0].artParams`。
4. 前端新增 `PreviewOption`，`PreviewData` 增加可选 `options`，并保留 `artParams` 作为兜底。

## 实现范围
- `src/app/api/art/generate/route.ts`
- `src/app/page.tsx`
- `src/test/art-generate.test.ts`

## 关键交互设计
1. 生成后展示 Option A / Option B 两个预览卡片。
2. 默认选中左侧 Option A。
3. 点击某个卡片后，右侧参数面板实时展示该卡片参数。
4. “Save to Gallery” 仅保存当前选中项的 `artParams`。
5. 若接口缺失 `options`，前端用 `artParams` 构造单 option，避免崩溃。

## 验收标准
1. 输入关键词后出现 2 个可对比 artwork。
2. 默认左侧被选中，且可切换选择。
3. 切换选择后右侧参数立即联动。
4. 保存后 gallery 中新增的是被选中的 artwork。
5. 旧依赖 `artParams` 的路径不受影响。
