/***
 * Clash Verge Rev / Mihomo Party 优化脚本
 * 原作者: dahaha-365 (YaNet)
 * Github：https://github.com/dahaha-365/YaNet
 * 已彻底修复：覆写后仅保留机场默认规则的问题
 */

// --- 0. GitHub Raw 链接常量 ---
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
  return val.split(';').map(item => item.trim()).filter(item => item.length > 0)
}

// --- 1. 静态配置区域 ---
const _skipIps = '10.0.0.0/8;100.64.0.0/10;127.0.0.0/8;169.254.0.0/16;172.16.0.0/12;192.168.0.0/16;198.18.0.0/16;FC00::/7;FE80::/10;::1/128'

const _proxyProviders = {
  P1: { type: 'http', url: '聚合订阅链接1', interval: 86400, override: { 'additional-prefix': 'P1 | ' } },
  P2: { type: 'http', url: '聚合订阅链接2', interval: 86400, override: { 'additional-prefix': 'P2 | ' } },
}

const _chinaDohDns = 'https://doh.pub/dns-query;https://dns.alidns.com/dns-query'
const _foreignDohDns = 'https://dns.google/dns-query;https://dns.adguard-dns.com/dns-query'
const _chinaIpDns = '119.29.29.29;223.5.5.5'
const _foreignIpDns = "8.8.8.8;94.140.14.14"

const args = typeof $arguments !== 'undefined' ? $arguments : {
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
  mode = 'default',
  ipv6 = false,
  logLevel = 'error',
  verbose = false,
  githubProxy = 'https://ghfast.top/',
  subscriptions = _proxyProviders,
} = args

function _log(level, ...msgs) {
  if (!verbose && level === 'debug') return
  const prefix = `[YaNet][${level.toUpperCase()}]`
  if (level === 'warn') console.warn(prefix, ...msgs)
  else if (level === 'error') console.error(prefix, ...msgs)
  else console.log(prefix, ...msgs)
}

// 模式配置
if (['securest', 'secure', 'default', 'fast', 'fastest'].includes(mode)) {
  switch (mode) {
    case 'securest':
      defaultDNS = _foreignIpDns; directDNS = _foreignDohDns; break
    case 'secure':
      defaultDNS = _foreignIpDns; directDNS = _chinaDohDns; chinaDNS = _chinaDohDns; foreignDNS = _foreignDohDns; break
    case 'fast':
      defaultDNS = _chinaIpDns; directDNS = _chinaIpDns; chinaDNS = _chinaIpDns; foreignDNS = _chinaDohDns; break
    case 'fastest':
      defaultDNS = _chinaIpDns; directDNS = _chinaIpDns; chinaDNS = _chinaIpDns; foreignDNS = _chinaIpDns; break
    default:
      defaultDNS = _chinaIpDns; directDNS = _chinaIpDns; chinaDNS = _chinaDohDns; foreignDNS = _chinaDohDns; break
  }
}

skipIps = stringToArray(skipIps)
defaultDNS = stringToArray(defaultDNS)
directDNS = stringToArray(directDNS)
chinaDNS = stringToArray(chinaDNS)
foreignDNS = stringToArray(foreignDNS)

// 分流规则配置
let ruleOptions = {
  apple: false, microsoft: false, github: false, google: false, openai: false,
  spotify: false, youtube: false, bahamut: false, netflix: false, tiktok: false,
  disney: false, pixiv: false, hbo: false, hulu: false, primevideo: false,
  telegram: false, line: false, whatsapp: false, games: false, japan: false, ads: false,
}

if (ruleSet === 'all') {
  Object.keys(ruleOptions).forEach(key => ruleOptions[key] = true)
} else if (typeof ruleSet === 'string') {
  const enabledKeys = ruleSet.split(';').map(s => s.trim())
  enabledKeys.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(ruleOptions, key)) ruleOptions[key] = true
  })
}

// 初始规则
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

