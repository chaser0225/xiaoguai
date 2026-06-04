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
  /https?:\/\/(?:[\w-]+\.)?(?:taobao\.com|tmall\.com|tb\.cn|m\.tb\.cn|liangxinyao\.com|chaoshi\.detail\.tmall\.com)\/[^\s<>"']+/gi;

// 淘宝商品ID正则
const TAOBAO_ITEM_ID_REGEX = /[?&]id=(\d+)/;

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
    // 如果提取到了商品ID，构造标准链接
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

  // 3. 尝试匹配短链接 (m.tb.cn/xxx)
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
 * 支持格式：【商品名】、淘口令+商品名、链接前后带商品名
 */
export function extractTitle(input: string, parsed?: any): string {
  if (!input) return '未命名商品';

  // 1. 优先匹配【】或[]中的内容（最常见）
  const bracketMatch = input.match(/[【\[](.+?)[】\]]/);
  if (bracketMatch) {
    const title = bracketMatch[1].trim();
    if (title.length >= 2) return title;
  }

  // 2. 清理干扰内容
  let cleaned = input
    .replace(/https?:\/\/[^\s]+/g, '')     // 移除 URL
    .replace(/www\.[^\s]+/g, '')            // 移除 www 链接
    .replace(/[￥$₳₤£¢€¥]/g, ' ')          // 移除淘口令货币符号
    .replace(/复制这条信息|打开淘宝|打开天猫|即可看到|点击链接|直接购买/g, '')
    .replace(/[a-zA-Z0-9]{10,}/g, ' ')    // 移除长串数字字母（通常是淘口令密文）
    .replace(/[\r\n\t]/g, ' ')              // 换行转空格
    .trim();

  // 3. 提取连续的中文字符（至少2个字）
  // 匹配中文、中文+数字/字母混合（如" iPhone 16 Pro Max 手机壳"）
  const chineseMatches = cleaned.match(/[\u4e00-\u9fa5][\u4e00-\u9fa5\s\w]*[\u4e00-\u9fa5]/g);
  
  if (chineseMatches && chineseMatches.length > 0) {
    // 取最长的一段作为商品名（通常商品名最长）
    const longest = chineseMatches.reduce((a, b) => 
      a.replace(/\s/g, '').length > b.replace(/\s/g, '').length ? a : b
    );
    const title = longest.trim();
    if (title.length >= 2) return title;
  }

  // 4. 兜底：如果 parsed 里有其他信息
  if (parsed?.taobaoUrl) {
    // 从 URL 里尝试提取 id 作为临时名称
    const idMatch = parsed.taobaoUrl.match(/[?&]id=(\d+)/);
    if (idMatch) return `商品 ${idMatch[1]}`;
  }

  return '未命名商品';
}
