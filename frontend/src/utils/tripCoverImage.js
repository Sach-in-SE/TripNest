/**
 * TripNest Indian Landscape Cover Image Presets & Auto-Assignment Engine
 * Provides high-resolution, CDN-cached photography for Indian travel destinations
 * with automatic fallback when no custom cover image is provided by the traveler.
 */

export const INDIAN_LANDSCAPE_PRESETS = [
  {
    id: 'kashmir',
    name: 'Kashmir Valley',
    label: 'Kashmir (Dal Lake)',
    keywords: ['kashmir', 'srinagar', 'gulmarg', 'pahalgam', 'dal lake', 'sonamarg'],
    url: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=900&auto=format&fit=crop&q=80',
    alt: 'Shikara boats floating on serene Dal Lake with snow-capped Himalayas in Kashmir',
  },
  {
    id: 'taj-mahal',
    name: 'Taj Mahal',
    label: 'Taj Mahal (Agra)',
    keywords: ['taj mahal', 'taj', 'agra', 'yamuna', 'fatehpur'],
    url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=900&auto=format&fit=crop&q=80',
    alt: 'Majestic ivory-white marble Taj Mahal reflected in gardens at Agra',
  },
  {
    id: 'goa',
    name: 'Goa Coast',
    label: 'Goa (Beaches)',
    keywords: ['goa', 'beach', 'calangute', 'baga', 'anjuna', 'palolem', 'coastal'],
    url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=900&auto=format&fit=crop&q=80',
    alt: 'Golden palm-fringed tropical beach coastline in Goa at sunset',
  },
  {
    id: 'jaipur',
    name: 'Jaipur Palace',
    label: 'Jaipur (Rajasthan)',
    keywords: ['jaipur', 'rajasthan', 'udaipur', 'jodhpur', 'jaisalmer', 'palace', 'hawa mahal'],
    url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=900&auto=format&fit=crop&q=80',
    alt: 'Intricate pink sandstone Hawa Mahal palace facade in Jaipur Rajasthan',
  },
  {
    id: 'kerala',
    name: 'Kerala Backwaters',
    label: 'Kerala (Backwaters)',
    keywords: ['kerala', 'alleppey', 'alappuzha', 'munnar', 'kochi', 'cochin', 'backwaters', 'wayanad'],
    url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=900&auto=format&fit=crop&q=80',
    alt: 'Traditional wooden houseboat gliding through lush palm backwaters in Kerala',
  },
  {
    id: 'ladakh',
    name: 'Ladakh & Pangong',
    label: 'Ladakh (Pangong Tso)',
    keywords: ['ladakh', 'leh', 'pangong', 'nubra', 'khardung', 'himalayas', 'zanskar'],
    url: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=900&auto=format&fit=crop&q=80',
    alt: 'Crystal azure waters of high-altitude Pangong Tso lake in Ladakh',
  },
  {
    id: 'varanasi',
    name: 'Varanasi Ghats',
    label: 'Varanasi (Ganga)',
    keywords: ['varanasi', 'banaras', 'kashi', 'ganga', 'ghats'],
    url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=900&auto=format&fit=crop&q=80',
    alt: 'Historic stone ghats and temple spires along the holy Ganges river in Varanasi',
  },
  {
    id: 'himachal',
    name: 'Himachal & Manali',
    label: 'Manali / Himalayas',
    keywords: ['manali', 'shimla', 'dharamshala', 'himachal', 'kasol', 'spiti', 'rohtang', 'rishikesh', 'uttarakhand'],
    url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=900&auto=format&fit=crop&q=80',
    alt: 'Majestic pine-forested alpine valleys and mountain peaks in Himachal Pradesh',
  },
];

export const DEFAULT_INDIAN_COVER = 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=900&auto=format&fit=crop&q=80';

/**
 * Resolves the display cover image for a trip.
 * @param {string} destinationName - The name of the destination (e.g. "Goa", "Agra", "Jaipur")
 * @param {string} [customCoverUrl] - Custom user-uploaded image URL or base64 data URI
 * @returns {string} URL of the cover image
 */
export function getDestinationCoverImage(destinationName, customCoverUrl) {
  if (customCoverUrl && typeof customCoverUrl === 'string' && customCoverUrl.trim().length > 0) {
    return customCoverUrl.trim();
  }

  if (!destinationName || typeof destinationName !== 'string') {
    return DEFAULT_INDIAN_COVER;
  }

  const normalized = destinationName.toLowerCase();
  for (const preset of INDIAN_LANDSCAPE_PRESETS) {
    if (preset.keywords.some((kw) => normalized.includes(kw))) {
      return preset.url;
    }
  }

  return DEFAULT_INDIAN_COVER;
}

export default getDestinationCoverImage;
