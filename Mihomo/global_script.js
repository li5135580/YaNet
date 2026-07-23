/***
 * Clash Verge Rev / Mihomo Party 优化脚本 
 * 原作者: dahaha-365 (YaNet)
 * 修改：精确主节点 + 备用节点（包含“日本高速”） + fallback 自动切换
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
const _skipIps =
  '10.0.0.0/8;100.64.0.0/10;127.0.0.0/8;169.254.0.0/16;172.16.0.0/12;192.168.0.0/16;198.18.0.0/16;FC00::/7;FE80::/10;::1/128'

const _proxyProviders = {
  P1: {
    type: 'http',
    url: '聚合订阅链接1',
    interval: 86400,
    override: { 'additional-prefix': 'P1 | ' },
  },
  P2: {
    type: 'http',
    url: '聚合订阅链接2',
    interval: 86400,
    override: { 'additional-prefix': 'P2 | ' },
  },
}

// DNS 配置
const _chinaDohDns = 'https://doh.pub/dns-query;https://dns.alidns.com/dns-query'
const _foreignDohDns = 'https://dns.google/dns-query;https://dns.adguard-dns.com/dns-query'
const _chinaIpDns = '119.29.29.29;223.5.5.5'
const _foreignIpDns = '8.8.8.8;94.140.14.14'

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
        foreignDNS: _foreignDohDns,
        mode: 'default',
        ipv6: false,
        logLevel: 'error',
        githubProxy: 'https://ghfast.top/',
        subscriptions: _proxyProviders,
      }

let {
  enable = true,
  ruleSet = 'all',
  regionSet = 'all',
  excludeHighPercentage = true,
  globalRatioLimit = 2,
  skipIps = _skipIps,
  defaultDNS = _chinaIpDns,
  directDNS = _chinaIpDns,
  chinaDNS = _chinaDohDns,
  foreignDNS = _foreignDohDns,
  mode = '',
  ipv6 = false,
  logLevel = 'error',
  githubProxy = 'https://ghfast.top/',
  subscriptions = _proxyProviders,
} = args

if (['securest', 'secure', 'default', 'fast', 'fastest'].includes(mode)) {
  switch (mode) {
    case 'securest':
      defaultDNS = _foreignIpDns
      directDNS = _foreignDohDns
      break
    case 'secure':
      defaultDNS = _foreignIpDns
      directDNS = _chinaDohDns
      chinaDNS = _chinaDohDns
      foreignDNS = _foreignDohDns
      break
    case 'fast':
      defaultDNS = _chinaIpDns
      directDNS = _chinaIpDns
      chinaDNS = _chinaIpDns
      foreignDNS = _chinaDohDns
      break
    case 'fastest':
      defaultDNS = _chinaIpDns
      directDNS = _chinaIpDns
      chinaDNS = _chinaIpDns
      foreignDNS = _foreignIpDns
      break
    default:
      defaultDNS = _chinaIpDns
      directDNS = _chinaIpDns
      chinaDNS = _chinaDohDns
      foreignDNS = _chinaDohDns
      break
  }
}

skipIps = stringToArray(skipIps)
defaultDNS = stringToArray(defaultDNS)
directDNS = stringToArray(directDNS)
chinaDNS = stringToArray(chinaDNS)
foreignDNS = stringToArray(foreignDNS)

// 分流规则配置
let ruleOptions = {
  apple: false,
  microsoft: true,
  github: true,
  google: true,
  openai: true,
  crypto: true,
  spotify: true,
  youtube: true,
  bahamut: false,
  netflix: false,
  tiktok: false,
  disney: false,
  hbo: false,
  hulu: false,
  primevideo: false,
  telegram: true,
  line: false,
  games: true,
  ads: true,
}

if (ruleSet === 'all') {
  Object.keys(ruleOptions).forEach((key) => (ruleOptions[key] = true))
}

const rules = ['PROCESS-NAME-REGEX,(?i).*cloudflared.*,直连']

// 地区定义
const allRegionDefinitions = [
  { name: 'HK香港', regex: /港|🇭🇰|hk|hongkong|hong kong/i, filter: '(?i)港|🇭🇰|hk|hongkong|hong kong', icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Hong_Kong.png' },
  { name: 'US美国', regex: /\b(usa|united states)\b|(?:\b|_)us(?:\b|_|\d+)|美|🇺🇸/i, filter: '(?i)\\b(usa|united states)\\b|(?:\\b|_)us(?:\\b|_|\\d+)|美|🇺🇸', icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_States.png' },
  { name: 'JP日本', regex: /日本|🇯🇵|jp|japan/i, filter: '(?i)日本|🇯🇵|jp|japan', icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Japan.png' },
  // ... 其他地区定义可继续添加（保持原样）
]

let regionDefinitions = regionSet === 'all' ? allRegionDefinitions : allRegionDefinitions.filter(r => {
  const prefix = r.name.substring(0, 2)
  return regionSet.split(';').map(s => s.trim()).includes(prefix)
})

const dnsConfig = {
  enable: true,
  listen: '0.0.0.0:53',
  ipv6: ipv6,
  'log-level': logLevel,
  'prefer-h3': true,
  'use-hosts': true,
  'use-system-hosts': true,
  'respect-rules': true,
  'enhanced-mode': 'fake-ip',
  'fake-ip-range': '198.18.0.0/16',
  'fake-ip-filter-mode': 'blacklist',
  'fake-ip-filter': ['*.lan', '*.local', 'geosite:private'],
  nameserver: chinaDNS,
  'default-nameserver': defaultDNS,
  'direct-nameserver': directDNS,
  fallback: foreignDNS,
  'fallback-filter': { geoip: true, 'geoip-code': 'CN', geosite: ['gfw'] },
  'nameserver-policy': {
    'geosite:private': 'system',
    'geosite:tld-cn,cn': chinaDNS,
    'geosite:gfw,category-ai-!cn': foreignDNS,
  },
}

const groupBaseOption = {
  interval: 30,        // 每30秒健康检测
  timeout: 3000,
  url: 'https://www.gstatic.com/generate_204',
  lazy: true,
  'max-failed-times': 3,
  hidden: false,
}

// 机场广告过滤函数
function isAdInfoNode(name) {
  if (!name) return false
  return /导航|到期|剩余|流量|重置|Panel|Author|Traffic/i.test(name)
}

// 服务规则（保持原样）
const serviceConfigs = [
  {
    key: 'github',
    name: 'Github',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/GitHub.png',
    url: 'https://github.com/robots.txt',
    rules: ['GEOSITE,github,Github'],
  },
  {
    key: 'microsoft',
    name: '微软服务',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Microsoft.png',
    url: 'https://www.msftconnecttest.com/connecttest.txt',
    rules: ['GEOSITE,microsoft@cn,国内网站', 'GEOSITE,microsoft,微软服务'],
  },
  {
    key: 'openai',
    name: '国外AI',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/AI.png',
    url: 'https://chat.openai.com/cdn-cgi/trace',
    rules: [
      'GEOSITE,jetbrains-ai,国外AI',
      'GEOSITE,category-ai-!cn,国外AI',
      'GEOSITE,category-ai-chat-!cn,国外AI',
      'DOMAIN-SUFFIX,chatgpt.com,国外AI',
      'DOMAIN-SUFFIX,openai.com,国外AI',
      'DOMAIN-SUFFIX,oaistatic.com,国外AI',
      'DOMAIN-SUFFIX,oaiusercontent.com,国外AI',
      'DOMAIN-SUFFIX,gemini.google.com,国外AI',
      'DOMAIN-SUFFIX,gemini.com,国外AI',
      'DOMAIN-SUFFIX,generativelanguage.googleapis.com,国外AI',
      'DOMAIN-SUFFIX,ai.google.dev,国外AI',
      'DOMAIN-SUFFIX,aistudio.google.com,国外AI',
      'DOMAIN-SUFFIX,anthropic.com,国外AI',
      'DOMAIN-SUFFIX,claude.ai,国外AI',
      'DOMAIN-SUFFIX,meta.ai,国外AI',
      'DOMAIN-SUFFIX,meta.com,国外AI',
      'DOMAIN-SUFFIX,perplexity.ai,国外AI',
      'DOMAIN-SUFFIX,mistral.ai,国外AI',
      'DOMAIN-SUFFIX,midjourney.com,国外AI',
      'DOMAIN-SUFFIX,poe.com,国外AI',
      'DOMAIN-SUFFIX,cohere.ai,国外AI',
      'DOMAIN-SUFFIX,cohere.com,国外AI',
      'DOMAIN-SUFFIX,character.ai,国外AI',
      'DOMAIN-SUFFIX,huggingface.co,国外AI',
      'DOMAIN-SUFFIX,hf.co,国外AI',
      'DOMAIN-SUFFIX,cursor.sh,国外AI',
      'DOMAIN-SUFFIX,cursor.com,国外AI',
      'DOMAIN-SUFFIX,groq.com,国外AI',
      'DOMAIN-SUFFIX,x.ai,国外AI',
      'DOMAIN-SUFFIX,grok.com,国外AI',
      'DOMAIN-SUFFIX,openrouter.ai,国外AI',
      'DOMAIN-SUFFIX,api.openai.com,国外AI',
      'DOMAIN-SUFFIX,api.anthropic.com,国外AI',
      'DOMAIN-SUFFIX,cursorapi.com,国外AI',
      'DOMAIN-SUFFIX,vertexai.googleapis.com,国外AI',
      'DOMAIN-SUFFIX,together.ai,国外AI',
      'DOMAIN-SUFFIX,replicate.com,国外AI',
      'DOMAIN-SUFFIX,stability.ai,国外AI',
      'DOMAIN-SUFFIX,runwayml.com,国外AI',
      'DOMAIN-SUFFIX,suno.ai,国外AI',
      'DOMAIN-SUFFIX,you.com,国外AI',
      'DOMAIN-SUFFIX,copilot.microsoft.com,国外AI',
      'DOMAIN-SUFFIX,v0.dev,国外AI',
      'PROCESS-NAME-REGEX,(?i).*Antigravity.*,国外AI',
      'PROCESS-NAME-REGEX,(?i).*language_server_.*,国外AI',
    ],
  },
  {
    key: 'crypto', // 修正：采用具体域名后缀进行精准分流，彻底避开 geosite 报错
    name: '虚拟货币',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Cryptocurrency.png',
    url: 'https://www.binance.com/robots.txt',
    rules: [
      // 币安 Binance
      'DOMAIN-SUFFIX,binance.com,虚拟货币',
      'DOMAIN-SUFFIX,bnappzh.co,虚拟货币',
      'DOMAIN-SUFFIX,binance.me,虚拟货币',
      'DOMAIN-SUFFIX,binance.co,虚拟货币',
      'DOMAIN-SUFFIX,binance.us,虚拟货币',
      'DOMAIN-KEYWORD,binance,虚拟货币',
      // 欧易 OKX
      'DOMAIN-SUFFIX,okx.com,虚拟货币',
      'DOMAIN-SUFFIX,okx-dns.com,虚拟货币',
      'DOMAIN-SUFFIX,okex.com,虚拟货币',
      'DOMAIN-KEYWORD,okx,虚拟货币',
      // Coinbase
      'DOMAIN-SUFFIX,coinbase.com,虚拟货币',
      'DOMAIN-SUFFIX,coinbase.co,虚拟货币',
      // Bybit
      'DOMAIN-SUFFIX,bybit.com,虚拟货币',
      'DOMAIN-SUFFIX,bybit.co,虚拟货币',
      'DOMAIN-SUFFIX,byapps.net,虚拟货币',
      // Gate.io
      'DOMAIN-SUFFIX,gate.io,虚拟货币',
      // HTX (火币)
      'DOMAIN-SUFFIX,htx.com,虚拟货币',
      'DOMAIN-SUFFIX,huobi.com,虚拟货币',
      // Bitget
      'DOMAIN-SUFFIX,bitget.com,虚拟货币',
      // Kraken
      'DOMAIN-SUFFIX,kraken.com,虚拟货币',
      // 常用钱包与资产看板工具
      'DOMAIN-SUFFIX,metamask.io,虚拟货币',
      'DOMAIN-SUFFIX,trustwallet.com,虚拟货币',
      'DOMAIN-SUFFIX,tradingview.com,虚拟货币',
      'DOMAIN-SUFFIX,coinmarketcap.com,虚拟货币',
      'DOMAIN-SUFFIX,coingecko.com,虚拟货币',
    ],
  },
  {
    key: 'apple',
    name: '苹果服务',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Apple.png',
    url: 'https://www.apple.com/library/test/success.html',
    rules: ['GEOSITE,apple-cn,苹果服务'],
  },
  {
    key: 'google',
    name: '谷歌服务',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Google_Search.png',
    url: 'https://www.google.com/generate_204',
    rules: ['GEOSITE,google,谷歌服务'],
  },
  {
    key: 'youtube',
    name: 'YouTube',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/YouTube.png',
    url: 'https://www.youtube.com/s/desktop/494dd881/img/favicon.ico',
    rules: ['GEOSITE,youtube,YouTube'],
  },
  {
    key: 'bahamut',
    name: '巴哈姆特',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Bahamut.png',
    url: 'https://ani.gamer.com.tw/ajax/getdeviceid.php',
    rules: ['GEOSITE,bahamut,巴哈姆特'],
  },
  {
    key: 'disney',
    name: 'Disney+',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Disney.png',
    url: 'https://disney.api.edge.bamgrid.com/devices',
    rules: ['GEOSITE,disney,Disney+'],
  },
  {
    key: 'netflix',
    name: 'NETFLIX',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Netflix_Letter.png',
    url: 'https://api.fast.com/netflix/speedtest/v2?https=true',
    rules: ['GEOSITE,netflix,NETFLIX'],
  },
  {
    key: 'tiktok',
    name: 'Tiktok',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/TikTok.png',
    url: 'https://www.tiktok.com/',
    rules: ['GEOSITE,tiktok,Tiktok'],
  },
  {
    key: 'spotify',
    name: 'Spotify',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Spotify.png',
    url: 'https://spclient.wg.spotify.com/signup/public/v1/account',
    rules: ['GEOSITE,spotify,Spotify'],
  },
  {
    key: 'hbo',
    name: 'HBO',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/HBO.png',
    url: 'https://www.hbo.com/favicon.ico',
    rules: ['GEOSITE,hbo,HBO'],
  },
  {
    key: 'primevideo',
    name: 'Prime Video',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Prime_Video.png',
    url: 'https://m.media-amazon.com/images/G/01/digital/video/web/logo-min-remaster.png',
    rules: ['GEOSITE,primevideo,Prime Video'],
  },
  {
    key: 'hulu',
    name: 'Hulu',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Hulu.png',
    url: 'https://auth.hulu.com/v4/web/password/authenticate',
    rules: ['GEOSITE,hulu,Hulu'],
  },
  {
    key: 'telegram',
    name: 'Telegram',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Telegram.png',
    url: 'https://www.telegram.org/img/website_icon.svg',
    rules: ['GEOIP,telegram,Telegram'],
  },
  {
    key: 'line',
    name: 'Line',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Line.png',
    url: 'https://line.me/page-data/app-data.json',
    rules: ['GEOSITE,line,Line'],
  },
  {
    key: 'games',
    name: '游戏专用',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Game.png',
    rules: ['GEOSITE,category-games@cn,国内网站', 'GEOSITE,category-games,游戏专用'],
  },
  {
    key: 'ads',
    name: '广告过滤',
    icon: 'https://raw.githubusercontent.com/Lanlan13-14/Icon-for-webui/main/block.png',
    rules: [
      'GEOSITE,category-ads-all,广告过滤',
      'RULE-SET,adblockmihomo,广告过滤',
      'DOMAIN-SUFFIX,ad.ldmnq.com,广告过滤',
      'DOMAIN-SUFFIX,ads.ldmnq.com,广告过滤',
      'DOMAIN-SUFFIX,push.ldmnq.com,广告过滤',
      'DOMAIN-SUFFIX,stat.ldmnq.cn,广告过滤',
      'DOMAIN-SUFFIX,log.ldmnq.cn,广告过滤',
      'DOMAIN-SUFFIX,mnqlog.ldmnq.com,广告过滤',
    ],
    providers: [
      {
        key: 'adblockmihomo',
        url: 'https://github.com/217heidai/adblockfilters/raw/refs/heads/main/rules/adblockmihomo.mrs',
        path: './ruleset/adblockfilters/adblockmihomo.mrs',
        format: 'mrs',
        behavior: 'domain',
      },
    ],
    reject: true,
  },
]

// --- 主入口 ---
function main(config) {
  if (!enable) return config

  config.proxies = config?.proxies || []
  const proxies = config.proxies
  const allProxyNames = proxies.map(p => p.name)

  // 基础配置
  config['allow-lan'] = true
  config['mode'] = 'rule'
  config['ipv6'] = ipv6
  config['mixed-port'] = 7890
  config['dns'] = dnsConfig
  config['sniffer'] = {
    enable: true,
    'force-dns-mapping': true,
    'parse-pure-ip': false,
    'override-destination': true,
    sniff: {
      TLS: { ports: [443, 8443] },
      HTTP: { ports: [80, '8080-8880'] },
      QUIC: { ports: [443, 8443] },
    },
    'skip-src-address': skipIps,
    'skip-dst-address': skipIps,
    'force-domain': [
      'geosite:google',
      'geosite:youtube',
      'geosite:category-ai-!cn',
      'geosite:netflix',
      'geosite:facebook',
      'geosite:twitter',
    ],
    'skip-domain': ['Mijia Cloud', '+.oray.com'],
  }

  config['ntp'] = {
    enable: true,
    'write-to-system': false,
    server: 'cn.ntp.org.cn',
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

  config.proxies.push({ name: '直连', type: 'direct', udp: true })
  config.proxies.push({ name: '拒绝', type: 'reject', udp: true })

  // ====================== 主节点 & 备用节点 ======================
  // 主节点：精确两个节点
  const mainNodeNames = [
    '🇺🇸 美国 | 72.249.203 | TUIC',
    '🇺🇸 美国 | 72.249.203 | H2'
  ].filter(n => allProxyNames.includes(n))

  const 主节点 = {
    ...groupBaseOption,
    name: '主节点',
    type: 'url-test',
    tolerance: 50,
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_States.png',
    proxies: mainNodeNames.length ? mainNodeNames : ['直连']
  }

  // 备用节点：包含 “日本高速”
  const backupNodeNames = allProxyNames.filter(name => name && name.includes('日本高速'))

  const 备用节点 = {
    ...groupBaseOption,
    name: '备用节点',
    type: 'url-test',
    tolerance: 50,
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Japan.png',
    proxies: backupNodeNames.length ? backupNodeNames : ['直连']
  }

  // 默认节点 = fallback
  const defaultNodeGroup = {
    ...groupBaseOption,
    name: '默认节点',
    type: 'fallback',
    proxies: ['主节点', '备用节点'],
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Proxy.png'
  }

  const functionalGroups = [defaultNodeGroup, 主节点, 备用节点]

  // 其他分流规则（自动使用默认节点）
  serviceConfigs.forEach((svc) => {
    if (!ruleOptions[svc.key]) return
    rules.push(...svc.rules)

    const group = {
      ...groupBaseOption,
      name: svc.name,
      type: 'select',
      proxies: ['默认节点', '直连'],
      url: svc.url,
      icon: svc.icon,
    }
    functionalGroups.push(group)
  })

  // 兜底
  rules.push(
    'GEOSITE,private,直连',
    'GEOIP,private,直连,no-resolve',
    'GEOSITE,cn,国内网站',
    'GEOIP,cn,国内网站,no-resolve',
    'MATCH,其他外网'
  )

  functionalGroups.push({
    ...groupBaseOption,
    name: '国内网站',
    type: 'select',
    proxies: ['直连', '默认节点'],
  })

  config['proxy-groups'] = functionalGroups
  config['rules'] = rules

  return config
}
