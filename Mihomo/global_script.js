/***
 * Clash Verge Rev / Mihomo Party / OpenClash 优化脚本
 * 优化点：
 * 1. 彻底移除 DNS 层 fallback 与 fallback-filter，杜绝 5 秒 context deadline 超时
 *    （注意：策略组"默认节点"的 fallback 类型是另一概念，与此无关）
 * 2. 修复 telegram_ip_mrs 导致的 DNS 泄漏 (追加 no-resolve)
 * 3. 优化 Fake-IP 性能，关闭 prefer-h3 与 respect-rules 冲突
 * 4. 内置 AdGuard Home 开关与联动支持（地址填路由器 AGH 的 LAN 口）
 * 5. 四端通用（OpenClash/PC/移动端同配）：AGH 优选+加密 DoH 备路，境外域名真实解析经代理走 Cloudflare DoH（消除明文/并发泄露，低内存设备免 OOM）
 */

function stringToArray(val) {
  if (Array.isArray(val)) return val
  if (typeof val !== 'string') return []
  return val
    .split(';')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

// ==========================================
// ⚙️ 1. 静态与核心配置区域
// ==========================================

const _skipIps =
  '10.0.0.0/8;100.64.0.0/10;127.0.0.0/8;169.254.0.0/16;172.16.0.0/12;192.168.0.0/16;198.18.0.0/16;FC00::/7;FE80::/10;::1/128'

/**
 * 多订阅聚合配置
 */
const _proxyProviders = {
  P1: {
    type: 'http',
    url: '聚合订阅链接1',
    interval: 86400,
    override: {
      'additional-prefix': 'P1 | '
    }
  },

  P2: {
    type: 'http',
    url: '聚合订阅链接2',
    interval: 86400,
    override: {
      'additional-prefix': 'P2 | '
    }
  },
}

// DNS 配置
const _chinaDohDns =
  'https://doh.pub/dns-query;https://dns.alidns.com/dns-query'

const _chinaIpDns =
  '223.5.5.5;119.29.29.29'

/**
 * 整个脚本的总开关与核心变量
 */
const args =
  typeof $arguments !== 'undefined'
    ? $arguments
    : {
        enable: true,
        ruleSet: 'all',
        regionSet: 'all',
        excludeHighPercentage: true,
        globalRatioLimit: 2,
        skipIps: _skipIps,
        defaultDNS: _chinaIpDns,
        directDNS: _chinaIpDns,
        chinaDNS: _chinaDohDns,
        allowLan: false, // 默认仅监听本机（PC/移动端安全默认）；家庭共享场景由路由器
        // 网关层承担，无需开放；确需开放时用客户端 GUI"允许局域网"开关（覆盖本值）
        ipv6: false, // 禁用 IPv6，彻底规避双栈回退卡顿
        logLevel: 'error',
        githubProxy: 'https://ghfast.top/',
        // ⚠️ 分享脚本或产物 YAML 前，务必先脱敏 subscriptions 里的订阅地址（含 Token）
        subscriptions: _proxyProviders,

        // 核心性能与耗电配置
        checkInterval: 900,
        lazy: true,

        // 主节点总开关
        enablePrimaryNode: true,

        // ⭐ AdGuard Home 联动开关：填路由器 AGH 的 LAN 地址，四端（OpenClash/PC/
        // 安卓/iOS）同一份配置通用；AGH 不可达时自动回落国内加密 DoH，解析不瘫
        enableAdguardHome: true,
        adguardHomeDNS: '192.168.10.1:5335',
      }

let enable = args.enable ?? true
let ruleSet = args.ruleSet ?? 'all'
let regionSet = args.regionSet ?? 'all'
let excludeHighPercentage = args.excludeHighPercentage ?? true
let globalRatioLimit = args.globalRatioLimit ?? 2
let skipIps = args.skipIps ?? _skipIps
let defaultDNS = args.defaultDNS ?? _chinaIpDns
let directDNS = args.directDNS ?? _chinaIpDns
let chinaDNS = args.chinaDNS ?? _chinaDohDns
let allowLan = args.allowLan ?? false
let ipv6 = args.ipv6 ?? false
let logLevel = args.logLevel ?? 'error'
let githubProxy = args.githubProxy ?? 'https://ghfast.top/'
let subscriptions = args.subscriptions ?? _proxyProviders
let checkInterval = args.checkInterval ?? 300
let lazy = args.lazy ?? false
let enablePrimaryNode = args.enablePrimaryNode ?? true
let enableAdguardHome = args.enableAdguardHome ?? true
let adguardHomeDNS = args.adguardHomeDNS ?? '192.168.10.1:5335'

skipIps = stringToArray(skipIps)
defaultDNS = stringToArray(defaultDNS)
directDNS = stringToArray(directDNS)
chinaDNS = stringToArray(chinaDNS)

// 若开启 AdGuard Home：AGH 优选 + 加密 DoH 备路（并发竞速下局域网 AGH 通常最快，
// DNS 级广告过滤大概率保留；AGH 不可达时加密 DoH 接管，国内解析不瘫痪）。
// directDNS 的备路同时替换掉明文 _chinaIpDns，全链路无明文。
if (enableAdguardHome) {
  const backupDNS = chinaDNS
  chinaDNS = [adguardHomeDNS, ...backupDNS]
  directDNS = [adguardHomeDNS, ...backupDNS]
}

let ruleOptions = {
  ads: true,
  apple: false,
  microsoft: true,
  github: true,
  google: true,
  openai: true,
  crypto: true,
  spotify: true,
  youtube: true,
  netflix: false,
  tiktok: false,
  disney: false,
  telegram: true,
  line: false,
  games: true,
}

if (ruleSet === 'all') {
  Object.keys(ruleOptions).forEach((key) => (ruleOptions[key] = true))
} else if (typeof ruleSet === 'string') {
  ruleSet
    .split(';')
    .map((s) => s.trim())
    .forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(ruleOptions, key)) {
        ruleOptions[key] = true
      }
    })
}

