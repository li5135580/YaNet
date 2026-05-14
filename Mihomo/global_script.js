/***
 * Clash Verge Rev / Mihomo Party 优化脚本
 * 原作者: dahaha-365 (YaNet)
 * Github：https://github.com/dahaha-365/YaNet
 */

// --- 0. GitHub Raw 链接常量 ---
// 修改 RAW_BASE 即可统一切换镜像源，如: 'https://ghfast.top/https://raw.githubusercontent.com'
const RAW_BASE = 'https://raw.githubusercontent.com'
const RULE_URLS = {
  applications: `${RAW_BASE}/DustinWin/ruleset_geodata/refs/heads/mihomo-ruleset/applications.list`,
  adblockmihomo: 'https://github.com/217heidai/adblockfilters/raw/refs/heads/main/rules/adblockmihomo.mrs',
  categoryBankJp: `${RAW_BASE}/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-bank-jp.mrs`,
}
const GEO_URLS = {
  geoip: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip-lite.dat',
  geosite: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geosite.dat',
  mmdb: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/geoip.metadb',
  asn: 'https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest/GeoLite2-ASN.mmdb',
}

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
        verbose: false,
        githubProxy: 'https://ghfast.top/',
        subscriptions: _proxyProviders,
      }

/**
 * 如果是直接在软件中粘贴脚本的，就手动修改下面这几个变量实现自定义配置
 */
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
  verbose = args.verbose || false,
  githubProxy = args.githubProxy || 'https://ghfast.top/',
  subscriptions = args.subscriptions || _proxyProviders,
} = args

function _log(level, ...msgs) {
  if (!verbose && level === 'debug') return
  const prefix = `[YaNet][${level.toUpperCase()}]`
  if (level === 'warn') {
    console.warn(prefix, ...msgs)
  } else if (level === 'error') {
    console.error(prefix, ...msgs)
  } else {
    console.log(prefix, ...msgs)
  }
}

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
 * 设置的时候可遵循"最小，可用"原则，把自己不需要的规则全禁用掉，提高效率
 * true = 启用
 * false = 禁用
 */
