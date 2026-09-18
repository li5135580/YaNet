# ================= 基础核心配置 =================
allow-lan: true
bind-address: "*"
mode: rule
ipv6: false # 关闭 IPv6 栈，根除无 IPv6 时的双栈回退卡顿
log-level: info
unified-delay: true
tcp-concurrent: true
keep-alive-interval: 1800
find-process-mode: strict
geodata-mode: true
geodata-loader: standard
geo-auto-update: true
geo-update-interval: 24

# 端口监听
port: 7890
socks-port: 7891
mixed-port: 7893
redir-port: 7892
tproxy-port: 7895
external-controller: 0.0.0.0:9090
external-ui: "/usr/share/openclash/ui"
external-ui-url: https://codeload.github.com/Zephyruso/zashboard/zip/refs/heads/gh-pages-cdn-fonts
external-ui-name: zashboard

authentication:
  - "Clash:XKvS5gi3"

experimental:
  quic-go-disable-gso: true

profile:
  store-selected: true
  store-fake-ip: true

# ================= DNS 模块优化 (解决 5 秒超时与对接 AGH) =================
dns:
  enable: true
  listen: 0.0.0.0:7874
  ipv6: false # 关闭 IPv6 DNS 解析
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  fake-ip-filter-mode: blacklist
  respect-rules: false
  cache-size: 8192
  independent-cache: true
  prefer-h3: false # 避免 QUIC DNS 握手超时
  use-hosts: true
  use-system-hosts: true

  # 基础引导 DNS (用于启动时解析代理节点域名，使用直连纯 IP)
  default-nameserver:
    - 223.5.5.5
    - 119.29.29.29

  # 本地/国内主解析：直接交由 AdGuard Home 过滤并缓存
  nameserver:
    - 127.0.0.1:5335
    - 223.5.5.5

  # 直连解析
  direct-nameserver:
    - 127.0.0.1:5335
    - 223.5.5.5

  # 节点代理服务器域名解析
  proxy-server-nameserver:
    - 223.5.5.5
    - 119.29.29.29

  # 国内常见大厂分流至 AGH
  nameserver-policy:
    geosite:tld-cn,cn,steam@cn,category-games@cn,microsoft@cn,apple@cn,category-game-platforms-download@cn,category-public-tracker:
      - 127.0.0.1:5335

  # 彻底移除原配置中无法直连的境外 DoH fallback，杜绝 5 秒 context deadline 超时

  # Fake-IP 过滤名单
  fake-ip-filter:
    - "*.lan"
    - "*.local"
    - "*.market.xiaomi.com"
    - localhost.ptlogin2.qq.com
    - localhost.sec.qq.com
    - "+.msftconnecttest.com"
    - "+.msftncsi.com"
    - router.asus.com
    - routerlogin.net
    - www.asusrouter.com
    - printer
    - nas
    - time.*.com
    - time.*.gov
    - time.*.edu.cn
    - ntp.*.com
    - ntp.*.cn
    - stun.*.*
    - stun.*.*.*
    - "+.stun.*.*"
    - "+.stun.*.*.*"
    - "+.market.xiaomi.com"
    - geosite:private
    - geosite:category-bank-jp

# ================= 嗅探设置 =================
sniffer:
  enable: false
  force-dns-mapping: true
  parse-pure-ip: false
  override-destination: true
  sniff:
    TLS:
      ports: [443, 8443]
    HTTP:
      ports: [80, 8080-8880]
    QUIC:
      ports: [443, 8443]
  skip-domain:
    - Mijia Cloud
    - "+.oray.com"

# ================= NTP 与 TUN 模式 =================
ntp:
  enable: true
  write-to-system: false
  server: cn.ntp.org.cn
  port: 123
  interval: 30

tun:
  enable: true
  stack: system
  device: utun
  dns-hijack:
    - 127.0.0.1:53
  endpoint-independent-nat: true
  auto-route: false
  auto-detect-interface: false
  auto-redirect: false
  strict-route: false
  disable-icmp-forwarding: false

geox-url:
  geoip: https://testingcf.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geoip.dat
  geosite: https://testingcf.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geosite.dat
  mmdb: https://testingcf.jsdelivr.net/gh/alecthw/mmdb_china_ip_list@release/lite/Country.mmdb
  asn: https://testingcf.jsdelivr.net/gh/xishang0128/geoip@release/GeoLite2-ASN.mmdb

