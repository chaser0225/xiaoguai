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
 * 从输入中提取展示标题
 */
export function extractTitle(input: string, parsed: ParsedTaobaoItem): string {
  // 如果是淘口令，尝试从周围文本提取描述
  if (parsed.sourceType === 'taobao_code') {
    const codeMatch = input.match(TAOBAO_CODE_REGEX);
    if (codeMatch) {
      const code = codeMatch[0];
      const surrounding = input.replace(code, '').trim();
      if (surrounding && surrounding.length > 2) {
        return surrounding.length > 80
          ? surrounding.substring(0, 80) + '...'
          : surrounding;
      }
    }
  }
  return parsed.title;
}