// 局域网直连前置
const rules = [
  'PROCESS-NAME-REGEX,(?i).*cloudflared.*,直连',
  'GEOSITE,private,直连'
]

const allRegionDefinitions = [
  {
    name: 'HK香港',
    regex: /港|🇭🇰|hk|hongkong|hong kong/i,
    filter: '(?i)港|🇭🇰|hk|hongkong|hong kong',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Hong_Kong.png'
  },
  {
    name: 'US美国',
    regex: /\b(usa|united states)\b|(?:\b|_)us(?:\b|_|\d+)|美|🇺🇸/i,
    filter: '(?i)\\b(usa|united states)\\b|(?:\\b|_)us(?:\\b|_|\\d+)|美|🇺🇸',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_States.png'
  },
  {
    name: 'JP日本',
    regex: /日本|🇯🇵|jp|japan/i,
    filter: '(?i)日本|🇯🇵|jp|japan',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Japan.png'
  },
  {
    name: 'KR韩国',
    regex: /韩|🇰🇷|kr|korea/i,
    filter: '(?i)韩|🇰🇷|kr|korea',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Korea.png'
  },
  {
    name: 'SG新加坡',
    regex: /新加坡|🇸🇬|sg|singapore/i,
    filter: '(?i)新加坡|🇸🇬|sg|singapore',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Singapore.png'
  },
  {
    name: 'TW台湾省',
    regex: /台湾|台灣|🇹🇼|tw|taiwan|tai wan/i,
    filter: '(?i)台湾|台灣|🇹🇼|tw|taiwan|tai wan',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Taiwan.png'
  },
  {
    name: 'GB英国',
    regex: /英|🇬🇧|uk|united kingdom|great britain/i,
    filter: '(?i)英|🇬🇧|uk|united kingdom|great britain',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_Kingdom.png'
  },
  {
    name: 'DE德国',
    regex: /德国|🇩🇪|de|germany/i,
    filter: '(?i)德国|🇩🇪|de|germany',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Germany.png'
  },
  {
    name: 'MY马来西亚',
    regex: /马来|🇲🇾|my|malaysia/i,
    filter: '(?i)马来|🇲🇾|my|malaysia',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Malaysia.png'
  },
  {
    name: 'TK土耳其',
    regex: /土耳其|🇹🇷|tk|turkey/i,
    filter: '(?i)土耳其|🇹🇷|tk|turkey',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Turkey.png'
  },
  {
    name: 'CA加拿大',
    regex: /加拿大|🇨🇦|ca|canada/i,
    filter: '(?i)加拿大|🇨🇦|ca|canada',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Canada.png'
  },
  {
    name: 'AU澳大利亚',
    regex: /澳大利亚|🇦🇺|au|australia|sydney/i,
    filter: '(?i)澳大利亚|🇦🇺|au|australia|sydney',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Australia.png'
  },
]

