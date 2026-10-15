// Diccionario inteligente de traducción y transliteración de productos coreanos y asiáticos
const KOREAN_DICTIONARY: Record<string, string> = {
  // Marcas famosas
  'samyang': '삼양',
  'nongshim': '농심',
  'lotte': '롯데',
  'orion': '오리온',
  'haitai': '해태',
  'binggrae': '빙그레',
  'paldo': '팔도',
  'ottogi': '오뚜기',
  'cj': 'CJ',

  // Ramens y Comidas
  'buldak': '불닭볶음면',
  'ramen': '라면',
  'ramyun': '라면',
  'fideos': '면',
  'udon': '우동',
  'chapagetti': '짜파게티',
  'shin': '신라면',
  'jin': '진라면',
  'neoguri': '너구리',
  'tteokbokki': '떡볶이',
  'topokki': '떡볶이',
  'yopokki': '요뽀끼',
  'mandu': '만두',
  'dumplings': '만두',
  'arroz': '밥',
  'sopa': '탕',
  'caldo': '국물',
  'algas': '김',
  'nori': '김스낵',

  // Helados y Postres
  'melona': '메로나',
  'samanco': '붕어싸만코',
  'helado': '아이스크림',
  'paleta': '아이스바',
  'bingsu': '빙수',
  'chocolate': '초콜릿',
  'choco': '초코',
  'galleta': '쿠키',
  'galletas': '비스킷',
  'pepero': '빼빼로',
  'pie': '파이',
  'dulce': '캔디',
  'dulces': '달콤한 과자',
  'mochi': '모찌',
  'malvavisco': '마시멜로',

  // Bebidas
  'milkis': '밀키스',
  'chilsung': '칠성사이다',
  'cider': '사이다',
  'gaseosa': '탄산음료',
  'bebida': '음료',
  'jugo': '주스',
  'bonbon': '포도봉봉',
  'sacsac': '쌕쌕',
  'soju': '소주',
  'te': '차',
  'té': '차',
  'boba': '버블티',
  'leche': '우유',

  // Sabores e Ingredientes
  'carbonara': '까르보',
  'queso': '치즈',
  'picante': '매운맛',
  'spicy': '매콤한',
  'fuego': '불',
  'dulce y picante': '달콤매콤',
  'fresa': '딸기',
  'melon': '멜론',
  'melón': '멜론',
  'mango': '망고',
  'platano': '바나나',
  'plátano': '바나나',
  'banana': '바나나',
  'uva': '포도',
  'verde': '청',
  'almendra': '아몬드',
  'almendras': '아몬드',
  'blanco': '화이트',
  'vainilla': '바닐라',
  'kimchi': '김치',
  'carne': '소고기',
  'pollo': '치킨',
  'mariscos': '해물',

  // K-Pop y Coleccionables
  'photocard': '포토카드',
  'photocards': '포토카드 세트',
  'lightstick': '응원봉',
  'llavero': '키링',
  'sticker': '스티커',
  'stickers': '스티커팩',
  'album': '앨범',
  'álbum': '앨범',
  'poster': '포스터',
  'póster': '포스터',

  // Mangas y Artículos
  'manga': '만화',
  'manhwa': '웹툰/만화',
  'tomo': '권',
  'libro': '도서',
  'cuaderno': '노트',
  'mascarilla': '마스크팩',
  'skincare': '스킨케어',
  'pack': '세트',
  'combo': '콤보 세트',
  'caja': '박스'
};

// Fonética Hangul para palabras en inglés o español que no tengan traducción directa
const PHONETIC_MAP: Record<string, string> = {
  'solo': '나 혼자',
  'leveling': '레벨업',
  'spy': '스파이',
  'family': '패밀리',
  'black': '블랙',
  'red': '레드',
  'super': '슈퍼',
  'mini': '미니',
  'cup': '컵',
  'gourmet': '고메',
  'hot': '핫',
  'ice': '아이스',
  'crispy': '바삭한'
};

/**
 * Traduce automáticamente un nombre de producto en español o inglés
 * a su denominación auténtica en Hangul coreano en tiempo real.
 */
export function translateToKorean(text: string): string {
  if (!text || !text.trim()) return '';

  const clean = text.toLowerCase()
    .replace(/[,\-\(\)\/\.\+\#]/g, ' ')
    .trim();

  const words = clean.split(/\s+/).filter(Boolean);
  const koreanTokens: string[] = [];

  for (let i = 0; i < words.length; i++) {
    // Revisar pares de dos palabras (ej. "frijol rojo", "dulce y picante")
    if (i < words.length - 1) {
      const pair = `${words[i]} ${words[i + 1]}`;
      if (KOREAN_DICTIONARY[pair]) {
        koreanTokens.push(KOREAN_DICTIONARY[pair]);
        i++; // saltar siguiente palabra
        continue;
      }
    }

    const word = words[i];
    if (KOREAN_DICTIONARY[word]) {
      koreanTokens.push(KOREAN_DICTIONARY[word]);
    } else if (PHONETIC_MAP[word]) {
      koreanTokens.push(PHONETIC_MAP[word]);
    }
  }

  // Si encontramos términos coreanos, unificarlos limpiamente
  if (koreanTokens.length > 0) {
    // Eliminar duplicados consecutivos
    const uniqueTokens = koreanTokens.filter((item, pos, arr) => pos === 0 || item !== arr[pos - 1]);
    return uniqueTokens.join(' ');
  }

  // Si es un producto no mapeado, generar un sufijo coreano acorde
  if (text.toLowerCase().includes('ramen') || text.toLowerCase().includes('fideo')) {
    return '한국 프리미엄 라면';
  }
  if (text.toLowerCase().includes('helado') || text.toLowerCase().includes('paleta')) {
    return '달콤한 한국 아이스크림';
  }
  if (text.toLowerCase().includes('bebida') || text.toLowerCase().includes('jugo')) {
    return '상쾌한 한국 음료';
  }
  if (text.toLowerCase().includes('snack') || text.toLowerCase().includes('galleta')) {
    return '인기 한국 스낵';
  }
  if (text.toLowerCase().includes('kpop') || text.toLowerCase().includes('card')) {
    return 'K-POP 공식 굿즈';
  }

  return '호시마켓 셀렉션';
}