let ruleOptions = {
  apple: false,
  microsoft: false,
  github: true,
  google: true,
  openai: false,
  spotify: false,
  youtube: false,
  bahamut: false,
  netflix: false,
  tiktok: false,
  disney: false,
  pixiv: false,
  hbo: false,
  mediaHMT: false,
  hulu: false,
  primevideo: false,
  telegram: false,
  line: false,
  whatsapp: false,
  games: false,
  japan: false,
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

// --- 初始规则 (工厂函数，每次 main() 调用创建新数组) ---
// PROCESS-NAME-REGEX 集中放在最前面
function _createInitialRules() {
  return [
    'PROCESS-NAME-REGEX,(?i).*Oray.*,直连',
    'PROCESS-NAME-REGEX,(?i).*Sunlogin.*,直连',
    'PROCESS-NAME-REGEX,(?i).*AweSun.*,直连',
    'PROCESS-NAME-REGEX,(?i).*NodeBaby.*,直连',
    'PROCESS-NAME-REGEX,(?i).*Node Baby.*,直连',
    'PROCESS-NAME-REGEX,(?i).*nblink.*,直连',
    'PROCESS-NAME-REGEX,(?i).*owjdxb.*,直连',
    'PROCESS-NAME-REGEX,(?i).*vpn.*,直连',
    'PROCESS-NAME-REGEX,(?i).*vnc.*,直连',
    'PROCESS-NAME-REGEX,(?i).*tvnserver.*,直连',
    'PROCESS-NAME-REGEX,(?i).*节点小宝.*,直连',
    'PROCESS-NAME-REGEX,(?i).*AnyDesk.*,直连',
    'PROCESS-NAME-REGEX,(?i).*ToDesk.*,直连',
    'PROCESS-NAME-REGEX,(?i).*RustDesk.*,直连',
    'PROCESS-NAME-REGEX,(?i).*TeamViewer.*,直连',
    'PROCESS-NAME-REGEX,(?i).*Zerotier.*,直连',
    'PROCESS-NAME-REGEX,(?i).*Tailscaled.*,直连',
    'PROCESS-NAME-REGEX,(?i).*phddns.*,直连',
    'PROCESS-NAME-REGEX,(?i).*ngrok.*,直连',
    'PROCESS-NAME-REGEX,(?i).*frpc.*,直连',
    'PROCESS-NAME-REGEX,(?i).*frps.*,直连',
    'PROCESS-NAME-REGEX,(?i).*natapp.*,直连',
    'PROCESS-NAME-REGEX,(?i).*cloudflared.*,直连',
    'PROCESS-NAME-REGEX,(?i).*xmqtunnel.*,直连',
    'PROCESS-NAME-REGEX,(?i).*Navicat.*,直连',
    'RULE-SET,applications,下载软件',
    'DOMAIN-SUFFIX,iepose.com,直连',
    'DOMAIN-SUFFIX,iepose.cn,直连',
    'DOMAIN-SUFFIX,nblink.cc,直连',
    'DOMAIN-SUFFIX,ionewu.com,直连',
    'DOMAIN-SUFFIX,vicp.net,直连',
  ]
}

// 地区定义 (Icons 使用 RAW_BASE 常量)
const allRegionDefinitions = [
  {
    name: 'HK香港',
    regex: /港|🇭🇰|hk|hongkong|hong kong/i,
    filter: '(?i)港|🇭🇰|hk|hongkong|hong kong',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Hong_Kong.png`,
  },
  {
    name: 'US美国',
    regex: /(?!.*aus)(?=.*(美|🇺🇸|us(?!t)|usa|american|united states)).*/i,
    filter: '(?i)(?!.*aus)(?=.*(美|🇺🇸|us(?!t)|usa|american|united states)).*',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/United_States.png`,
  },
  {
    name: 'JP日本',
    regex: /日本|🇯🇵|jp|japan/i,
    filter: '(?i)日本|🇯🇵|jp|japan',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Japan.png`,
  },
  {
    name: 'KR韩国',
    regex: /韩|🇰🇷|kr|korea/i,
    filter: '(?i)韩|🇰🇷|kr|korea',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Korea.png`,
  },
  {
    name: 'SG新加坡',
    regex: /新加坡|🇸🇬|sg|singapore/i,
    filter: '(?i)新加坡|🇸🇬|sg|singapore',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Singapore.png`,
  },
  {
    name: 'CN中国大陆',
    regex: /中国|🇨🇳|cn|china/i,
    filter: '(?i)中国|🇨🇳|cn|china',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/China_Map.png`,
  },
  {
    name: 'TW台湾省',
    regex: /台湾|台灣|🇹🇼|tw|taiwan|tai wan/i,
    filter: '(?i)台湾|台灣|🇹🇼|tw|taiwan|tai wan',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/China.png`,
  },
  {
    name: 'GB英国',
    regex: /英|🇬🇧|uk|united kingdom|great britain/i,
    filter: '(?i)英|🇬🇧|uk|united kingdom|great britain',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/United_Kingdom.png`,
  },
  {
    name: 'DE德国',
    regex: /德国|🇩🇪|de|germany/i,
    filter: '(?i)德国|🇩🇪|de|germany',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Germany.png`,
  },
  {
    name: 'MY马来西亚',
    regex: /马来|🇲🇾|my|malaysia/i,
    filter: '(?i)马来|🇲🇾|my|malaysia',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Malaysia.png`,
  },
  {
    name: 'TK土耳其',
    regex: /土耳其|🇹🇷|tk|turkey/i,
    filter: '(?i)土耳其|🇹🇷|tk|turkey',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Turkey.png`,
  },
  {
    name: 'CA加拿大',
    regex: /加拿大|🇨🇦|ca|canada/i,
    filter: '(?i)加拿大|🇨🇦|ca|canada',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Canada.png`,
  },
  {
    name: 'AU澳大利亚',
    regex: /澳大利亚|🇦🇺|au|australia|sydney/i,
    filter: '(?i)澳大利亚|🇦🇺|au|australia|sydney',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Australia.png`,
  },
]

let regionDefinitions = []
if (regionSet === 'all') {
  regionDefinitions = allRegionDefinitions
} else {
  const enabledRegions = regionSet.split(';').map(s => s.trim())
  regionDefinitions = allRegionDefinitions.filter(r => {
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
  'fake-ip-filter-mode': 'whitelist',
  'fake-ip-filter': [
    'geosite:gfw',
    'geosite:jetbrains-ai',
    'geosite:category-ai-!cn',
    'geosite:category-ai-chat-!cn',
    'geosite:category-games-!cn',
    'geosite:google@!cn',
    'geosite:telegram',
    'geosite:facebook',
    'geosite:google',
    'geosite:amazon',
    'geosite:category-bank-jp',
  ],
  nameserver: chinaDNS,
  'default-nameserver': defaultDNS,
  'direct-nameserver': directDNS,
  'proxy-server-nameserver': chinaDNS,
  'nameserver-policy': {
    'geosite:private': 'system',
    'geosite:tld-cn,cn,steam@cn,category-games@cn,microsoft@cn,apple@cn,category-game-platforms-download@cn,category-public-tracker':
      chinaDNS,
    'geosite:gfw,jetbrains-ai,category-ai-!cn,category-ai-chat-!cn': foreignDNS,
  },
}

// 通用配置
const ruleProviderCommon = {
  type: 'http',
  format: 'yaml',
  interval: 86400,
}
const groupBaseOption = {
  interval: 300,
  timeout: 3000,
  url: 'https://www.gstatic.com/generate_204',
  lazy: true,
  'max-failed-times': 3,
  hidden: false,
}

// 预定义 Rule Providers (工厂函数，每次 main() 调用创建新对象)
function _createInitialRuleProviders() {
  return {
    applications: {
      ...ruleProviderCommon,
      behavior: 'classical',
      format: 'text',
      url: RULE_URLS.applications,
      path: './ruleset/DustinWin/applications.list',
    },
  }
}

// --- 2. 倍率解析 ---
// 支持: x2.5, 2.0x, x2, 2x, 倍率2.5, 2.5倍率, ✖2.0 等变体
const multiplierRegex = /([1-9]\d*(?:\.\d+)?|0\.\d+)\s*[xX✕✖⨉倍率]|[xX✕✖⨉倍率]\s*([1-9]\d*(?:\.\d+)?|0\.\d+)/i

function parseMultiplier(name) {
  const m = name.match(multiplierRegex)
  if (m) {
    return parseFloat(m[1] || m[2])
  }
  return null
}

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

const adInfoRegexes = [
  /\b(?:USE|USED|TOTAL|EXPIRE|EMAIL)\b/i,
  /Panel|Channel|Author|Traffic|Reset|Expire|Renew|Support|Telegram/i,
  /https?:\/\//,
  /(?:\d+\.\d+)\s*(GB|TB|MB|KB)/i,
  /\d{4}[-/]\d{2}[-/]\d{2}/,
]

const _adInfoCache = new Map()

function isAdInfoNode(name) {
  if (!name || typeof name !== 'string') return false
  const cached = _adInfoCache.get(name)
  if (cached !== undefined) return cached
  let result = false
  if (adInfoKeywords.some((kw) => name.includes(kw))) {
    result = true
  } else if (adInfoRegexes.some((re) => re.test(name))) {
    result = true
  }
  _adInfoCache.set(name, result)
  return result
}

// --- 3. 服务规则数据结构 ---
// 排序原则: 广告过滤最前 → 特定媒体(Netflix,Disney+等)在通用规则前 → AI → 通讯 → 通用服务 → 游戏 → 地区
const serviceConfigs = [
  // --- 广告过滤 (最前) ---
  {
    key: 'ads',
    name: '广告过滤',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Advertising.png`,
    rules: [
      'GEOSITE,category-ads-all,广告过滤',
      'RULE-SET,adblockmihomo,广告过滤',
    ],
    providers: [
      {
        key: 'adblockmihomo',
        url: RULE_URLS.adblockmihomo,
        path: './ruleset/adblockfilters/adblockmihomo.mrs',
        format: 'mrs',
        behavior: 'domain',
      },
    ],
    reject: true,
  },
  // --- 特定流媒体 (在通用规则前) ---
  {
    key: 'netflix',
    name: 'NETFLIX',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Netflix_Letter.png`,
    url: 'https://api.fast.com/netflix/speedtest/v2?https=true',
    rules: ['GEOSITE,netflix,NETFLIX'],
  },
  {
    key: 'disney',
    name: 'Disney+',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Disney+.png`,
    url: 'https://disney.api.edge.bamgrid.com/devices',
    rules: ['GEOSITE,disney,Disney+'],
  },
  {
    key: 'hbo',
    name: 'HBO',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/HBO.png`,
    url: 'https://www.hbo.com/favicon.ico',
    rules: ['GEOSITE,hbo,HBO'],
  },
  {
    key: 'hulu',
    name: 'Hulu',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Hulu.png`,
    url: 'https://auth.hulu.com/v4/web/password/authenticate',
    rules: ['GEOSITE,hulu,Hulu'],
  },
  {
    key: 'primevideo',
    name: 'Prime Video',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Prime_Video.png`,
    url: 'https://m.media-amazon.com/images/G/01/digital/video/web/logo-min-remaster.png',
    rules: ['GEOSITE,primevideo,Prime Video'],
  },
  {
    key: 'youtube',
    name: 'YouTube',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/YouTube.png`,
    url: 'https://www.youtube.com/s/desktop/494dd881/img/favicon.ico',
    rules: ['GEOSITE,youtube,YouTube'],
  },
  {
    key: 'spotify',
    name: 'Spotify',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Spotify.png`,
    url: 'https://spclient.wg.spotify.com/signup/public/v1/account',
    rules: ['GEOSITE,spotify,Spotify'],
  },
  {
    key: 'tiktok',
    name: 'Tiktok',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/TikTok.png`,
    url: 'https://www.tiktok.com/',
    rules: ['GEOSITE,tiktok,Tiktok'],
  },
  {
    key: 'bahamut',
    name: '巴哈姆特',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Bahamut.png`,
    url: 'https://ani.gamer.com.tw/ajax/getdeviceid.php',
    rules: ['GEOSITE,bahamut,巴哈姆特'],
  },
  {
    key: 'pixiv',
    name: 'Pixiv',
    icon: 'https://play-lh.googleusercontent.com/8pFuLOHF62ADcN0ISUAyEueA5G8IF49mX_6Az6pQNtokNVHxIVbS1L2NM62H-k02rLM=w240-h480-rw',
    url: 'https://www.pixiv.net/robots.txt',
    rules: ['GEOSITE,pixiv,Pixiv'],
  },
  // --- AI 服务 ---
  {
    key: 'openai',
    name: '国外AI',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/ChatGPT.png`,
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
  // --- 通讯 ---
  {
    key: 'telegram',
    name: 'Telegram',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Telegram.png`,
    url: 'https://www.telegram.org/img/website_icon.svg',
    rules: ['GEOIP,telegram,Telegram'],
  },
  {
    key: 'whatsapp',
    name: 'WhatsApp',
    icon: 'https://static.whatsapp.net/rsrc.php/v3/yP/r/rYZqPCBaG70.png',
    url: 'https://web.whatsapp.com/data/manifest.json',
    rules: ['GEOSITE,whatsapp,WhatsApp'],
  },
  {
    key: 'line',
    name: 'Line',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Line.png`,
    url: 'https://line.me/page-data/app-data.json',
    rules: ['GEOSITE,line,Line'],
  },
  // --- 通用服务 ---
  {
    key: 'google',
    name: '谷歌服务',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Google_Search.png`,
    url: 'https://www.google.com/generate_204',
    rules: ['GEOSITE,google,谷歌服务'],
  },
  {
    key: 'github',
    name: 'Github',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/GitHub.png`,
    url: 'https://github.com/robots.txt',
    rules: ['GEOSITE,github,Github'],
  },
  {
    key: 'apple',
    name: '苹果服务',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Apple_2.png`,
    url: 'https://www.apple.com/library/test/success.html',
    rules: ['GEOSITE,apple-cn,苹果服务'],
  },
  {
    key: 'microsoft',
    name: '微软服务',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Microsoft.png`,
    url: 'https://www.msftconnecttest.com/connecttest.txt',
    rules: ['GEOSITE,microsoft@cn,国内网站', 'GEOSITE,microsoft,微软服务'],
  },
  // --- 游戏 ---
  {
    key: 'games',
    name: '游戏专用',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Game.png`,
    rules: [
      'GEOSITE,category-games@cn,国内网站',
      'GEOSITE,category-games,游戏专用',
    ],
  },
  // --- 日本地区 ---
  {
    key: 'japan',
    name: '日本网站',
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/JP.png`,
    url: 'https://r.r10s.jp/com/img/home/logo/touch.png',
    rules: [
      'RULE-SET,category-bank-jp,日本网站',
      'GEOIP,jp,日本网站,no-resolve',
    ],
    providers: [
      {
        key: 'category-bank-jp',
        url: RULE_URLS.categoryBankJp,
        path: './ruleset/MetaCubeX/category-bank-jp.mrs',
        format: 'mrs',
        behavior: 'domain',
      },
    ],
  },
]

// --- 4. 主入口 ---

function main(config) {
  if (!enable) return config

  // 每次调用创建全新数组/对象，避免全局累积
  const rules = _createInitialRules()
  const ruleProviders = _createInitialRuleProviders()

  const proxies = config?.proxies || []
  const proxyCount = proxies.length
  const proxyProviderCount =
    typeof config?.['proxy-providers'] === 'object'
      ? Object.keys(config['proxy-providers']).length
      : 0

  if (proxyCount === 0 && proxyProviderCount === 0) {
    throw new Error('配置文件中未找到任何代理')
  }

  _log('info', `开始处理 — 本地节点: ${proxyCount}, 现有 provider: ${proxyProviderCount}`)

  // 4.1 覆盖基础配置
  config['allow-lan'] = true
  config['bind-address'] = '*'
  config['mode'] = 'rule'
  config['ipv6'] = ipv6
  config['external-controller'] = '0.0.0.0:1906'
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
  config['geodata-loader'] = 'memconservative'
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
    geoip: `${githubProxy}${GEO_URLS.geoip}`,
    geosite: `${githubProxy}${GEO_URLS.geosite}`,
    mmdb: `${githubProxy}${GEO_URLS.mmdb}`,
    asn: `${githubProxy}${GEO_URLS.asn}`,
  }

  // 4.2 多订阅聚合：解析 proxyProviders，仅 url 以 http 开头的条目生效
  const providerKeys = []
  if (typeof subscriptions === 'object' && subscriptions !== null) {
    const entries = Object.entries(subscriptions).filter(([key, cfg]) => {
      if (!cfg || !cfg.url || typeof cfg.url !== 'string') {
        _log('warn', `订阅 ${key} 缺少有效 URL，已跳过`)
        return false
      }
      if (!/^https?:\/\//.test(cfg.url)) {
        _log('warn', `订阅 ${key} URL 协议非 http/https: "${cfg.url}"，已跳过。若有自定义协议订阅请检查`)
        return false
      }
      return true
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
            interval: 300,
          },
        }

        if (cfg.override && cfg.override['additional-prefix']) {
          provider.override = {
            'additional-prefix': cfg.override['additional-prefix'],
          }
        }

        config['proxy-providers'][key] = provider
      })

      _log('info', `生效的订阅 provider: ${providerKeys.join(', ')}`)
    } else {
      _log('warn', '没有有效的订阅 provider')
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

  // 4.3 本地代理分类 (单次遍历，含去重与过滤)
  const regionGroups = {}
  regionDefinitions.forEach(
    (r) =>
      (regionGroups[r.name] = {
        ...r,
        proxies: [],
      })
  )
  const otherProxies = []
  const seenNodes = new Set()
  let adFilteredCount = 0
  let ratioFilteredCount = 0
  let dupFilteredCount = 0

  for (let i = 0; i < proxyCount; i++) {
    const proxy = proxies[i]
    const name = proxy.name

    // 去除机场广告/信息节点
    if (isAdInfoNode(name)) {
      adFilteredCount++
      continue
    }

    // 去除高倍率节点 (预解析倍率)
    if (excludeHighPercentage) {
      const ratio = parseMultiplier(name)
      if (ratio !== null && ratio > globalRatioLimit) {
        ratioFilteredCount++
        continue
      }
    }

    // 重复节点去重 (按 name + server + port)
    const dedupKey = `${name}|${proxy.server || ''}|${proxy.port || ''}`
    if (seenNodes.has(dedupKey)) {
      dupFilteredCount++
      continue
    }
    seenNodes.add(dedupKey)

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

  if (verbose) {
    const classifiedCount = proxyCount - adFilteredCount - ratioFilteredCount - dupFilteredCount - otherProxies.length
    _log('debug', `节点过滤: 广告/信息 ${adFilteredCount}, 高倍率 ${ratioFilteredCount}, 重复 ${dupFilteredCount}`)
    _log('debug', `节点分类: 地区归类 ${classifiedCount}, 其他 ${otherProxies.length}`)
    regionDefinitions.forEach((r) => {
      const g = regionGroups[r.name]
      if (g.proxies.length > 0) {
        _log('debug', `  ${r.name}: ${g.proxies.length} 个节点`)
      }
    })
  }

  // 4.4 构建地区策略组
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
        proxies: groupData.proxies,
      }

      if (hasProviders) {
        group.use = providerKeys
        group.filter = r.filter
      }

      generatedRegionGroups.push(group)
    }
  })

  // "其他节点"组
  if (otherProxies.length > 0 || hasProviders) {
    const otherGroup = {
      ...groupBaseOption,
      name: '其他节点',
      type: 'select',
      icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/World_Map.png`,
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

  // 收集所有本地节点名 (用于功能分组直列)
  const allLocalProxyNames = []
  regionDefinitions.forEach((r) => {
    const groupData = regionGroups[r.name]
    if (groupData && groupData.proxies.length > 0) {
      allLocalProxyNames.push(...groupData.proxies)
    }
  })
  allLocalProxyNames.push(...otherProxies)

  // 4.5 构建功能策略组 — 按 serviceConfigs 顺序 (ads 最前)
  const functionalGroups = []

  const defaultNodeGroup = {
    ...groupBaseOption,
    name: '默认节点',
    type: 'select',
    proxies: ['直连', ...regionGroupNames, ...allLocalProxyNames],
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Proxy.png`,
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
      if (svc.reject) {
        groupProxies = ['REJECT', '直连', '默认节点', ...allLocalProxyNames]
      } else if (svc.key === 'biliintl' || svc.key === 'bahamut') {
        groupProxies = ['默认节点', '直连', ...allLocalProxyNames]
      } else {
        groupProxies = ['默认节点', ...allLocalProxyNames, '直连']
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

  // 4.6 通用兜底策略组
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
      name: '下载软件',
      type: 'select',
      proxies: ['直连', 'REJECT', '默认节点', '国内网站', ...allLocalProxyNames],
      icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Download.png`,
    }),
    buildFixedGroup({
      name: '其他外网',
      type: 'select',
      proxies: ['默认节点', '国内网站', ...allLocalProxyNames],
      icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Streaming!CN.png`,
    }),
    buildFixedGroup({
      name: '国内网站',
      type: 'select',
      proxies: ['直连', '默认节点', ...allLocalProxyNames],
      url: 'https://wifi.vivo.com.cn/generate_204',
      icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/StreamingCN.png`,
    })
  )

  // 4.7 组装最终结果 (先清理机场原始配置再赋值，确保完全替换)
  delete config['proxy-groups']
  delete config['rules']
  delete config['rule-providers']

  config['proxy-groups'] = [...functionalGroups, ...generatedRegionGroups]
  config['rules'] = rules
  config['rule-providers'] = ruleProviders

  // 4.8 配置格式校验
  _validateConfig(config)

  _log('info', `处理完成 — 策略组: ${config['proxy-groups'].length}, 规则: ${config['rules'].length}`)

  return config
}

// --- 5. 配置校验 ---

function _validateConfig(config) {
  const errors = []

  // 检查 proxy-groups 是否存在且为数组
  if (!Array.isArray(config['proxy-groups'])) {
    errors.push('proxy-groups 不是数组')
  } else {
    const groupNames = new Set()
    const groupNameSet = new Set()

    for (const g of config['proxy-groups']) {
      if (!g.name || typeof g.name !== 'string') {
        errors.push('存在无名策略组')
        continue
      }
      if (groupNameSet.has(g.name)) {
        errors.push(`重复的策略组名称: "${g.name}"`)
      }
      groupNameSet.add(g.name)
      groupNames.add(g.name)
    }

    // 检查 rules 引用的策略组是否存在
    if (Array.isArray(config['rules'])) {
      for (const rule of config['rules']) {
        if (typeof rule !== 'string') continue
        const parts = rule.split(',')
        if (parts.length >= 3) {
          const target = parts[parts.length - 1].trim()
          // 内置策略: 直连, REJECT, MATCH 等不需要在 proxy-groups 中
          const builtins = new Set(['直连', 'REJECT', 'MATCH', 'REJECT-TLS', 'REJECT-DROP'])
          if (!builtins.has(target) && !groupNames.has(target) && target !== 'no-resolve') {
            // no-resolve 不是策略组名，跳过
            if (!rule.includes('no-resolve') || parts[parts.length - 1].trim() !== 'no-resolve') {
              // 如果最后一个字段不是策略组（比如是 no-resolve），检查倒数第二个
              const realTarget = parts.length >= 4 && parts[parts.length - 1].trim() === 'no-resolve'
                ? parts[parts.length - 2].trim()
                : target
              if (!builtins.has(realTarget) && !groupNames.has(realTarget) && realTarget !== 'no-resolve') {
                errors.push(`规则引用了不存在的策略组: "${realTarget}" (规则: ${rule})`)
              }
            }
          }
        }
      }
    }

    // 检查 rule-providers 是否在 rules 中被引用
    const ruleProviderNames = Object.keys(config['rule-providers'] || {})
    const rulesText = (config['rules'] || []).join('\n')
    for (const rpName of ruleProviderNames) {
      if (!rulesText.includes(`RULE-SET,${rpName}`)) {
        _log('warn', `rule-provider "${rpName}" 未被任何规则引用`)
      }
    }
  }

  // 检查 proxy-groups 引用的 proxy-provider 是否存在
  const existingProviders = new Set(Object.keys(config['proxy-providers'] || {}))
  for (const g of (config['proxy-groups'] || [])) {
    if (Array.isArray(g.use)) {
      for (const u of g.use) {
        if (!existingProviders.has(u)) {
          errors.push(`策略组 "${g.name}" 引用了不存在的 proxy-provider: "${u}"`)
        }
      }
    }
  }

  if (errors.length > 0) {
    _log('error', '配置校验失败:')
    errors.forEach((e) => _log('error', `  - ${e}`))
    throw new Error(`配置校验失败: ${errors.join('; ')}`)
  }

  if (verbose) {
    _log('debug', '配置格式校验通过')
  }
}
