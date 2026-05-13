import { createAlova } from 'alova'
import { useRequest } from 'alova/client'
import VueHook from 'alova/vue';
import adapterFetch from 'alova/fetch'
import { classicalExtractor, singJsonExtrator } from './src/ruleset-extrator'
import * as path from 'node:path'
import { writeFileSync, mkdirSync } from 'node:fs'

const alova = createAlova({
  requestAdapter: adapterFetch(),
  statesHook: VueHook,
  responded: response => response.text(),
})

const { send: getAIChatNotCNRules } = useRequest(() => alova.Get('https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/category-ai-chat-!cn.json', {
  transform(rawData: string) {
    return singJsonExtrator(rawData)
  }
}), { immediate: false })

const { send: getJetbrainsAiRules } = useRequest(() => alova.Get('https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/sing/geo/geosite/jetbrains-ai.json', {
  transform(rawData: string) {
    return singJsonExtrator(rawData)
  }
}), { immediate: false })

const { send: getClaudeRules } = useRequest(() => alova.Get('https://github.com/blackmatrix7/ios_rule_script/raw/refs/heads/master/rule/Clash/Claude/Claude.list', {
  transform(rawData: string) {
    return classicalExtractor(rawData)
  }
}), { immediate: false })

const { send: getOpenAIRules } = useRequest(() => alova.Get('https://github.com/blackmatrix7/ios_rule_script/raw/refs/heads/master/rule/Clash/OpenAI/OpenAI.list', {
  transform(rawData: string) {
    return classicalExtractor(rawData)
  }
}), { immediate: false })

const { send: getBardAIRules } = useRequest(() => alova.Get('https://github.com/blackmatrix7/ios_rule_script/raw/refs/heads/master/rule/Clash/BardAI/BardAI.list', {
  transform(rawData: string) {
    return classicalExtractor(rawData)
  }
}), { immediate: false })

const { send: getCopilotRules } = useRequest(() => alova.Get('https://github.com/blackmatrix7/ios_rule_script/raw/refs/heads/master/rule/Clash/Copilot/Copilot.list', {
  transform(rawData: string) {
    return classicalExtractor(rawData)
  }
}), { immediate: false })

const { send: getNotionRules } = useRequest(() => alova.Get('https://github.com/blackmatrix7/ios_rule_script/raw/refs/heads/master/rule/Clash/Notion/Notion.list', {
  transform(rawData: string) {
    return classicalExtractor(rawData)
  }
}), { immediate: false })

const { send: getGeminiRules } = useRequest(() => alova.Get('https://github.com/blackmatrix7/ios_rule_script/raw/refs/heads/master/rule/Clash/Gemini/Gemini.list', {
  transform(rawData: string) {
    return classicalExtractor(rawData)
  }
}), { immediate: false })

const { send: getAnthropicRules } = useRequest(() => alova.Get('https://github.com/blackmatrix7/ios_rule_script/raw/refs/heads/master/rule/Clash/Anthropic/Anthropic.list', {
  transform(rawData: string) {
    return classicalExtractor(rawData)
  }
}), { immediate: false })

async function fetchWithRetry<R>(
  label: string,
  fetcher: () => Promise<R>,
  retries = 2
): Promise<R | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await fetcher()
      console.log(`[YaNet] ${label} 获取成功`)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (attempt < retries) {
        console.warn(`[YaNet] ${label} 获取失败，第 ${attempt + 1} 次重试... (${msg})`)
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)))
      } else {
        console.error(`[YaNet] ${label} 获取失败，已跳过 (${msg})`)
      }
    }
  }
  return null
}

const build = async () => {
  const sources: { label: string; fetcher: () => Promise<string[]> }[] = [
    { label: 'MetaCubeX category-ai-chat-!cn', fetcher: () => getAIChatNotCNRules() },
    { label: 'MetaCubeX jetbrains-ai', fetcher: () => getJetbrainsAiRules() },
    { label: 'blackmatrix7 Claude', fetcher: () => getClaudeRules() },
    { label: 'blackmatrix7 OpenAI', fetcher: () => getOpenAIRules() },
    { label: 'blackmatrix7 BardAI', fetcher: () => getBardAIRules() },
    { label: 'blackmatrix7 Copilot', fetcher: () => getCopilotRules() },
    { label: 'blackmatrix7 Notion', fetcher: () => getNotionRules() },
    { label: 'blackmatrix7 Gemini', fetcher: () => getGeminiRules() },
    { label: 'blackmatrix7 Anthropic', fetcher: () => getAnthropicRules() },
  ]

  const results = await Promise.all(
    sources.map((s) => fetchWithRetry(s.label, s.fetcher))
  )

  const allRules: string[] = []
  let successCount = 0
  results.forEach((r, i) => {
    if (r && r.length > 0) {
      allRules.push(...r)
      successCount++
    } else {
      console.warn(`[YaNet] ${sources[i].label} 返回空数据`)
    }
  })

  if (allRules.length === 0) {
    throw new Error('所有规则集来源均获取失败，中止构建')
  }

  const rules = Array.from(new Set(allRules))
  rules.sort()
  const header = `# AI ruleset\n# Creator URL: https://yanet.app\n# Created at ${new Date().toISOString()}\n# Sources: ${successCount}/${sources.length} 个来源成功\n\n`
  mkdirSync(path.resolve('./dist/rulesets/mihomo/'), {
    recursive: true
  })
  writeFileSync(path.resolve('./dist/rulesets/mihomo/ai.list'), header + rules.join('\n'))
  console.log(`[YaNet] AI 规则集构建完成: ${rules.length} 条规则 (${successCount}/${sources.length} 源)`)
}

build()
