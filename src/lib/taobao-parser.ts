// 淘口令/淘宝链接解析器

export interface ParsedTaobaoItem {
  title: string;
  taobaoUrl: string;
  imageUrl: string;
  price: string;
  sourceType: 'taobao_link' | 'tmall_link' | 'taobao_code' | 'manual';
}

// 淘口令正则匹配（匹配 ￥xxx￥ 或 ₳xxx₳ 等格式）
const TAOBAO_CODE_REGEX = /[￥$₳₤£¢€¥]\s*([a-zA-Z0-9]+)\s*[￥$₳₤£¢€¥]/;

// 淘宝/天猫链接正则
const TAOBAO_URL_REGEX =
  /https?:\/\/(?:[\w-]+\.)?(?:taobao\.com|tmall\.com|tb\.cn|m\.tb\.cn|liangxinyao\.com|chaoshi\.detail\.tmall\.com)\/[^\s<<>"']+/gi;

// 淘宝商品ID正则
const TAOBAO_ITEM_ID_REGEX = /[?&]id=(\d+)/;

// 平台名黑名单（【】里如果是这些，跳过）
const PLATFORM_NAMES = ['淘宝', '天猫', '淘口令', '链接', '淘宝商品', '天猫商品', '手机淘宝', '手机天猫'];

/**
 * 解析用户输入，提取淘宝商品信息
 */
export function parseInput(input: string): ParsedTaobaoItem {
  const trimmed = input.trim();

  // 1. 尝试匹配淘口令
  const codeMatch = trimmed.match(TAOBAO_CODE_REGEX);
  if (codeMatch) {
    const code = codeMatch[1];
    return {
      title: `淘口令商品 (${code})`,
      taobaoUrl: `https://m.tb.cn/${code}`,
      imageUrl: '',
      price: '',
      sourceType: 'taobao_code',
    };
  }

  // 2. 尝试匹配淘宝/天猫链接
  const urlMatches = trimmed.match(TAOBAO_URL_REGEX);
  if (urlMatches && urlMatches.length > 0) {
    const url = urlMatches[0];
    const itemIdMatch = url.match(TAOBAO_ITEM_ID_REGEX);

    let taobaoUrl = url;
    if (itemIdMatch) {
      const itemId = itemIdMatch[1];
      taobaoUrl = `https://item.taobao.com/item.htm?id=${itemId}`;
    }

    const isTmall = url.includes('tmall.com');
    return {
      title: isTmall ? '天猫商品' : '淘宝商品',
      taobaoUrl,
      imageUrl: '',
      price: '',
      sourceType: isTmall ? 'tmall_link' : 'taobao_link',
    };
  }

  // 3. 尝试匹配短链接
  const shortUrlRegex = /https?:\/\/m\.tb\.cn\/[\w.-]+/gi;
  const shortUrlMatch = trimmed.match(shortUrlRegex);
  if (shortUrlMatch) {
    return {
      title: '淘宝商品',
      taobaoUrl: shortUrlMatch[0],
      imageUrl: '',
      price: '',
      sourceType: 'taobao_link',
    };
  }

  // 4. 尝试匹配 tb.cn 短链接
  const tbCnRegex = /https?:\/\/[\w.]*tb\.cn\/[\w.-]+/gi;
  const tbCnMatch = trimmed.match(tbCnRegex);
  if (tbCnMatch) {
    return {
      title: '淘宝商品',
      taobaoUrl: tbCnMatch[0],
      imageUrl: '',
      price: '',
      sourceType: 'taobao_link',
    };
  }

  // 5. 纯文本，作为手动输入处理
  return {
    title: trimmed.length > 50 ? trimmed.substring(0, 50) + '...' : trimmed,
    taobaoUrl: `https://s.taobao.com/search?q=${encodeURIComponent(trimmed)}`,
    imageUrl: '',
    price: '',
    sourceType: 'manual',
  };
}

/**
 * 从粘贴的混合文本中提取中文商品名称
 * 支持格式：【商品名】、「商品名」、"商品名"、链接前后带商品名
 */
export function extractTitle(input: string, parsed?: any): string {
  if (!input) return '未命名商品';

  // 1. 遍历所有【】和[]，跳过平台名，找真正的商品名
  const bracketMatches = input.matchAll(/[【\[](.+?)[】\]]/g);
  for (const match of bracketMatches) {
    const title = match[1].trim();
    const isPlatform = PLATFORM_NAMES.some(p => 
      title === p || title.startsWith(p + ' ') || title.includes(p)
    );
    if (title.length >= 2 && !isPlatform) {
      return title;
    }
  }

  // 2. 遍历所有「」和""中的内容
  const quoteMatches = input.matchAll(/[「"](.+?)[」"]/g);
  for (const match of quoteMatches) {
    const title = match[1].trim();
    if (title.length >= 2) return title;
  }

  // 3. 清理干扰内容
  let cleaned = input
    .replace(/https?:\/\/[^\s]+/g, ' ')    // 移除 URL（保留空格）
    .replace(/www\.[^\s]+/g, ' ')
    .replace(/[￥$₳₤£¢€¥]/g, ' ')          // 移除淘口令货币符号
    .replace(/复制这条信息|打开淘宝|打开天猫|即可看到|点击链接|直接购买|长按复制|进入淘宝|进入天猫|查看详情/g, ' ')
    .replace(/[a-zA-Z0-9]{11,}/g, ' ')     // 移除长串密文（淘口令/ID通常11位+）
    .replace(/[\r\n\t]/g, ' ')
    .trim();

  // 4. 按空格/标点分割，找包含中文的最长片段（商品名通常最长）
  const segments = cleaned
    .split(/[\s【】\[\]「」"\"'']+/)
    .map(s => s.trim())
    .filter(s => s.length >= 2 && /[\u4e00-\u9fa5]/.test(s));

  if (segments.length > 0) {
    const longest = segments.reduce((a, b) => a.length > b.length ? a : b);
    return longest.replace(/^[,.;:!?\s]+|[,.;:!?\s]+$/g, '');
  }

  // 5. 兜底：用商品ID
  if (parsed?.taobaoUrl) {
    const idMatch = parsed.taobaoUrl.match(/[?&]id=(\d+)/);
    if (idMatch) return `商品 ${idMatch[1]}`;
  }

  return '未命名商品';
}