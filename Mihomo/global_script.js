/***
 * Clash Verge Rev / Mihomo Party 优化脚本
 * 原作者: dahaha-365 (YaNet)
 * Github：https://github.com/dahaha-365/YaNet
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
 * 新增订阅按 P3、P4 ... 递增
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
const _foreignDohDns =
  'https://dns.google/dns-query;https://dns.adguard-dns.com/dns-query'
const _chinaIpDns = '119.29.29.29;223.5.5.5'
const _foreignIpDns = "8.8.8.8;94.140.14.14"

/**
 * 整个脚本的总开关，在Mihomo Party使用的话，请保持为true
 * true = 启用
 * false = 禁用
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

/**
 * 如果是直接在软件中粘贴脚本的，就手动修改下面这几个变量实现自定义配置
 */
let {
  enable = args.enable || true,
  ruleSet = args.ruleSet || 'all', // 支持 'all' 或 'openai,youtube,ads' 这种格式
  regionSet = args.regionSet || 'all', // 匹配 regionDefinitions.name 前两个字母 (严格大小写)
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
      break;
    case 'secure':
      defaultDNS = _foreignIpDns
      directDNS = _chinaDohDns
      chinaDNS = _chinaDohDns
      foreignDNS = _foreignDohDns
      break;
    case 'fast':
      defaultDNS = _chinaIpDns
      directDNS = _chinaIpDns
      chinaDNS = _chinaIpDns
      foreignDNS = _chinaDohDns
      break;
    case 'fastest':
      defaultDNS = _chinaIpDns
      directDNS = _chinaIpDns
      chinaDNS = _chinaIpDns
      foreignDNS = _chinaIpDns
      break;
    default:
      defaultDNS = _chinaIpDns
      directDNS = _chinaIpDns
      chinaDNS = _chinaDohDns
      foreignDNS = _chinaDohDns
      break;
  }
}

skipIps = stringToArray(skipIps)
defaultDNS = stringToArray(defaultDNS)
directDNS = stringToArray(directDNS)
chinaDNS = stringToArray(chinaDNS)
foreignDNS = stringToArray(foreignDNS)

/**
 * 分流规则配置，会自动生成对应的策略组
 * 设置的时候可遵循“最小，可用”原则，把自己不需要的规则全禁用掉，提高效率
 * true = 启用
 * false = 禁用
 */
let ruleOptions = {
  apple: false,
  microsoft: true,
  github: true,
  google: true,
  openai: true,
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
  games: false,
  ads: true,
}

if (ruleSet === 'all') {
  Object.keys(ruleOptions).forEach(key => ruleOptions[key] = true);
} else if (typeof ruleSet === 'string') {
  const enabledKeys = ruleSet.split(';').map(s => s.trim());
  enabledKeys.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(ruleOptions, key)) {
      ruleOptions[key] = true;
    }
  });
}

// 初始规则
const rules = [
  'PROCESS-NAME-REGEX,(?i).*cloudflared.*,直连',]
// 地区定义 (Icons 更新为 GitHub Raw)
const allRegionDefinitions = [
  {
    name: 'HK香港',
    regex: /港|🇭🇰|hk|hongkong|hong kong/i,
    filter: '(?i)港|🇭🇰|hk|hongkong|hong kong',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Hong_Kong.png',
  },
  {
    name: 'US美国',
    regex: /\b(us|usa|united states)\b|美|🇺🇸/i,
    filter: '(?i)\\b(us|usa|united states)\\b|美|🇺🇸',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_States.png',
  },
  {
    name: 'JP日本',
    regex: /日本|🇯🇵|jp|japan/i,
    filter: '(?i)日本|🇯🇵|jp|japan',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Japan.png',
  },
  {
    name: 'KR韩国',
    regex: /韩|🇰🇷|kr|korea/i,
    filter: '(?i)韩|🇰🇷|kr|korea',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Korea.png',
  },
  {
    name: 'SG新加坡',
    regex: /新加坡|🇸🇬|sg|singapore/i,
    filter: '(?i)新加坡|🇸🇬|sg|singapore',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Singapore.png',
  },
  {
    name: 'TW台湾省',
    regex: /台湾|台灣|🇹🇼|tw|taiwan|tai wan/i,
    filter: '(?i)台湾|台灣|🇹🇼|tw|taiwan|tai wan',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Taiwan.png',
  },
  {
    name: 'GB英国',
    regex: /英|🇬🇧|uk|united kingdom|great britain/i,
    filter: '(?i)英|🇬🇧|uk|united kingdom|great britain',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_Kingdom.png',
  },
  {
    name: 'DE德国',
    regex: /德国|🇩🇪|de|germany/i,
    filter: '(?i)德国|🇩🇪|de|germany',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Germany.png',
  },
  {
    name: 'MY马来西亚',
    regex: /马来|🇲🇾|my|malaysia/i,
    filter: '(?i)马来|🇲🇾|my|malaysia',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Malaysia.png',
  },
  {
    name: 'TK土耳其',
    regex: /土耳其|🇹🇷|tk|turkey/i,
    filter: '(?i)土耳其|🇹🇷|tk|turkey',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Turkey.png',
  },
  {
    name: 'CA加拿大',
    regex: /加拿大|🇨🇦|ca|canada/i,
    filter: '(?i)加拿大|🇨🇦|ca|canada',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Canada.png',
  },
  {
    name: 'AU澳大利亚',
    regex: /澳大利亚|🇦🇺|au|australia|sydney/i,
    filter: '(?i)澳大利亚|🇦🇺|au|australia|sydney',
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Australia.png',
  },
]

