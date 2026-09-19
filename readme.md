# Mihomo 全端通用优化脚本（global_script.js）

> 适用于 **Clash Verge Rev / Mihomo Party / FlClash（安卓）** 的 mihomo（Clash.Meta）内核覆写脚本；
> **OpenClash（路由器）** 经"导出 YAML"两段式部署同样可用。
> 核心价值：在 Fake-IP 之上构建**分流式 DNS 架构**——境外域名真实解析经代理走加密 DoH、国内解析走 AGH/加密 DoH，全链路无明文用户查询、无污染。

---

## 为什么需要它

mihomo 的 Fake-IP 只罩住 A/AAAA 查询。但现代浏览器每次导航还会发 **HTTPS-RR（type 65）**，加上 TXT/SRV 查询和 fake-ip-filter 白名单域名，这些"真实解析"若没有境外加密出口，会整批落进国内递归——这就是常见的"网页能开、DNS 泄露测试却显示一堆国内出口"的根因。

本脚本用 **nameserver 反转**解决它：

| 查询类型 | 路径 | 泄露面 |
|---|---|---|
| A/AAAA（所有域名） | Fake-IP 直答，不出网 | 无 |
| 境外域名真实解析（HTTPS-RR/TXT/SRV、白名单域名） | `https://1.1.1.1/dns-query#默认节点`——经代理出口的加密 DoH | 无（ISP 与国内 DNS 均不可见） |
| 国内域名真实解析 | AGH 优选 → doh.pub/alidns DoH 备路（并发竞速） | 无明文 |
| DNS 服务商自身域名（dns.alidns.com 等） | `223.5.5.5/119.29.29.29` 明文直解 | 仅服务商域名（bootstrap 必需） |

两个刻意的设计决策：

- **不用 `geosite:geolocation-!cn` policy 做境外分流**：该分类约 10 万域名，低内存 ARM 路由器（<1GB）加载必然 OOM（实测被内核击杀）。默认 nameserver 反转达到同样的隔离效果，零额外内存。
- **保留一条明文 bootstrap**：mihomo 与 AdGuard Home 同机部署（OpenClash + AGH 是典型场景）时，服务商域名解析若指回 AGH 自身，会形成 AGH↔mihomo 解析死锁（cn 域名全部超时）。服务商域名明文直解是打断环路的必需设计，不涉及任何用户域名。

## 特性总览

- 分流式 DNS（见上表）+ Fake-IP 黑名单（time/ntp/stun/局域网等连通性域名保留真实解析）
- 节点体系：**主节点**（名含"自建/free"自动识别）→ **备用节点**（日本/新加坡，排除专线与主节点）→ **默认节点**（fallback 链）；12 地区分组（港美日韩新台英德马土加澳）
- 15 个服务分组（AI/流媒体/Telegram/游戏/广告过滤等），全开时 36 条规则、23 个远程规则集（MetaCubeX MRS 为主 + AWAvenue 广告过滤）
- 多订阅聚合（P1/P2 provider，节点名自动加 `P1 |` 前缀）
- 倍率节点过滤（默认剔除 >2x）
- Telegram IP 规则带 `no-resolve`（防 IP 规则匹配触发解析泄露）
- `allow-lan` 默认 false（客户端安全默认，见安全注意第 2 条）

## 快速开始

### Clash Verge Rev / Mihomo Party（PC）

1. 把脚本添加为你的订阅的**扩展脚本 / 覆写（JavaScript）**；
2. **关闭客户端自身的 DNS 接管/覆写开关**（Mihomo Party："接管 DNS 设置"和"接管域名嗅探设置"），否则脚本的 dns 段会被客户端设置改写；
3. 更新订阅，代理组出现 主节点/默认节点/地区组 即生效。

### FlClash（安卓）

支持 JavaScript 覆写的版本可直接加载本脚本；仅支持 YAML 覆写的客户端请使用下述导出产物。

### OpenClash（路由器，两段式）

OpenClash 不执行 JS，需要先在 PC 客户端生成产物：

1. PC 客户端加载本脚本 + 你的订阅，导出最终 YAML；
2. 上传为 OpenClash 配置文件（本地配置，或托管 raw URL 作为配置订阅）；
3. **务必**：LuCI 覆写设置中"自定义上游 DNS"保持关闭（`enable_custom_dns=0`）——开启时 OpenClash 会用 uci 里的明文 DNS 列表覆写 `nameserver`，DNS 泄露直接回归；
4. 家用场景下各设备的代理共享由路由器网关层承担，PC/手机端无需再开 `allow-lan`。

## AdGuard Home 联动（`enableAdguardHome`，默认开启）

开启时，国内/直连/节点域名的解析列表为 `[AGH, doh.pub, alidns]`（并发竞速）：

- AGH 在局域网内通常最快——多数查询仍能吃到 AGH 的 DNS 级广告过滤；
- AGH 不可达（出门/停机）时加密 DoH 自动接管，**国内解析不瘫痪**；
- `adguardHomeDNS` 默认值 `192.168.10.1:5335` 是示例网关地址，**请替换为你的 AGH 实际地址**（路由器同机用 `127.0.0.1:5335`，跨设备用路由器 LAN IP）。

