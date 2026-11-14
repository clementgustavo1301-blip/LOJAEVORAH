import { NextResponse } from 'next/server';

export interface ExtractedSupplierProduct {
  platform: 'SHOPEE' | 'TIKTOK' | 'OTHER';
  supplierName: string;
  resolvedUrl: string;
  suggestedName: string;
  suggestedDescription: string;
  suggestedImages: string[];
  suggestedCost: number;
  suggestedPrice: number;
  priceDetected: boolean;
  suggestedCategory: string;
  suggestedSizes: string[];
  suggestedFinishes: ('silver' | 'gold' | 'black')[];
  estimatedDeliveryDays: string;
  extractionMethod: string;
}

function detectPlatform(url: string): {
  platform: 'SHOPEE' | 'TIKTOK' | 'OTHER';
  supplierName: string;
  estimatedDeliveryDays: string;
} {
  const lower = url.toLowerCase();
  if (lower.includes('shopee') || lower.includes('shp.ee')) {
    return {
      platform: 'SHOPEE',
      supplierName: 'Shopee Brasil (Vendedor Nacional)',
      estimatedDeliveryDays: '4 a 8 dias úteis (Shopee Xpress / SPX)',
    };
  }
  if (lower.includes('tiktok')) {
    return {
      platform: 'TIKTOK',
      supplierName: 'TikTok Shop Brasil',
      estimatedDeliveryDays: '3 a 6 dias úteis (J&T Express / TikTok)',
    };
  }
  return {
    platform: 'OTHER',
    supplierName: 'Fornecedor Parceiro',
    estimatedDeliveryDays: '5 a 10 dias úteis',
  };
}

function inferCategoryFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('anel') || lower.includes('aliança') || lower.includes('alianca') || lower.includes('sinete')) {
    return 'cat-aneis';
  }
  if (lower.includes('cordão') || lower.includes('cordao') || lower.includes('baiano')) {
    return 'cat-cordoes';
  }
  if (
    (lower.includes('pingente') || lower.includes('cruz') || lower.includes('medalha') || lower.includes('placa')) &&
    !lower.includes('colar') &&
    !lower.includes('corrente')
  ) {
    return 'cat-pingentes';
  }
  if (lower.includes('pulseira') || lower.includes('bracelete')) {
    if (!lower.includes('colar') && !lower.includes('corrente')) {
      return 'cat-pulseiras';
    }
  }
  if (lower.includes('brinco') || lower.includes('argola')) {
    return 'cat-brincos';
  }
  return 'cat-correntes';
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&atilde;/gi, 'ã')
    .replace(/&otilde;/gi, 'õ')
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&acirc;/gi, 'â')
    .replace(/&ecirc;/gi, 'ê')
    .replace(/&ocirc;/gi, 'ô')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

/**
 * Unwraps login/universal-link redirect URLs (e.g. shopee.com.br/buyer/login?next=https%3A%2F%2Fshopee.com.br%2F...)
 */
function unwrapRedirectTarget(urlStr: string): string {
  try {
    let current = urlStr;
    for (let i = 0; i < 4; i++) {
      const u = new URL(current);
      const nextParam =
        u.searchParams.get('next') ||
        u.searchParams.get('origin_link') ||
        u.searchParams.get('redir') ||
        u.searchParams.get('params_url') ||
        u.searchParams.get('url') ||
        u.searchParams.get('target');
      if (nextParam && nextParam.startsWith('http')) {
        current = decodeURIComponent(nextParam);
      } else {
        break;
      }
    }
    return current;
  } catch {
    return urlStr;
  }
}

/**
 * Extracts first valid BRL price (e.g. R$ 23,99) ignoring strikethrough old prices
 */
function extractPriceFromText(text: string): number | undefined {
  if (!text) return undefined;
  // Remove words with strikethrough combining char (\u0336) so we don't pick old crossed-out price
  const withoutStrikethrough = text.replace(/\S*\u0336\S*/g, ' ');
  const brlMatch = withoutStrikethrough.match(/R\$\s*(\d{1,4}(?:[.,]\d{2})?)/i);
  if (brlMatch?.[1]) {
    const normalized = brlMatch[1].includes(',')
      ? brlMatch[1].replace(/\./g, '').replace(',', '.')
      : brlMatch[1];
    const parsed = parseFloat(normalized);
    if (!isNaN(parsed) && parsed > 1 && parsed < 5000) {
      return parsed;
    }
  }
  return undefined;
}

