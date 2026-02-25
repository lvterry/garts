# 双 Artwork 参数差异增强方案（关键词语义锁定版）

## 简要摘要
在同一关键词与同一语义理解下，双选项 artwork 不再只变化 `seed/colors`，还会在构图与动态参数上产生可控差异，并通过最小差异保障避免两图过于接近。

## 已落地实现
1. 生成器引入 `variationContext`（可选，不破坏旧调用）：
- `optionIndex`
- `optionCount`
- `baseSeed`
- `mode: 'compare-controlled'`
- `strength?`

2. 生成流程改为“基线 + 扰动”：
- 先按关键词 + 语义生成基线参数。
- 再按 option 强度做受控扰动（复杂度、运动、混沌、旋转、sizeCurve、positionBias、strokeWidth、layerCount、shapeTypes）。

3. shape 采样改造：
- 从 `Math.random()` 改为 seed 驱动，保证可复现。
- 修复无放回加权抽样中 `totalWeight` 不更新导致的偏差。

4. 最小差异保障：
- 新增 `computeOptionDistance(a, b)`。
- Route 层对非首选项执行阈值检查（`0.28`），不足时自动提高强度重算一次。

5. API 兼容性：
- 保持 `artParams === options[0].artParams`。
- 响应新增可选 `options[i].meta`（`optionDistance`、`variationSummary`），不影响现有前端读取。

## 变更文件
- `src/lib/art-generator/index.ts`
- `src/app/api/art/generate/route.ts`
- `src/test/setup.ts`
- `src/test/art-generate.test.ts`
- `src/test/art-generator-variation.test.ts`

## 验证结果
- `npm run test` 通过（17/17）。
- `npx tsc --noEmit` 通过。
