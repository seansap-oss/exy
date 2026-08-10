/**
 * EXY shared taxonomy — single source for website, Android app, share drawer,
 * single-listing form, bulk importer, search and the database seed
 * (supabase/migrations/006_taxonomy_seed.sql).
 *
 * Stable text ids are deliberate: listings.category_id / subcategory_id /
 * type_id store these strings, so renaming a label never orphans a listing.
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
  children?: TaxNode[];
}

export interface MainCategory extends TaxNode {
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
/* 14 MAIN CATEGORIES                                                          */
/* ========================================================================== */
export const TAXONOMY: MainCategory[] = [

  /* 1. ELECTRONICS, COMPUTERS & TECHNOLOGY ================================== */
  {
    id: 'electronics',
    name: 'Electronics, Computers & Technology',
    attributes: [
      CONDITION,
      { key: 'brand', label: 'Brand', input: 'text', filterable: true },
      { key: 'model', label: 'Model', input: 'text', filterable: true },
      { key: 'ram', label: 'RAM', input: 'select', options: ['2GB', '4GB', '8GB', '16GB', '32GB', '64GB', '128GB'], filterable: true },
      { key: 'storage', label: 'Storage', input: 'select', options: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'], filterable: true },
      { key: 'processor', label: 'Processor', input: 'select', options: ['Intel i3', 'Intel i5', 'Intel i7', 'Intel i9', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'Apple M1', 'Apple M2', 'Apple M3', 'Apple M4', 'Snapdragon', 'MediaTek', 'Other'], filterable: true },
      { key: 'screen_size', label: 'Screen size', input: 'number', unit: 'inch', filterable: true },
      { key: 'graphics', label: 'Graphics card', input: 'text' },
      { key: 'warranty', label: 'Under warranty', input: 'boolean' },
      { key: 'color', label: 'Color', input: 'text', filterable: true },
    ],
    children: [
      { id: 'ele-mobile-phones', name: 'Mobile Phones' },
      { id: 'ele-smartphones', name: 'Smartphones' },
      { id: 'ele-tablets', name: 'Tablets' },
      { id: 'ele-laptops', name: 'Laptops' },
      { id: 'ele-macbooks', name: 'MacBooks' },
      { id: 'ele-desktops', name: 'Desktop Computers' },
      { id: 'ele-gaming-pcs', name: 'Gaming PCs' },
      { id: 'ele-monitors', name: 'Monitors' },
      { id: 'ele-accessories', name: 'Computer Accessories' },
      { id: 'ele-keyboards', name: 'Keyboards' },
      { id: 'ele-mice', name: 'Mice' },
      { id: 'ele-webcams', name: 'Webcams' },
      { id: 'ele-printers', name: 'Printers & Scanners' },
      { id: 'ele-networking', name: 'Routers & Networking' },
      { id: 'ele-components', name: 'Computer Components', children: [
        { id: 'ele-cpus', name: 'CPUs' }, { id: 'ele-gpus', name: 'GPUs' },
        { id: 'ele-ram', name: 'RAM' }, { id: 'ele-motherboards', name: 'Motherboards' },
        { id: 'ele-storage-drives', name: 'Storage Drives' }, { id: 'ele-psu', name: 'Power Supplies' } ] },
      { id: 'ele-consoles', name: 'Gaming Consoles' },
      { id: 'ele-gaming-acc', name: 'Gaming Accessories' },
      { id: 'ele-tvs', name: 'Televisions' },
      { id: 'ele-cameras', name: 'Cameras' },
      { id: 'ele-lenses', name: 'Lenses' },
      { id: 'ele-audio', name: 'Audio Equipment' },
      { id: 'ele-headphones', name: 'Headphones & Earbuds' },
      { id: 'ele-speakers', name: 'Speakers' },
      { id: 'ele-smartwatches', name: 'Smartwatches' },
      { id: 'ele-wearables', name: 'Wearables' },
      { id: 'ele-cables', name: 'Cables & Chargers' },
      { id: 'ele-software', name: 'Software' },
      { id: 'ele-it-services', name: 'IT Services' },
      { id: 'ele-repairs', name: 'Repairs & Technical Support' },
    ],
  },

  /* 2. VEHICLES ============================================================ */
  {
    id: 'vehicles',
    name: 'Vehicles',
    attributes: [
      { key: 'make', label: 'Make', input: 'text', required: true, filterable: true },
      { key: 'model', label: 'Model', input: 'text', filterable: true },
      { key: 'year', label: 'Year', input: 'number', filterable: true },
      { key: 'mileage', label: 'Mileage', input: 'number', unit: 'km', filterable: true },
      { key: 'fuel', label: 'Fuel type', input: 'select', options: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'LPG'], filterable: true },
      { key: 'transmission', label: 'Transmission', input: 'select', options: ['Manual', 'Automatic', 'AMT', 'CVT', 'DCT'], filterable: true },
      { key: 'ownership', label: 'Ownership', input: 'select', options: ['1st owner', '2nd owner', '3rd owner', '4th or more'], filterable: true },
      { key: 'registration', label: 'Registration location', input: 'text' },
      { key: 'color', label: 'Color', input: 'text', filterable: true },
    ],
    children: [
      { id: 'veh-cars', name: 'Cars' }, { id: 'veh-motorcycles', name: 'Motorcycles' },
      { id: 'veh-scooters', name: 'Scooters' }, { id: 'veh-bicycles', name: 'Bicycles' },
      { id: 'veh-ev', name: 'Electric Vehicles' }, { id: 'veh-trucks', name: 'Trucks' },
      { id: 'veh-vans', name: 'Vans' }, { id: 'veh-commercial', name: 'Commercial Vehicles' },
      { id: 'veh-auto-parts', name: 'Auto Parts' }, { id: 'veh-bike-parts', name: 'Motorcycle Parts' },
      { id: 'veh-tyres', name: 'Tyres & Wheels' }, { id: 'veh-acc', name: 'Vehicle Accessories' },
      { id: 'veh-services', name: 'Vehicle Services' }, { id: 'veh-rentals', name: 'Car Rentals' },
      { id: 'veh-finance', name: 'Vehicle Finance' },
    ],
  },

  /* 3. PROPERTY & REAL ESTATE ============================================== */
  {
    id: 'property',
    name: 'Property & Real Estate',
    attributes: [
      { key: 'listing_type', label: 'Sale or rent', input: 'select', options: ['For sale', 'For rent', 'PG / Shared'], required: true, filterable: true },
      { key: 'bedrooms', label: 'Bedrooms', input: 'select', options: ['1', '2', '3', '4', '5+'], filterable: true },
      { key: 'bathrooms', label: 'Bathrooms', input: 'select', options: ['1', '2', '3', '4+'], filterable: true },
      { key: 'area', label: 'Area', input: 'number', unit: 'sq ft', filterable: true },
      { key: 'furnishing', label: 'Furnishing', input: 'select', options: ['Unfurnished', 'Semi-furnished', 'Fully furnished'], filterable: true },
      { key: 'parking', label: 'Parking', input: 'select', options: ['None', '1', '2', '3+'], filterable: true },
      { key: 'floor', label: 'Floor', input: 'text' },
      { key: 'facing', label: 'Facing', input: 'text' },
      { key: 'age', label: 'Property age', input: 'text' },
      { key: 'owner_type', label: 'Ownership', input: 'select', options: ['Freehold', 'Leasepower', 'Power of attorney'], filterable: true },
    ],
    children: [
      { id: 'prp-house-sale', name: 'Houses for Sale' }, { id: 'prp-apt-sale', name: 'Apartments for Sale' },
      { id: 'prp-house-rent', name: 'Houses for Rent' }, { id: 'prp-apt-rent', name: 'Apartments for Rent' },
      { id: 'prp-rooms', name: 'Rooms & Flatmates' }, { id: 'prp-land', name: 'Land & Plots' },
      { id: 'prp-commercial', name: 'Commercial Property' }, { id: 'prp-shops', name: 'Shops & Offices' },
      { id: 'prp-warehouses', name: 'Warehouses' }, { id: 'prp-industrial', name: 'Industrial Property' },
      { id: 'prp-hostels', name: 'Hostels & PG' }, { id: 'prp-vacation', name: 'Vacation Rentals' },
      { id: 'prp-services', name: 'Property Services' }, { id: 'prp-management', name: 'Property Management' },
    ],
  },

  /* 4. HOME, FURNITURE & GARDEN ============================================ */
  {
    id: 'home',
    name: 'Home, Furniture & Garden',
    attributes: [CONDITION, { key: 'material', label: 'Material', input: 'text' }, { key: 'assembly', label: 'Assembly required', input: 'boolean' }],
    children: [
      { id: 'hom-sofas', name: 'Sofas' }, { id: 'hom-beds', name: 'Beds & Mattresses' },
      { id: 'hom-tables', name: 'Tables & Chairs' }, { id: 'hom-wardrobes', name: 'Wardrobes' },
      { id: 'hom-kitchen-furn', name: 'Kitchen Furniture' }, { id: 'hom-office-furn', name: 'Office Furniture' },
      { id: 'hom-decor', name: 'Home Decor' }, { id: 'hom-lighting', name: 'Lighting' },
      { id: 'hom-curtains', name: 'Curtains & Blinds' },
      { id: 'hom-appliances', name: 'Appliances', children: [
        { id: 'hom-fridge', name: 'Refrigerators' }, { id: 'hom-washing', name: 'Washing Machines' },
        { id: 'hom-ac', name: 'Air Conditioners' }, { id: 'hom-coolers', name: 'Coolers' },
        { id: 'hom-fans', name: 'Fans' }, { id: 'hom-microwave', name: 'Microwaves' },
        { id: 'hom-oven', name: 'Ovens' }, { id: 'hom-mixer', name: 'Mixers & Grinders' },
        { id: 'hom-coffee', name: 'Coffee Machines' }, { id: 'hom-purifier', name: 'Water Purifiers' },
        { id: 'hom-vacuum', name: 'Vacuum Cleaners' }, { id: 'hom-geyser', name: 'Geysers' },
        { id: 'hom-iron', name: 'Irons' }, { id: 'hom-small-app', name: 'Small Appliances' } ] },
      { id: 'hom-garden', name: 'Gardening Equipment' }, { id: 'hom-plants', name: 'Plants' },
      { id: 'hom-tools', name: 'Tools' }, { id: 'hom-improvement', name: 'Home Improvement Materials' },
      { id: 'hom-cleaning', name: 'Cleaning Equipment' },
    ],
  },

  /* 5. FASHION & PERSONAL ITEMS =========================================== */
  {
    id: 'fashion',
    name: 'Fashion & Personal Items',
    attributes: [
      CONDITION,
      { key: 'size', label: 'Size', input: 'text', filterable: true },
      { key: 'gender', label: 'For', input: 'select', options: ['Men', 'Women', 'Unisex', 'Kids', 'Boys', 'Girls'], filterable: true },
      { key: 'brand', label: 'Brand', input: 'text', filterable: true },
      { key: 'material', label: 'Material', input: 'text', filterable: true },
    ],
    children: [
      { id: 'fsh-mens', name: "Men's Clothing" }, { id: 'fsh-womens', name: "Women's Clothing" },
      { id: 'fsh-kids', name: "Children's Clothing" }, { id: 'fsh-shoes', name: 'Shoes' },
      { id: 'fsh-bags', name: 'Bags' }, { id: 'fsh-watches', name: 'Watches' },
      { id: 'fsh-jewellery', name: 'Jewellery' }, { id: 'fsh-beauty', name: 'Beauty Products' },
      { id: 'fsh-cosmetics', name: 'Cosmetics' }, { id: 'fsh-personal-care', name: 'Personal Care' },
      { id: 'fsh-accessories', name: 'Accessories' }, { id: 'fsh-traditional', name: 'Traditional Clothing' },
      { id: 'fsh-wedding', name: 'Wedding Clothing' }, { id: 'fsh-sportswear', name: 'Sportswear' },
      { id: 'fsh-services', name: 'Fashion Services' },
    ],
  },

  /* 6. JOBS & EMPLOYMENT =================================================== */
  {
    id: 'jobs',
    name: 'Jobs & Employment',
    attributes: [
      { key: 'employment_type', label: 'Employment type', input: 'select', required: true, filterable: true,
        options: ['Full-Time', 'Part-Time', 'Casual', 'Contract', 'Temporary', 'Internship', 'Freelance'] },
      { key: 'work_mode', label: 'Work mode', input: 'select', filterable: true,
        options: ['On-site', 'Remote', 'Hybrid', 'Work from home'] },
      { key: 'salary_type', label: 'Payment frequency', input: 'select', filterable: true,
        options: ['Monthly', 'Daily wage', 'Hourly', 'Commission', 'Per project', 'Negotiable'] },
      { key: 'salary_min', label: 'Minimum salary', input: 'number', unit: '₹', filterable: true },
      { key: 'salary_max', label: 'Maximum salary', input: 'number', unit: '₹', filterable: true },
      { key: 'experience', label: 'Experience level', input: 'select', filterable: true,
        options: ['Fresher', '0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'] },
      { key: 'education', label: 'Education required', input: 'select',
        options: ['None', '10th', '12th', 'Diploma', 'Graduate', 'Post-graduate', 'Doctorate'] },
      { key: 'working_hours', label: 'Working hours', input: 'text' },
      { key: 'company', label: 'Company name', input: 'text', filterable: true },
      { key: 'vacancies', label: 'Number of vacancies', input: 'number' },
      { key: 'application_method', label: 'How to apply', input: 'select', options: ['In-app message', 'Phone call', 'Email', 'Walk-in'] },
      { key: 'closing_date', label: 'Closing date', input: 'text' },
      { key: 'benefits', label: 'Benefits', input: 'text' },
    ],
    children: [
      { id: 'job-full-time', name: 'Full-Time Jobs' }, { id: 'job-part-time', name: 'Part-Time Jobs' },
      { id: 'job-casual', name: 'Casual Jobs' }, { id: 'job-contract', name: 'Contract Jobs' },
      { id: 'job-temporary', name: 'Temporary Jobs' }, { id: 'job-work-home', name: 'Work From Home' },
      { id: 'job-remote', name: 'Remote Jobs' }, { id: 'job-internship', name: 'Internships' },
      { id: 'job-freelance', name: 'Freelance Work' }, { id: 'job-commission', name: 'Commission-Based Work' },
      { id: 'job-delivery', name: 'Delivery Jobs' }, { id: 'job-driver', name: 'Driver Jobs' },
      { id: 'job-sales', name: 'Sales Jobs' }, { id: 'job-marketing', name: 'Marketing Jobs' },
      { id: 'job-office', name: 'Office Jobs' }, { id: 'job-customer-svc', name: 'Customer Service' },
      { id: 'job-it', name: 'IT & Software Jobs' }, { id: 'job-construction', name: 'Construction Jobs' },
      { id: 'job-hospitality', name: 'Hospitality Jobs' }, { id: 'job-healthcare', name: 'Healthcare Jobs' },
      { id: 'job-education', name: 'Education Jobs' }, { id: 'job-domestic', name: 'Domestic Help' },
      { id: 'job-security', name: 'Security Jobs' }, { id: 'job-skilled', name: 'Skilled Trades' },
    ],
  },

  /* 7. SERVICES ============================================================ */
  {
    id: 'services',
    name: 'Services',
    attributes: [
      { key: 'service_type', label: 'Service type', input: 'text', filterable: true },
      { key: 'service_area', label: 'Service area', input: 'text', filterable: true },
      { key: 'availability', label: 'Availability', input: 'select', options: ['Weekdays', 'Weekends', 'All week', '24x7', 'By appointment'], filterable: true },
      { key: 'pricing_method', label: 'Pricing method', input: 'select', options: ['Fixed', 'Hourly', 'Per visit', 'Per project', 'Quote on request'], filterable: true },
      { key: 'experience_years', label: 'Years of experience', input: 'number', filterable: true },
    ],
    children: [
      { id: 'srv-home', name: 'Home Services', children: [
        { id: 'srv-cleaning', name: 'Cleaning' }, { id: 'srv-plumbing', name: 'Plumbing' },
        { id: 'srv-electrical', name: 'Electrical' }, { id: 'srv-painting', name: 'Painting' },
        { id: 'srv-carpentry', name: 'Carpentry' }, { id: 'srv-construction', name: 'Construction' },
        { id: 'srv-moving', name: 'Moving & Transport' } ] },
      { id: 'srv-repair', name: 'Repair Services' },
      { id: 'srv-computer', name: 'Computer Services' },
      { id: 'srv-phone-repair', name: 'Phone Repair' },
      { id: 'srv-vehicle', name: 'Vehicle Services' },
      { id: 'srv-photography', name: 'Photography' },
      { id: 'srv-video', name: 'Video Production' },
      { id: 'srv-design', name: 'Design Services' },
      { id: 'srv-marketing', name: 'Marketing Services' },
      { id: 'srv-legal', name: 'Legal Services' },
      { id: 'srv-accounting', name: 'Accounting Services' },
      { id: 'srv-education', name: 'Education & Tutoring' },
      { id: 'srv-childcare', name: 'Childcare' },
      { id: 'srv-beauty', name: 'Beauty Services' },
      { id: 'srv-fitness', name: 'Fitness & Personal Training' },
      { id: 'srv-events', name: 'Event Services' },
      { id: 'srv-catering', name: 'Catering' },
      { id: 'srv-travel', name: 'Travel Services' },
      { id: 'srv-business', name: 'Business Services' },
    ],
  },

  /* 8. BUSINESS & INDUSTRIAL =============================================== */
  {
    id: 'business',
    name: 'Business & Industrial',
    attributes: [CONDITION, { key: 'capacity', label: 'Capacity / output', input: 'text' }, { key: 'power_req', label: 'Power requirement', input: 'text' }],
    children: [
      { id: 'biz-machinery', name: 'Industrial Machinery' }, { id: 'biz-manufacturing', name: 'Manufacturing Equipment' },
      { id: 'biz-construction-eq', name: 'Construction Equipment' }, { id: 'biz-agri-eq', name: 'Agricultural Equipment' },
      { id: 'biz-restaurant', name: 'Restaurant Equipment' }, { id: 'biz-shop-eq', name: 'Shop Equipment' },
      { id: 'biz-office-eq', name: 'Office Equipment' }, { id: 'biz-medical-eq', name: 'Medical Equipment' },
      { id: 'biz-safety', name: 'Safety Equipment' }, { id: 'biz-packaging', name: 'Packaging Equipment' },
      { id: 'biz-wholesale', name: 'Wholesale Products' }, { id: 'biz-opportunities', name: 'Business Opportunities' },
      { id: 'biz-franchise', name: 'Franchise Opportunities' }, { id: 'biz-commercial-supplies', name: 'Commercial Supplies' },
      { id: 'biz-raw-materials', name: 'Raw Materials' }, { id: 'biz-import-export', name: 'Import & Export Services' },
    ],
  },

  /* 9. HOME APPLIANCES ===================================================== */
  {
    id: 'appliances',
    name: 'Home Appliances',
    attributes: [CONDITION, { key: 'brand', label: 'Brand', input: 'text', filterable: true }, { key: 'capacity', label: 'Capacity', input: 'text', filterable: true }, { key: 'energy_rating', label: 'Energy rating', input: 'select', options: ['5 Star', '4 Star', '3 Star', '2 Star', '1 Star'], filterable: true }],
    children: [
      { id: 'app-fridge', name: 'Refrigerators' }, { id: 'app-freezer', name: 'Freezers' },
      { id: 'app-washing', name: 'Washing Machines' }, { id: 'app-dryer', name: 'Dryers' },
      { id: 'app-dishwasher', name: 'Dishwashers' }, { id: 'app-microwave', name: 'Microwaves' },
      { id: 'app-oven', name: 'Ovens' }, { id: 'app-mixer', name: 'Mixers & Grinders' },
      { id: 'app-coffee', name: 'Coffee Machines' }, { id: 'app-ac', name: 'Air Conditioners' },
      { id: 'app-purifier', name: 'Air Purifiers' }, { id: 'app-water-purifier', name: 'Water Purifiers' },
      { id: 'app-vacuum', name: 'Vacuum Cleaners' }, { id: 'app-fan', name: 'Fans' },
      { id: 'app-geyser', name: 'Geysers' }, { id: 'app-iron', name: 'Irons' },
      { id: 'app-small', name: 'Small Appliances' },
    ],
  },

  /* 10. BOOKS, SPORTS, HOBBIES & ENTERTAINMENT ============================ */
  {
    id: 'leisure',
    name: 'Books, Sports, Hobbies & Entertainment',
    attributes: [CONDITION, { key: 'genre', label: 'Genre / type', input: 'text', filterable: true }, { key: 'author_artist', label: 'Author / artist', input: 'text', filterable: true }],
    children: [
      { id: 'lei-books', name: 'Books' }, { id: 'lei-school-books', name: 'School Books' },
      { id: 'lei-college-books', name: 'College Books' }, { id: 'lei-instruments', name: 'Musical Instruments' },
      { id: 'lei-sports-eq', name: 'Sports Equipment' }, { id: 'lei-gym', name: 'Gym Equipment' },
      { id: 'lei-outdoor', name: 'Outdoor Activities' }, { id: 'lei-toys', name: 'Toys' },
      { id: 'lei-games', name: 'Games' }, { id: 'lei-collectibles', name: 'Collectibles' },
      { id: 'lei-art', name: 'Art & Crafts' }, { id: 'lei-movies', name: 'Movies & Music' },
      { id: 'lei-party', name: 'Party Supplies' }, { id: 'lei-hobby', name: 'Hobby Equipment' },
      { id: 'lei-tickets', name: 'Tickets & Events' },
    ],
  },

  /* 11. PETS, ANIMALS & AGRICULTURE ======================================= */
  {
    id: 'agri',
    name: 'Pets, Animals & Agriculture',
    attributes: [
      { key: 'breed_type', label: 'Breed / type', input: 'text', filterable: true },
      { key: 'age', label: 'Age', input: 'text', filterable: true },
      { key: 'vaccinated', label: 'Vaccinated', input: 'boolean', filterable: true },
      { key: 'quantity', label: 'Quantity', input: 'number', filterable: true },
      { key: 'organic', label: 'Organic', input: 'boolean', filterable: true },
    ],
    children: [
      { id: 'agr-dogs', name: 'Dogs' }, { id: 'agr-cats', name: 'Cats' },
      { id: 'agr-birds', name: 'Birds' }, { id: 'agr-fish', name: 'Fish' },
      { id: 'agr-pet-acc', name: 'Pet Accessories' }, { id: 'agr-pet-food', name: 'Pet Food' },
      { id: 'agr-livestock', name: 'Livestock' }, { id: 'agr-poultry', name: 'Poultry' },
      { id: 'agr-cattle', name: 'Cattle' }, { id: 'agr-farm-eq', name: 'Farm Equipment' },
      { id: 'agr-seeds', name: 'Seeds' }, { id: 'agr-plants', name: 'Plants' },
      { id: 'agr-fertiliser', name: 'Fertiliser' }, { id: 'agr-animal-feed', name: 'Animal Feed' },
      { id: 'agr-agri-products', name: 'Agricultural Products' }, { id: 'agr-farm-services', name: 'Farm Services' },
    ],
  },

  /* 12. EDUCATION & TRAINING =============================================== */
  {
    id: 'education',
    name: 'Education & Training',
    attributes: [
      { key: 'course_type', label: 'Course type', input: 'select', filterable: true, options: ['Online', 'Offline', 'Hybrid'] },
      { key: 'subject', label: 'Subject', input: 'text', filterable: true },
      { key: 'level', label: 'Level', input: 'select', options: ['Beginner', 'Intermediate', 'Advanced', 'Professional'], filterable: true },
      { key: 'duration', label: 'Duration', input: 'text', filterable: true },
      { key: 'certification', label: 'Certification provided', input: 'boolean', filterable: true },
      { key: 'fees', label: 'Fees', input: 'number', unit: '₹', filterable: true },
    ],
    children: [
      { id: 'edu-schools', name: 'Schools' }, { id: 'edu-colleges', name: 'Colleges' },
      { id: 'edu-coaching', name: 'Coaching' }, { id: 'edu-online', name: 'Online Courses' },
      { id: 'edu-language', name: 'Language Classes' }, { id: 'edu-computer-training', name: 'Computer Training' },
      { id: 'edu-certification', name: 'Professional Certifications' }, { id: 'edu-music', name: 'Music Classes' },
      { id: 'edu-dance', name: 'Dance Classes' }, { id: 'edu-driving', name: 'Driving Classes' },
      { id: 'edu-vocational', name: 'Vocational Training' }, { id: 'edu-exam-prep', name: 'Exam Preparation' },
      { id: 'edu-tutors', name: 'Tutors' },
    ],
  },

  /* 13. TRAVEL, LEISURE & EVENTS ========================================== */
  {
    id: 'travel',
    name: 'Travel, Leisure & Events',
    attributes: [
      { key: 'travel_type', label: 'Type', input: 'select', options: ['Hotel', 'Rental', 'Package', 'Ticket', 'Service'], filterable: true },
      { key: 'location', label: 'Location', input: 'text', filterable: true },
      { key: 'duration', label: 'Duration', input: 'text', filterable: true },
      { key: 'price_per_night', label: 'Price per night', input: 'number', unit: '₹', filterable: true },
      { key: 'amenities', label: 'Amenities', input: 'text' },
    ],
    children: [
      { id: 'trv-hotels', name: 'Hotels' }, { id: 'trv-rentals', name: 'Holiday Rentals' },
      { id: 'trv-packages', name: 'Travel Packages' }, { id: 'trv-flights', name: 'Flights' },
      { id: 'trv-bus', name: 'Bus Tickets' }, { id: 'trv-event-tickets', name: 'Event Tickets' },
      { id: 'trv-wedding', name: 'Wedding Services' }, { id: 'trv-party', name: 'Party Services' },
      { id: 'trv-guides', name: 'Tour Guides' }, { id: 'trv-equipment', name: 'Travel Equipment' },
    ],
  },

  /* 14. COMMUNITY & MISCELLANEOUS ========================================= */
  {
    id: 'community',
    name: 'Community & Miscellaneous',
    attributes: [{ key: 'post_type', label: 'Post type', input: 'select', options: ['Lost', 'Found', 'Free', 'Donation', 'Announcement', 'Group', 'Other'], filterable: true }],
    children: [
      { id: 'com-lost-found', name: 'Lost & Found' }, { id: 'com-free', name: 'Free Items' },
      { id: 'com-donations', name: 'Donations' }, { id: 'com-announcements', name: 'Announcements' },
      { id: 'com-groups', name: 'Local Groups' }, { id: 'com-community-svc', name: 'Community Services' },
      { id: 'com-other', name: 'Other' },
    ],
  },
];

/* ========================================================================== */
/* Lookup helpers                                                              */
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

export function filterableAttributes(categoryId: string): AttrDef[] {
  return attributesOf(categoryId).filter((attr) => attr.filterable !== false);
}

export const TAXONOMY_VERSION = '14.0';