let regionDefinitions = []
if (regionSet === 'all') {
  regionDefinitions = allRegionDefinitions
} else {
  const enabledRegions = regionSet.split(';').map(s => s.trim())
  regionDefinitions = allRegionDefinitions.filter(r => {
    const prefix = r.name.substring(0, 2) // 获取前两个字母
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

  // whitelist -> blacklist
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

  nameserver: chinaDNS,

  'default-nameserver': defaultDNS,

  'direct-nameserver': directDNS,

  // 恢复 fallback
  fallback: foreignDNS,

  'fallback-filter': {
    geoip: true,
    'geoip-code': 'CN',
    geosite: ['gfw'],
  },

  'proxy-server-nameserver': chinaDNS,

  'nameserver-policy': {
    'geosite:private': 'system',

    'geosite:tld-cn,cn,steam@cn,category-games@cn,microsoft@cn,apple@cn,category-game-platforms-download@cn,category-public-tracker':
      chinaDNS,

    'geosite:gfw,jetbrains-ai,category-ai-!cn,category-ai-chat-!cn':
      foreignDNS,
  },
}

// 通用配置
const ruleProviderCommon = {
  type: 'http',
  format: 'yaml',
  interval: 86400,
}
const groupBaseOption = {
  interval: 3600,
  timeout: 3000,
  url: 'https://www.gstatic.com/generate_204',
  lazy: true,
  'max-failed-times': 3,
  hidden: false,
}

// 预定义 Rule Providers
const ruleProviders = {
  applications: {
    ...ruleProviderCommon,
    behavior: 'classical',
    format: 'text',
    url: 'https://github.com/DustinWin/ruleset_geodata/raw/refs/heads/mihomo-ruleset/applications.list',
    path: './ruleset/DustinWin/applications.list',
  },
}

// 倍率正则预编译
const multiplierRegex =
  /(?:倍率|[xX✕✖⨉])?\s*(\d+(?:\.\d+)?)\s*(?:倍率|[xX✕✖⨉])?/i

// 机场广告/信息节点过滤
const adInfoKeywords = [
  '导航网址',
  '距离下次重置',
  '剩余流量',
  '套餐到期',
  '网址导航',
  '官网',
  '订阅',
  '到期',
  '剩余',
  '重置',
  '流量',
  '已用',
  '总计',
  '续费',
]

// 优化后的合并正则（注意变量名现在是 adInfoRegex，没有结尾的 es）
const adInfoRegex = /\b(?:USE|USED|TOTAL|EXPIRE|EMAIL)\b|Panel|Channel|Author|Traffic|Reset|Expire|Renew|Support|Telegram|https?:\/\/|(?:\d+\.\d+)\s*(GB|TB|MB|KB)|\d{4}[-/]\d{2}[-/]\d{2}/i;

function isAdInfoNode(name) {
  if (!name || typeof name !== 'string') return false
  if (adInfoKeywords.some((kw) => name.includes(kw))) return true
  // 这里同步修改为使用 adInfoRegex.test()
  if (adInfoRegex.test(name)) return true 
  return false
}
// --- 2. 服务规则数据结构 ---
// Icons 更新为 GitHub Raw
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
      // OpenAI / ChatGPT
      'DOMAIN-SUFFIX,chatgpt.com,国外AI',
      'DOMAIN-SUFFIX,openai.com,国外AI',
      'DOMAIN-SUFFIX,oaistatic.com,国外AI',
      'DOMAIN-SUFFIX,oaiusercontent.com,国外AI',
      // Google Gemini
      'DOMAIN-SUFFIX,gemini.google.com,国外AI',
      'DOMAIN-SUFFIX,gemini.com,国外AI',
      'DOMAIN-SUFFIX,generativelanguage.googleapis.com,国外AI',
      'DOMAIN-SUFFIX,ai.google.dev,国外AI',
      'DOMAIN-SUFFIX,aistudio.google.com,国外AI',
      // Anthropic / Claude
      'DOMAIN-SUFFIX,anthropic.com,国外AI',
      'DOMAIN-SUFFIX,claude.ai,国外AI',
      // Meta AI
      'DOMAIN-SUFFIX,meta.ai,国外AI',
      'DOMAIN-SUFFIX,meta.com,国外AI',
      // Perplexity AI
      'DOMAIN-SUFFIX,perplexity.ai,国外AI',
      // Mistral AI
      'DOMAIN-SUFFIX,mistral.ai,国外AI',
      // Midjourney
      'DOMAIN-SUFFIX,midjourney.com,国外AI',
      // Poe by Quora
      'DOMAIN-SUFFIX,poe.com,国外AI',
      // Cohere
      'DOMAIN-SUFFIX,cohere.ai,国外AI',
      'DOMAIN-SUFFIX,cohere.com,国外AI',
      // Character.AI
      'DOMAIN-SUFFIX,character.ai,国外AI',
      // Hugging Face
      'DOMAIN-SUFFIX,huggingface.co,国外AI',
      'DOMAIN-SUFFIX,hf.co,国外AI',
      // Cursor
      'DOMAIN-SUFFIX,cursor.sh,国外AI',
      'DOMAIN-SUFFIX,cursor.com,国外AI',
      // Groq
      'DOMAIN-SUFFIX,groq.com,国外AI',
      // xAI / Grok
      'DOMAIN-SUFFIX,x.ai,国外AI',
      'DOMAIN-SUFFIX,grok.com,国外AI',
      // OpenRouter
      'DOMAIN-SUFFIX,openrouter.ai,国外AI',

      // OpenAI API
      'DOMAIN-SUFFIX,api.openai.com,国外AI',

      // Anthropic API
      'DOMAIN-SUFFIX,api.anthropic.com,国外AI',

      // Cursor API
      'DOMAIN-SUFFIX,cursorapi.com,国外AI',

      // Google Vertex AI
      'DOMAIN-SUFFIX,vertexai.googleapis.com,国外AI',
      // Together AI
      'DOMAIN-SUFFIX,together.ai,国外AI',
      // Replicate
      'DOMAIN-SUFFIX,replicate.com,国外AI',
      // Stability AI
      'DOMAIN-SUFFIX,stability.ai,国外AI',
      // Runway
      'DOMAIN-SUFFIX,runwayml.com,国外AI',
      // Suno AI
      'DOMAIN-SUFFIX,suno.ai,国外AI',
      // You.com
      'DOMAIN-SUFFIX,you.com,国外AI',
      // Copilot / Microsoft AI
      'DOMAIN-SUFFIX,copilot.microsoft.com,国外AI',
      // Vercel AI
      'DOMAIN-SUFFIX,v0.dev,国外AI',
      // Process
      'PROCESS-NAME-REGEX,(?i).*Antigravity.*,国外AI',
      'PROCESS-NAME-REGEX,(?i).*language_server_.*,国外AI',
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
    rules: [
      'GEOSITE,category-games@cn,国内网站',
      'GEOSITE,category-games,游戏专用',
    ],
  },
  {
    key: 'ads',
    name: '广告过滤',
    icon: 'https://raw.githubusercontent.com/Lanlan13-14/Icon-for-webui/main/block.png',
    rules: [
      'GEOSITE,category-ads-all,广告过滤',
      'RULE-SET,adblockmihomo,广告过滤',
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

  const proxies = config?.proxies || []
  const proxyCount = proxies.length
  const proxyProviderCount =
    typeof config?.['proxy-providers'] === 'object'
      ? Object.keys(config['proxy-providers']).length
      : 0

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
  config['external-ui-url'] =
    `${githubProxy}https://github.com/Zephyruso/zashboard/releases/latest/download/dist.zip`
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
      TLS: {
        ports: [443, 8443],
      },
      HTTP: {
        ports: [80, '8080-8880'],
      },
      QUIC: {
        ports: [443, 8443],
      },
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

  // 3.2 多订阅聚合：解析 proxyProviders，仅 url 以 http 开头的条目生效
  const providerKeys = []
  if (typeof subscriptions === 'object' && subscriptions !== null) {
    const entries = Object.entries(subscriptions)
      .filter(([, cfg]) => {
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
            interval: 3600,
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

  config.proxies.push({
    name: '直连',
    type: 'direct',
    udp: true,
  })

  config.proxies.push({
    name: '拒绝',
    type: 'reject',
    udp: true,
  })

  // 3.3 本地代理按地区分类 (单次遍历)
  const regionGroups = {}
  regionDefinitions.forEach(
    (r) =>
      (regionGroups[r.name] = {
        ...r,
        proxies: [],
      })
  )
  const otherProxies = []

  for (let i = 0; i < proxyCount; i++) {
    const proxy = proxies[i]
    const name = proxy.name

    // 去除机场广告/信息节点
    if (isAdInfoNode(name)) {
      continue
    }

    if (excludeHighPercentage) {
      const match = multiplierRegex.exec(name)
      if (match && parseFloat(match[1] || match[0]) > globalRatioLimit) {
        continue
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

  // 3.4 构建地区策略组 — 本地节点 + provider 节点 (use + filter)
  const generatedRegionGroups = []
  const hasProviders = providerKeys.length > 0

  // 构建"其他节点"排除过滤器
  const allRegionKeywords = regionDefinitions
    .map((r) => r.filter.replace('(?i)', ''))
    .join('|')

  regionDefinitions.forEach((r) => {
    const groupData = regionGroups[r.name]
    const hasLocalNodes = groupData.proxies.length > 0

    // 仅本地有节点且无 provider 时加入本地节点，有 provider 时也生成（带 use+filter）
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

  // "其他节点"组 — 始终生成（本地无归类节点 + provider 无归类节点）
  if (otherProxies.length > 0 || hasProviders) {
    const otherGroup = {
      ...groupBaseOption,
      name: '其他节点',
      type: 'select',
      icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Global.png',
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

  // 收集所有本地节点名（用于功能分组直列）
  const allLocalProxyNames = []
  regionDefinitions.forEach((r) => {
    const groupData = regionGroups[r.name]
    if (groupData && groupData.proxies.length > 0) {
      allLocalProxyNames.push(...groupData.proxies)
    }
  })
  allLocalProxyNames.push(...otherProxies)

  // 3.5 构建功能策略组 — use 引入 provider 全量节点 + proxies 列出本地节点
  const functionalGroups = []

  const defaultNodeGroup = {
    ...groupBaseOption,
    name: '默认节点',
    type: 'select',
    proxies: ['直连', ...regionGroupNames, ...allLocalProxyNames],
    icon: 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Proxy.png',
  }
  if (hasProviders) {
    defaultNodeGroup.use = providerKeys
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

// 广告过滤
if (svc.reject) {
  groupProxies = ['REJECT', '直连', '默认节点']
}

// 巴哈姆特
else if (svc.key === 'bahamut') {
  groupProxies = ['默认节点', '直连']
}

// 国外AI：保留全部节点直列
else if (svc.key === 'openai') {
  groupProxies = [
    '默认节点',
    ...allLocalProxyNames,
    ...regionGroupNames,
    '直连',
  ]
}

// 其他功能组：不展开节点
else {
  groupProxies = ['默认节点', '直连']
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
    if (hasProviders) {
      group.use = providerKeys
    }
    return group
  }

  functionalGroups.push(
    buildFixedGroup({
      name: '其他外网',
      type: 'select',
      proxies: ['默认节点', '国内网站', ...allLocalProxyNames],
      icon: 'https://raw.githubusercontent.com/Koolson/Qure/IconSet/mini/GlobalMedia.png',
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
