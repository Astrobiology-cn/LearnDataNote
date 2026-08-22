---
title: 偏微分方程
order: 3
---

## 热传导方程

行星内部热演化的基本方程：

$$\frac{\partial T}{\partial t} = \kappa \nabla^2 T + \frac{Q}{\rho c_p}$$

其中 $\kappa$ 为热扩散率，$Q$ 为热源（放射性元素衰变）。

### 边界条件

- 表面：辐射平衡 $-k \frac{\partial T}{\partial z} = \sigma T^4$
- 中心：温度梯度为零

## 泊松方程

重力场与密度分布的关系：

$$\nabla^2 \Phi = 4\pi G \rho$$

## 波动方程

地震波在行星内部传播：

$$\rho \frac{\partial^2 \mathbf{u}}{\partial t^2} = (\lambda + 2\mu) \nabla(\nabla \cdot \mathbf{u}) - \mu \nabla \times (\nabla \times \mathbf{u})$$

## 求解方法

- 分离变量法
- 格林函数法
- 有限差分法
- 谱方法