let regionDefinitions = []

if (regionSet === 'all') {
  regionDefinitions = allRegionDefinitions
} else {
  const enabledRegions = regionSet.split(';').map((s) => s.trim())
  regionDefinitions = allRegionDefinitions.filter((r) =>
    enabledRegions.includes(r.name.substring(0, 2))
  )
}

// ==========================================
// 🚀 核心优化：纯净高速 Fake-IP DNS 模块
// ==========================================
const dnsConfig = {
  enable: true,
  listen: '0.0.0.0:53',
  ipv6: false, // 强制关闭 IPv6 DNS 解析

  'independent-cache': true,
  'cache-size': 8192,
  'fallback-cache': false,

  'log-level': logLevel,
  'prefer-h3': false, // 关闭 H3，防止海外 QUIC DNS 超时
  'use-hosts': true,
  'use-system-hosts': true,
  'respect-rules': false, // Fake-IP 模式下设为 false 避免解析混乱

  'enhanced-mode': 'fake-ip',
  'fake-ip-range': '198.18.0.0/16',
  'fake-ip-filter-mode': 'blacklist',

  'fake-ip-filter': [
    '*.lan',
    '*.local',
    '*.market.xiaomi.com',
    'localhost.ptlogin2.qq.com',
    'localhost.sec.qq.com',
    '+.msftconnecttest.com',
    '+.msftncsi.com',
    'router.asus.com',
    'routerlogin.net',
    'www.asusrouter.com',
    'printer',
    'nas',
    'time.*.com',
    'time.*.gov',
    'time.*.edu.cn',
    'ntp.*.com',
    'ntp.*.cn',
    'stun.*.*',
    'stun.*.*.*',
    '+.stun.*.*',
    '+.stun.*.*.*',
    '+.market.xiaomi.com',
    'geosite:private',
    'geosite:category-bank-jp',
  ],

  // 默认 nameserver 反转设计：境外域名真实解析（HTTPS-RR/TXT/SRV、fake-ip-filter
  // 白名单域名）经"默认节点"走 Cloudflare DoH，加密且不被污染。
  // 注意：不要改用 geosite:geolocation-!cn 的 policy 实现——该分类约 10 万域名，
  // 低内存路由器（<1GB，如 900MB ARM 设备）加载时必 OOM（已实测）
  nameserver: ['https://1.1.1.1/dns-query#默认节点'],
  'default-nameserver': defaultDNS,
  'direct-nameserver': directDNS,
  // 节点域名解析跟随 chinaDNS（AGH 优选+加密备路；关闭 AGH 时为纯 DoH，不再明文）
  'proxy-server-nameserver': chinaDNS,

  // 彻底移除 fallback 与 fallback-filter，杜绝 5 秒 context deadline 超时！

  'nameserver-policy': {
    'geosite:private': 'system',
    // DNS 服务商域名明文直解（bootstrap）：打断 AGH→mihomo→AGH 循环依赖，
    // 仅服务商自身域名，不含任何用户查询
    'dns.alidns.com,doh.pub,dot.pub': defaultDNS,
    'geosite:tld-cn,cn,steam@cn,category-games@cn,microsoft@cn,apple@cn,category-game-platforms-download@cn,category-public-tracker':
      chinaDNS,
  },
}

const ruleProviderCommon = {
  type: 'http',
  format: 'yaml',
  interval: 86400
}

const groupBaseOption = {
  interval: checkInterval,
  timeout: 3000,
  url: 'https://www.gstatic.com/generate_204',
  lazy: lazy,
  'max-failed-times': 3,
  hidden: false,
}

const ruleProviders = {
  applications: {
    ...ruleProviderCommon,
    behavior: 'classical',
    format: 'text',
    url: `${githubProxy}https://github.com/DustinWin/ruleset_geodata/raw/refs/heads/mihomo-ruleset/applications.list`,
    path: './ruleset/DustinWin/applications.list',
  },
}

const multiplierRegex =
  /(?:倍率[ :]*|(?:^|[\s\-_\[\]()])[xX✕✖⨉])\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:倍率|倍|[xX✕✖⨉](?:$|[\s\-_\[\]()]))/

