/***
 * Clash Verge Rev / Mihomo Party 优化脚本 
 * 原作者: dahaha-365 (YaNet)
 * GitHub：https://github.com/dahaha-365/YaNet
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

/**
 * 多订阅聚合配置
 */
const _proxyProviders = {
  P1: {
    type: 'http',
    url: '聚合订阅链接1',
    interval: 86400,
    override: {
      'additional-prefix': 'P1 | ',
    },
  },
  P2: {
    type: 'http',
    url: '聚合订阅链接2',
    interval: 86400,
    override: {
      'additional-prefix': 'P2 | ',
    },
  },
}

// DNS 配置
const _chinaDohDns = 'https://doh.pub/dns-query;https://dns.alidns.com/dns-query'
const _foreignDohDns = 'https://dns.google/dns-query;https://dns.adguard-dns.com/dns-query'
const _chinaIpDns = '119.29.29.29;223.5.5.5'
const _foreignIpDns = '8.8.8.8;94.140.14.14'

/**
 * 整个脚本的总开关
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
        foreignDNS: _foreignDohDns,
        mode: 'default',
        ipv6: false,
        logLevel: 'error',
        githubProxy: 'https://ghfast.top/',
        subscriptions: _proxyProviders,
        checkInterval: 900, // 修改点：测速间隔改为 900 秒 (15分钟)
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
  checkInterval = 900, // 提取测速间隔，默认 15 分钟
} = args

/**
 * 模式配置
 */
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
}

if (ruleSet === 'all') {
  Object.keys(ruleOptions).forEach((key) => (ruleOptions[key] = true))
} else if (typeof ruleSet === 'string') {
  const enabledKeys = ruleSet.split(';').map((s) => s.trim())
  enabledKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(ruleOptions, key)) {
      ruleOptions[key] = true
    }
  })
}

const rules = ['PROCESS-NAME-REGEX,(?i).*cloudflared.*,直连']