# ================= 策略组 (保持你的原有分组) =================
proxy-groups:
  - name: 默认节点
    type: fallback
    url: https://www.gstatic.com/generate_204
    interval: 300
    timeout: 3000
    lazy: false
    max-failed-times: 3
    hidden: false
    proxies:
      - 主节点
      - 备用节点
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Proxy.png

  - name: 主节点
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    timeout: 3000
    tolerance: 50
    lazy: false
    max-failed-times: 3
    hidden: false
    proxies:
      - "🇺🇸 自建| 186.244 | Vision"
      - "🇺🇸 自建| 186.244 | TUIC"
      - "🇯🇵 自建| 18.181 | Vision"
      - "🇯🇵 自建| 18.181 | TUIC"
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/United_States.png

  - name: 备用节点
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    timeout: 3000
    tolerance: 50
    lazy: false
    max-failed-times: 3
    hidden: false
    proxies:
      - "🇯🇵日本高速01|CTCU|0.5x"
      - "🇯🇵日本高速02|CTCU|0.5x"
      - "🇯🇵日本高速01|BGP|CUCM"
      - "🇯🇵日本高速02|BGP|CUCM"
      - "🇯🇵日本高速03|BGP|CUCM"
      - "🇯🇵日本高速04|BGP|CUCM"
      - "🇯🇵日本高速05|BGP|CUCM"
      - "🇯🇵日本高速06|BGP|CTCU"
      - "🇯🇵日本高速07|BGP|CTCU"
      - "🇯🇵日本高速08|BGP|CTCU"
      - "🇯🇵日本高速09|BGP|CTCU"
      - "🇸🇬新加坡高速01|BGP|CTCUCM"
      - "🇸🇬新加坡高速02|BGP|CTCUCM"
      - "🇸🇬新加坡高速03|BGP|CTCUCM"
      - "🇸🇬新加坡高速04|BGP|CTCUCM"
      - "🇸🇬新加坡高速05|BGP|CTCUCM"
      - "🇸🇬新加坡高速06|BGP|CTCU"
      - "🇸🇬新加坡高速07|BGP|CTCU"
      - "🇸🇬新加坡高速08|BGP|CTCU"
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Japan.png

  - name: 广告过滤
    type: select
    proxies:
      - REJECT
      - 直连
      - 默认节点
      - 备用节点
    icon: https://raw.githubusercontent.com/Lanlan13-14/Icon-for-webui/main/block.png

  - name: 国外AI
    type: select
    proxies:
      - 默认节点
      - 备用节点
      - 主节点
      - HK香港
      - US美国
      - JP日本
      - SG新加坡
      - TW台湾省
      - GB英国
      - 直连
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/AI.png

  - name: Github
    type: select
    proxies:
      - 默认节点
      - 备用节点
      - HK香港
      - US美国
      - JP日本
      - SG新加坡
      - TW台湾省
      - GB英国
      - 直连
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/GitHub.png

  - name: 谷歌服务
    type: select
    proxies:
      - 默认节点
      - 备用节点
      - HK香港
      - US美国
      - JP日本
      - SG新加坡
      - TW台湾省
      - GB英国
      - 直连
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Google_Search.png

  - name: YouTube
    type: select
    proxies:
      - 默认节点
      - 备用节点
      - HK香港
      - US美国
      - JP日本
      - SG新加坡
      - TW台湾省
      - GB英国
      - 直连
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/YouTube.png

  - name: 微软服务
    type: select
    proxies:
      - 默认节点
      - 备用节点
      - HK香港
      - US美国
      - JP日本
      - SG新加坡
      - TW台湾省
      - GB英国
      - 直连
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Microsoft.png

  - name: 苹果服务
    type: select
    proxies:
      - 默认节点
      - 备用节点
      - HK香港
      - US美国
      - JP日本
      - SG新加坡
      - TW台湾省
      - GB英国
      - 直连
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Apple.png

  - name: Telegram
    type: select
    proxies:
      - 默认节点
      - 备用节点
      - HK香港
      - US美国
      - JP日本
      - SG新加坡
      - TW台湾省
      - GB英国
      - 直连
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Telegram.png

  - name: NETFLIX
    type: select
    proxies:
      - 默认节点
      - 备用节点
      - HK香港
      - US美国
      - JP日本
      - SG新加坡
      - TW台湾省
      - GB英国
      - 直连
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Netflix_Letter.png

  - name: Disney+
    type: select
    proxies:
      - 默认节点
      - 备用节点
      - HK香港
      - US美国
      - JP日本
      - SG新加坡
      - TW台湾省
      - GB英国
      - 直连
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Disney.png

  - name: Spotify
    type: select
    proxies:
      - 默认节点
      - 备用节点
      - HK香港
      - US美国
      - JP日本
      - SG新加坡
      - TW台湾省
      - GB英国
      - 直连
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Spotify.png

  - name: Tiktok
    type: select
    proxies:
      - 默认节点
      - 备用节点
      - HK香港
      - US美国
      - JP日本
      - SG新加坡
      - TW台湾省
      - GB英国
      - 直连
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/TikTok.png

  - name: Line
    type: select
    proxies:
      - 默认节点
      - 备用节点
      - HK香港
      - US美国
      - JP日本
      - SG新加坡
      - TW台湾省
      - GB英国
      - 直连
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Line.png

  - name: 虚拟货币
    type: select
    proxies:
      - 默认节点
      - 备用节点
      - 主节点
      - HK香港
      - US美国
      - JP日本
      - SG新加坡
      - TW台湾省
      - GB英国
      - 直连
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Cryptocurrency.png

  - name: 游戏专用
    type: select
    proxies:
      - 默认节点
      - 备用节点
      - HK香港
      - US美国
      - JP日本
      - SG新加坡
      - TW台湾省
      - GB英国
      - 直连
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Game.png

  - name: 国内网站
    type: select
    proxies:
      - 直连
      - 默认节点
      - 备用节点
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/China_Map.png

  - name: 其他外网
    type: select
    proxies:
      - 默认节点
      - 备用节点
      - 主节点
    icon: https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Dark/GlobalMedia.png

  - name: HK香港
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    proxies:
      - "🇭🇰香港高速01|BGP|CMCU"
      - "🇭🇰香港高速02|BGP|CMCU"
      - "🇭🇰香港高速03|BGP|CMCU"
      - "🇭🇰香港高速04|BGP|CMCU"
      - "🇭🇰香港高速05|BGP|CMCU"
      - "🇭🇰香港专线01|BGP|住宅IP"
      - "🇭🇰香港专线02|BGP|住宅IP"
      - "🇭🇰香港专线03|BGP|住宅IP"
      - "🇭🇰香港专线04|BGP|住宅IP"
      - "🇭🇰香港专线05|BGP|住宅IP"

  - name: US美国
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    proxies:
      - "🇺🇸美国高速01|CTCU|0.1x"
      - "🇺🇸美国高速02|CTCU|0.1x"
      - "🇺🇸美国高速03|CTCU|0.1x"
      - "🇺🇸美国高速04|CTCU|0.1x"
      - "🇺🇸美国高速05|CTCU|0.1x"
      - "🇺🇸 自建| 186.244 | Vision"
      - "🇺🇸 自建| 186.244 | TUIC"

  - name: JP日本
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    proxies:
      - "🇯🇵日本高速01|CTCU|0.5x"
      - "🇯🇵日本高速02|CTCU|0.5x"
      - "🇯🇵日本高速01|BGP|CUCM"
      - "🇯🇵日本高速02|BGP|CUCM"
      - "🇯🇵 自建| 18.181 | Vision"
      - "🇯🇵 自建| 18.181 | TUIC"

  - name: SG新加坡
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    proxies:
      - "🇸🇬新加坡高速01|BGP|CTCUCM"
      - "🇸🇬新加坡高速02|BGP|CTCUCM"
      - "🇸🇬新加坡专线01|BGP|流媒体"

  - name: TW台湾省
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    proxies:
      - "🇨🇳台湾专线01|BGP|流媒体"

  - name: GB英国
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 300
    tolerance: 50
    proxies:
      - "🇬🇧英国伦敦01|CTCU|0.1x"
      - "🇬🇧英国伦敦02|CTCU|0.1x"

