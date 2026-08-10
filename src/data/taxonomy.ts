/**
 * EXY shared taxonomy — the single source used by the website, Android app,
 * share drawer, single-listing form, bulk importer, search and the database
 * seed in supabase/migrations/006_taxonomy_seed.sql.
 *
 * Stable ids are deliberate: listings.category_id / subcategory_id / type_id
 * store these strings, so renaming a label never orphans a listing.
 */

export type AttrInput = 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'range';

export interface AttrDef {
  key: string;
  label: string;
  input: AttrInput;
  options?: string[];
  unit?: string;
  required?: boolean;
  filterable?: boolean;
}

export interface TaxNode {
  id: string;
  name: string;
  /** subcategory → type → brand */
  children?: TaxNode[];
}

export interface MainCategory extends TaxNode {
  /** Attribute definitions inherited by every listing in this category. */
  attributes: AttrDef[];
}

const CONDITION: AttrDef = {
  key: 'condition',
  label: 'Condition',
  input: 'select',
  options: ['New', 'Like new', 'Good', 'Used', 'For parts'],
  filterable: true,
};

/* ========================================================================== */
/* 12 main categories                                                          */
/* ========================================================================== */
export const TAXONOMY: MainCategory[] = [
  {
    id: 'mobiles',
    name: 'Mobiles & Tablets',
    attributes: [
      CONDITION,
      { key: 'brand', label: 'Brand', input: 'select', options: ['Apple', 'Samsung', 'Xiaomi', 'OnePlus', 'Realme', 'Vivo', 'Oppo', 'Google', 'Motorola', 'Nothing', 'Other'], filterable: true },
      { key: 'storage', label: 'Storage', input: 'select', options: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'], filterable: true },
      { key: 'ram', label: 'RAM', input: 'select', options: ['2GB', '4GB', '6GB', '8GB', '12GB', '16GB'], filterable: true },
      { key: 'warranty', label: 'Under warranty', input: 'boolean' },
    ],
    children: [
      { id: 'mob-phones', name: 'Mobile Phones', children: [
        { id: 'mob-smart', name: 'Smartphones' }, { id: 'mob-feature', name: 'Feature Phones' },
        { id: 'mob-refurb', name: 'Refurbished Phones' } ] },
      { id: 'mob-tablets', name: 'Tablets', children: [
        { id: 'mob-ipad', name: 'iPad' }, { id: 'mob-android-tab', name: 'Android Tablets' } ] },
      { id: 'mob-wearables', name: 'Smart Watches & Wearables' },
      { id: 'mob-accessories', name: 'Accessories', children: [
        { id: 'mob-cases', name: 'Cases & Covers' }, { id: 'mob-chargers', name: 'Chargers & Cables' },
        { id: 'mob-powerbank', name: 'Power Banks' } ] },
      { id: 'mob-repair', name: 'Mobile Repair & Services' },
    ],
  },
  {
    id: 'computers',
    name: 'Computers, Laptops & IT',
    attributes: [
      CONDITION,
      { key: 'ram', label: 'RAM', input: 'select', options: ['4GB', '8GB', '16GB', '32GB', '64GB', '128GB'], filterable: true },
      { key: 'storage', label: 'Storage', input: 'select', options: ['128GB SSD', '256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD', '1TB HDD', '2TB HDD'], filterable: true },
      { key: 'processor', label: 'Processor', input: 'select', options: ['Intel i3', 'Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'Apple M1', 'Apple M2', 'Apple M3', 'Apple M4', 'Other'], filterable: true },
      { key: 'os', label: 'Operating system', input: 'select', options: ['Windows 11', 'Windows 10', 'macOS', 'ChromeOS', 'Linux', 'None'], filterable: true },
      { key: 'screen_size', label: 'Screen size', input: 'number', unit: 'inch', filterable: true },
      { key: 'graphics', label: 'Graphics card', input: 'text' },
    ],
    children: [
      { id: 'cmp-laptops', name: 'Laptops', children: [
        { id: 'cmp-mba', name: 'MacBook Air' }, { id: 'cmp-mbp', name: 'MacBook Pro' },
        { id: 'cmp-win-laptop', name: 'Windows Laptops' }, { id: 'cmp-gaming-laptop', name: 'Gaming Laptops' },
        { id: 'cmp-chromebook', name: 'Chromebooks' } ] },
      { id: 'cmp-desktops', name: 'Desktop Computers', children: [
        { id: 'cmp-gaming-pc', name: 'Gaming PCs' }, { id: 'cmp-imac', name: 'iMac' },
        { id: 'cmp-mac-mini', name: 'Mac Mini' }, { id: 'cmp-mac-studio', name: 'Mac Studio' },
        { id: 'cmp-mac-pro', name: 'Mac Pro' }, { id: 'cmp-workstation', name: 'Workstations' } ] },
      { id: 'cmp-peripherals', name: 'Peripherals', children: [
        { id: 'cmp-monitors', name: 'Monitors' }, { id: 'cmp-keyboards', name: 'Keyboards' },
        { id: 'cmp-mice', name: 'Mice' }, { id: 'cmp-printers', name: 'Printers' },
        { id: 'cmp-scanners', name: 'Scanners' }, { id: 'cmp-webcams', name: 'Webcams' } ] },
      { id: 'cmp-networking', name: 'Networking', children: [
        { id: 'cmp-routers', name: 'Routers' }, { id: 'cmp-switches', name: 'Network Switches' },
        { id: 'cmp-nas', name: 'NAS' } ] },
      { id: 'cmp-components', name: 'Components', children: [
        { id: 'cmp-ssd', name: 'SSDs' }, { id: 'cmp-hdd', name: 'Hard Drives' },
        { id: 'cmp-ram', name: 'RAM' }, { id: 'cmp-cpu', name: 'Processors' },
        { id: 'cmp-gpu', name: 'Graphics Cards' }, { id: 'cmp-mobo', name: 'Motherboards' },
        { id: 'cmp-battery', name: 'Laptop Batteries' }, { id: 'cmp-screen', name: 'Laptop Screens' } ] },
      { id: 'cmp-services', name: 'IT Services', children: [
        { id: 'cmp-repair', name: 'Computer Repair' }, { id: 'cmp-support', name: 'IT Support' },
        { id: 'cmp-webdev', name: 'Website Development' } ] },
    ],
  },
  {
    id: 'electronics',
    name: 'Electronics & Appliances',
    attributes: [
      CONDITION,
      { key: 'brand', label: 'Brand', input: 'text', filterable: true },
      { key: 'warranty', label: 'Under warranty', input: 'boolean' },
      { key: 'energy_rating', label: 'Energy rating', input: 'select', options: ['5 Star', '4 Star', '3 Star', '2 Star', '1 Star'], filterable: true },
    ],
    children: [
      { id: 'ele-tv', name: 'TV & Video', children: [
        { id: 'ele-tvs', name: 'TVs' }, { id: 'ele-soundbar', name: 'Soundbars' },
        { id: 'ele-hometheatre', name: 'Home Theatres' }, { id: 'ele-projector', name: 'Projectors' } ] },
      { id: 'ele-audio', name: 'Audio', children: [
        { id: 'ele-speakers', name: 'Speakers' }, { id: 'ele-headphones', name: 'Headphones' },
        { id: 'ele-earbuds', name: 'Earbuds' } ] },
      { id: 'ele-cameras', name: 'Cameras', children: [
        { id: 'ele-camera', name: 'Cameras' }, { id: 'ele-lenses', name: 'Lenses' },
        { id: 'ele-drones', name: 'Drones' } ] },
      { id: 'ele-gaming', name: 'Gaming Consoles' },
      { id: 'ele-smarthome', name: 'Smart Home Devices' },
      { id: 'ele-kitchen', name: 'Kitchen Appliances', children: [
        { id: 'ele-microwave', name: 'Microwaves' }, { id: 'ele-airfryer', name: 'Air Fryers' },
        { id: 'ele-mixer', name: 'Mixers' }, { id: 'ele-coffee', name: 'Coffee Machines' },
        { id: 'ele-purifier', name: 'Water Purifiers' } ] },
      { id: 'ele-large', name: 'Large Appliances', children: [
        { id: 'ele-ac', name: 'Air Conditioners' }, { id: 'ele-fridge', name: 'Refrigerators' },
        { id: 'ele-washing', name: 'Washing Machines' } ] },
      { id: 'ele-power', name: 'Power & Energy', children: [
        { id: 'ele-inverter', name: 'Inverters' }, { id: 'ele-batteries', name: 'Batteries' },
        { id: 'ele-solar', name: 'Solar Panels' }, { id: 'ele-generator', name: 'Generators' } ] },
    ],
  },
  {
    id: 'vehicles',
    name: 'Vehicles',
    attributes: [
      { key: 'brand', label: 'Brand', input: 'text', required: true, filterable: true },
      { key: 'model', label: 'Model', input: 'text', filterable: true },
      { key: 'year', label: 'Year', input: 'number', filterable: true },
      { key: 'mileage', label: 'Mileage', input: 'number', unit: 'km', filterable: true },
      { key: 'fuel', label: 'Fuel type', input: 'select', options: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'LPG'], filterable: true },
      { key: 'transmission', label: 'Transmission', input: 'select', options: ['Manual', 'Automatic', 'AMT', 'CVT', 'DCT'], filterable: true },
      { key: 'ownership', label: 'Ownership', input: 'select', options: ['1st owner', '2nd owner', '3rd owner', '4th or more'], filterable: true },
      { key: 'registration', label: 'Registration location', input: 'text' },
    ],
    children: [
      { id: 'veh-cars', name: 'Cars', children: [
        { id: 'veh-hatchback', name: 'Hatchbacks' }, { id: 'veh-sedan', name: 'Sedans' },
        { id: 'veh-suv', name: 'SUVs' }, { id: 'veh-muv', name: 'MUVs' },
        { id: 'veh-ev-car', name: 'Electric Cars' } ] },
      { id: 'veh-bikes', name: 'Motorcycles', children: [
        { id: 'veh-sports', name: 'Sports Bikes' }, { id: 'veh-cruiser', name: 'Cruisers' },
        { id: 'veh-commuter', name: 'Commuter Bikes' } ] },
      { id: 'veh-scooters', name: 'Scooters', children: [
        { id: 'veh-petrol-scooter', name: 'Petrol Scooters' }, { id: 'veh-ev-scooter', name: 'Electric Scooters' } ] },
      { id: 'veh-bicycles', name: 'Bicycles' },
      { id: 'veh-commercial', name: 'Commercial Vehicles', children: [
        { id: 'veh-trucks', name: 'Trucks' }, { id: 'veh-vans', name: 'Vans' }, { id: 'veh-buses', name: 'Buses' } ] },
      { id: 'veh-parts', name: 'Spare Parts & Accessories', children: [
        { id: 'veh-tyres', name: 'Tyres' }, { id: 'veh-batteries', name: 'Batteries' },
        { id: 'veh-helmets', name: 'Helmets' } ] },
      { id: 'veh-services', name: 'Vehicle Services' },
      { id: 'veh-rentals', name: 'Rentals' },
    ],
  },
  {
    id: 'property',
    name: 'Property',
    attributes: [
      { key: 'listing_type', label: 'Sale or rent', input: 'select', options: ['For sale', 'For rent', 'PG / Shared'], required: true, filterable: true },
      { key: 'bedrooms', label: 'Bedrooms', input: 'select', options: ['1', '2', '3', '4', '5+'], filterable: true },
      { key: 'bathrooms', label: 'Bathrooms', input: 'select', options: ['1', '2', '3', '4+'], filterable: true },
      { key: 'area', label: 'Area', input: 'number', unit: 'sq ft', filterable: true },
      { key: 'furnishing', label: 'Furnishing', input: 'select', options: ['Unfurnished', 'Semi-furnished', 'Fully furnished'], filterable: true },
      { key: 'parking', label: 'Parking', input: 'select', options: ['None', '1', '2', '3+'], filterable: true },
      { key: 'floor', label: 'Floor', input: 'text' },
    ],
    children: [
      { id: 'prp-residential', name: 'Residential', children: [
        { id: 'prp-house', name: 'Houses' }, { id: 'prp-apartment', name: 'Apartments' },
        { id: 'prp-villa', name: 'Villas' }, { id: 'prp-flat', name: 'Flats' },
        { id: 'prp-room', name: 'Rooms' } ] },
      { id: 'prp-shared', name: 'PG & Hostels', children: [
        { id: 'prp-pg', name: 'PG' }, { id: 'prp-hostel', name: 'Hostels' } ] },
      { id: 'prp-commercial', name: 'Commercial', children: [
        { id: 'prp-shop', name: 'Shops' }, { id: 'prp-office', name: 'Offices' },
        { id: 'prp-showroom', name: 'Showrooms' }, { id: 'prp-warehouse', name: 'Warehouses' },
        { id: 'prp-hotel', name: 'Hotels' } ] },
      { id: 'prp-land', name: 'Land & Plots', children: [
        { id: 'prp-plot', name: 'Plots' }, { id: 'prp-agri-land', name: 'Agricultural Land' } ] },
      { id: 'prp-services', name: 'Property Services' },
    ],
  },
  {
    id: 'home',
    name: 'Home, Furniture & Garden',
    attributes: [
      CONDITION,
      { key: 'material', label: 'Material', input: 'text' },
      { key: 'assembly', label: 'Assembly required', input: 'boolean' },
    ],
    children: [
      { id: 'hom-furniture', name: 'Furniture', children: [
        { id: 'hom-sofa', name: 'Sofas' }, { id: 'hom-bed', name: 'Beds & Mattresses' },
        { id: 'hom-dining', name: 'Dining Sets' }, { id: 'hom-wardrobe', name: 'Wardrobes' },
        { id: 'hom-office-furn', name: 'Office Furniture' } ] },
      { id: 'hom-decor', name: 'Home Decor' },
      { id: 'hom-kitchenware', name: 'Kitchenware' },
      { id: 'hom-garden', name: 'Garden & Outdoor' },
      { id: 'hom-tools', name: 'Tools & DIY' },
      { id: 'hom-building', name: 'Building Materials', children: [
        { id: 'hom-bricks', name: 'Bricks' }, { id: 'hom-cement', name: 'Cement' },
        { id: 'hom-sand', name: 'Sand & Aggregate' }, { id: 'hom-roofing', name: 'Roofing Sheets' },
        { id: 'hom-timber', name: 'Timber' } ] },
    ],
  },
  {
    id: 'fashion',
    name: 'Fashion & Personal Items',
    attributes: [
      CONDITION,
      { key: 'size', label: 'Size', input: 'text', filterable: true },
      { key: 'gender', label: 'For', input: 'select', options: ['Men', 'Women', 'Unisex', 'Kids'], filterable: true },
      { key: 'brand', label: 'Brand', input: 'text', filterable: true },
    ],
    children: [
      { id: 'fsh-clothing', name: 'Clothing', children: [
        { id: 'fsh-mens', name: "Men's Clothing" }, { id: 'fsh-womens', name: "Women's Clothing" },
        { id: 'fsh-kids', name: "Kids' Clothing" }, { id: 'fsh-suits', name: 'Suits & Formalwear' } ] },
      { id: 'fsh-footwear', name: 'Footwear', children: [
        { id: 'fsh-sneakers', name: 'Sneakers' }, { id: 'fsh-formal-shoes', name: 'Formal Shoes' } ] },
      { id: 'fsh-watches', name: 'Watches' },
      { id: 'fsh-jewellery', name: 'Jewellery' },
      { id: 'fsh-bags', name: 'Bags & Luggage' },
      { id: 'fsh-beauty', name: 'Beauty & Grooming' },
    ],
  },
  {
    id: 'jobs',
    name: 'Jobs & Employment',
    attributes: [
      { key: 'employment_type', label: 'Employment type', input: 'select', required: true, filterable: true,
        options: ['Full-time', 'Part-time', 'Casual', 'Temporary', 'Contract', 'Internship', 'Freelance'] },
      { key: 'work_mode', label: 'Work mode', input: 'select', options: ['On-site', 'Remote', 'Hybrid', 'Work from home'], filterable: true },
      { key: 'salary_type', label: 'Salary type', input: 'select', filterable: true,
        options: ['Monthly', 'Daily wage', 'Hourly', 'Commission', 'Per project', 'Negotiable'] },
      { key: 'salary_min', label: 'Minimum salary', input: 'number', unit: '₹', filterable: true },
      { key: 'salary_max', label: 'Maximum salary', input: 'number', unit: '₹', filterable: true },
      { key: 'experience', label: 'Experience level', input: 'select', filterable: true,
        options: ['Fresher', '0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'] },
      { key: 'education', label: 'Education required', input: 'select',
        options: ['None', '10th', '12th', 'Diploma', 'Graduate', 'Post-graduate', 'Doctorate'] },
      { key: 'working_hours', label: 'Working hours', input: 'text' },
      { key: 'vacancies', label: 'Number of vacancies', input: 'number' },
      { key: 'application_method', label: 'How to apply', input: 'select', options: ['In-app message', 'Phone call', 'Email', 'Walk-in'] },
      { key: 'closing_date', label: 'Closing date', input: 'text' },
    ],
    children: [
      { id: 'job-it', name: 'IT & Software' }, { id: 'job-engineering', name: 'Engineering' },
      { id: 'job-construction', name: 'Construction' }, { id: 'job-admin', name: 'Administration' },
      { id: 'job-sales', name: 'Sales & Marketing' }, { id: 'job-retail', name: 'Retail' },
      { id: 'job-customer', name: 'Customer Service' }, { id: 'job-bpo', name: 'BPO & Call Centre' },
      { id: 'job-teaching', name: 'Teaching' }, { id: 'job-healthcare', name: 'Healthcare' },
      { id: 'job-hospitality', name: 'Hospitality' }, { id: 'job-hotel', name: 'Hotel & Tourism' },
      { id: 'job-driving', name: 'Driving & Delivery' }, { id: 'job-security', name: 'Security' },
      { id: 'job-accounting', name: 'Accounting' }, { id: 'job-legal', name: 'Legal' },
      { id: 'job-agriculture', name: 'Agriculture' }, { id: 'job-manufacturing', name: 'Manufacturing' },
      { id: 'job-domestic', name: 'Domestic Help' }, { id: 'job-beauty', name: 'Beauty & Salon' },
      { id: 'job-media', name: 'Media & Creative' }, { id: 'job-government', name: 'Government' },
      { id: 'job-ngo', name: 'NGO & Charity' }, { id: 'job-sports', name: 'Sports & Fitness' },
    ],
  },
  {
    id: 'services',
    name: 'Services',
    attributes: [
      { key: 'service_type', label: 'Service type', input: 'text', filterable: true },
      { key: 'service_area', label: 'Service area', input: 'text', filterable: true },
      { key: 'availability', label: 'Availability', input: 'select', options: ['Weekdays', 'Weekends', 'All week', '24x7', 'By appointment'], filterable: true },
      { key: 'pricing_method', label: 'Pricing method', input: 'select', options: ['Fixed', 'Hourly', 'Per visit', 'Per project', 'Quote on request'], filterable: true },
    ],
    children: [
      { id: 'srv-home', name: 'Home Services', children: [
        { id: 'srv-electrician', name: 'Electricians' }, { id: 'srv-plumber', name: 'Plumbers' },
        { id: 'srv-carpenter', name: 'Carpenters' }, { id: 'srv-painter', name: 'Painters' },
        { id: 'srv-cleaning', name: 'Cleaning' }, { id: 'srv-pest', name: 'Pest Control' } ] },
      { id: 'srv-construction', name: 'Construction & Repair', children: [
        { id: 'srv-roofing', name: 'Roofing Contractors' }, { id: 'srv-masonry', name: 'Masonry' } ] },
      { id: 'srv-transport', name: 'Transport & Movers' },
      { id: 'srv-education', name: 'Tutors & Education' },
      { id: 'srv-events', name: 'Events & Photography' },
      { id: 'srv-professional', name: 'Legal, Finance & Professional' },
      { id: 'srv-tailor', name: 'Tailors & Alterations' },
    ],
  },
  {
    id: 'business',
    name: 'Business & Industrial',
    attributes: [
      CONDITION,
      { key: 'capacity', label: 'Capacity / output', input: 'text' },
      { key: 'power', label: 'Power requirement', input: 'text' },
    ],
    children: [
      { id: 'biz-forsale', name: 'Businesses for Sale' },
      { id: 'biz-machinery', name: 'Industrial Machinery' },
      { id: 'biz-fixtures', name: 'Store Fixtures' },
      { id: 'biz-restaurant', name: 'Restaurant Supplies' },
      { id: 'biz-office', name: 'Office Equipment' },
      { id: 'biz-wholesale', name: 'Wholesale & Bulk' },
    ],
  },
  {
    id: 'leisure',
    name: 'Books, Sports, Hobbies & Entertainment',
    attributes: [CONDITION, { key: 'brand', label: 'Brand', input: 'text', filterable: true }],
    children: [
      { id: 'lei-books', name: 'Books & Magazines' },
      { id: 'lei-sports', name: 'Sports Equipment' },
      { id: 'lei-fitness', name: 'Gym & Fitness' },
      { id: 'lei-music', name: 'Musical Instruments' },
      { id: 'lei-games', name: 'Games & Toys' },
      { id: 'lei-collectibles', name: 'Art & Collectibles' },
      { id: 'lei-travel', name: 'Travel & Outdoor Gear' },
    ],
  },
  {
    id: 'agri',
    name: 'Pets, Animals & Agriculture',
    attributes: [
      { key: 'quantity', label: 'Quantity', input: 'number', filterable: true },
      { key: 'organic', label: 'Organic', input: 'boolean', filterable: true },
    ],
    children: [
      { id: 'agr-pets', name: 'Pets' },
      { id: 'agr-petsupplies', name: 'Pet Supplies' },
      { id: 'agr-livestock', name: 'Livestock' },
      { id: 'agr-produce', name: 'Farm Produce' },
      { id: 'agr-seeds', name: 'Seeds & Plants' },
      { id: 'agr-equipment', name: 'Farm Equipment' },
      { id: 'agr-organic', name: 'Organic Foods' },
    ],
  },
];

/* ========================================================================== */
/* Lookups                                                                     */
/* ========================================================================== */
export const TAX_MAP: Record<string, MainCategory> = Object.fromEntries(
  TAXONOMY.map((category) => [category.id, category]),
);

export function subcategoriesOf(categoryId: string): TaxNode[] {
  return TAX_MAP[categoryId]?.children ?? [];
}

export function typesOf(categoryId: string, subcategoryId: string): TaxNode[] {
  return subcategoriesOf(categoryId).find((sub) => sub.id === subcategoryId)?.children ?? [];
}

export function attributesOf(categoryId: string): AttrDef[] {
  return TAX_MAP[categoryId]?.attributes ?? [];
}

export function nodeName(categoryId: string, subcategoryId?: string, typeId?: string): string {
  const category = TAX_MAP[categoryId];
  if (!category) return '';
  if (!subcategoryId) return category.name;
  const sub = category.children?.find((item) => item.id === subcategoryId);
  if (!sub) return category.name;
  if (!typeId) return sub.name;
  return sub.children?.find((item) => item.id === typeId)?.name ?? sub.name;
}

/** Breadcrumb for search results and listing pages. */
export function breadcrumb(categoryId: string, subcategoryId?: string, typeId?: string): string[] {
  const out: string[] = [];
  const category = TAX_MAP[categoryId];
  if (!category) return out;
  out.push(category.name);
  const sub = category.children?.find((item) => item.id === subcategoryId);
  if (sub) {
    out.push(sub.name);
    const type = sub.children?.find((item) => item.id === typeId);
    if (type) out.push(type.name);
  }
  return out;
}

/** Every filterable attribute across the taxonomy, for the search UI. */
export function filterableAttributes(categoryId: string): AttrDef[] {
  return attributesOf(categoryId).filter((attr) => attr.filterable !== false);
}
