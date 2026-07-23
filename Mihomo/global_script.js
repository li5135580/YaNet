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
 * 将 url 占位符替换为真实订阅链接即可生效，未替换的条目自动跳过
 * additional-prefix 为节点名前缀，用于标识来源
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
      }

let {
  enable = args.enable || true,
  ruleSet = args.ruleSet || 'all', 
  regionSet = args.regionSet || 'all', 
  excludeHighPercentage = args.excludeHighPercentage || true,
  globalRatioLimit = args.globalRatioLimit || 2,
  skipIps = args.skipIps || _skipIps,
  defaultDNS = args.defaultDNS || _chinaIpDns,
  directDNS = args.directDNS || _chinaIpDns,
  chinaDNS = args.chinaDNS || _chinaDohDns,
  foreignDNS = args.foreignDNS || _foreignDohDns,
  mode = args.mode || '',
  ipv6 = args.ipv6 || false,
  logLevel = args.logLevel || 'error',
  githubProxy = args.githubProxy || 'https://ghfast.top/',
  subscriptions = args.subscriptions || _proxyProviders,
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

// ✅ 优化 4: 统一基础检测间隔，要求改为 300（5分钟）
const ruleProviderCommon = { type: 'http', format: 'yaml', interval: 86400 }
const groupBaseOption = {
  interval: 300,        // ✅ 统一所有策略组的健康检测(测速)时间为 300 秒
  timeout: 3000,
  url: 'https://www.gstatic.com/generate_204',
  lazy: true,
  'max-failed-times': 3,
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
    // ✅ 优化 3: 引入开源 Rule Provider 彻底去除内置的冗长域名匹配列表，后期全自动维护
    key: 'openai',
    name: '国外AI',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/AI.png',
    url: 'https://chat.openai.com/cdn-cgi/trace',
    rules: [
      'RULE-SET,ai_rules,国外AI',                 // 使用远端 Rule Provider
      'GEOSITE,jetbrains-ai,国外AI',             // 保留 Geosite 作为兜底增强
      'GEOSITE,category-ai-!cn,国外AI',
      'GEOSITE,category-ai-chat-!cn,国外AI'
    ],
    providers: [
      {
        key: 'ai_rules',
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/AI/AI.yaml',
        path: './ruleset/blackmatrix7/ai.yaml',
        format: 'yaml',
        behavior: 'classical', // blackmatrix7 使用 classical 标准格式
      }
    ]
  },
  {
    // ✅ 优化 3: 同理，虚拟货币也抛弃全部手写规则，使用强大的 blackmatrix7 远端规则集
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
        url: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Crypto/Crypto.yaml',
        path: './ruleset/blackmatrix7/crypto.yaml',
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

// --- 3. 主入口 ---

function main(config) {
  if (!enable) return config

  config.proxies = config?.proxies || []
  const proxies = config.proxies
  const proxyCount = proxies.length
  const proxyProviderCount =
    typeof config?.['proxy-providers'] === 'object' ? Object.keys(config['proxy-providers']).length : 0

  if (proxyCount === 0 && proxyProviderCount === 0) {
    throw new Error('配置文件中未找到任何代理')
  }

  // 3.1 覆盖基础配置
  config['allow-lan'] = true
  config['bind-address'] = '*'
  config['mode'] = 'rule'
  config['ipv6'] = ipv6
  config['external-controller'] = '0.0.0.0:1906'
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
            interval: 300, // ✅ 优化 4: 订阅节点的健康检测同样修改为 300 秒
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
        const ratio = parseFloat(match[1] || match[2])
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

  // ✅ 新增：主节点 策略组 (保持手动指定美国节点)
  const primaryGroup = {
    ...groupBaseOption,
    name: '主节点',
    type: 'select',
    proxies: ['🇺🇸 美国 | 72.249.203 | TUIC', '🇺🇸 美国 | 72.249.203 | H2'],
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_States.png',
  }
  if (hasProviders) {
    primaryGroup.use = providerKeys
    primaryGroup.filter = '🇺🇸 美国 \\| 72\\.249\\.203 \\| (TUIC|H2)'
  }
  functionalGroups.push(primaryGroup)

  // ✅ 新增：备用节点 策略组 (保持手动指定日本节点)
  const backupLocalNodes = allLocalProxyNames.filter(name => name.includes('日本高速'))
  const backupGroup = {
    ...groupBaseOption,
    name: '备用节点',
    type: 'select',
    proxies: backupLocalNodes.length > 0 ? backupLocalNodes : ['直连'],
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Japan.png',
  }
  if (hasProviders) {
    backupGroup.use = providerKeys
    backupGroup.filter = '日本高速'
  }
  functionalGroups.push(backupGroup)

  // ✅ 优化 1：引入真正的智能测速分组，对所有节点进行实时并发测速 (url-test)
  const autoSelectGroup = {
    ...groupBaseOption,
    name: '自动优选',
    type: 'url-test',
    tolerance: 50,
    proxies: allLocalProxyNames.length > 0 ? allLocalProxyNames : ['直连'],
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Auto.png'
  }
  if (hasProviders) autoSelectGroup.use = providerKeys
  functionalGroups.push(autoSelectGroup)

  // ✅ 优化 1：使用 fallback 组合，实现 “智能主备与自动回切”
  // fallback 逻辑：从左到右按 interval (现为300秒) 测试连通性。
  // 1. 如果主节点存活，强制走主节点；2. 如果主节点死，走备用；3. 俩都死，走“自动优选”（这里会智能挑最快的可用节点）。当主节点恢复时，流量自动平滑切回。
  const defaultNodeGroup = {
    ...groupBaseOption,
    name: '默认节点',
    type: 'fallback',
    proxies: ['主节点', '备用节点', '自动优选'],
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
      } 
      // ✅ 优化 2：AI、Crypto 等策略组改为只展示美国、香港、日本、新加坡全部节点
      else if (svc.key === 'openai' || svc.key === 'crypto') {
        const targetRegions = ['US美国', 'HK香港', 'JP日本', 'SG新加坡']
        let allowedProxies = []
        targetRegions.forEach(r => {
          // 仅从这四个地区的本地已筛选节点中提取并合并
          if (regionGroups[r] && regionGroups[r].proxies.length > 0) {
            allowedProxies.push(...regionGroups[r].proxies)
          }
        })
        // 移除原有的 '默认节点' 和地区组，纯净展示所有节点单体。为空时赋予 '直连' 兜底防报错。
        groupProxies = allowedProxies.length > 0 ? allowedProxies : ['直连']
        
        // 埋点，通知下方创建 group 时单独写入专属正则表达式
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
        // ✅ 优化 2 配套操作：针对外部订阅提供者（Provider），增加严格正则限制，仅拉取美港日新节点
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