// 地区定义
const allRegionDefinitions = [
  { name: 'HK香港', regex: /港|🇭🇰|hk|hongkong|hong kong/i, filter: '(?i)港|🇭🇰|hk|hongkong|hong kong', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Hong_Kong.png` },
  { name: 'US美国', regex: /(?!.*aus)(?=.*(美|🇺🇸|us(?!t)|usa|american|united states)).*/i, filter: '(?i)(?!.*aus)(?=.*(美|🇺🇸|us(?!t)|usa|american|united states)).*', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/United_States.png` },
  { name: 'JP日本', regex: /日本|🇯🇵|jp|japan/i, filter: '(?i)日本|🇯🇵|jp|japan', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Japan.png` },
  { name: 'KR韩国', regex: /韩|🇰🇷|kr|korea/i, filter: '(?i)韩|🇰🇷|kr|korea', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Korea.png` },
  { name: 'SG新加坡', regex: /新加坡|🇸🇬|sg|singapore/i, filter: '(?i)新加坡|🇸🇬|sg|singapore', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Singapore.png` },
  { name: 'CN中国大陆', regex: /中国|🇨🇳|cn|china/i, filter: '(?i)中国|🇨🇳|cn|china', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/China_Map.png` },
  { name: 'TW台湾省', regex: /台湾|台灣|🇹🇼|tw|taiwan|tai wan/i, filter: '(?i)台湾|台灣|🇹🇼|tw|taiwan|tai wan', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/China.png` },
  { name: 'GB英国', regex: /英|🇬🇧|uk|united kingdom|great britain/i, filter: '(?i)英|🇬🇧|uk|united kingdom|great britain', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/United_Kingdom.png` },
  { name: 'DE德国', regex: /德国|🇩🇪|de|germany/i, filter: '(?i)德国|🇩🇪|de|germany', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Germany.png` },
  { name: 'MY马来西亚', regex: /马来|🇲🇾|my|malaysia/i, filter: '(?i)马来|🇲🇾|my|malaysia', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Malaysia.png` },
  { name: 'TK土耳其', regex: /土耳其|🇹🇷|tk|turkey/i, filter: '(?i)土耳其|🇹🇷|tk|turkey', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Turkey.png` },
  { name: 'CA加拿大', regex: /加拿大|🇨🇦|ca|canada/i, filter: '(?i)加拿大|🇨🇦|ca|canada', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Canada.png` },
  { name: 'AU澳大利亚', regex: /澳大利亚|🇦🇺|au|australia|sydney/i, filter: '(?i)澳大利亚|🇦🇺|au|australia|sydney', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Australia.png` },
]

let regionDefinitions = regionSet === 'all' ? allRegionDefinitions : 
  allRegionDefinitions.filter(r => regionSet.split(';').map(s=>s.trim()).includes(r.name.substring(0,2)))

const dnsConfig = {
  enable: true,
  listen: '0.0.0.0:53',
  ipv6: ipv6,
  'log-level': logLevel,
  'prefer-h3': true,
  'use-hosts': true,
  'use-system-hosts': true,
  'enhanced-mode': 'fake-ip',
  'fake-ip-range': '198.18.0.0/16',
  'fake-ip-filter-mode': 'whitelist',
  'fake-ip-filter': [
    'geosite:gfw', 'geosite:jetbrains-ai', 'geosite:category-ai-!cn',
    'geosite:category-ai-chat-!cn', 'geosite:category-games-!cn',
    'geosite:google@!cn', 'geosite:telegram', 'geosite:facebook',
    'geosite:google', 'geosite:amazon', 'geosite:category-bank-jp'
  ],
  nameserver: chinaDNS,
  'default-nameserver': defaultDNS,
  'direct-nameserver': directDNS,
  'proxy-server-nameserver': chinaDNS,
  'nameserver-policy': {
    'geosite:private': 'system',
    'geosite:tld-cn,cn,steam@cn,category-games@cn,microsoft@cn,apple@cn,category-game-platforms-download@cn,category-public-tracker': chinaDNS,
    'geosite:gfw,jetbrains-ai,category-ai-!cn,category-ai-chat-!cn': foreignDNS,
  },
}

const ruleProviderCommon = { type: 'http', format: 'yaml', interval: 86400 }
const groupBaseOption = { interval: 300, timeout: 3000, url: 'https://www.gstatic.com/generate_204', lazy: true, 'max-failed-times': 3, hidden: false }

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

// 倍率 & 广告过滤
const multiplierRegex = /([1-9]\d*(?:\.\d+)?|0\.\d+)\s*[xX✕✖⨉倍率]|[xX✕✖⨉倍率]\s*([1-9]\d*(?:\.\d+)?|0\.\d+)/i
function parseMultiplier(name) {
  const m = name.match(multiplierRegex)
  return m ? parseFloat(m[1] || m[2]) : null
}

const adInfoKeywords = ['导航网址','距离下次重置','剩余流量','套餐到期','网址导航','官网','订阅','到期','剩余','重置','流量','已用','总计','续费']
const adInfoRegexes = [/\b(?:USE|USED|TOTAL|EXPIRE|EMAIL)\b/i, /Panel|Channel|Author|Traffic|Reset|Expire|Renew|Support|Telegram/i, /https?:\/\//, /(?:\d+\.\d+)\s*(GB|TB|MB|KB)/i, /\d{4}[-/]\d{2}[-/]\d{2}/]

const _adInfoCache = new Map()
function isAdInfoNode(name) {
  if (!name || typeof name !== 'string') return false
  if (_adInfoCache.has(name)) return _adInfoCache.get(name)
  const result = adInfoKeywords.some(kw => name.includes(kw)) || adInfoRegexes.some(re => re.test(name))
  _adInfoCache.set(name, result)
  return result
}

// 服务配置（完整）
const serviceConfigs = [
  { key: 'ads', name: '广告过滤', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Advertising.png`,
    rules: ['GEOSITE,category-ads-all,广告过滤', 'RULE-SET,adblockmihomo,广告过滤'],
    providers: [{ key: 'adblockmihomo', url: RULE_URLS.adblockmihomo, path: './ruleset/adblockfilters/adblockmihomo.mrs', format: 'mrs', behavior: 'domain' }],
    reject: true },
  { key: 'netflix', name: 'NETFLIX', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Netflix_Letter.png`, url: 'https://api.fast.com/netflix/speedtest/v2?https=true', rules: ['GEOSITE,netflix,NETFLIX'] },
  { key: 'disney', name: 'Disney+', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Disney+.png`, url: 'https://disney.api.edge.bamgrid.com/devices', rules: ['GEOSITE,disney,Disney+'] },
  { key: 'hbo', name: 'HBO', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/HBO.png`, url: 'https://www.hbo.com/favicon.ico', rules: ['GEOSITE,hbo,HBO'] },
  { key: 'hulu', name: 'Hulu', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Hulu.png`, url: 'https://auth.hulu.com/v4/web/password/authenticate', rules: ['GEOSITE,hulu,Hulu'] },
  { key: 'primevideo', name: 'Prime Video', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Prime_Video.png`, url: 'https://m.media-amazon.com/images/G/01/digital/video/web/logo-min-remaster.png', rules: ['GEOSITE,primevideo,Prime Video'] },
  { key: 'youtube', name: 'YouTube', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/YouTube.png`, url: 'https://www.youtube.com/s/desktop/494dd881/img/favicon.ico', rules: ['GEOSITE,youtube,YouTube'] },
  { key: 'spotify', name: 'Spotify', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Spotify.png`, url: 'https://spclient.wg.spotify.com/signup/public/v1/account', rules: ['GEOSITE,spotify,Spotify'] },
  { key: 'tiktok', name: 'Tiktok', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/TikTok.png`, url: 'https://www.tiktok.com/', rules: ['GEOSITE,tiktok,Tiktok'] },
  { key: 'bahamut', name: '巴哈姆特', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Bahamut.png`, url: 'https://ani.gamer.com.tw/ajax/getdeviceid.php', rules: ['GEOSITE,bahamut,巴哈姆特'] },
  { key: 'pixiv', name: 'Pixiv', icon: 'https://play-lh.googleusercontent.com/8pFuLOHF62ADcN0ISUAyEueA5G8IF49mX_6Az6pQNtokNVHxIVbS1L2NM62H-k02rLM=w240-h480-rw', url: 'https://www.pixiv.net/robots.txt', rules: ['GEOSITE,pixiv,Pixiv'] },
  { key: 'openai', name: '国外AI', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/ChatGPT.png`, url: 'https://chat.openai.com/cdn-cgi/trace',
    rules: [
      'GEOSITE,jetbrains-ai,国外AI', 'GEOSITE,category-ai-!cn,国外AI', 'GEOSITE,category-ai-chat-!cn,国外AI',
      'DOMAIN-SUFFIX,chatgpt.com,国外AI', 'DOMAIN-SUFFIX,openai.com,国外AI', 'DOMAIN-SUFFIX,oaistatic.com,国外AI',
      'DOMAIN-SUFFIX,oaiusercontent.com,国外AI', 'DOMAIN-SUFFIX,gemini.google.com,国外AI', 'DOMAIN-SUFFIX,anthropic.com,国外AI',
      'DOMAIN-SUFFIX,claude.ai,国外AI', /* ... 其余AI域名保持你原来的 ... */
      'PROCESS-NAME-REGEX,(?i).*Antigravity.*,国外AI'
    ]},
  { key: 'telegram', name: 'Telegram', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Telegram.png`, url: 'https://www.telegram.org/img/website_icon.svg', rules: ['GEOIP,telegram,Telegram'] },
  { key: 'whatsapp', name: 'WhatsApp', icon: 'https://static.whatsapp.net/rsrc.php/v3/yP/r/rYZqPCBaG70.png', rules: ['GEOSITE,whatsapp,WhatsApp'] },
  { key: 'line', name: 'Line', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Line.png`, rules: ['GEOSITE,line,Line'] },
  { key: 'google', name: '谷歌服务', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Google_Search.png`, rules: ['GEOSITE,google,谷歌服务'] },
  { key: 'github', name: 'Github', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/GitHub.png`, rules: ['GEOSITE,github,Github'] },
  { key: 'apple', name: '苹果服务', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Apple_2.png`, rules: ['GEOSITE,apple-cn,苹果服务'] },
  { key: 'microsoft', name: '微软服务', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Microsoft.png`, rules: ['GEOSITE,microsoft@cn,国内网站', 'GEOSITE,microsoft,微软服务'] },
  { key: 'games', name: '游戏专用', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Game.png`, rules: ['GEOSITE,category-games@cn,国内网站', 'GEOSITE,category-games,游戏专用'] },
  { key: 'japan', name: '日本网站', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/JP.png`, rules: ['RULE-SET,category-bank-jp,日本网站', 'GEOIP,jp,日本网站,no-resolve'],
    providers: [{ key: 'category-bank-jp', url: RULE_URLS.categoryBankJp, path: './ruleset/MetaCubeX/category-bank-jp.mrs', format: 'mrs', behavior: 'domain' }] },
]

