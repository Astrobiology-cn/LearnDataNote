# 遥感技术

**Remote Sensing**

---

## 1. 课程概述

遥感技术是获取行星表面和大气信息的核心手段，涵盖光学成像、光谱分析、雷达探测等多种方法，是现代行星科学研究的支柱技术之一。

> [!note] 数据来源
> 现代行星科学的数据主要来自轨道器、着陆器和巡视器的遥感仪器。这些数据的处理和分析需要深厚的物理基础和编程能力。

---

## 2. 光学成像

### 瑞利判据

望远镜的角分辨率：

$$
\theta = 1.22 \frac{\lambda}{D}
$$

其中 $\lambda$ 为波长，$D$ 为孔径直径。

> [!tip] HiRISE
> NASA 的 HiRISE（High Resolution Imaging Science Experiment）搭载于火星勘测轨道器（MRO），分辨率可达 0.25 m/像素，足以识别火星表面的机遇号火星车。

---

## 3. 光谱分析

### 普朗克黑体辐射定律

$$
B_\lambda(T) = \frac{2hc^2}{\lambda^5} \frac{1}{e^{hc/\lambda k_B T} - 1}
$$

> [!important] 热红外遥感
> 通过测量行星表面的热辐射，可以反演表面温度分布，进而推断热惯量（thermal inertia），这对于识别地下冰层和岩石类型至关重要。

### 矿物识别

吸收特征波长：

| 矿物 | 吸收波长 ($\mu$m) | 成因 |
|:---|:---|:---|
| 橄榄石 | 1.05 | Fe²⁺ 晶体场跃迁 |
| 辉石 | 1.9, 2.3 | Fe²⁺, Ca²⁺ |
| 赤铁矿 | 0.85, 0.52 | Fe³⁺ 电荷转移 |
| 水合矿物 | 1.4, 1.9 | O-H 振动 |

---

## 4. 雷达探测

### 雷达方程

接收功率：

$$
P_r = \frac{P_t G^2 \lambda^2 \sigma}{(4\pi)^3 R^4}
$$

其中 $\sigma$ 为雷达散射截面。

> [!example] SHARAD
> NASA 的 SHARAD（Shallow Radar）可以探测火星地下 1 km 深度，分辨率约 15 m。它在火星极冠发现了多层冰-尘沉积结构，记录了火星气候的周期性变化。

---

## 5. 推荐阅读

1. *Remote Sensing of the Environment* — Jensen
2. 《行星遥感概论》— 邸凯昌
3. *Introduction to the Physics and Techniques of Remote Sensing* — Elachi
