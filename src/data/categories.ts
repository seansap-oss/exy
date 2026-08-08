import type { Category } from '../types';

/**
 * EXY master taxonomy — modelled on OLX / Gumtree / Craigslist / FB Marketplace.
 * `icon` holds raw SVG inner markup drawn on a 24x24 viewBox with currentColor
 * strokes so the <CategoryIcon /> component can scale it to 200%.
 */
export const CATEGORIES: Category[] = [
  {
    id: 'fashion',
    name: 'Fashion & Apparel',
    slug: 'fashion-apparel',
    accent: '#f2713a',
    blurb: 'Suits, sneakers, boutiques, jewelry & luxury accessories on reel.',
    icon: `<path d="M8.5 3 12 6l3.5-3 4 2.2a2 2 0 0 1 1 2.3L19.4 11H17v9a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-9H4.6L3.5 7.5a2 2 0 0 1 1-2.3Z"/><path d="M9.5 3.4 12 8l2.5-4.6"/>`,
    children: [
      { id: 'suits', name: 'Suits', slug: 'suits', tags: ['3-piece', 'tuxedo', 'bespoke', 'wedding'] },
      { id: 'formalwear', name: 'Formalwear', slug: 'formalwear', tags: ['blazer', 'sherwani', 'gown', 'tie'] },
      {
        id: 'sneakers-black-shoes',
        name: 'Sneakers & Black Shoes',
        slug: 'sneakers-black-shoes',
        tags: ['black shoes', 'sneakers', 'oxford', 'loafers', 'running'],
      },
      { id: 'boutiques', name: 'Boutiques', slug: 'boutiques', tags: ['designer', 'ethnic', 'kurta', 'saree'] },
      { id: 'jewelry', name: 'Jewelry', slug: 'jewelry', tags: ['gold', 'silver', 'diamond', 'bridal'] },
      { id: 'watches', name: 'Watches', slug: 'watches', tags: ['automatic', 'smartwatch', 'vintage', 'chrono'] },
      {
        id: 'luxury-accessories',
        name: 'Luxury Accessories',
        slug: 'luxury-accessories',
        tags: ['handbags', 'belts', 'sunglasses', 'wallets'],
      },
    ],
  },
  {
    id: 'construction',
    name: 'Building & Construction',
    slug: 'building-construction',
    accent: '#c2661f',
    blurb: 'Bricks, cement, sand, roofing sheets, timber & aggregate suppliers.',
    icon: `<path d="M3 9h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M3 9 6 3h12l3 6"/><path d="M9 9V3M15 9V3M3 15h18"/>`,
    children: [
      { id: 'bricks', name: 'Bricks', slug: 'bricks', tags: ['red brick', 'fly ash', 'clay', 'wire cut'] },
      { id: 'cement', name: 'Cement', slug: 'cement', tags: ['opc 53', 'ppc', 'white cement', 'bulk'] },
      { id: 'sand', name: 'Sand', slug: 'sand', tags: ['river sand', 'm-sand', 'plastering', 'truckload'] },
      {
        id: 'structural-piping',
        name: 'Structural Piping',
        slug: 'structural-piping',
        tags: ['gi pipe', 'ms pipe', 'square tube', 'column'],
      },
      {
        id: 'roofing-sheets',
        name: 'Roofing Sheets',
        slug: 'roofing-sheets',
        tags: ['gi sheet', 'polycarbonate', 'tile profile', 'colour coated'],
      },
      { id: 'timber', name: 'Timber', slug: 'timber', tags: ['teak', 'plywood', 'pine', 'shuttering'] },
      {
        id: 'concrete-blocks',
        name: 'Concrete Blocks',
        slug: 'concrete-blocks',
        tags: ['aac', 'solid block', 'hollow block', 'paver'],
      },
      { id: 'gravel', name: 'Gravel', slug: 'gravel', tags: ['20mm', '40mm', 'aggregate', 'landscaping stone'] },
    ],
  },
  {
    id: 'hardware',
    name: 'Hardware & Tools',
    slug: 'hardware-tools',
    accent: '#8a5cf6',
    blurb: 'Power tools, plumbing gear, electrical supplies, safety & scaffolding.',
    icon: `<path d="M14.7 6.3a4 4 0 0 1 5.2 5.2l-1.6-1.6-2.2.6-.6-2.2Z"/><path d="M14.5 9.5 4.7 19.3a2 2 0 0 0 2.8 2.8l9.8-9.8"/><path d="M6 6l3 3M4 9l3-3"/>`,
    children: [
      { id: 'power-tools', name: 'Power Tools', slug: 'power-tools', tags: ['drill', 'grinder', 'saw', 'impact'] },
      { id: 'hand-tools', name: 'Hand Tools', slug: 'hand-tools', tags: ['spanner', 'hammer', 'chisel', 'tool kit'] },
      { id: 'plumbing-gear', name: 'Plumbing Gear', slug: 'plumbing-gear', tags: ['cpvc', 'faucet', 'tank', 'fittings'] },
      {
        id: 'electrical-supplies',
        name: 'Electrical Supplies',
        slug: 'electrical-supplies',
        tags: ['wiring', 'mcb', 'switchgear', 'led'],
      },
      {
        id: 'safety-equipment',
        name: 'Safety Equipment',
        slug: 'safety-equipment',
        tags: ['helmet', 'harness', 'gloves', 'boots'],
      },
      { id: 'scaffolding', name: 'Scaffolding', slug: 'scaffolding', tags: ['cuplock', 'props', 'rental', 'ladder'] },
      { id: 'paints', name: 'Paints & Finishes', slug: 'paints', tags: ['emulsion', 'primer', 'enamel', 'putty'] },
      { id: 'garden-gear', name: 'Garden Gear', slug: 'garden-gear', tags: ['mower', 'trimmer', 'hose', 'planters'] },
    ],
  },
  {
    id: 'property',
    name: 'Real Estate & Property',
    slug: 'real-estate-property',
    accent: '#0ea5a4',
    blurb: 'Flats, commercial spaces, land plots, PG/hostels & retail shops.',
    icon: `<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.8V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.8"/><path d="M9.5 21v-6h5v6"/>`,
    children: [
      {
        id: 'flats-sale',
        name: 'Apartments / Flats for Sale',
        slug: 'flats-for-sale',
        tags: ['2bhk', '3bhk', 'ready to move', 'builder floor'],
      },
      {
        id: 'flats-rent',
        name: 'Apartments / Flats for Rent',
        slug: 'flats-for-rent',
        tags: ['furnished', 'family', 'bachelor', 'lease'],
      },
      {
        id: 'commercial-spaces',
        name: 'Commercial Spaces',
        slug: 'commercial-spaces',
        tags: ['office', 'warehouse', 'showroom', 'coworking'],
      },
      { id: 'land-plots', name: 'Land / Plots', slug: 'land-plots', tags: ['residential plot', 'agricultural', 'corner', 'dtcp'] },
      { id: 'pg-hostels', name: 'PG / Hostels', slug: 'pg-hostels', tags: ['girls pg', 'boys pg', 'mess included', 'ac room'] },
      { id: 'shops', name: 'Shops', slug: 'shops', tags: ['high street', 'mall unit', 'kiosk', 'godown'] },
    ],
  },
  {
    id: 'home',
    name: 'Home & Furniture',
    slug: 'home-furniture',
    accent: '#e0851b',
    blurb: 'Sofas, dining sets, refrigerators, washing machines & decor.',
    icon: `<path d="M4 11V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M2 12.5A1.5 1.5 0 0 1 3.5 11h17a1.5 1.5 0 0 1 1.5 1.5V18H2Z"/><path d="M5 18v2M19 18v2M7 11V9h10v2"/>`,
    children: [
      { id: 'sofas', name: 'Sofas', slug: 'sofas', tags: ['l-shape', 'recliner', 'fabric', '3 seater'] },
      { id: 'dining-sets', name: 'Dining Sets', slug: 'dining-sets', tags: ['6 seater', 'marble top', 'wooden', 'foldable'] },
      { id: 'refrigerators', name: 'Refrigerators', slug: 'refrigerators', tags: ['double door', 'inverter', 'mini fridge', 'deep freezer'] },
      {
        id: 'washing-machines',
        name: 'Washing Machines',
        slug: 'washing-machines',
        tags: ['front load', 'top load', 'semi auto', 'dryer'],
      },
      {
        id: 'kitchen-appliances',
        name: 'Kitchen Appliances',
        slug: 'kitchen-appliances',
        tags: ['mixer', 'chimney', 'microwave', 'gas stove'],
      },
      { id: 'home-decor', name: 'Home Decor', slug: 'home-decor', tags: ['curtains', 'wall art', 'lighting', 'rugs'] },
    ],
  },
  {
    id: 'electronics',
    name: 'Electronics & Tech',
    slug: 'electronics-tech',
    accent: '#2563eb',
    blurb: 'Smartphones, laptops, audio gear, cameras, TVs & consoles.',
    icon: `<rect x="2.5" y="4.5" width="19" height="12" rx="2"/><path d="M8 20.5h8M12 16.5v4"/><path d="M6.5 8.5h6"/>`,
    children: [
      { id: 'smartphones', name: 'Smartphones', slug: 'smartphones', tags: ['iphone', 'android', '5g', 'refurbished'] },
      { id: 'laptops', name: 'Laptops', slug: 'laptops', tags: ['gaming', 'ultrabook', 'macbook', 'workstation'] },
      { id: 'audio-gear', name: 'Audio Gear', slug: 'audio-gear', tags: ['headphones', 'speakers', 'studio', 'dj'] },
      { id: 'cameras', name: 'Cameras', slug: 'cameras', tags: ['dslr', 'mirrorless', 'action cam', 'lens'] },
      { id: 'tv-video', name: 'TV / Video', slug: 'tv-video', tags: ['smart tv', 'oled', 'projector', 'soundbar'] },
      {
        id: 'gaming-consoles',
        name: 'Gaming Consoles',
        slug: 'gaming-consoles',
        tags: ['ps5', 'xbox', 'nintendo', 'controllers'],
      },
    ],
  },
  {
    id: 'services',
    name: 'Services & Trades',
    slug: 'services-trades',
    accent: '#16a34a',
    blurb: 'Roofing contractors, electricians, plumbers, tailors, movers & tutors.',
    icon: `<path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5"/><path d="M12 8v4l3 2"/><path d="M16.5 3.5h5v5"/><path d="M21.5 3.5 15 10"/>`,
    children: [
      {
        id: 'roofing-contractors',
        name: 'Roofing Contractors',
        slug: 'roofing-contractors',
        tags: ['waterproofing', 'sheet roofing', 'repair', 'annual contract'],
      },
      { id: 'electricians', name: 'Electricians', slug: 'electricians', tags: ['wiring', 'emergency', 'inverter', 'ac point'] },
      { id: 'plumbers', name: 'Plumbers', slug: 'plumbers', tags: ['leak repair', 'bathroom', 'tank cleaning', '24x7'] },
      { id: 'tailors', name: 'Tailors', slug: 'tailors', tags: ['bespoke suit', 'alteration', 'blouse', 'uniform'] },
      {
        id: 'freight-movers',
        name: 'Freight / Movers',
        slug: 'freight-movers',
        tags: ['packers', 'tempo', 'intercity', 'warehouse'],
      },
      {
        id: 'legal-finance',
        name: 'Legal / Finance',
        slug: 'legal-finance',
        tags: ['gst', 'registration', 'audit', 'advocate'],
      },
      { id: 'tutors', name: 'Tutors', slug: 'tutors', tags: ['maths', 'neet', 'spoken english', 'music'] },
    ],
  },
  {
    id: 'business',
    name: 'Business & Industrial',
    slug: 'business-industrial',
    accent: '#7c3aed',
    blurb: 'Businesses for sale, machinery, store fixtures & restaurant supplies.',
    icon: `<rect x="2.5" y="7.5" width="19" height="13" rx="2"/><path d="M8.5 7.5V5a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 5v2.5"/><path d="M2.5 12.5h19M11 12v2h2v-2"/>`,
    children: [
      {
        id: 'businesses-for-sale',
        name: 'Small Businesses for Sale',
        slug: 'businesses-for-sale',
        tags: ['cafe', 'salon', 'franchise', 'service route'],
      },
      {
        id: 'industrial-machinery',
        name: 'Industrial Machinery',
        slug: 'industrial-machinery',
        tags: ['cnc', 'lathe', 'packaging', 'generator'],
      },
      {
        id: 'store-fixtures',
        name: 'Store Fixtures',
        slug: 'store-fixtures',
        tags: ['display rack', 'counter', 'mannequin', 'signage'],
      },
      {
        id: 'restaurant-supplies',
        name: 'Restaurant Supplies',
        slug: 'restaurant-supplies',
        tags: ['tandoor', 'chiller', 'crockery', 'coffee machine'],
      },
    ],
  },
  {
    id: 'jobs',
    name: 'Jobs & Gigs',
    slug: 'jobs-gigs',
    accent: '#0891b2',
    blurb: 'Skilled labour, hospitality, admin, tech roles & freelance gigs.',
    icon: `<rect x="2.5" y="6.5" width="19" height="14" rx="2"/><path d="M8.5 6.5V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5"/><path d="M2.5 12h19M9.5 12v2h5v-2"/>`,
    children: [
      { id: 'skilled-labor', name: 'Skilled Labor', slug: 'skilled-labor', tags: ['mason', 'welder', 'carpenter', 'painter'] },
      { id: 'hospitality-jobs', name: 'Hospitality', slug: 'hospitality-jobs', tags: ['chef', 'steward', 'barista', 'housekeeping'] },
      { id: 'admin-jobs', name: 'Admin', slug: 'admin-jobs', tags: ['data entry', 'receptionist', 'accounts', 'hr'] },
      { id: 'tech-jobs', name: 'Tech', slug: 'tech-jobs', tags: ['developer', 'support', 'designer', 'qa'] },
      { id: 'freelance-gigs', name: 'Freelance Gigs', slug: 'freelance-gigs', tags: ['videography', 'reels editor', 'delivery', 'part time'] },
    ],
  },
  {
    id: 'fresh',
    name: 'Fresh & Agriculture',
    slug: 'fresh-agriculture',
    accent: '#65a30d',
    blurb: 'Farm produce, seeds, organic foods, artisan goods & livestock supplies.',
    icon: `<path d="M12 21c0-6 3.5-10.5 9-11-.5 6.5-4 10-9 11Z"/><path d="M12 21C12 15 8.5 10.5 3 10c.5 6.5 4 10 9 11Z"/><path d="M12 21v-4"/>`,
    children: [
      { id: 'farm-produce', name: 'Farm Produce', slug: 'farm-produce', tags: ['vegetables', 'fruits', 'wholesale', 'daily mandi'] },
      { id: 'seeds', name: 'Seeds', slug: 'seeds', tags: ['hybrid', 'heirloom', 'paddy', 'vegetable seeds'] },
      { id: 'organic-foods', name: 'Organic Foods', slug: 'organic-foods', tags: ['millets', 'cold pressed', 'honey', 'artisan'] },
      {
        id: 'livestock-supplies',
        name: 'Livestock Supplies',
        slug: 'livestock-supplies',
        tags: ['cattle feed', 'poultry', 'dairy gear', 'fodder'],
      },
      {
        id: 'farmers-markets',
        name: "Farmer's Markets",
        slug: 'farmers-markets',
        tags: ['weekend market', 'stall', 'local produce', 'artisan foods'],
      },
    ],
  },
];

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category]),
);

export function findSubCategory(categoryId: string, subId: string) {
  return CATEGORY_MAP[categoryId]?.children.find((child) => child.id === subId);
}

export function categoryName(categoryId: string): string {
  return CATEGORY_MAP[categoryId]?.name ?? 'Uncategorised';
}

export function subCategoryName(categoryId: string, subId: string): string {
  return findSubCategory(categoryId, subId)?.name ?? '';
}

export const ALL_TAGS = Array.from(
  new Set(CATEGORIES.flatMap((category) => category.children.flatMap((child) => child.tags))),
).sort();
