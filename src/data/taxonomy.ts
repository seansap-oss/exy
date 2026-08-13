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
/* 15 MAIN CATEGORIES                                                          */
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
      { id: 'ele-mobile-phones', name: 'Mobile Phones & Accessories', children: [
        { id: 'ele-phone-smart', name: 'Smartphones' }, { id: 'ele-phone-watch', name: 'Smartwatches & Fitness Trackers' },
        { id: 'ele-phone-case', name: 'Cases, Covers & Screen Protectors' }, { id: 'ele-phone-power', name: 'Chargers, Cables & Power Banks' },
      ] },
      { id: 'ele-smartphones', name: 'Smartphones' },
      { id: 'ele-tablets', name: 'Tablets' },
      { id: 'ele-tablets-readers', name: 'Tablets & E-readers', children: [
        { id: 'ele-tablet-ipad', name: 'Tablets & iPads' }, { id: 'ele-ereader', name: 'E-readers' },
      ] },
      { id: 'ele-laptops', name: 'Laptops & MacBooks', children: [
        { id: 'ele-laptop-windows', name: 'Windows Laptops' }, { id: 'ele-laptop-mac', name: 'MacBooks' },
        { id: 'ele-laptop-gaming', name: 'Gaming Laptops' }, { id: 'ele-laptop-chromebook', name: 'Chromebooks' },
      ] },
      { id: 'ele-macbooks', name: 'MacBooks' },
      { id: 'ele-desktops', name: 'Desktop PCs & Gaming Rigs', children: [
        { id: 'ele-desktop-office', name: 'Office & Home PCs' }, { id: 'ele-desktop-gaming', name: 'Gaming Rigs' },
        { id: 'ele-desktop-workstation', name: 'Workstations & Servers' },
      ] },
      { id: 'ele-gaming-pcs', name: 'Gaming PCs' },
      { id: 'ele-monitors', name: 'Monitors' },
      { id: 'ele-accessories', name: 'Computer Accessories' },
      { id: 'ele-keyboards', name: 'Keyboards' },
      { id: 'ele-mice', name: 'Mice' },
      { id: 'ele-webcams', name: 'Webcams' },
      { id: 'ele-printers', name: 'Printers & Scanners' },
      { id: 'ele-office-devices', name: 'Office, Printing & POS', children: [
        { id: 'ele-printer-3d', name: 'Printers, Scanners & 3D Printers' }, { id: 'ele-pos', name: 'POS, Barcode & Office Equipment' },
      ] },
      { id: 'ele-networking', name: 'Routers & Networking' },
      { id: 'ele-components', name: 'Computer Components', children: [
        { id: 'ele-cpus', name: 'CPUs' }, { id: 'ele-gpus', name: 'GPUs' },
        { id: 'ele-ram', name: 'RAM' }, { id: 'ele-motherboards', name: 'Motherboards' },
        { id: 'ele-storage-drives', name: 'Storage Drives' }, { id: 'ele-psu', name: 'Power Supplies' } ] },
      { id: 'ele-consoles', name: 'Video Gaming & Consoles', children: [
        { id: 'ele-console-playstation', name: 'PlayStation Consoles & Games' }, { id: 'ele-console-xbox', name: 'Xbox Consoles & Games' },
        { id: 'ele-console-nintendo', name: 'Nintendo Consoles & Games' }, { id: 'ele-console-retro', name: 'Retro Gaming & Arcade' },
      ] },
      { id: 'ele-gaming-acc', name: 'Gaming Accessories' },
      { id: 'ele-tvs', name: 'Audio, TV & Projectors', children: [
        { id: 'ele-tv-smart', name: 'Smart TVs & Projectors' }, { id: 'ele-tv-sound', name: 'Soundbars & Home Audio' },
        { id: 'ele-tv-amp', name: 'Amplifiers & Receivers' },
      ] },
      { id: 'ele-cameras', name: 'Cameras, Lenses & Drones', children: [
        { id: 'ele-camera-dslr', name: 'DSLR & Mirrorless Cameras' }, { id: 'ele-camera-action', name: 'Action Cameras' },
        { id: 'ele-camera-drone', name: 'Drones' },
      ] },
      { id: 'ele-lenses', name: 'Lenses' },
      { id: 'ele-audio', name: 'Audio Equipment' },
      { id: 'ele-home-audio', name: 'Home Audio & Hi-Fi', children: [
        { id: 'ele-audio-speaker', name: 'Speakers, Soundbars & Home Theatre' }, { id: 'ele-audio-hifi', name: 'Amplifiers, Turntables & Hi-Fi' },
      ] },
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
      { key: 'fuel', label: 'Fuel type', input: 'select', options: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid', 'CNG', 'LPG', 'Hydrogen', 'Other'], filterable: true },
      { key: 'transmission', label: 'Transmission', input: 'select', options: ['Manual', 'Automatic', 'AMT', 'CVT', 'DCT'], filterable: true },
      { key: 'ownership', label: 'Ownership', input: 'select', options: ['1st owner', '2nd owner', '3rd owner', '4th or more'], filterable: true },
      { key: 'registration', label: 'Registration location', input: 'text' },
      { key: 'color', label: 'Color', input: 'text', filterable: true },
    ],
    children: [
      { id: 'veh-cars', name: 'Cars', children: [
        { id: 'veh-car-hatchback', name: 'Hatchbacks' }, { id: 'veh-car-sedan', name: 'Sedans' },
        { id: 'veh-car-suv', name: 'SUVs & Crossovers' }, { id: 'veh-car-mpv', name: 'MPVs & Minivans' },
        { id: 'veh-car-coupe', name: 'Coupes & Convertibles' }, { id: 'veh-car-luxury', name: 'Luxury Cars' },
        { id: 'veh-car-classic', name: 'Classic & Collector Cars' }, { id: 'veh-car-electric', name: 'Electric Cars' },
        { id: 'veh-car-hybrid', name: 'Hybrid Cars' }, { id: 'veh-car-ute', name: 'Utes & Pick-ups' },
        { id: 'veh-car-wagon', name: 'Station Wagons' }, { id: 'veh-car-van', name: 'Vans & Cab Chassis' },
        { id: 'veh-car-project', name: 'Project & Restoration Cars' }, { id: 'veh-car-other', name: 'Other Cars' },
      ] },
      { id: 'veh-motorcycles', name: 'Motorcycles', children: [
        { id: 'veh-bike-standard', name: 'Standard & Commuter Bikes' }, { id: 'veh-bike-sport', name: 'Sport Bikes' },
        { id: 'veh-bike-cruiser', name: 'Cruiser Bikes' }, { id: 'veh-bike-adventure', name: 'Adventure & Touring Bikes' },
        { id: 'veh-bike-dirt', name: 'Off-road & Dirt Bikes' }, { id: 'veh-bike-classic', name: 'Classic & Vintage Bikes' },
        { id: 'veh-bike-electric', name: 'Electric Motorcycles' }, { id: 'veh-bike-cafe', name: 'Cafe Racers & Choppers' },
        { id: 'veh-bike-naked', name: 'Naked Bikes' }, { id: 'veh-bike-other', name: 'Other Motorcycles' },
      ] },
      { id: 'veh-scooters', name: 'Scooters', children: [
        { id: 'veh-scooter-petrol', name: 'Petrol Scooters' }, { id: 'veh-scooter-electric', name: 'Electric Scooters' },
        { id: 'veh-scooter-moped', name: 'Mopeds' }, { id: 'veh-scooter-retro', name: 'Retro & Maxi Scooters' }, { id: 'veh-scooter-other', name: 'Other Scooters' },
      ] },
      { id: 'veh-ebikes', name: 'E-bikes & Personal Electric Mobility', children: [
        { id: 'veh-ebike-pedal', name: 'Pedal-assist E-bikes' }, { id: 'veh-ebike-moped', name: 'Electric Mopeds' },
        { id: 'veh-ebike-scooter', name: 'Electric Kick Scooters' }, { id: 'veh-ebike-mobility', name: 'Mobility Scooters' },
        { id: 'veh-ebike-parts', name: 'E-bike Batteries, Chargers & Parts' }, { id: 'veh-ebike-cargo', name: 'Cargo & Utility E-bikes' },
        { id: 'veh-ebike-fat', name: 'Fat-Tyre & E-Mountain Bikes' },
      ] },
      { id: 'veh-bicycles', name: 'Bicycles', children: [
        { id: 'veh-cycle-mountain', name: 'Mountain Bikes' }, { id: 'veh-cycle-road', name: 'Road Bikes' },
        { id: 'veh-cycle-hybrid', name: 'Hybrid & City Bikes' }, { id: 'veh-cycle-kids', name: 'Kids Bikes & Tricycles' },
        { id: 'veh-cycle-bmx', name: 'BMX & Freestyle Bikes' }, { id: 'veh-cycle-folding', name: 'Folding Bikes' },
        { id: 'veh-cycle-gravel', name: 'Road & Gravel Bikes' }, { id: 'veh-cycle-cruiser', name: 'Cruiser, Fixie & Single-speed Bikes' },
        { id: 'veh-cycle-other', name: 'Other Bicycles' },
      ] },
      { id: 'veh-trucks', name: 'Trucks & Heavy Vehicles', children: [
        { id: 'veh-truck-light', name: 'Light Trucks & Pickups' }, { id: 'veh-truck-heavy', name: 'Heavy Trucks' },
        { id: 'veh-truck-tipper', name: 'Tippers & Dump Trucks' }, { id: 'veh-truck-trailer', name: 'Trailers & Tankers' },
        { id: 'veh-truck-bus', name: 'Buses & Coaches' }, { id: 'veh-truck-refrigerated', name: 'Refrigerated & Special-purpose Trucks' },
      ] },
      { id: 'veh-vans', name: 'Vans & Buses', children: [
        { id: 'veh-van-passenger', name: 'Passenger Vans' }, { id: 'veh-van-cargo', name: 'Cargo Vans' },
        { id: 'veh-bus-minibus', name: 'Minibuses & Buses' }, { id: 'veh-rv', name: 'Campers & Motorhomes' },
      ] },
      { id: 'veh-commercial', name: 'Commercial, Farm & Construction Vehicles', children: [
        { id: 'veh-commercial-auto', name: 'Auto Rickshaws & Taxis' }, { id: 'veh-commercial-tractor', name: 'Tractors & Farm Vehicles' },
        { id: 'veh-commercial-construction', name: 'Construction & Earthmoving Equipment' }, { id: 'veh-commercial-other', name: 'Other Commercial Vehicles' },
      ] },
      { id: 'veh-auto-parts', name: 'Car Parts', children: [
        { id: 'veh-car-engine', name: 'Engines & Drivetrain' }, { id: 'veh-car-body', name: 'Body Parts & Panels' },
        { id: 'veh-car-interior', name: 'Interior Parts' }, { id: 'veh-car-electrical', name: 'Electrical & Lighting' },
        { id: 'veh-car-performance', name: 'Performance Parts' },
      ] },
      { id: 'veh-bike-parts', name: 'Motorcycle & Scooter Parts', children: [
        { id: 'veh-bike-engine-parts', name: 'Engine & Exhaust Parts' }, { id: 'veh-bike-body-parts', name: 'Body & Fairing Parts' },
        { id: 'veh-bike-electrical', name: 'Electrical & Lighting' }, { id: 'veh-bike-riding-gear', name: 'Helmets & Riding Gear' },
      ] },
      { id: 'veh-cycle-parts', name: 'Bicycle & E-bike Accessories', children: [
        { id: 'veh-cycle-safety', name: 'Helmets & Safety Gear' }, { id: 'veh-cycle-components', name: 'Frames, Wheels & Components' },
        { id: 'veh-cycle-carriers', name: 'Carriers, Racks & Bags' }, { id: 'veh-cycle-training', name: 'Trainers & Accessories' }, { id: 'veh-cycle-locks', name: 'Locks, Lights & Pumps' },
      ] },
      { id: 'veh-tyres', name: 'Tyres, Wheels & Batteries', children: [
        { id: 'veh-tyres-car', name: 'Car Tyres & Wheels' }, { id: 'veh-tyres-bike', name: 'Motorcycle & Scooter Tyres' },
        { id: 'veh-tyres-cycle', name: 'Bicycle Tyres & Tubes' }, { id: 'veh-batteries', name: 'Vehicle Batteries' }, { id: 'veh-car-tyres-rims', name: 'Tyres, Wheels & Rims' },
      ] },
      { id: 'veh-acc', name: 'Vehicle Accessories', children: [
        { id: 'veh-acc-audio', name: 'Audio, Cameras & Navigation' }, { id: 'veh-acc-care', name: 'Car Care & Cleaning' },
        { id: 'veh-acc-security', name: 'Security & Tracking' }, { id: 'veh-acc-covers', name: 'Covers & Protection' }, { id: 'veh-car-towing', name: 'Roof Racks & Towing Gear' },
      ] },
      { id: 'veh-services', name: 'Vehicle Services', children: [
        { id: 'veh-service-repair', name: 'Repair & Maintenance' }, { id: 'veh-service-detailing', name: 'Detailing & Cleaning' },
        { id: 'veh-service-inspection', name: 'Inspection & Registration' }, { id: 'veh-service-towing', name: 'Towing & Transport' },
      ] },
      { id: 'veh-rentals', name: 'Vehicle Rentals', children: [
        { id: 'veh-rental-car', name: 'Car Rentals' }, { id: 'veh-rental-bike', name: 'Motorcycle & Scooter Rentals' },
        { id: 'veh-rental-commercial', name: 'Commercial Vehicle Rentals' },
      ] },
      { id: 'veh-marine', name: 'Boats, Marine & Watercraft', children: [
        { id: 'veh-marine-boat', name: 'Boats & Sailing' }, { id: 'veh-marine-jetski', name: 'Jet Skis & Personal Watercraft' },
        { id: 'veh-marine-parts', name: 'Marine Parts & Accessories' },
      ] },
      { id: 'veh-finance', name: 'Vehicle Finance & Insurance' },
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
      { id: 'prp-for-rent', name: 'For Rent', children: [
        { id: 'prp-rent-apartment', name: 'Apartments & Flats' }, { id: 'prp-rent-house', name: 'Houses' },
        { id: 'prp-rent-share', name: 'Room Share & Flatshare' }, { id: 'prp-rent-commercial', name: 'Commercial Property & Offices' },
        { id: 'prp-rent-parking', name: 'Parking & Storage' }, { id: 'prp-rent-studio', name: 'Studios & Lofts' },
        { id: 'prp-rent-student', name: 'Student & Short-term Accommodation' },
      ] },
      { id: 'prp-for-sale', name: 'For Sale', children: [
        { id: 'prp-sale-house', name: 'Houses' }, { id: 'prp-sale-apartment', name: 'Apartments & Condos' },
        { id: 'prp-sale-land', name: 'Land & Plots' }, { id: 'prp-sale-commercial', name: 'Commercial Real Estate' },
        { id: 'prp-sale-townhouse', name: 'Townhouses, Duplexes & Villas' }, { id: 'prp-sale-farm', name: 'Rural, Farm & Lifestyle Property' },
      ] },
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
      { id: 'hom-furniture', name: 'Furniture', children: [
        { id: 'hom-furn-sofa', name: 'Sofas, Couches & Armchairs' }, { id: 'hom-furn-bed', name: 'Beds, Mattresses & Bedroom Furniture' },
        { id: 'hom-furn-dining', name: 'Dining Tables & Chairs' }, { id: 'hom-furn-office', name: 'Desks & Home Office Furniture' },
        { id: 'hom-furn-storage', name: 'TV Units, Cabinets & Bookcases' }, { id: 'hom-furn-wardrobe', name: 'Wardrobes & Drawers' },
      ] },
      { id: 'hom-decor-collection', name: 'Home Decor', children: [
        { id: 'hom-decor-rugs', name: 'Rugs, Carpets & Mats' }, { id: 'hom-decor-art', name: 'Mirrors & Wall Art' },
        { id: 'hom-decor-soft', name: 'Curtains, Blinds & Cushions' }, { id: 'hom-decor-light', name: 'Lighting, Lamps & Chandeliers' },
        { id: 'hom-decor-vases', name: 'Candles & Vases' },
      ] },
      { id: 'hom-garden-outdoor', name: 'Garden & Outdoor', children: [
        { id: 'hom-garden-mower', name: 'Lawn Mowers & Trimmers' }, { id: 'hom-garden-patio', name: 'Outdoor & Patio Furniture' },
        { id: 'hom-garden-bbq', name: 'BBQs & Grills' }, { id: 'hom-garden-plants', name: 'Plants, Pots & Seeds' },
        { id: 'hom-garden-tools', name: 'Power Tools' }, { id: 'hom-garden-sheds', name: 'Garden Sheds & Storage' },
      ] },
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
      { id: 'hom-kitchenware', name: 'Kitchenware & Dining', children: [
        { id: 'hom-kitchen-cookware', name: 'Cookware, Bakeware & Utensils' }, { id: 'hom-kitchen-tableware', name: 'Dinnerware, Glassware & Cutlery' },
      ] },
      { id: 'hom-bedding-bath', name: 'Bedding & Bath', children: [
        { id: 'hom-bedding-linen', name: 'Bedding, Linen & Towels' }, { id: 'hom-bedding-bathroom', name: 'Bathroom Fixtures & Accessories' },
      ] },
      { id: 'hom-pools-spas', name: 'Pools, Spas & Outdoor Living', children: [
        { id: 'hom-pool-equipment', name: 'Pools, Spas & Pool Equipment' }, { id: 'hom-pool-outdoor', name: 'Outdoor Heating & Fire Pits' },
      ] },
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
      { id: 'fsh-womens', name: "Women's Fashion", children: [
        { id: 'fsh-women-dress', name: 'Dresses & Skirts' }, { id: 'fsh-women-tops', name: 'Tops, T-Shirts & Blouses' },
        { id: 'fsh-women-jackets', name: 'Coats, Jackets & Hoodies' }, { id: 'fsh-women-pants', name: 'Jeans, Pants & Leggings' },
        { id: 'fsh-women-active', name: 'Activewear & Gym Clothes' }, { id: 'fsh-women-swim', name: 'Swimwear' },
      ] },
      { id: 'fsh-mens', name: "Men's Fashion", children: [
        { id: 'fsh-men-shirts', name: 'Shirts & T-Shirts' }, { id: 'fsh-men-pants', name: 'Pants, Jeans & Chinos' },
        { id: 'fsh-men-suits', name: 'Suits & Formal Wear' }, { id: 'fsh-men-jackets', name: 'Coats, Jackets & Jumpers' },
        { id: 'fsh-men-active', name: 'Activewear' },
      ] },
      { id: 'fsh-kids', name: "Children's Clothing" }, { id: 'fsh-shoes', name: 'Footwear', children: [
        { id: 'fsh-shoe-sneaker', name: 'Sneakers & Athletic Shoes' }, { id: 'fsh-shoe-boots', name: 'Boots' },
        { id: 'fsh-shoe-heels', name: 'Heels & Wedges' }, { id: 'fsh-shoe-sandal', name: 'Sandals & Slides' },
        { id: 'fsh-shoe-formal', name: 'Formal & Dress Shoes' },
      ] },
      { id: 'fsh-bags', name: 'Bags' }, { id: 'fsh-watches', name: 'Watches' },
      { id: 'fsh-jewellery', name: 'Jewellery' }, { id: 'fsh-beauty', name: 'Beauty Products' },
      { id: 'fsh-cosmetics', name: 'Cosmetics' }, { id: 'fsh-personal-care', name: 'Personal Care' },
      { id: 'fsh-accessories', name: 'Accessories' }, { id: 'fsh-traditional', name: 'Traditional Clothing' },
      { id: 'fsh-wedding', name: 'Wedding Clothing' }, { id: 'fsh-sportswear', name: 'Sportswear' },
      { id: 'fsh-services', name: 'Fashion Services' },
      { id: 'fsh-lingerie-sleep', name: 'Lingerie, Sleepwear & Swimwear', children: [
        { id: 'fsh-lingerie', name: 'Lingerie & Underwear' }, { id: 'fsh-sleepwear', name: 'Sleepwear & Loungewear' },
      ] },
      { id: 'fsh-luggage', name: 'Luggage, Bags & Accessories', children: [
        { id: 'fsh-luggage-bags', name: 'Handbags, Totes & Backpacks' }, { id: 'fsh-luggage-travel', name: 'Suitcases & Travel Luggage' },
      ] },
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
      { id: 'job-trades', name: 'Trades & Labour', children: [
        { id: 'job-trades-carpentry', name: 'Carpentry & Joinery' }, { id: 'job-trades-plumbing', name: 'Plumbing' },
        { id: 'job-trades-construction', name: 'Construction & Labouring' }, { id: 'job-trades-electrical', name: 'Electrical' },
        { id: 'job-trades-mechanical', name: 'Mechanical & Automotive' }, { id: 'job-trades-landscaping', name: 'Landscaping & Gardening' },
      ] },
      { id: 'job-sales-retail', name: 'Sales & Retail', children: [
        { id: 'job-retail-assistant', name: 'Retail & Store Staff' }, { id: 'job-sales-rep', name: 'Sales Representatives' },
        { id: 'job-business-development', name: 'Business Development' }, { id: 'job-retail-manager', name: 'Store Management & Merchandising' },
      ] },
      { id: 'job-hospitality-tourism', name: 'Hospitality & Tourism', children: [
        { id: 'job-chef', name: 'Chefs & Kitchen Staff' }, { id: 'job-barista', name: 'Baristas & Cafe Staff' },
        { id: 'job-waitstaff', name: 'Wait Staff & Front of House' }, { id: 'job-hotel', name: 'Hotels & Travel' },
      ] },
      { id: 'job-office-support', name: 'Admin, Office & Secretarial', children: [
        { id: 'job-office-admin', name: 'Administration & Reception' }, { id: 'job-office-pa', name: 'Executive Assistants & Secretaries' },
      ] },
      { id: 'job-logistics', name: 'Transport, Logistics & Warehousing', children: [
        { id: 'job-logistics-driver', name: 'Drivers, Delivery & Couriers' }, { id: 'job-logistics-warehouse', name: 'Warehouse, Freight & Supply Chain' },
      ] },
      { id: 'job-health-care', name: 'Healthcare, Nursing & Care', children: [
        { id: 'job-health-nursing', name: 'Nursing, Allied Health & Care' },
      ] },
      { id: 'job-childcare-nannies', name: 'Childcare & Nannies' },
      { id: 'job-tech-software', name: 'IT, Tech & Software Development', children: [
        { id: 'job-tech-dev', name: 'Software Development' }, { id: 'job-tech-support', name: 'IT Support & Networking' },
        { id: 'job-tech-data', name: 'Data, AI & Analytics' },
      ] },
      { id: 'job-finance-legal', name: 'Accounting, Finance & Legal', children: [
        { id: 'job-finance-accounting', name: 'Accounting, Finance & Legal' },
      ] },
      { id: 'job-pr-marketing', name: 'Marketing, Advertising & PR', children: [
        { id: 'job-marketing-digital', name: 'Digital Marketing, PR & Content' },
      ] },
      { id: 'job-teaching', name: 'Education & Teaching', children: [
        { id: 'job-teaching-school', name: 'School, Tutoring & Training' },
      ] },
      { id: 'job-cleaning-housekeeping', name: 'Cleaning & Housekeeping' },
      { id: 'job-call-centres', name: 'Customer Service & Call Centres' },
      { id: 'job-full-time', name: 'Full-Time Jobs' }, { id: 'job-part-time', name: 'Part-Time Jobs' },
      { id: 'job-casual', name: 'Casual / Vacation Jobs' }, { id: 'job-contract', name: 'Contract / Temp Jobs' },
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
      { id: 'srv-local', name: 'Local Services', children: [
        { id: 'srv-handyman', name: 'Handyman' }, { id: 'srv-mechanics', name: 'Mechanics' },
        { id: 'srv-removals', name: 'Removals' }, { id: 'srv-tutors', name: 'Tutors' },
      ] },
      { id: 'srv-classes', name: 'Classes & Lessons' }, { id: 'srv-gigs', name: 'Events & Gigs' },
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
      { id: 'srv-building', name: 'Building, Trades & Renovation', children: [
        { id: 'srv-building-roof', name: 'Roofing, Building & Renovation' }, { id: 'srv-building-garden', name: 'Gardening & Landscaping' },
      ] },
      { id: 'srv-professional', name: 'Professional & Business Services', children: [
        { id: 'srv-professional-legal', name: 'Legal, Accounting & Consulting' }, { id: 'srv-professional-tech', name: 'IT, Design & Marketing' },
      ] },
      { id: 'srv-auto', name: 'Automotive & Transport Services', children: [
        { id: 'srv-auto-mechanic', name: 'Mechanics, Detailing & Repairs' }, { id: 'srv-auto-moving', name: 'Removals, Delivery & Transport' },
      ] },
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
      { id: 'biz-for-sale', name: 'Businesses for Sale', children: [
        { id: 'biz-sale-existing', name: 'Established Businesses & Franchises' }, { id: 'biz-sale-online', name: 'Online Businesses & E-commerce' },
      ] },
      { id: 'biz-office-supplies', name: 'Office, Retail & Shop Supplies', children: [
        { id: 'biz-office-furniture', name: 'Office Furniture & Supplies' }, { id: 'biz-shop-fitting', name: 'Shop Fittings, POS & Display' },
      ] },
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
      { id: 'lei-books', name: 'Books, Magazines & Comics' }, { id: 'lei-school-books', name: 'School Books' },
      { id: 'lei-college-books', name: 'College Books' }, { id: 'lei-instruments', name: 'Musical Instruments', children: [
        { id: 'lei-guitar', name: 'Guitars & String Instruments' }, { id: 'lei-keyboards', name: 'Keyboards & Pianos' },
        { id: 'lei-drums', name: 'Drums & Percussion' },
      ] },
      { id: 'lei-sports-eq', name: 'Team Sports Gear', children: [
        { id: 'lei-football', name: 'Football & Soccer' }, { id: 'lei-basketball', name: 'Basketball' }, { id: 'lei-cricket', name: 'Cricket' },
      ] },
      { id: 'lei-gym', name: 'Gym & Fitness Gear', children: [
        { id: 'lei-weights', name: 'Weights & Strength Training' }, { id: 'lei-treadmill', name: 'Treadmills & Cardio' }, { id: 'lei-bands', name: 'Resistance Bands & Yoga' },
      ] },
      { id: 'lei-outdoor', name: 'Camping & Hiking Gear', children: [
        { id: 'lei-tents', name: 'Tents & Shelters' }, { id: 'lei-packs', name: 'Backpacks & Sleeping Bags' }, { id: 'lei-fishing', name: 'Fishing Tackle & Rods' }, { id: 'lei-golf', name: 'Golf Equipment' },
      ] }, { id: 'lei-toys', name: 'Toys & Games' },
      { id: 'lei-games', name: 'Games' }, { id: 'lei-collectibles', name: 'Collectibles' },
      { id: 'lei-art', name: 'Art & Crafts' }, { id: 'lei-movies', name: 'Movies & Music' },
      { id: 'lei-party', name: 'Party Supplies' }, { id: 'lei-hobby', name: 'Hobby Equipment' },
      { id: 'lei-tickets', name: 'Tickets & Events' },
      { id: 'lei-antiques', name: 'Antiques & Collectibles', children: [
        { id: 'lei-antique-art', name: 'Antiques, Vintage & Fine Art' }, { id: 'lei-collectible-cards', name: 'Coins, Cards & Memorabilia' },
      ] },
      { id: 'lei-crafts', name: 'Arts, Crafts & Sewing', children: [
        { id: 'lei-craft-supplies', name: 'Art Supplies, Sewing & Craft Kits' }, { id: 'lei-craft-models', name: 'Models, RC & Maker Hobbies' },
      ] },
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
      { id: 'agr-pet-acc', name: 'Pet Accessories', children: [
        { id: 'agr-pet-beds', name: 'Pet Beds, Cages & Crates' }, { id: 'agr-pet-toys', name: 'Toys, Leashes & Collars' },
        { id: 'agr-aquariums', name: 'Aquariums & Fish Tanks' },
      ] }, { id: 'agr-pet-food', name: 'Pet Food & Treats' },
      { id: 'agr-livestock', name: 'Livestock' }, { id: 'agr-poultry', name: 'Poultry' },
      { id: 'agr-cattle', name: 'Cattle' }, { id: 'agr-farm-eq', name: 'Farm Equipment' },
      { id: 'agr-seeds', name: 'Seeds' }, { id: 'agr-plants', name: 'Plants' },
      { id: 'agr-fertiliser', name: 'Fertiliser' }, { id: 'agr-animal-feed', name: 'Animal Feed' },
      { id: 'agr-agri-products', name: 'Agricultural Products' }, { id: 'agr-farm-services', name: 'Farm Services' },
      { id: 'agr-small-pets', name: 'Small Pets & Exotic Pets', children: [
        { id: 'agr-pet-rabbits', name: 'Rabbits, Guinea Pigs & Small Pets' }, { id: 'agr-pet-reptiles', name: 'Reptiles & Terrariums' },
      ] },
    ],
  },

  /* 15. FAMILY, BABY & KIDS ================================================= */
  {
    id: 'family',
    name: 'Family, Baby & Kids',
    attributes: [CONDITION, { key: 'age_group', label: 'Age group', input: 'select', options: ['Newborn', '0-2 years', '3-5 years', '6-9 years', '10-12 years', 'Teens'], filterable: true }],
    children: [
      { id: 'fam-clothing', name: 'Baby Clothing & Footwear' }, { id: 'fam-toys', name: 'Toys & Games' },
      { id: 'fam-travel', name: 'Prams, Strollers & Car Seats' }, { id: 'fam-nursery', name: 'Nursery Furniture & Bedding' },
      { id: 'fam-feeding', name: 'Feeding & Bathing Accessories' }, { id: 'fam-maternity', name: 'Maternity & Pregnancy' },
      { id: 'fam-toys-learning', name: 'Toys, Games & Learning', children: [
        { id: 'fam-learning-toys', name: 'Educational Toys & STEM' }, { id: 'fam-outdoor-toys', name: 'Outdoor, Ride-on & Sports Toys' },
      ] },
      { id: 'fam-gear', name: 'Baby Gear & Safety', children: [
        { id: 'fam-safety', name: 'Safety Gates, Monitors & Baby Proofing' }, { id: 'fam-car-seat', name: 'Car Seats, Carriers & Travel Gear' },
      ] },
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

export const TAXONOMY_VERSION = '17.0';