# ================= 规则匹配（防 DNS 泄漏与加速架构） =================
rules:
  # 1. 进程与内网放行
  - PROCESS-NAME-REGEX,(?i).*cloudflared.*,直连
  - GEOSITE,private,直连

  # 2. 广告与跟踪过滤
  - DOMAIN-SUFFIX,ad.ldmnq.com,广告过滤
  - DOMAIN-SUFFIX,ads.ldmnq.com,广告过滤
  - DOMAIN-SUFFIX,push.ldmnq.com,广告过滤
  - DOMAIN-SUFFIX,stat.ldmnq.cn,广告过滤
  - DOMAIN-SUFFIX,log.ldmnq.cn,广告过滤
  - DOMAIN-SUFFIX,mnqlog.ldmnq.com,广告过滤
  - RULE-SET,category-ads-all_mrs,广告过滤
  - RULE-SET,awavenue_ads_yaml,广告过滤

  # 3. 境外特定域名服务
  - RULE-SET,ai_rules,国外AI
  - RULE-SET,jetbrains-ai_mrs,国外AI
  - RULE-SET,category-ai-not-cn_mrs,国外AI
  - RULE-SET,category-ai-chat-not-cn_mrs,国外AI
  - RULE-SET,github_mrs,Github
  - RULE-SET,youtube_mrs,YouTube
  - RULE-SET,google_mrs,谷歌服务
  - RULE-SET,telegram_domain_mrs,Telegram
  - RULE-SET,netflix_mrs,NETFLIX
  - RULE-SET,disney_mrs,Disney+
  - RULE-SET,spotify_mrs,Spotify
  - RULE-SET,tiktok_mrs,Tiktok
  - RULE-SET,line_mrs,Line
  - RULE-SET,crypto_rules,虚拟货币
  - RULE-SET,category-games_mrs,游戏专用

  # 4. 大厂境内/境外分流
  - RULE-SET,apple-cn_mrs,苹果服务
  - RULE-SET,microsoft_cn_mrs,国内网站
  - RULE-SET,microsoft_mrs,微软服务

  # 5. 国内常规域名
  - GEOSITE,category-public-tracker,直连
  - GEOSITE,category-game-platforms-download@cn,直连
  - RULE-SET,category-games-cn_mrs,国内网站
  - GEOSITE,cn,国内网站

  # 6. 纯 IP 沉底规则（关键：全量添加 no-resolve，杜绝 DNS 泄漏）
  - GEOIP,private,直连,no-resolve
  - RULE-SET,telegram_ip_mrs,Telegram,no-resolve
  - GEOIP,cn,国内网站,no-resolve

  # 7. 漏网境外流量兜底
  - MATCH,其他外网