const adInfoKeywords = [
  '导航网址', '距离下次重置', '剩余流量', '套餐到期', '网址导航', '官网',
  '订阅', '到期', '剩余', '重置', '流量', '已用', '总计', '续费'
]

const adInfoRegex =
  /\b(?:USE|USED|TOTAL|EXPIRE|EMAIL)\b|Panel|Channel|Author|Traffic|Reset|Expire|Renew|Support|Telegram|https?:\/\/|(?:\d+\.\d+)\s*(GB|TB|MB|KB)|\d{4}[-/]\d{2}[-/]\d{2}/i

function isAdInfoNode(name) {
  if (!name || typeof name !== 'string') return false
  if (adInfoKeywords.some((kw) => name.includes(kw))) return true
  if (adInfoRegex.test(name)) return true
  return false
}

// --- 2. 服务规则数据结构 ---
const serviceConfigs = [
  {
    key: 'ads',
    name: '广告过滤',
    icon: 'https://raw.githubusercontent.com/Lanlan13-14/Icon-for-webui/main/block.png',
    rules: [
      'RULE-SET,category-ads-all_mrs,广告过滤',
      'RULE-SET,awavenue_ads_yaml,广告过滤',
      'DOMAIN-SUFFIX,ad.ldmnq.com,广告过滤',
      'DOMAIN-SUFFIX,ads.ldmnq.com,广告过滤',
      'DOMAIN-SUFFIX,push.ldmnq.com,广告过滤',
      'DOMAIN-SUFFIX,stat.ldmnq.cn,广告过滤',
      'DOMAIN-SUFFIX,log.ldmnq.cn,广告过滤',
      'DOMAIN-SUFFIX,mnqlog.ldmnq.com,广告过滤',
    ],
    providers: [
      {
        key: 'awavenue_ads_yaml',
        url: 'https://gcore.jsdelivr.net/gh/TG-Twilight/AWAvenue-Ads-Rule@main/Filters/AWAvenue-Ads-Rule-Clash.yaml',
        path: './ruleset/awavenue/awavenue_ads.yaml',
        format: 'yaml',
        behavior: 'classical'
      },
      {
        key: 'category-ads-all_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ads-all.mrs`,
        path: './ruleset/metacubex/category-ads-all.mrs',
        format: 'mrs',
        behavior: 'domain'
      },
    ],
    reject: true,
  },

  {
    key: 'github',
    name: 'Github',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/GitHub.png',
    url: 'https://github.com/robots.txt',
    rules: ['RULE-SET,github_mrs,Github'],
    providers: [
      {
        key: 'github_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/github.mrs`,
        path: './ruleset/metacubex/github.mrs',
        format: 'mrs',
        behavior: 'domain'
      }
    ]
  },

  {
    key: 'microsoft',
    name: '微软服务',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Microsoft.png',
    url: 'https://www.msftconnecttest.com/connecttest.txt',
    rules: [
      'RULE-SET,microsoft_cn_mrs,国内网站',
      'RULE-SET,microsoft_mrs,微软服务'
    ],
    providers: [
      {
        key: 'microsoft_cn_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/microsoft@cn.mrs`,
        path: './ruleset/metacubex/microsoft_cn.mrs',
        format: 'mrs',
        behavior: 'domain'
      },
      {
        key: 'microsoft_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/microsoft.mrs`,
        path: './ruleset/metacubex/microsoft.mrs',
        format: 'mrs',
        behavior: 'domain'
      }
    ]
  },

  {
    key: 'openai',
    name: '国外AI',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/AI.png',
    url: 'https://chat.openai.com/cdn-cgi/trace',
    rules: [
      'RULE-SET,ai_rules,国外AI',
      'RULE-SET,jetbrains-ai_mrs,国外AI',
      'RULE-SET,category-ai-not-cn_mrs,国外AI',
      'RULE-SET,category-ai-chat-not-cn_mrs,国外AI'
    ],
    providers: [
      {
        key: 'ai_rules',
        url: `${githubProxy}https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/OpenAI/OpenAI.yaml`,
        path: './ruleset/blackmatrix7/openai.yaml',
        format: 'yaml',
        behavior: 'classical'
      },
      {
        key: 'jetbrains-ai_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/jetbrains-ai.mrs`,
        path: './ruleset/metacubex/jetbrains-ai.mrs',
        format: 'mrs',
        behavior: 'domain'
      },
      {
        key: 'category-ai-not-cn_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ai-!cn.mrs`,
        path: './ruleset/metacubex/category-ai-not-cn.mrs',
        format: 'mrs',
        behavior: 'domain'
      },
      {
        key: 'category-ai-chat-not-cn_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ai-chat-!cn.mrs`,
        path: './ruleset/metacubex/category-ai-chat-not-cn.mrs',
        format: 'mrs',
        behavior: 'domain'
      }
    ]
  },

  {
    key: 'crypto',
    name: '虚拟货币',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Cryptocurrency.png',
    url: 'https://www.binance.com/robots.txt',
    rules: ['RULE-SET,crypto_rules,虚拟货币'],
    providers: [
      {
        key: 'crypto_rules',
        url: `${githubProxy}https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Cryptocurrency/Cryptocurrency.yaml`,
        path: './ruleset/blackmatrix7/cryptocurrency.yaml',
        format: 'yaml',
        behavior: 'classical'
      }
    ]
  },

  {
    key: 'apple',
    name: '苹果服务',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Apple.png',
    url: 'https://www.apple.com/library/test/success.html',
    rules: ['RULE-SET,apple-cn_mrs,苹果服务'],
    providers: [
      {
        key: 'apple-cn_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/apple-cn.mrs`,
        path: './ruleset/metacubex/apple-cn.mrs',
        format: 'mrs',
        behavior: 'domain'
      }
    ]
  },

  {
    key: 'google',
    name: '谷歌服务',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Google_Search.png',
    url: 'https://www.google.com/generate_204',
    rules: ['RULE-SET,google_mrs,谷歌服务'],
    providers: [
      {
        key: 'google_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/google.mrs`,
        path: './ruleset/metacubex/google.mrs',
        format: 'mrs',
        behavior: 'domain'
      }
    ]
  },

  {
    key: 'youtube',
    name: 'YouTube',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/YouTube.png',
    url: 'https://www.youtube.com/s/desktop/494dd881/img/favicon.ico',
    rules: ['RULE-SET,youtube_mrs,YouTube'],
    providers: [
      {
        key: 'youtube_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/youtube.mrs`,
        path: './ruleset/metacubex/youtube.mrs',
        format: 'mrs',
        behavior: 'domain'
      }
    ]
  },

  {
    key: 'disney',
    name: 'Disney+',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Disney.png',
    url: 'https://disney.api.edge.bamgrid.com/devices',
    rules: ['RULE-SET,disney_mrs,Disney+'],
    providers: [
      {
        key: 'disney_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/disney.mrs`,
        path: './ruleset/metacubex/disney.mrs',
        format: 'mrs',
        behavior: 'domain'
      }
    ]
  },

  {
    key: 'netflix',
    name: 'NETFLIX',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Netflix_Letter.png',
    url: 'https://api.fast.com/netflix/speedtest/v2?https=true',
    rules: ['RULE-SET,netflix_mrs,NETFLIX'],
    providers: [
      {
        key: 'netflix_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/netflix.mrs`,
        path: './ruleset/metacubex/netflix.mrs',
        format: 'mrs',
        behavior: 'domain'
      }
    ]
  },

  {
    key: 'tiktok',
    name: 'Tiktok',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/TikTok.png',
    url: 'https://www.tiktok.com/',
    rules: ['RULE-SET,tiktok_mrs,Tiktok'],
    providers: [
      {
        key: 'tiktok_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/tiktok.mrs`,
        path: './ruleset/metacubex/tiktok.mrs',
        format: 'mrs',
        behavior: 'domain'
      }
    ]
  },

  {
    key: 'spotify',
    name: 'Spotify',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Spotify.png',
    url: 'https://spclient.wg.spotify.com/signup/public/v1/account',
    rules: ['RULE-SET,spotify_mrs,Spotify'],
    providers: [
      {
        key: 'spotify_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/spotify.mrs`,
        path: './ruleset/metacubex/spotify.mrs',
        format: 'mrs',
        behavior: 'domain'
      }
    ]
  },

  {
    key: 'telegram',
    name: 'Telegram',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Telegram.png',
    url: 'https://www.telegram.org/img/website_icon.svg',
    rules: [
      'RULE-SET,telegram_domain_mrs,Telegram',
      // ⭐ 核心修复：必须添加 no-resolve，杜绝 DNS 泄漏！
      'RULE-SET,telegram_ip_mrs,Telegram,no-resolve'
    ],
    providers: [
      {
        key: 'telegram_domain_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/telegram.mrs`,
        path: './ruleset/metacubex/telegram_domain.mrs',
        format: 'mrs',
        behavior: 'domain'
      },
      {
        key: 'telegram_ip_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/telegram.mrs`,
        path: './ruleset/metacubex/telegram_ip.mrs',
        format: 'mrs',
        behavior: 'ipcidr'
      }
    ]
  },

  {
    key: 'line',
    name: 'Line',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Line.png',
    url: 'https://line.me/page-data/app-data.json',
    rules: ['RULE-SET,line_mrs,Line'],
    providers: [
      {
        key: 'line_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/line.mrs`,
        path: './ruleset/metacubex/line.mrs',
        format: 'mrs',
        behavior: 'domain'
      }
    ]
  },

  {
    key: 'games',
    name: '游戏专用',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Game.png',
    rules: [
      'RULE-SET,category-games-cn_mrs,国内网站',
      'RULE-SET,category-games_mrs,游戏专用'
    ],
    providers: [
      {
        key: 'category-games-cn_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-games@cn.mrs`,
        path: './ruleset/metacubex/category-games-cn.mrs',
        format: 'mrs',
        behavior: 'domain'
      },
      {
        key: 'category-games_mrs',
        url: `${githubProxy}https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-games.mrs`,
        path: './ruleset/metacubex/category-games.mrs',
        format: 'mrs',
        behavior: 'domain'
      }
    ]
  },
]