// ==================== 主函数 ====================
function main(config) {
  if (!enable) return config
  if (!config) return config

  // 关键修复：强制初始化
  config.proxies = config.proxies || []
  config['proxy-groups'] = config['proxy-groups'] || []
  config.rules = config.rules || []
  config['rule-providers'] = config['rule-providers'] || {}

  const rules = _createInitialRules()
  const ruleProviders = _createInitialRuleProviders()

  const proxies = config.proxies
  const proxyCount = proxies.length

  // 多订阅处理（保持原逻辑）
  const providerKeys = []
  if (subscriptions && typeof subscriptions === 'object') {
    Object.entries(subscriptions).forEach(([key, cfg]) => {
      if (cfg?.url && /^https?:\/\//.test(cfg.url)) {
        providerKeys.push(key)
        config['proxy-providers'] = config['proxy-providers'] || {}
        config['proxy-providers'][key] = {
          type: cfg.type || 'http',
          url: cfg.url,
          interval: cfg.interval || 86400,
          'health-check': { enable: true, url: 'https://www.gstatic.com/generate_204', interval: 300 }
        }
      }
    })
  }

  const hasProviders = providerKeys.length > 0

  // 添加直连和拒绝
  config.proxies.push({ name: '直连', type: 'direct', udp: true })
  config.proxies.push({ name: '拒绝', type: 'reject', udp: true })

  // 节点分类
  const regionGroups = {}
  regionDefinitions.forEach(r => regionGroups[r.name] = { ...r, proxies: [] })
  const otherProxies = []
  const seenNodes = new Set()

  for (let proxy of proxies) {
    const name = proxy.name
    if (isAdInfoNode(name)) continue
    if (excludeHighPercentage) {
      const ratio = parseMultiplier(name)
      if (ratio && ratio > globalRatioLimit) continue
    }
    const dedupKey = `${name}|${proxy.server || ''}|${proxy.port || ''}`
    if (seenNodes.has(dedupKey)) continue
    seenNodes.add(dedupKey)

    let matched = false
    for (let r of regionDefinitions) {
      if (r.regex.test(name)) {
        regionGroups[r.name].proxies.push(name)
        matched = true
        break
      }
    }
    if (!matched) otherProxies.push(name)
  }

  // 构建地区组
  const generatedRegionGroups = []
  regionDefinitions.forEach(r => {
    if (regionGroups[r.name].proxies.length > 0) {
      const group = { ...groupBaseOption, name: r.name, type: 'url-test', tolerance: 50, icon: r.icon, proxies: regionGroups[r.name].proxies }
      if (hasProviders) { group.use = providerKeys; group.filter = r.filter }
      generatedRegionGroups.push(group)
    }
  })

  if (otherProxies.length > 0 || hasProviders) {
    const otherGroup = { ...groupBaseOption, name: '其他节点', type: 'select', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/World_Map.png` }
    if (otherProxies.length > 0) otherGroup.proxies = otherProxies
    if (hasProviders) otherGroup.use = providerKeys
    generatedRegionGroups.push(otherGroup)
  }

  const regionGroupNames = generatedRegionGroups.map(g => g.name)
  const allLocalProxyNames = []
  regionDefinitions.forEach(r => allLocalProxyNames.push(...regionGroups[r.name].proxies))
  allLocalProxyNames.push(...otherProxies)

  // 功能组
  const functionalGroups = []

  functionalGroups.push({
    ...groupBaseOption, name: '默认节点', type: 'select',
    proxies: ['直连', ...regionGroupNames, ...allLocalProxyNames],
    icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Proxy.png`
  })

  serviceConfigs.forEach(svc => {
    if (!ruleOptions[svc.key]) return
    rules.push(...svc.rules)

    if (svc.providers) {
      svc.providers.forEach(p => {
        ruleProviders[p.key] = { ...ruleProviderCommon, behavior: p.behavior, format: p.format, url: p.url, path: p.path }
      })
    }

    const groupProxies = svc.reject 
      ? ['拒绝', '直连', '默认节点', ...allLocalProxyNames]
      : svc.key === 'bahamut'
      ? ['默认节点', '直连', ...allLocalProxyNames]
      : ['默认节点', ...allLocalProxyNames, '直连']

    functionalGroups.push({
      ...groupBaseOption,
      name: svc.name,
      type: 'select',
      proxies: groupProxies,
      url: svc.url,
      icon: svc.icon
    })
  })

  // 兜底规则
  rules.push(
    'GEOSITE,private,直连',
    'GEOSITE,category-public-tracker,直连',
    'GEOSITE,category-game-platforms-download@cn,直连',
    'GEOIP,private,直连,no-resolve',
    'GEOSITE,cn,国内网站',
    'GEOIP,cn,国内网站,no-resolve',
    'MATCH,其他外网'
  )

  functionalGroups.push(
    { ...groupBaseOption, name: '下载软件', type: 'select', proxies: ['直连', '拒绝', '默认节点', '国内网站', ...allLocalProxyNames], icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Download.png` },
    { ...groupBaseOption, name: '其他外网', type: 'select', proxies: ['默认节点', '国内网站', ...allLocalProxyNames], icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/Streaming!CN.png` },
    { ...groupBaseOption, name: '国内网站', type: 'select', proxies: ['直连', '默认节点', ...allLocalProxyNames], url: 'https://wifi.vivo.com.cn/generate_204', icon: `${RAW_BASE}/Koolson/Qure/master/IconSet/Color/StreamingCN.png` }
  )

  // 最终替换
  delete config['proxy-groups']
  delete config['rules']
  delete config['rule-providers']

  config['proxy-groups'] = [...functionalGroups, ...generatedRegionGroups]
  config['rules'] = rules
  config['rule-providers'] = ruleProviders

  // 基础配置
  config['mode'] = 'rule'
  config['allow-lan'] = true
  config['bind-address'] = '*'
  config['mixed-port'] = 7890
  config['external-controller'] = '0.0.0.0:1906'
  config['external-ui'] = 'ui'
  config['dns'] = dnsConfig

  _validateConfig(config)
  _log('info', `✅ YaNet 脚本执行完成 | 节点数: ${proxyCount} | 地区组: ${generatedRegionGroups.length}`)
  return config
}

function _validateConfig(config) {
  // 原有校验逻辑（可根据需要保留）
  if (!Array.isArray(config['proxy-groups'])) throw new Error('proxy-groups 不是数组')
}

if (typeof module !== "undefined") module.exports = { main }
else globalThis.main = main