# ================= 规则集定义 =================
rule-providers:
  applications:
    type: http
    format: text
    interval: 86400
    behavior: classical
    url: https://ghfast.top/https://github.com/DustinWin/ruleset_geodata/raw/refs/heads/mihomo-ruleset/applications.list
    path: "./rule_provider/applications.list"
  awavenue_ads_yaml:
    type: http
    format: yaml
    interval: 86400
    behavior: classical
    url: https://gcore.jsdelivr.net/gh/TG-Twilight/AWAvenue-Ads-Rule@main/Filters/AWAvenue-Ads-Rule-Clash.yaml
    path: "./rule_provider/awavenue_ads.yaml"
  category-ads-all_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: domain
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ads-all.mrs
    path: "./rule_provider/category-ads-all.mrs"
  github_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: domain
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/github.mrs
    path: "./rule_provider/github.mrs"
  microsoft_cn_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: domain
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/microsoft@cn.mrs
    path: "./rule_provider/microsoft_cn.mrs"
  microsoft_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: domain
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/microsoft.mrs
    path: "./rule_provider/microsoft.mrs"
  ai_rules:
    type: http
    format: yaml
    interval: 86400
    behavior: classical
    url: https://ghfast.top/https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/OpenAI/OpenAI.yaml
    path: "./rule_provider/openai.yaml"
  jetbrains-ai_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: domain
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/jetbrains-ai.mrs
    path: "./rule_provider/jetbrains-ai.mrs"
  category-ai-not-cn_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: domain
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ai-!cn.mrs
    path: "./rule_provider/category-ai-not-cn.mrs"
  category-ai-chat-not-cn_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: domain
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-ai-chat-!cn.mrs
    path: "./rule_provider/category-ai-chat-not-cn.mrs"
  crypto_rules:
    type: http
    format: yaml
    interval: 86400
    behavior: classical
    url: https://ghfast.top/https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Clash/Cryptocurrency/Cryptocurrency.yaml
    path: "./rule_provider/cryptocurrency.yaml"
  apple-cn_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: domain
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/apple-cn.mrs
    path: "./rule_provider/apple-cn.mrs"
  google_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: domain
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/google.mrs
    path: "./rule_provider/google.mrs"
  youtube_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: domain
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/youtube.mrs
    path: "./rule_provider/youtube.mrs"
  disney_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: domain
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/disney.mrs
    path: "./rule_provider/disney.mrs"
  netflix_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: domain
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/netflix.mrs
    path: "./rule_provider/netflix.mrs"
  tiktok_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: domain
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/tiktok.mrs
    path: "./rule_provider/tiktok.mrs"
  spotify_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: domain
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/spotify.mrs
    path: "./rule_provider/spotify.mrs"
  telegram_domain_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: domain
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/telegram.mrs
    path: "./rule_provider/telegram_domain.mrs"
  telegram_ip_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: ipcidr
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/telegram.mrs
    path: "./rule_provider/telegram_ip.mrs"
  line_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: domain
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/line.mrs
    path: "./rule_provider/line.mrs"
  category-games-cn_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: domain
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-games@cn.mrs
    path: "./rule_provider/category-games-cn.mrs"
  category-games_mrs:
    type: http
    format: mrs
    interval: 86400
    behavior: domain
    url: https://ghfast.top/https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/category-games.mrs
    path: "./rule_provider/category-games.mrs"

# ================= 实际代理节点列表 =================
# 注意：请务必将你原配置文件中的 proxies 节点列表完整粘贴/保留在此处！
proxies:
  # - name: "🇺🇸 自建| 186.244 | Vision" ...
  # - name: "🇺🇸 自建| 186.244 | TUIC" ...
  # (保留原文件此部分不变)
