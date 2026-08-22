---
title: 模型评估与诊断
order: 2
---

## 残差分析

残差 $e_i = y_i - \hat{y}_i$ 应满足：
- 均值为零
- 同方差性
- 正态性
- 独立性

### 诊断图

1. 残差 vs 拟合值图
2. QQ 图
3. 尺度-位置图
4. 残差 vs 杠杆值图

## 显著性检验

### t 检验

$$t = \frac{\hat{\beta}_j}{SE(\hat{\beta}_j)}$$

### F 检验

$$F = \frac{(SS_{tot} - SS_{res})/p}{SS_{res}/(n-p-1)}$$

## 信息准则

$$AIC = 2k - 2\ln(L)$$

$$BIC = k\ln(n) - 2\ln(L)$$

## 交叉验证

k 折交叉验证用于评估模型的泛化能力。