**AGH 自身的上游卫生是整条链路的底线**（本架构实测踩过的坑）：

- AGH 上游只保留**一个加密 DoH**（如 `https://dns.alidns.com/dns-query`），fallback 留空；
- **不要**混入明文上游再配 `upstream_mode: parallel`——并行模式会把每条查询扇出到全部上游，等于把泄露从 mihomo 层转移到 AGH 层。

出门/无 AGH 场景传 `enableAdguardHome: false`，国内解析自动回落纯 DoH，境外通道不受影响。

## 参数（$arguments）

支持传参的客户端可覆盖以下默认值；不支持的客户端直接改脚本头部 args 区即可。

| 参数 | 默认 | 说明 |
|---|---|---|
| `enable` | `true` | 总开关 |
| `ruleSet` | `all` | 启用的服务规则集（分号分隔）：ads;apple;microsoft;github;google;openai;crypto;spotify;youtube;netflix;tiktok;disney;telegram;line;games |
| `regionSet` | `all` | 地区分组（前缀分号分隔）：HK;US;JP;KR;SG;TW;GB;DE;MY;TK;CA;AU |
| `excludeHighPercentage` / `globalRatioLimit` | `true` / `2` | 剔除节点名中倍率标注超限的节点 |
| `defaultDNS` | `223.5.5.5;119.29.29.29` | 服务商域名/引导解析（明文，仅此用途） |
| `directDNS` / `chinaDNS` | 国内 IP / 国内 DoH | AGH 开启时被替换为 `[AGH, DoH 备路]` |
| `allowLan` | `false` | 局域网共享代理（见安全注意） |
| `ipv6` | `false` | IPv6 总开关 |
| `githubProxy` | `https://ghfast.top/` | GitHub 资源反代前缀（可换 jsdelivr 或自建） |
| `subscriptions` | P1/P2 占位 | 多订阅对象；url 需以 `http` 开头才生效 |
| `checkInterval` / `lazy` | `900` / `true` | 组测速间隔（秒）与懒测速 |
| `enablePrimaryNode` | `true` | 主节点组开关（无匹配节点时自动隐藏） |
| `enableAdguardHome` / `adguardHomeDNS` | `true` / `192.168.10.1:5335` | AGH 联动开关与地址 |

## 安全注意事项

1. **分享前脱敏**：`subscriptions` 换成你自己的订阅前，确认不含 Token/UUID（本仓库发布版内置占位符）；导出的产物 YAML 同样含订阅凭据，勿直接粘贴求 debug。
2. **`allow-lan` 默认 false**：PC/手机在公共网络默认只监听本机。确需局域网共享时，用客户端 GUI 的"允许局域网"开关（该值优先于脚本，无需改脚本）。
3. **第三方反代信任链**：规则集/GeoData/UI 下载经 ghfast.top。介意可替换 `githubProxy` 为 jsdelivr 或自建反代。
4. **OOM 红线**：低内存设备（<1GB RAM）不要在任何位置引入 `geosite:geolocation-!cn`。

## 泄露自检（一分钟）

```
nslookup -type=TXT whoami.ds.akahelp.net <你的网关或 127.0.0.1>
```

- **健康**：返回你的**代理出口网段**（境外 IP）；
- **泄露**：返回国内运营商/公共递归 IP——说明境外真实解析走了国内链路。

启用 AGH 的，再查 AGH 查询日志：upstream 出现 `223.5.5.5:53` / `119.29.29.29:53` 即明文泄露回归（AGH 上游配置被改动）。

## 版本沿革

| 版本 | 要点 |
|---|---|
| 18 | 经典架构：DNS fallback 竞速（境外 DoH 需直连可达——5 秒超时的病根） |
| 19 | 移除 DNS 层 fallback + AGH 前置 → 引入明文/境外解析泄露（**已废弃**） |
| 20 | 修复版：nameserver 反转 + AGH 独占 + bootstrap policy |
| 21 | 四端通用：AGH 优选 + 加密 DoH 备路 |
| **22（当前）** | `allowLan` 默认 false、移除未被引用的"拒绝"死节点、fallback 术语精确化 |

## 已知限制

- 境外域名真实解析依赖代理可用：默认节点全部不可用时 HTTPS-RR/TXT 查询失败（浏览器自动降级，不影响 Fake-IP 主路径）；
- `enableAdguardHome: false` 时 `direct-nameserver` 为国内明文 IP——cn 直连流量的常规行为，不含境外域名；
- Shadowrocket 等"转换型"客户端导入 Clash YAML 可能丢弃 MRS 规则集，服务分流缺失需自行验证；
- 脚本产出为配置对象，YAML 序列化由客户端完成；各客户端对 TUN/端口等字段的接管以客户端自身设置为准。

## 致谢

规则与资源来自 [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)、[blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script)、[TG-Twilight/AWAvenue-Ads-Rule](https://github.com/TG-Twilight/AWAvenue-Ads-Rule)、[DustinWin/ruleset_geodata](https://github.com/DustinWin/ruleset_geodata)，图标来自 [Koolson/Qure](https://github.com/Koolson/Qure)。
