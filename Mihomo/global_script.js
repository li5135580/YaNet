/***
 * Clash Verge Rev / Mihomo Party 优化脚本 
 * 原作者: dahaha-365 (YaNet)
 * 修改：精确主节点 + 备用节点（包含“日本高速”） + fallback
 */

function stringToArray(val) {
  if (Array.isArray(val)) return val
  if (typeof val !== 'string') return []
  return val
    .split(';')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

// --- 1. 静态配置区域 ---
const _skipIps = '10.0.0.0/8;100.64.0.0/10;127.0.0.0/8;169.254.0.0/16;172.16.0.0/12;192.168.0.0/16;198.18.0.0/16;FC00::/7;FE80::/10;::1/128'

const _proxyProviders = {
  P1: { type: 'http', url: '聚合订阅链接1', interval: 86400, override: { 'additional-prefix': 'P1 | ' } },
  P2: { type: 'http', url: '聚合订阅链接2', interval: 86400, override: { 'additional-prefix': 'P2 | ' } },
}

// DNS 配置
const _chinaDohDns = 'https://doh.pub/dns-query;https://dns.alidns.com/dns-query'
const _foreignDohDns = 'https://dns.google/dns-query;https://dns.adguard-dns.com/dns-query'
const _chinaIpDns = '119.29.29.29;223.5.5.5'
const _foreignIpDns = '8.8.8.8;94.140.14.14'

const args = typeof $arguments !== 'undefined' ? $arguments : {
  enable: true, ruleSet: 'all', regionSet: 'all', excludeHighPercentage: true,
  globalRatioLimit: 2, skipIps: _skipIps, defaultDNS: _chinaIpDns,
  directDNS: _chinaIpDns, chinaDNS: _chinaDohDns, foreignDNS: _foreignDohDns,
  mode: 'default', ipv6: false, logLevel: 'error', githubProxy: 'https://ghfast.top/',
  subscriptions: _proxyProviders,
}

let {
  enable = true, ruleSet = 'all', regionSet = 'all', excludeHighPercentage = true,
  globalRatioLimit = 2, skipIps = _skipIps, defaultDNS = _chinaIpDns,
  directDNS = _chinaIpDns, chinaDNS = _chinaDohDns, foreignDNS = _foreignDohDns,
  mode = '', ipv6 = false, logLevel = 'error', githubProxy = 'https://ghfast.top/',
  subscriptions = _proxyProviders,
} = args

// 模式配置（保持不变）
if (['securest', 'secure', 'default', 'fast', 'fastest'].includes(mode)) {
  // ... 原有模式逻辑保持不变 ...
}

skipIps = stringToArray(skipIps)
// ... 其他 DNS 数组转换保持不变

// 分流规则配置（保持不变）
let ruleOptions = {
  apple: false, microsoft: true, github: true, google: true, openai: true,
  crypto: true, spotify: true, youtube: true, bahamut: false, netflix: false,
  tiktok: false, disney: false, hbo: false, hulu: false, primevideo: false,
  telegram: true, line: false, games: true, ads: true,
}

if (ruleSet === 'all') {
  Object.keys(ruleOptions).forEach((key) => (ruleOptions[key] = true))
}

// 初始规则 + 地区定义 + dnsConfig + ruleProviders 等保持不变（此处省略，实际代码请保留原文件对应部分）

const groupBaseOption = {
  interval: 30,      // 每30秒健康检测
  timeout: 3000,
  url: 'https://www.gstatic.com/generate_204',
  lazy: true,
  'max-failed-times': 3,
  hidden: false,
}

// --- 主入口 ---
function main(config) {
  if (!enable) return config

  config.proxies = config?.proxies || []
  const proxies = config.proxies
  const allProxyNames = proxies.map(p => p.name)

  // ... 前面所有配置（allow-lan、mode、sniffer、tun、geox-url、proxy-providers 等）保持不变 ...

  config.proxies.push({ name: '直连', type: 'direct', udp: true })
  config.proxies.push({ name: '拒绝', type: 'reject', udp: true })

  // ====================== 精确主备节点 ======================

  // 主节点：精确匹配这两个节点
  const mainNodeNames = [
    '🇺🇸 美国 | 72.249.203 | TUIC',
    '🇺🇸 美国 | 72.249.203 | H2'
  ].filter(name => allProxyNames.includes(name))

  const 主节点 = {
    ...groupBaseOption,
    name: '主节点',
    type: 'url-test',
    tolerance: 50,
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_States.png',
    proxies: mainNodeNames.length > 0 ? mainNodeNames : ['直连'],
    interval: 30,
  }

  // 备用节点：名字**包含** “日本高速” 的所有节点
  const backupNodeNames = allProxyNames.filter(name => 
    name && name.includes('日本高速')
  )

  const 备用节点 = {
    ...groupBaseOption,
    name: '备用节点',
    type: 'url-test',
    tolerance: 50,
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Japan.png',
    proxies: backupNodeNames.length > 0 ? backupNodeNames : ['直连'],
    interval: 30,
  }

  // 默认节点 - 使用 fallback 实现自动切换
  const defaultNodeGroup = {
    ...groupBaseOption,
    name: '默认节点',
    type: 'fallback',
    proxies: ['主节点', '备用节点'],
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Proxy.png',
    interval: 30,
  }

  // ====================== 功能策略组 ======================
  const functionalGroups = [defaultNodeGroup, 主节点, 备用节点]

  // 其他所有分流规则（AI、GitHub、微软、虚拟货币等）完全不动
  serviceConfigs.forEach((svc) => {
    if (!ruleOptions[svc.key]) return
    rules.push(...svc.rules)

    let groupProxies = svc.reject 
      ? ['REJECT', '直连', '默认节点']
      : ['默认节点', ...allProxyNames, '直连']

    const group = {
      ...groupBaseOption,
      name: svc.name,
      type: 'select',
      proxies: groupProxies,
      url: svc.url || 'https://www.gstatic.com/generate_204',
      icon: svc.icon,
    }
    functionalGroups.push(group)
  })

  // 兜底组（保持原有）
  functionalGroups.push(
    { ...groupBaseOption, name: '其他外网', type: 'select', proxies: ['默认节点', '国内网站', ...allProxyNames], icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Dark/GlobalMedia.png' },
    { ...groupBaseOption, name: '国内网站', type: 'select', proxies: ['直连', '默认节点', ...allProxyNames], url: 'https://wifi.vivo.com.cn/generate_204', icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/China_Map.png' }
  )

  config['proxy-groups'] = functionalGroups
  config['rules'] = rules
  config['rule-providers'] = ruleProviders || {}

  return config
}