const allRegionDefinitions = [
  { name: 'HK香港', regex: /港|🇭🇰|hk|hongkong|hong kong/i, filter: '(?i)港|🇭🇰|hk|hongkong|hong kong', icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Hong_Kong.png' },
  { name: 'US美国', regex: /\b(usa|united states)\b|(?:\b|_)us(?:\b|_|\d+)|美|🇺🇸/i, filter: '(?i)\\b(usa|united states)\\b|(?:\\b|_)us(?:\\b|_|\\d+)|美|🇺🇸', icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_States.png' },
  { name: 'JP日本', regex: /日本|🇯🇵|jp|japan/i, filter: '(?i)日本|🇯🇵|jp|japan', icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Japan.png' },
  { name: 'KR韩国', regex: /韩|🇰🇷|kr|korea/i, filter: '(?i)韩|🇰🇷|kr|korea', icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Korea.png' },
  { name: 'SG新加坡', regex: /新加坡|🇸🇬|sg|singapore/i, filter: '(?i)新加坡|🇸🇬|sg|singapore', icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Singapore.png' },
  { name: 'TW台湾省', regex: /台湾|台灣|🇹🇼|tw|taiwan|tai wan/i, filter: '(?i)台湾|台灣|🇹🇼|tw|taiwan|tai wan', icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Taiwan.png' },
  { name: 'GB英国', regex: /英|🇬🇧|uk|united kingdom|great britain/i, filter: '(?i)英|🇬🇧|uk|united kingdom|great britain', icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_Kingdom.png' },
  { name: 'DE德国', regex: /德国|🇩🇪|de|germany/i, filter: '(?i)德国|🇩🇪|de|germany', icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Germany.png' },
  { name: 'MY马来西亚', regex: /马来|🇲🇾|my|malaysia/i, filter: '(?i)马来|🇲🇾|my|malaysia', icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Malaysia.png' },
  { name: 'TK土耳其', regex: /土耳其|🇹🇷|tk|turkey/i, filter: '(?i)土耳其|🇹🇷|tk|turkey', icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Turkey.png' },
  { name: 'CA加拿大', regex: /加拿大|🇨🇦|ca|canada/i, filter: '(?i)加拿大|🇨🇦|ca|canada', icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Canada.png' },
  { name: 'AU澳大利亚', regex: /澳大利亚|🇦🇺|au|australia|sydney/i, filter: '(?i)澳大利亚|🇦🇺|au|australia|sydney', icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Australia.png' },
]

let regionDefinitions = []
if (regionSet === 'all') {
  regionDefinitions = allRegionDefinitions
} else {
  const enabledRegions = regionSet.split(';').map((s) => s.trim())
  regionDefinitions = allRegionDefinitions.filter((r) => {
    const prefix = r.name.substring(0, 2)
    return enabledRegions.includes(prefix)
  })
}

// 修改点：① DNS 增强（V2）加入新属性
const dnsConfig = {
  enable: true,
  listen: '0.0.0.0:53',
  ipv6: ipv6,
  'independent-cache': true,  // 增强：独立缓存
  'cache-size': 8192,         // 增强：缓存大小
  'fallback-cache': true,     // 增强：回退缓存
  'log-level': logLevel,
  'prefer-h3': true,
  'use-hosts': true,
  'use-system-hosts': true,
  'respect-rules': true,
  'enhanced-mode': 'fake-ip',
  'fake-ip-range': '198.18.0.0/16',
  'fake-ip-filter-mode': 'blacklist',
  'fake-ip-filter': [
    '*.lan', '*.local', '*.market.xiaomi.com', 'localhost.ptlogin2.qq.com',
    'localhost.sec.qq.com', '+.msftconnecttest.com', '+.msftncsi.com',
    'router.asus.com', 'routerlogin.net', 'www.asusrouter.com', 'printer', 'nas',
    'time.*.com', 'time.*.gov', 'time.*.edu.cn', 'ntp.*.com', 'ntp.*.cn',
    'stun.*.*', 'stun.*.*.*', '+.stun.*.*', '+.stun.*.*.*', '+.market.xiaomi.com',
    'geosite:private', 'geosite:category-bank-jp',
  ],
  nameserver: chinaDNS,
  'default-nameserver': defaultDNS,
  'direct-nameserver': directDNS,
  fallback: foreignDNS,
  'fallback-filter': { geoip: true, 'geoip-code': 'CN', geosite: ['gfw'] },
  'proxy-server-nameserver': chinaDNS,
  'nameserver-policy': {
    'geosite:private': 'system',
    'geosite:tld-cn,cn,steam@cn,category-games@cn,microsoft@cn,apple@cn,category-game-platforms-download@cn,category-public-tracker': chinaDNS,
    'geosite:gfw,jetbrains-ai,category-ai-!cn,category-ai-chat-!cn': foreignDNS, 
  },
}

const ruleProviderCommon = { type: 'http', format: 'yaml', interval: 86400 }

// 修改点：解决耗电量的核心配置
const groupBaseOption = {
  interval: checkInterval, // 全局设为 15 分钟（900秒）
  timeout: 3000,
  url: 'https://www.gstatic.com/generate_204',
  lazy: true,              // 核心修改：恢复按需测速，不使用不唤醒基带，极大省电
  'max-failed-times': 3,   // 连续失败3次才判定故障进入冷却
  hidden: false,
}

const ruleProviders = {
  applications: {
    ...ruleProviderCommon,
    behavior: 'classical',
    format: 'text',
    url: 'https://github.com/DustinWin/ruleset_geodata/raw/refs/heads/mihomo-ruleset/applications.list',
    path: './ruleset/DustinWin/applications.list',
  },
}

const multiplierRegex = /(?:倍率[ :]*|(?:^|[\s\-_\[\]()])[xX✕✖⨉])\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:倍率|倍|[xX✕✖⨉](?:$|[\s\-_\[\]()]))/
const adInfoKeywords = ['导航网址', '距离下次重置', '剩余流量', '套餐到期', '网址导航', '官网', '订阅', '到期', '剩余', '重置', '流量', '已用', '总计', '续费']
const adInfoRegex = /\b(?:USE|USED|TOTAL|EXPIRE|EMAIL)\b|Panel|Channel|Author|Traffic|Reset|Expire|Renew|Support|Telegram|https?:\/\/|(?:\d+\.\d+)\s*(GB|TB|MB|KB)|\d{4}[-/]\d{2}[-/]\d{2}/i

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
      'RULE-SET,ai_rules,国外AI',
      'GEOSITE,jetbrains-ai,国外AI',
      'GEOSITE,category-ai-!cn,国外AI',
      'GEOSITE,category-ai-chat-!cn,国外AI'
    ],
    providers: [
      {
        key: 'ai_rules',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/OpenAI/OpenAI.yaml',
        path: './ruleset/blackmatrix7/openai.yaml',
        format: 'yaml',
        behavior: 'classical',
      }
    ]
  },
  {
    key: 'crypto', 
    name: '虚拟货币',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Cryptocurrency.png',
    url: 'https://www.binance.com/robots.txt',
    rules: [
      'RULE-SET,crypto_rules,虚拟货币'
    ],
    providers: [
      {
        key: 'crypto_rules',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Cryptocurrency/Cryptocurrency.yaml',
        path: './ruleset/blackmatrix7/cryptocurrency.yaml',
        format: 'yaml',
        behavior: 'classical',
      }
    ]
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
]

// --- 3. 主入口 ---

function main(config) {
  if (!enable) return config

  config.proxies ??= []
  const proxies = config.proxies
  const proxyCount = proxies.length
  const proxyProviderCount =
    typeof config?.['proxy-providers'] === 'object' && config['proxy-providers'] !== null
      ? Object.keys(config['proxy-providers']).length
      : 0
  const subscriptionEntries =
    typeof subscriptions === 'object' && subscriptions !== null
      ? Object.entries(subscriptions).filter(([, cfg]) => {
          const url = cfg && cfg.url
          return url && typeof url === 'string' && /^https?:\/\//.test(url)
        })
      : []

  if (proxyCount === 0 && proxyProviderCount === 0 && subscriptionEntries.length === 0) {
    throw new Error('配置文件中未找到任何代理')
  }

  // 3.1 覆盖基础配置
  config['allow-lan'] = false
  config['bind-address'] = '127.0.0.1'
  config['mode'] = 'rule'
  config['ipv6'] = ipv6
  config['external-controller'] = '127.0.0.1:1906'
  config['secret'] = 'mihomo_party_secret'
  config['mixed-port'] = 7890
  config['redir-port'] = 7891
  config['tproxy-port'] = 7892
  config['external-ui'] = 'ui'
  config['external-ui-url'] = `${githubProxy}https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip`
  config['dns'] = dnsConfig
  config['profile'] = {
    'store-selected': true,
    'store-fake-ip': true,
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

  // 3.2 多订阅聚合
  const providerKeys =
    typeof config['proxy-providers'] === 'object' && config['proxy-providers'] !== null
      ? Object.keys(config['proxy-providers'])
      : []
  if (subscriptionEntries.length > 0) {
    config['proxy-providers'] ??= {}
    subscriptionEntries.forEach(([key, cfg]) => {
      if (!providerKeys.includes(key)) providerKeys.push(key)
      const provider = {
        type: cfg.type ?? 'http',
        url: cfg.url,
        interval: cfg.interval ?? 86400,
        'health-check': {
          enable: true,
          url: 'https://www.gstatic.com/generate_204',
          interval: checkInterval,
        },
      }
      if (cfg.override && cfg.override['additional-prefix']) {
        provider.override = {
          'additional-prefix': cfg.override['additional-prefix'],
        }
      }
      config['proxy-providers'][key] = provider
    })
  }

  config.proxies.push({ name: '直连', type: 'direct', udp: true })
  config.proxies.push({ name: '拒绝', type: 'reject', udp: true })

  // 3.3 本地代理分类
  const regionGroups = {}
  regionDefinitions.forEach((r) => (regionGroups[r.name] = { ...r, proxies: [] }))
  const otherProxies = []

  for (let i = 0; i < proxyCount; i++) {
    const proxy = proxies[i]
    const name = proxy.name

    if (isAdInfoNode(name)) continue

    if (excludeHighPercentage) {
      const match = multiplierRegex.exec(name)
      if (match) {
        const ratio = parseFloat(match[1] ?? match[2])
        if (!isNaN(ratio) && ratio > globalRatioLimit) continue
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
    if (!matched) otherProxies.push(name)
  }

  // 3.4 构建地区策略组
  const generatedRegionGroups = []
  const hasProviders = providerKeys.length > 0
  const allRegionKeywords = regionDefinitions.map((r) => r.filter.replace('(?i)', '')).join('|')

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
        proxies: groupData.proxies,
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
      icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Global.png',
    }
    if (otherProxies.length > 0) otherGroup.proxies = otherProxies
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

  // 3.5 构建功能策略组
  const functionalGroups = []
  const primaryLocalNodes = allLocalProxyNames.filter((name) => name.includes('自建'))
  const dynamicLocalNodes = allLocalProxyNames.filter((name) => !name.includes('自建'))
  const defaultNodeProxies = []
  const shouldBuildPrimary = primaryLocalNodes.length > 0 || hasProviders
  const shouldBuildDynamic = dynamicLocalNodes.length > 0 || hasProviders

  if (shouldBuildPrimary) {
    const primaryGroup = {
      ...groupBaseOption,
      name: '主节点',
      type: 'url-test',
      tolerance: 50,
      'empty-fallback': 'REJECT',
      icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_States.png',
    }
    if (primaryLocalNodes.length > 0) primaryGroup.proxies = primaryLocalNodes
    if (hasProviders) {
      primaryGroup.use = providerKeys
      primaryGroup.filter = '自建'
    }
    functionalGroups.push(primaryGroup)
    defaultNodeProxies.push('主节点')
  }

  if (shouldBuildDynamic) {
    const dynamicGroup = {
      ...groupBaseOption,
      name: '动态均衡',
      type: 'url-test',
      url: 'https://chatgpt.com/cdn-cgi/trace',
      'expected-status': 200,
      tolerance: 0,
      'empty-fallback': 'REJECT',
      icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Auto.png',
    }
    if (dynamicLocalNodes.length > 0) dynamicGroup.proxies = dynamicLocalNodes
    if (hasProviders) {
      dynamicGroup.use = providerKeys
      dynamicGroup['exclude-filter'] = '自建'
    }
    functionalGroups.push(dynamicGroup)
    defaultNodeProxies.push('动态均衡')
  }

  if (defaultNodeProxies.length === 0) {
    throw new Error('现有过滤后未找到可用于主节点或动态均衡的候选节点')
  }

  const defaultNodeGroup = {
    ...groupBaseOption,
    name: '默认节点',
    type: 'fallback',
    proxies: defaultNodeProxies,
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Proxy.png',
  }
  functionalGroups.push(defaultNodeGroup)

  serviceConfigs.forEach((svc) => {
    if (ruleOptions[svc.key]) {
      rules.push(...svc.rules)

      if (Array.isArray(svc.providers)) {
        svc.providers.forEach((p) => {
          ruleProviders[p.key] = {
            ...ruleProviderCommon,
            behavior: p.behavior,
            format: p.format,
            url: p.url,
            path: p.path,
          }
        })
      }

      let groupProxies

      if (svc.reject) {
        groupProxies = ['REJECT', '直连', '默认节点']
      } else if (svc.key === 'bahamut') {
        groupProxies = ['默认节点', ...regionGroupNames, '直连']
      } else if (svc.key === 'openai' || svc.key === 'crypto') {
        const targetRegions = ['US美国', 'HK香港', 'JP日本', 'SG新加坡']
        let allowedProxies = []
        targetRegions.forEach(r => {
          if (regionGroups[r] && regionGroups[r].proxies.length > 0) {
            allowedProxies.push(...regionGroups[r].proxies)
          }
        })
        
        groupProxies = ['默认节点']
        if (allowedProxies.length > 0) {
          groupProxies.push(...allowedProxies)
        } else {
          groupProxies.push('直连')
        }
        
        svc._isStrictRegion = true
      } else {
        groupProxies = ['默认节点', ...regionGroupNames, '直连']
      }

      const group = {
        ...groupBaseOption,
        name: svc.name,
        type: 'select',
        proxies: groupProxies,
        url: svc.url,
        icon: svc.icon,
      }

      if (hasProviders) {
        group.use = providerKeys
        if (svc._isStrictRegion) {
          group.filter = '(?i)港|🇭🇰|hk|hongkong|美|🇺🇸|us|usa|日本|🇯🇵|jp|japan|新加坡|🇸🇬|sg|singapore'
        }
      }
      functionalGroups.push(group)
    }
  })

  // 3.6 通用兜底策略组
  rules.push(
    'GEOSITE,private,直连',
    'GEOSITE,category-public-tracker,直连',
    'GEOSITE,category-game-platforms-download@cn,直连',
    'GEOIP,private,直连,no-resolve',
    'GEOSITE,cn,国内网站',
    'GEOIP,cn,国内网站,no-resolve',
    'MATCH,其他外网'
  )

  const buildFixedGroup = (opts) => {
    const group = { ...groupBaseOption, ...opts }
    if (hasProviders) group.use = providerKeys
    return group
  }

  functionalGroups.push(
    buildFixedGroup({
      name: '其他外网',
      type: 'select',
      proxies: ['默认节点', '国内网站', ...allLocalProxyNames],
      icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Dark/GlobalMedia.png',
    }),
    buildFixedGroup({
      name: '国内网站',
      type: 'select',
      proxies: ['直连', '默认节点', ...allLocalProxyNames],
      url: 'https://wifi.vivo.com.cn/generate_204',
      icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/China_Map.png',
    })
  )

  // 3.7 组装最终结果
  config['proxy-groups'] = [...functionalGroups, ...generatedRegionGroups]
  config['rules'] = rules
  config['rule-providers'] = ruleProviders

  return config
}