// --- 3. 主入口 ---

function main(config) {
  if (!enable) return config

  config.proxies = config?.proxies || []

  const proxies = config.proxies
  const proxyCount = proxies.length

  const proxyProviderCount =
    typeof config?.['proxy-providers'] === 'object'
      ? Object.keys(config['proxy-providers']).length
      : 0

  if (proxyCount === 0 && proxyProviderCount === 0) {
    throw new Error('配置文件中未找到任何代理')
  }

  config['allow-lan'] = allowLan
  config['bind-address'] = allowLan ? '*' : '127.0.0.1'
  config['mode'] = 'rule'
  config['ipv6'] = ipv6

  config['mixed-port'] = 7890
  config['redir-port'] = 7892
  config['tproxy-port'] = 7895

  config['external-ui'] = 'ui'
  config['external-ui-url'] =
    `${githubProxy}https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip`

  config['dns'] = dnsConfig

  config['profile'] = {
    'store-selected': true,
    'store-fake-ip': true
  }

  config['unified-delay'] = true
  config['tcp-concurrent'] = true
  config['keep-alive-interval'] = 1800
  config['find-process-mode'] = 'strict'
  config['geodata-mode'] = true
  config['geodata-loader'] = 'standard'
  config['geo-auto-update'] = true
  config['geo-update-interval'] = 24

  config['sniffer'] = {
    enable: true,
    'force-dns-mapping': true,
    'parse-pure-ip': false,
    'override-destination': true,

    sniff: {
      TLS: { ports: [443, 8443] },
      HTTP: { ports: [80, '8080-8880'] },
      QUIC: { ports: [443, 8443] }
    },

    'skip-src-address': skipIps,
    'skip-dst-address': skipIps,

    'force-domain': [
      'geosite:google',
      'geosite:youtube',
      'geosite:category-ai-!cn',
      'geosite:netflix',
      'geosite:facebook',
      'geosite:twitter'
    ],

    'skip-domain': ['Mijia Cloud', '+.oray.com'],
  }

  config['ntp'] = {
    enable: true,
    'write-to-system': false,
    server: 'cn.ntp.org.cn'
  }

  config['tun'] = {
    enable: true,
    stack: 'system',
    device: 'utun1999',
    'auto-route': true,
    'auto-redirect': true,
    'auto-detect-interface': true,
    'strict-route': true,
    mtu: 1500,
    gso: true,
    'gso-max-size': 65536,
    'exclude-interface': ['NodeBabyLink'],
    'route-exclude-address': skipIps.filter((ip) => ip !== '198.18.0.0/16'),
    'dns-hijack': ['any:53', 'tcp://any:53'],
  }

  config['geox-url'] = {
    geoip: `${githubProxy}https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat`,
    geosite: `${githubProxy}https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat`,
    mmdb: `${githubProxy}https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip.metadb`,
    asn: `${githubProxy}https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb`,
  }

  // ==========================================
  // 3.2 多订阅聚合
  // ==========================================
  const providerKeys = []

  if (typeof subscriptions === 'object' && subscriptions !== null) {
    const entries = Object.entries(subscriptions).filter(([, cfg]) => {
      const url = cfg && cfg.url
      return url && typeof url === 'string' && /^https?:\/\//.test(url)
    })

    if (entries.length > 0) {
      config['proxy-providers'] = config['proxy-providers'] || {}

      entries.forEach(([key, cfg]) => {
        providerKeys.push(key)

        const provider = {
          type: cfg.type || 'http',
          url: cfg.url,
          interval: cfg.interval || 86400,
          'health-check': {
            enable: true,
            url: 'https://www.gstatic.com/generate_204',
            interval: checkInterval
          },
        }

        if (cfg.override && cfg.override['additional-prefix']) {
          provider.override = {
            'additional-prefix': cfg.override['additional-prefix']
          }
        }

        config['proxy-providers'][key] = provider
      })
    }
  }

  config.proxies.push({
    name: '直连',
    type: 'direct',
    udp: true
  })

  // ==========================================
  // 3.3 本地代理分类
  // ==========================================
  const regionGroups = {}

  regionDefinitions.forEach((r) => {
    regionGroups[r.name] = {
      ...r,
      proxies: []
    }
  })

  const otherProxies = []

  for (let i = 0; i < proxyCount; i++) {
    const proxy = proxies[i]
    const name = proxy.name

    if (isAdInfoNode(name)) continue

    if (excludeHighPercentage) {
      const match = multiplierRegex.exec(name)
      if (match) {
        const ratio = parseFloat(match[1] || match[2])
        if (!isNaN(ratio) && ratio > globalRatioLimit) {
          continue
        }
      }
    }

    let matched = false
    for (const region of regionDefinitions) {
      if (region.regex.test(name)) {
        regionGroups[region.name].proxies.push(name)
        matched = true
        break
      }
    }

    if (!matched) {
      otherProxies.push(name)
    }
  }

  // ==========================================
  // 3.4 构建地区策略组
  // ==========================================
  const generatedRegionGroups = []
  const hasProviders = providerKeys.length > 0
  const allRegionKeywords = regionDefinitions
    .map((r) => r.filter.replace('(?i)', ''))
    .join('|')

  regionDefinitions.forEach((r) => {
    const groupData = regionGroups[r.name]
    const hasLocalNodes = groupData.proxies.length > 0

    if (hasLocalNodes) {
      const group = {
        ...groupBaseOption,
        name: r.name,
        type: 'url-test',
        tolerance: 50,
        icon: r.icon,
        proxies: groupData.proxies
      }

      if (hasProviders) {
        group.use = providerKeys
        group.filter = r.filter
      }

      generatedRegionGroups.push(group)
    }
  })

  if (otherProxies.length > 0 || hasProviders) {
    const otherGroup = {
      ...groupBaseOption,
      name: '其他节点',
      type: 'select',
      icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Global.png'
    }

    if (otherProxies.length > 0) {
      otherGroup.proxies = otherProxies
    }

    if (hasProviders) {
      otherGroup.use = providerKeys
      if (otherProxies.length === 0) {
        otherGroup.filter = `(?i)^(?!.*(?:${allRegionKeywords})).*`
      }
    }

    generatedRegionGroups.push(otherGroup)
  }

  const regionGroupNames = generatedRegionGroups.map((g) => g.name)
  const allLocalProxyNames = []

  regionDefinitions.forEach((r) => {
    const groupData = regionGroups[r.name]
    if (groupData && groupData.proxies.length > 0) {
      allLocalProxyNames.push(...groupData.proxies)
    }
  })

  allLocalProxyNames.push(...otherProxies)

  // ==========================================
  // 3.5 构建功能策略组
  // ==========================================
  const functionalGroups = []

  // 1. 主节点
  const primaryRegex = /(?:自建|free)/i
  const primaryProxies = allLocalProxyNames.filter((name) =>
    primaryRegex.test(name)
  )

  const hasPrimaryNode = enablePrimaryNode && primaryProxies.length > 0

  if (hasPrimaryNode) {
    const primaryGroup = {
      ...groupBaseOption,
      name: '主节点',
      type: 'url-test',
      tolerance: 50,
      proxies: primaryProxies,
      icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_States.png',
    }

    if (hasProviders) {
      primaryGroup.use = providerKeys
      primaryGroup.filter = '(?i)自建|free'
    }

    functionalGroups.push(primaryGroup)
  }

  // 2. 备用节点
  const backupProxies = allLocalProxyNames.filter(
    (name) =>
      !primaryRegex.test(name) &&
      !name.includes('专线') &&
      /日本|🇯🇵|jp|japan|新加坡|🇸🇬|sg|singapore/i.test(name)
  )

  const backupGroup = {
    ...groupBaseOption,
    name: '备用节点',
    type: 'url-test',
    tolerance: 50,
    proxies: backupProxies.length > 0 ? backupProxies : ['直连'],
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Japan.png',
  }

  if (hasProviders) {
    backupGroup.use = providerKeys
    backupGroup.filter = '(?i)日本|🇯🇵|jp|japan|新加坡|🇸🇬|sg|singapore'
    backupGroup['exclude-filter'] = '(?i)自建|free|专线'
  }

  functionalGroups.push(backupGroup)

  // 3. 默认节点
  const defaultNodeGroup = {
    ...groupBaseOption,
    name: '默认节点',
    type: 'fallback',
    proxies: hasPrimaryNode ? ['主节点', '备用节点'] : ['备用节点'],
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Proxy.png',
  }

  functionalGroups.push(defaultNodeGroup)

  // 4. 服务策略组
  serviceConfigs.forEach((svc) => {
    if (!ruleOptions[svc.key]) return

    rules.push(...svc.rules)

    if (Array.isArray(svc.providers)) {
      svc.providers.forEach((p) => {
        ruleProviders[p.key] = {
          ...ruleProviderCommon,
          behavior: p.behavior,
          format: p.format,
          url: p.url,
          path: p.path
        }
      })
    }

    let groupProxies

    if (svc.reject) {
      groupProxies = ['REJECT', '直连', '默认节点', '备用节点']
    } else if (svc.key === 'openai' || svc.key === 'crypto') {
      groupProxies = hasPrimaryNode
        ? ['默认节点', '备用节点', '主节点', ...regionGroupNames, '直连']
        : ['默认节点', '备用节点', ...regionGroupNames, '直连']
      svc._isStrictRegion = false
    } else {
      groupProxies = ['默认节点', '备用节点', ...regionGroupNames, '直连']
    }

    const group = {
      ...groupBaseOption,
      name: svc.name,
      type: 'select',
      proxies: groupProxies,
      icon: svc.icon
    }

    if (svc.url) {
      group.url = svc.url
    }

    if (hasProviders) {
      group.use = providerKeys
      if (svc._isStrictRegion) {
        group.filter =
          '(?i)港|🇭🇰|hk|hongkong|美|🇺🇸|us|usa|日本|🇯🇵|jp|japan|新加坡|🇸🇬|sg|singapore'
      }
    }

    functionalGroups.push(group)
  })

  // ==========================================
  // 3.6 通用兜底策略组 (IP 规则沉底)
  // ==========================================
  rules.push(
    'GEOSITE,category-public-tracker,直连',
    'GEOSITE,category-game-platforms-download@cn,直连',
    'GEOIP,private,直连,no-resolve',
    'GEOSITE,cn,国内网站',
    'GEOIP,cn,国内网站,no-resolve',
    'MATCH,其他外网'
  )

  const buildFixedGroup = (opts) => {
    const group = {
      ...groupBaseOption,
      ...opts
    }

    if (hasProviders) {
      group.use = providerKeys
    }

    return group
  }

  functionalGroups.push(
    buildFixedGroup({
      name: '其他外网',
      type: 'select',
      proxies: ['默认节点', '备用节点', '国内网站', ...allLocalProxyNames],
      icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Dark/GlobalMedia.png'
    }),

    buildFixedGroup({
      name: '国内网站',
      type: 'select',
      proxies: ['直连', '默认节点', '备用节点', ...allLocalProxyNames],
      url: 'https://wifi.vivo.com.cn/generate_204',
      icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/China_Map.png'
    })
  )

  // ==========================================
  // 3.7 组装最终结果
  // ==========================================
  config['proxy-groups'] = [...functionalGroups, ...generatedRegionGroups]
  config['rules'] = rules
  config['rule-providers'] = ruleProviders

  return config
}
