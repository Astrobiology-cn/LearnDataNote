---
title: 复变函数与积分变换
order: 1
---

## 复变函数基础

复变函数是研究行星轨道共振、潮汐形变和电磁场问题的基本工具。

### 解析函数

若函数 $f(z) = u(x,y) + iv(x,y)$ 在区域 $D$ 内处处可导，则称 $f(z)$ 在 $D$ 内解析。柯西-黎曼条件为：

$$\frac{\partial u}{\partial x} = \frac{\partial v}{\partial y}, \quad \frac{\partial u}{\partial y} = -\frac{\partial v}{\partial x}$$

### 柯西积分公式

$$f(z_0) = \frac{1}{2\pi i} \oint_C \frac{f(z)}{z-z_0} dz$$

### 傅里叶变换

在行星信号处理中，傅里叶变换用于从时间域提取频率信息：

$$F(\omega) = \int_{-\infty}^{\infty} f(t) e^{-i\omega t} dt$$

### 拉普拉斯变换

常用于求解行星热传导方程的初值问题：

$$\mathcal{L}\{f(t)\} = \int_0^{\infty} e^{-st} f(t) dt$$

## 应用示例

- 行星轨道长期演化的频谱分析
- 潮汐锁定天体的热应力计算
- 行星磁场发电机方程的求解