/**
 * Cleans product title from TikTok / Shopee prefixes, prices, discounts, emojis and platform names
 */
function cleanProductTitle(raw: string): string {
  let text = decodeHtmlEntities(raw)
    // Remove combining strikethrough characters
    .replace(/\u0336/g, '');

  // If title has TikTok Shop price/discount prefix before pipe "|", e.g.:
  // "💰R$ 23,99 R$ 100,00 🔥-76% | 🛍️Colar Corrente Masculina..."
  if (text.includes('|')) {
    const parts = text.split('|').map((p) => p.trim()).filter(Boolean);
    // Filter out segments that are just platform names or price/discount banners
    const meaningfulParts = parts.filter((part) => {
      const lower = part.toLowerCase();
      if (lower.includes('shopee') || lower.includes('tiktok')) return false;
      if (/^[💰🔥⚡✨🛍️\s]*R\$\s*\d/i.test(part)) return false;
      if (/^-\d+%$/i.test(part)) return false;
      return true;
    });
    if (meaningfulParts.length > 0) {
      text = meaningfulParts.join(' - ');
    }
  }

  return text
    .replace(/\|\s*Shopee\s*Brasil.*$/gi, '')
    .replace(/-\s*Shopee\s*Brasil.*$/gi, '')
    .replace(/Shopee\s*Brasil/gi, '')
    .replace(/\|\s*TikTok\s*Shop.*$/gi, '')
    .replace(/-\s*TikTok\s*Shop.*$/gi, '')
    .replace(/TikTok\s*Shop/gi, '')
    .replace(/Compre\s+na\s+Shopee\s+agora!?/gi, '')
    // Remove any remaining leading price/discount tags or emojis
    .replace(/^(?:[💰🔥⚡✨🛍️💎👑🎁]+\s*)+/gu, '')
    .replace(/^R\$\s*\d+(?:[.,]\d{2})?\s*(?:-\d+%\s*)?/i, '')
    .replace(/^[💰🔥⚡✨🛍️💎👑🎁|\-\s]+/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isInvalidTitle(title: string): boolean {
  if (!title) return true;
  const cleaned = title.trim();
  const lower = cleaned.toLowerCase();
  if (cleaned.length < 4) return true;

  const invalidExact = new Set([
    'login',
    'shopee',
    'shopee br',
    'shopee brasil',
    'tiktok',
    'tiktok shop',
    'tiktok - make your day',
    'make your day',
    'shopping on tiktok shop',
    'security check',
    'verify to continue',
    'just a moment...',
    'access denied',
    'moved permanently',
  ]);
  if (invalidExact.has(lower)) return true;

  const invalidSubstrings = [
    'ofertas incríveis',
    'melhores preços do mercado',
    'na shopee compensa mais',
    'frete grátis e cupons',
    'faça login',
    'faca login',
    'entrar na conta',
    'verificação de segurança',
    'security check',
    'verify to continue',
    'shopping on tiktok',
    'captcha',
  ];
  return invalidSubstrings.some((sub) => lower.includes(sub));
}

function isInvalidImage(url: string): boolean {
  if (!url || !url.startsWith('http')) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes('tts-logo-dark') ||
    lower.includes('favicon') ||
    lower.includes('eden-va2') ||
    lower.includes('deo.shopeemobile.com') ||
    lower.includes('shopee-pcmall-live-sg/assets')
  );
}

/**
 * Cleans Shopee / TikTok description boilerplate while preserving real jewelry specs
 */
function cleanProductDescription(raw: string, productTitle: string): string {
  let desc = decodeHtmlEntities(raw)
    .replace(/\u0336/g, '')
    .replace(/^Compre\s+.+?\s+na\s+Shopee\s+Brasil!\s*/i, '')
    .replace(/Pol[ií]tica\s+de\s+Devolu[çc][ãa]o\s+Shopee\s*:[\s\S]*$/i, '')
    .replace(/IMPORTANTE:\s*A cor pode ser ligeiramente diferente[\s\S]*$/i, '')
    .replace(/Compre\s+agora\s+sua[\s\S]*$/i, '')
    .replace(/\u2E3B+/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (
    !desc ||
    desc.length < 15 ||
    desc.toLowerCase().includes('shopping on tiktok') ||
    desc.toLowerCase().includes('ofertas incríveis')
  ) {
    return `${productTitle} em Aço Inoxidável 316L de padrão joalheria. Resistente à água, perfume e suor, com acabamento de alto brilho hipoalergênico e garantia vitalícia contra oxidação.`;
  }
  return desc;
}

/**
 * Extracts Shopee CDN image URLs encoded directly in `image_ids` query param
 */
function extractShopeeImagesFromUrlParams(urlStr: string): string[] {
  try {
    const parsed = new URL(urlStr);
    const rawIds = parsed.searchParams.get('image_ids') || parsed.searchParams.get('image_id');
    if (!rawIds) return [];
    return rawIds
      .split(',')
      .map((id) => id.trim())
      .filter((id) => /^[a-z0-9-]+$/i.test(id) && id.length >= 10)
      .map((id) => `https://down-br.img.susercontent.com/file/${id}`);
  } catch {
    return [];
  }
}

/**
 * Infers available sizes and finishes cleanly from extracted title & description
 */
function inferSizesAndFinishes(
  title: string,
  description: string
): {
  sizes: string[];
  finishes: ('silver' | 'gold' | 'black')[];
} {
  const combined = `${title} ${description}`;
  const lower = combined.toLowerCase();

  const cmMatches = [...combined.matchAll(/\b(\d{2})\s*cm\b/gi)].map((m) => `${m[1]}cm`);
  const uniqueSizes = Array.from(new Set(cmMatches));
  const sizes =
    uniqueSizes.length >= 2
      ? uniqueSizes
      : uniqueSizes.length === 1
        ? uniqueSizes
        : lower.includes('40cm a 70cm') || lower.includes('40 a 70cm')
          ? ['40cm', '45cm', '50cm', '60cm', '70cm']
          : lower.includes('anel') || lower.includes('aliança')
            ? ['16', '18', '20', '22']
            : lower.includes('pulseira')
              ? ['19cm', '21cm']
              : ['45cm', '50cm', '60cm'];

  const finishes: ('silver' | 'gold' | 'black')[] = [];
  if (lower.includes('ouro') || lower.includes('dourad') || lower.includes('18k') || lower.includes('gold')) {
    finishes.push('gold');
  }
  if (lower.includes('prata') || lower.includes('inox') || lower.includes('316l') || lower.includes('aço') || lower.includes('aco') || lower.includes('silver')) {
    finishes.push('silver');
  }
  if (lower.includes('preto') || lower.includes('black') || lower.includes('ônix') || lower.includes('onix')) {
    finishes.push('black');
  }
  if (finishes.length === 0) {
    finishes.push('silver', 'gold');
  }

  return { sizes, finishes };
}

/**
 * Extracts a clean product name from Shopee / TikTok URL slugs,
 * carefully avoiding store usernames in `/<store_username>/<item_id>` URLs!
 */
function extractNameFromUrlSlug(rawUrl: string): {
  productName: string;
  sellerUsername?: string;
  shopeeItemId?: string;
  shopeeShopId?: string;
} {
  try {
    const unwrapped = unwrapRedirectTarget(rawUrl);
    const parsed = new URL(unwrapped);
    const pathname = decodeURIComponent(parsed.pathname);
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return { productName: '' };

    // Case 1: Shopee `/product/<shop_id>/<item_id>`
    if (segments[0]?.toLowerCase() === 'product' && /^\d+$/.test(segments[1] || '') && /^\d+$/.test(segments[2] || '')) {
      return {
        productName: '',
        shopeeShopId: segments[1],
        shopeeItemId: segments[2],
      };
    }

    // Case 2: Shopee `/<store_username>/<item_id>` (2 segments where 2nd is numeric item_id)
    // IMPORTANT: segment[0] is the SELLER STORE NAME, NOT the product name!
    if (
      segments.length === 2 &&
      !/^\d+$/.test(segments[0]) &&
      /^\d{6,15}$/.test(segments[1]) &&
      !segments[0].includes('-i.')
    ) {
      return {
        productName: '',
        sellerUsername: segments[0],
        shopeeItemId: segments[1],
      };
    }

    // Case 3: Shopee slug with `-i.<shop_id>.<item_id>` (e.g. `/Corrente-Grumet-Inox-i.278629160.23495643214`)
    for (const seg of segments) {
      const iMatch = seg.match(/^(.+)-i\.(\d+)\.(\d+)$/i);
      if (iMatch) {
        const rawSlug = iMatch[1].replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
        return {
          productName: formatSlugWords(rawSlug),
          shopeeShopId: iMatch[2],
          shopeeItemId: iMatch[3],
        };
      }
    }

    // Case 4: Other e-commerce product slugs (must contain hyphens/spaces and not be a single-word username)
    const ignored = new Set(['buyer', 'login', 'verify', 'traffic', 'product', 'view', 'item', 'shop', 'p', 'list', 'search']);
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i];
      if (
        !ignored.has(seg.toLowerCase()) &&
        !/^\d+$/.test(seg) &&
        (seg.includes('-') || seg.includes(' ')) &&
        seg.length > 6
      ) {
        const cleaned = seg.replace(/\.html?$/i, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
        return { productName: formatSlugWords(cleaned) };
      }
    }

    return { productName: '' };
  } catch {
    return { productName: '' };
  }
}

function formatSlugWords(text: string): string {
  if (!text || text.length < 4) return '';
  return text
    .split(' ')
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
    .join(' ');
}

/**
 * Order-agnostic & multiline-safe <meta> tag extractor
 */
function extractMetaContent(html: string, keys: string[]): string {
  const metaTags = html.match(/<meta\s+[\s\S]*?>/gi) || [];
  for (const key of keys) {
    const lowerKey = key.toLowerCase();
    for (const tag of metaTags) {
      const propMatch = tag.match(/(?:property|name|itemprop)=["']([^"']+)["']/i);
      const contentMatch = tag.match(/content=["']([\s\S]*?)["'](?:\s|>|\/)/i);
      if (propMatch?.[1]?.toLowerCase() === lowerKey && contentMatch?.[1]) {
        return decodeHtmlEntities(contentMatch[1].trim());
      }
    }
  }
  return '';
}

/**
 * Extracts structured product data ONLY from `@type: "Product"` JSON-LD blocks
 * (never from `@type: "WebSite"` or `@type: "Organization"` which contain the store/platform name!)
 */
function extractFromJsonLd(html: string): {
  name?: string;
  description?: string;
  images: string[];
  price?: number;
  sellerName?: string;
} {
  const images: string[] = [];
  let name: string | undefined;
  let description: string | undefined;
  let price: number | undefined;
  let sellerName: string | undefined;

  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const itemType = String(item['@type'] || '').toLowerCase();

        // Only read product title/images/price from Product schema!
        if (!itemType.includes('product')) continue;

        if (item.name && typeof item.name === 'string' && !name) {
          const candidate = cleanProductTitle(item.name);
          if (!isInvalidTitle(candidate)) {
            name = candidate;
          }
        }
        if (item.description && typeof item.description === 'string' && !description) {
          description = decodeHtmlEntities(item.description);
        }
        if (item.image) {
          if (typeof item.image === 'string' && !isInvalidImage(item.image)) {
            images.push(item.image);
          } else if (Array.isArray(item.image)) {
            for (const img of item.image) {
              const u = typeof img === 'string' ? img : img?.url;
              if (u && !isInvalidImage(u)) images.push(u);
            }
          } else if (item.image?.url && !isInvalidImage(item.image.url)) {
            images.push(item.image.url);
          }
        }
        const offers = item.offers;
        if (offers) {
          const offerObj = Array.isArray(offers) ? offers[0] : offers;
          const rawPrice = offerObj?.price ?? offerObj?.lowPrice ?? offerObj?.highPrice;
          if (rawPrice !== undefined && !price) {
            const num = parseFloat(String(rawPrice).replace(',', '.'));
            if (!isNaN(num) && num > 0) price = num;
          }
          if (offerObj?.seller?.name && !sellerName) {
            sellerName = decodeHtmlEntities(String(offerObj.seller.name));
          }
        }
      }
    } catch {
      // ignore invalid JSON-LD blocks
    }
  }

  return { name, description, images, price, sellerName };
}

/**
 * Extracts embedded `og_info` JSON and creator `unique_id` from TikTok Shop share URLs
 */
function extractFromTikTokUrlParams(urlStr: string): {
  title?: string;
  price?: number;
  image?: string;
  sellerHandle?: string;
} {
  try {
    const u = new URL(urlStr);
    let title: string | undefined;
    let price: number | undefined;
    let image: string | undefined;
    const uniqueId = u.searchParams.get('unique_id') || undefined;

    const ogInfoRaw = u.searchParams.get('og_info');
    if (ogInfoRaw) {
      const parsed = JSON.parse(ogInfoRaw);
      if (parsed?.title && typeof parsed.title === 'string') {
        price = extractPriceFromText(parsed.title);
        const cleaned = cleanProductTitle(parsed.title);
        if (!isInvalidTitle(cleaned)) {
          title = cleaned;
        }
      }
      if (parsed?.image && typeof parsed.image === 'string') {
        const unescapedImg = parsed.image.replace(/\\\//g, '/');
        if (!isInvalidImage(unescapedImg)) {
          image = unescapedImg;
        }
      }
    }

    return {
      title,
      price,
      image,
      sellerHandle: uniqueId,
    };
  } catch {
    return {};
  }
}

/**
 * Resolves a Shopee `item_id` via Yahoo Search when the user pasted a `/<store_username>/<item_id>` link
 */
async function lookupShopeeByItemId(itemId: string): Promise<{
  canonicalUrl?: string;
  title?: string;
  description?: string;
  price?: number;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const yRes = await fetch(`https://br.search.yahoo.com/search?p=site%3Ashopee.com.br+${encodeURIComponent(itemId)}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!yRes.ok) return {};

    const yHtml = await yRes.text();
    const ruMatches = [...yHtml.matchAll(/RU=(https%3a%2f%2fshopee\.com\.br[^/]+)/gi)].map((m) =>
      decodeURIComponent(m[1])
    );
    const canonicalUrl = ruMatches.find((u) => u.includes(itemId) && u.includes('-i.'));

    const snippets = [...yHtml.matchAll(/class="[^"]*compText[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)].map((m) =>
      decodeHtmlEntities(m[1].replace(/<[^>]+>/g, '').trim())
    );
    const bestSnippet = snippets.find((s) => s.length > 25 && !s.toLowerCase().includes('moved permanently'));
    const price = bestSnippet ? extractPriceFromText(bestSnippet) : undefined;
    const slugInfo = canonicalUrl ? extractNameFromUrlSlug(canonicalUrl) : { productName: '' };

    return {
      canonicalUrl,
      title: slugInfo.productName || undefined,
      description: bestSnippet,
      price,
    };
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawInputUrl = (body.url || '').trim();
    let pastedText = (body.pastedText || '').trim();

    if (!rawInputUrl && !pastedText) {
      return NextResponse.json({ error: 'URL ou texto do anúncio obrigatório' }, { status: 400 });
    }

    // Se o usuário colou o texto completo de compartilhamento da Shopee/TikTok no campo de link
    const urlMatchInInput = rawInputUrl.match(/https?:\/\/[^\s"']+/i);
    const rawUrl = urlMatchInInput ? urlMatchInInput[0] : rawInputUrl;
    if (rawInputUrl.length > rawUrl.length + 5 && !pastedText) {
      pastedText = rawInputUrl.replace(rawUrl, '').trim();
    }

    let finalUrl = unwrapRedirectTarget(rawUrl);
    let bestProductUrl = finalUrl;
    let suggestedName = '';
    let suggestedDescription = '';
    const suggestedImages: string[] = [];
    let detectedCost: number | undefined;
    let customSellerName: string | undefined;
    let extractionMethod = 'url-slug';

    // 0A. Check TikTok `og_info` & Shopee `image_ids` directly in URL params
    const initialTikTokParams = extractFromTikTokUrlParams(finalUrl);
    if (initialTikTokParams.title) {
      suggestedName = initialTikTokParams.title;
      extractionMethod = 'tiktok-og-param';
    }
    if (initialTikTokParams.price) {
      detectedCost = initialTikTokParams.price;
    }
    if (initialTikTokParams.image) {
      suggestedImages.push(initialTikTokParams.image);
    }
    if (initialTikTokParams.sellerHandle) {
      customSellerName = `TikTok Shop (@${initialTikTokParams.sellerHandle})`;
    }
    for (const imgUrl of [
      ...extractShopeeImagesFromUrlParams(rawUrl),
      ...extractShopeeImagesFromUrlParams(finalUrl),
    ]) {
      if (!isInvalidImage(imgUrl) && !suggestedImages.includes(imgUrl)) {
        suggestedImages.push(imgUrl);
      }
    }

    // 0B. Resolve short links (s.shopee.com.br, br.shp.ee, vt.tiktok.com, vm.tiktok.com) hop-by-hop
    if (rawUrl && rawUrl.startsWith('http')) {
      try {
        let hopUrl = rawUrl;
        for (let hop = 0; hop < 5; hop++) {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3500);
          const hopRes = await fetch(hopUrl, {
            method: 'GET',
            redirect: 'manual',
            headers: {
              'User-Agent': 'WhatsApp/2.23.20.0 A',
              Accept: 'text/html,application/xhtml+xml',
            },
            signal: controller.signal,
          });
          clearTimeout(timeout);

          const loc = hopRes.headers.get('location');
          if (!loc) break;

          const nextUrl = new URL(loc, hopUrl).toString();
          const unwrappedNext = unwrapRedirectTarget(nextUrl);

          // Check if the redirected URL has TikTok `og_info`
          const hopTikTok = extractFromTikTokUrlParams(unwrappedNext);
          if (hopTikTok.title && !suggestedName) {
            suggestedName = hopTikTok.title;
            extractionMethod = 'tiktok-og-param';
          }
          if (hopTikTok.price && !detectedCost) detectedCost = hopTikTok.price;
          if (hopTikTok.image && !suggestedImages.includes(hopTikTok.image)) {
            suggestedImages.push(hopTikTok.image);
          }
          if (hopTikTok.sellerHandle && !customSellerName) {
            customSellerName = `TikTok Shop (@${hopTikTok.sellerHandle})`;
          }

          if (
            !unwrappedNext.includes('/verify/') &&
            !unwrappedNext.includes('/buyer/login') &&
            !unwrappedNext.includes('/captcha')
          ) {
            bestProductUrl = unwrappedNext;
          }

          finalUrl = unwrappedNext;
          hopUrl = nextUrl;
        }
      } catch {
        // Ignore manual hop errors and proceed
      }
    }

    if (bestProductUrl && (finalUrl.includes('/verify/') || finalUrl.includes('/buyer/login'))) {
      finalUrl = bestProductUrl;
    }

    // 0C. Inspect URL slug / Shopee `/<store_username>/<item_id>` structure
    const slugAnalysis = extractNameFromUrlSlug(bestProductUrl || finalUrl);
    if (slugAnalysis.sellerUsername) {
      customSellerName = `Shopee Brasil (@${slugAnalysis.sellerUsername})`;
    }
    if (slugAnalysis.shopeeItemId && !slugAnalysis.productName) {
      // If we have `/<store_username>/<item_id>` or `/product/<shop_id>/<item_id>`,
      // convert or lookup the canonical Shopee URL so WhatsApp UA gets the full OpenGraph tags!
      if (slugAnalysis.shopeeShopId) {
        bestProductUrl = `https://shopee.com.br/product/${slugAnalysis.shopeeShopId}/${slugAnalysis.shopeeItemId}`;
        finalUrl = bestProductUrl;
      } else {
        const lookedUp = await lookupShopeeByItemId(slugAnalysis.shopeeItemId);
        if (lookedUp.canonicalUrl) {
          bestProductUrl = lookedUp.canonicalUrl;
          finalUrl = lookedUp.canonicalUrl;
        }
        if (lookedUp.title && !suggestedName) {
          suggestedName = lookedUp.title;
          extractionMethod = 'yahoo-index';
        }
        if (lookedUp.description && !suggestedDescription) {
          suggestedDescription = lookedUp.description;
        }
        if (lookedUp.price && !detectedCost) {
          detectedCost = lookedUp.price;
        }
      }
    }

    // 1. Fetch HTML using Social Preview Bot User-Agent (WhatsApp / Facebook External Hit)
    if (finalUrl && finalUrl.startsWith('http')) {
      const userAgents = [
        'WhatsApp/2.23.20.0 A',
        'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      ];

      for (const ua of userAgents) {
        if (suggestedName && suggestedImages.length > 0 && detectedCost && suggestedDescription) break;

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4500);
          const response = await fetch(finalUrl, {
            method: 'GET',
            redirect: 'follow',
            headers: {
              'User-Agent': ua,
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
            },
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (response.url) {
            const candidateUrl = unwrapRedirectTarget(response.url);
            if (
              !candidateUrl.includes('/verify/') &&
              !candidateUrl.includes('/buyer/login') &&
              candidateUrl !== 'https://shopee.com.br/'
            ) {
              finalUrl = candidateUrl;
              bestProductUrl = candidateUrl;
            }
          }

          if (response.ok) {
            const html = await response.text();

            // 1A. Product JSON-LD extraction (strictly @type: Product)
            const ld = extractFromJsonLd(html);
            if (ld.name && !suggestedName) {
              suggestedName = ld.name;
              extractionMethod = 'json-ld';
            }
            if (ld.description && !suggestedDescription) {
              suggestedDescription = ld.description;
            }
            if (ld.images.length > 0) {
              for (const img of ld.images) {
                if (!suggestedImages.includes(img)) suggestedImages.push(img);
              }
            }
            if (ld.price && !detectedCost) {
              detectedCost = ld.price;
            }
            if (ld.sellerName && !customSellerName) {
              customSellerName = ld.sellerName;
            }

            // 1B. Meta tags extraction (order-agnostic & multiline-safe)
            const rawMetaTitle = extractMetaContent(html, ['og:title', 'twitter:title', 'title']);
            if (rawMetaTitle) {
              // Extract price BEFORE stripping price prefix from title!
              if (!detectedCost) {
                detectedCost = extractPriceFromText(rawMetaTitle);
              }
              if (!suggestedName && !isInvalidTitle(rawMetaTitle)) {
                const cleaned = cleanProductTitle(rawMetaTitle);
                if (!isInvalidTitle(cleaned)) {
                  suggestedName = cleaned;
                  extractionMethod = 'opengraph';
                }
              }
            }

            const metaImage = extractMetaContent(html, ['og:image', 'og:image:secure_url', 'twitter:image', 'image']);
            if (metaImage && !isInvalidImage(metaImage) && !suggestedImages.includes(metaImage)) {
              suggestedImages.push(metaImage);
            }

            const metaDesc = extractMetaContent(html, ['og:description', 'twitter:description', 'description']);
            if (metaDesc && !isInvalidTitle(metaDesc)) {
              if (!detectedCost) {
                detectedCost = extractPriceFromText(metaDesc);
              }
              if (!suggestedDescription) {
                suggestedDescription = metaDesc;
              }
            }

            const metaPrice = extractMetaContent(html, [
              'product:price:amount',
              'og:price:amount',
              'price',
              'twitter:data1',
            ]);
            if (!detectedCost && metaPrice) {
              const num = parseFloat(metaPrice.replace(/[^\d.,]/g, '').replace(',', '.'));
              if (!isNaN(num) && num > 0) detectedCost = num;
            }

            // 1C. Title tag fallback
            if (!suggestedName) {
              const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
              if (titleTagMatch?.[1] && !isInvalidTitle(titleTagMatch[1])) {
                if (!detectedCost) {
                  detectedCost = extractPriceFromText(titleTagMatch[1]);
                }
                const cleaned = cleanProductTitle(titleTagMatch[1]);
                if (!isInvalidTitle(cleaned)) {
                  suggestedName = cleaned;
                  extractionMethod = 'title-tag';
                }
              }
            }

            // 1D. Shopee / TikTok CDN image patterns inside HTML
            if (suggestedImages.length === 0) {
              const cdnImgs =
                html.match(
                  /https?:\/\/[^"'\s\\>]+(?:susercontent\.com\/file\/[a-zA-Z0-9_-]+|ibyteimg\.com\/[^"'\s\\>]+)/gi
                ) || [];
              for (const img of cdnImgs) {
                if (!isInvalidImage(img) && !suggestedImages.includes(img)) {
                  suggestedImages.push(img);
                  if (suggestedImages.length >= 4) break;
                }
              }
            }
          }
        } catch {
          // Try next user-agent or fallback
        }
      }
    }

    // 2. Parse Pasted Text from the user (if user pasted copied announcement text)
    if (pastedText) {
      const lines = pastedText
        .split('\n')
        .map((l: string) => l.trim())
        .filter(Boolean);
      if (!detectedCost) {
        detectedCost = extractPriceFromText(pastedText);
      }
      if (lines.length > 0 && !suggestedName) {
        const cleaned = cleanProductTitle(lines[0]);
        if (!isInvalidTitle(cleaned)) {
          suggestedName = cleaned;
        }
      }
      const imgUrlsInText = pastedText.match(/https?:\/\/[^\s"']+\.(?:jpg|jpeg|png|webp)/gi) || [];
      for (const u of imgUrlsInText) {
        if (!isInvalidImage(u) && !suggestedImages.includes(u)) suggestedImages.push(u);
      }
      if (lines.length > 1 && !suggestedDescription) {
        suggestedDescription = lines.slice(1).join(' ');
      }
      extractionMethod = 'pasted-text';
    }

    // 3. URL Slug Extraction (safe against `/<store_username>/<item_id>`)
    if (!suggestedName || isInvalidTitle(suggestedName)) {
      const bestSlug = extractNameFromUrlSlug(bestProductUrl).productName;
      const finalSlug = extractNameFromUrlSlug(finalUrl).productName;
      const rawSlug = extractNameFromUrlSlug(rawUrl).productName;
      suggestedName = bestSlug || finalSlug || rawSlug;
      if (suggestedName) extractionMethod = 'url-slug';
    }

    const { platform, supplierName: defaultSupplierName, estimatedDeliveryDays } = detectPlatform(
      bestProductUrl || finalUrl || rawUrl
    );
    const finalSupplierName = customSellerName || defaultSupplierName;

    if (!suggestedName || isInvalidTitle(suggestedName)) {
      suggestedName =
        platform === 'SHOPEE'
          ? 'Joia em Aço Cirúrgico 316L (Shopee)'
          : platform === 'TIKTOK'
            ? 'Joia em Aço Cirúrgico 316L (TikTok Shop)'
            : 'Nova Joia Aço Inox 316L';
    }

    const cleanedDescription = cleanProductDescription(suggestedDescription, suggestedName);
    const suggestedCategory = inferCategoryFromName(suggestedName);
    const { sizes: suggestedSizes, finishes: suggestedFinishes } = inferSizesAndFinishes(
      suggestedName,
      cleanedDescription
    );
    const priceDetected = Boolean(detectedCost && detectedCost > 0);
    const finalCost = priceDetected && detectedCost ? detectedCost : 29.9;
    // Sugere preço de venda com margem saudável (~3.2x o custo ou mínimo R$ 99,90)
    const calculatedSale = Math.max(99.9, Math.ceil((finalCost * 3.2) / 10) * 10 - 0.1);

    const categoryDefaultImage: Record<string, string> = {
      'cat-aneis': '/images/ring-square.webp',
      'cat-correntes': '/images/chain-grumet.webp',
      'cat-cordoes': '/images/chain-rope.webp',
      'cat-pingentes': '/images/pendant-cross.webp',
      'cat-pulseiras': '/images/bracelet-curb.webp',
      'cat-brincos': '/images/earrings-hoops.webp',
    };

    const validImages = suggestedImages.filter((img) => !isInvalidImage(img));

    const result: ExtractedSupplierProduct = {
      platform,
      supplierName: finalSupplierName,
      resolvedUrl: bestProductUrl || finalUrl || rawUrl,
      suggestedName,
      suggestedDescription: cleanedDescription,
      suggestedImages:
        validImages.length > 0
          ? validImages
          : [categoryDefaultImage[suggestedCategory] || categoryDefaultImage['cat-correntes']],
      suggestedCost: Number(finalCost.toFixed(2)),
      suggestedPrice: Number(calculatedSale.toFixed(2)),
      priceDetected,
      suggestedCategory,
      suggestedSizes,
      suggestedFinishes,
      estimatedDeliveryDays,
      extractionMethod,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Erro ao extrair dados do link:', error);
    return NextResponse.json({ error: 'Não foi possível processar o link' }, { status: 500 });
  }
}
