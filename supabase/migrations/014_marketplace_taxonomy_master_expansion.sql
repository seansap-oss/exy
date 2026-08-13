-- EXY marketplace taxonomy master expansion — additive and idempotent.
-- Run AFTER 010_taxonomy_seed_v2.sql, 012_vehicle_taxonomy_expansion.sql
-- and 013_comprehensive_classified_taxonomy.sql.
-- This migration creates missing nodes only; it deletes no taxonomy, listings,
-- users, media, policies, or interface data. Parent rows are written first.

-- 1) Missing subcategories. Existing ids are refreshed rather than duplicated.
insert into public.taxonomy_nodes (id, parent_id, level, name, slug, sort_order) values
  ('veh-marine','vehicles','subcategory','Boats, Marine & Watercraft','veh-marine',17),
  ('hom-kitchenware','home','subcategory','Kitchenware & Dining','hom-kitchenware',3),
  ('hom-bedding-bath','home','subcategory','Bedding & Bath','hom-bedding-bath',4),
  ('hom-pools-spas','home','subcategory','Pools, Spas & Outdoor Living','hom-pools-spas',5),
  ('ele-tablets-readers','electronics','subcategory','Tablets & E-readers','ele-tablets-readers',2),
  ('ele-office-devices','electronics','subcategory','Office, Printing & POS','ele-office-devices',15),
  ('ele-home-audio','electronics','subcategory','Home Audio & Hi-Fi','ele-home-audio',16),
  ('fsh-lingerie-sleep','fashion','subcategory','Lingerie, Sleepwear & Swimwear','fsh-lingerie-sleep',6),
  ('fsh-luggage','fashion','subcategory','Luggage, Bags & Accessories','fsh-luggage',7),
  ('fam-toys-learning','family','subcategory','Toys, Games & Learning','fam-toys-learning',6),
  ('fam-gear','family','subcategory','Baby Gear & Safety','fam-gear',7),
  ('lei-antiques','leisure','subcategory','Antiques & Collectibles','lei-antiques',10),
  ('lei-crafts','leisure','subcategory','Arts, Crafts & Sewing','lei-crafts',11),
  ('agr-small-pets','agri','subcategory','Small Pets & Exotic Pets','agr-small-pets',7),
  ('srv-building','services','subcategory','Building, Trades & Renovation','srv-building',3),
  ('srv-professional','services','subcategory','Professional & Business Services','srv-professional',4),
  ('srv-auto','services','subcategory','Automotive & Transport Services','srv-auto',5),
  ('biz-for-sale','business','subcategory','Businesses for Sale','biz-for-sale',16),
  ('biz-office-supplies','business','subcategory','Office, Retail & Shop Supplies','biz-office-supplies',17)
on conflict (id) do update set
  parent_id = excluded.parent_id, level = excluded.level, name = excluded.name,
  slug = excluded.slug, sort_order = excluded.sort_order, active = true;

-- 2) Vehicle types. These use the already-created parent rows above and from
-- migrations 010/012, so the foreign keys are valid in a fresh sequence.
insert into public.taxonomy_nodes (id, parent_id, level, name, slug, sort_order) values
  ('veh-car-ute','veh-cars','type','Utes & Pick-ups','veh-car-ute',10),
  ('veh-car-wagon','veh-cars','type','Station Wagons','veh-car-wagon',11),
  ('veh-car-van','veh-cars','type','Vans & Cab Chassis','veh-car-van',12),
  ('veh-car-project','veh-cars','type','Project & Restoration Cars','veh-car-project',13),
  ('veh-bike-cafe','veh-motorcycles','type','Cafe Racers & Choppers','veh-bike-cafe',8),
  ('veh-bike-naked','veh-motorcycles','type','Naked Bikes','veh-bike-naked',9),
  ('veh-scooter-retro','veh-scooters','type','Retro & Maxi Scooters','veh-scooter-retro',4),
  ('veh-ebike-cargo','veh-ebikes','type','Cargo & Utility E-bikes','veh-ebike-cargo',5),
  ('veh-ebike-fat','veh-ebikes','type','Fat-Tyre & E-Mountain Bikes','veh-ebike-fat',6),
  ('veh-cycle-gravel','veh-bicycles','type','Road & Gravel Bikes','veh-cycle-gravel',7),
  ('veh-cycle-cruiser','veh-bicycles','type','Cruiser, Fixie & Single-speed Bikes','veh-cycle-cruiser',8),
  ('veh-truck-bus','veh-trucks','type','Buses & Coaches','veh-truck-bus',4),
  ('veh-truck-refrigerated','veh-trucks','type','Refrigerated & Special-purpose Trucks','veh-truck-refrigerated',5),
  ('veh-marine-boat','veh-marine','type','Boats & Sailing','veh-marine-boat',0),
  ('veh-marine-jetski','veh-marine','type','Jet Skis & Personal Watercraft','veh-marine-jetski',1),
  ('veh-marine-parts','veh-marine','type','Marine Parts & Accessories','veh-marine-parts',2),
  ('veh-car-tyres-rims','veh-tyres','type','Tyres, Wheels & Rims','veh-car-tyres-rims',4),
  ('veh-car-towing','veh-acc','type','Roof Racks & Towing Gear','veh-car-towing',4),
  ('veh-cycle-locks','veh-cycle-parts','type','Locks, Lights & Pumps','veh-cycle-locks',4)
on conflict (id) do update set
  parent_id = excluded.parent_id, level = excluded.level, name = excluded.name,
  slug = excluded.slug, sort_order = excluded.sort_order, active = true;

-- 3) Missing detail types across property, home, electronics, fashion and family.
insert into public.taxonomy_nodes (id, parent_id, level, name, slug, sort_order) values
  ('prp-rent-studio','prp-for-rent','type','Studios & Lofts','prp-rent-studio',5),
  ('prp-rent-student','prp-for-rent','type','Student & Short-term Accommodation','prp-rent-student',6),
  ('prp-sale-townhouse','prp-for-sale','type','Townhouses, Duplexes & Villas','prp-sale-townhouse',4),
  ('prp-sale-farm','prp-for-sale','type','Rural, Farm & Lifestyle Property','prp-sale-farm',5),
  ('hom-kitchen-cookware','hom-kitchenware','type','Cookware, Bakeware & Utensils','hom-kitchen-cookware',0),
  ('hom-kitchen-tableware','hom-kitchenware','type','Dinnerware, Glassware & Cutlery','hom-kitchen-tableware',1),
  ('hom-bedding-linen','hom-bedding-bath','type','Bedding, Linen & Towels','hom-bedding-linen',0),
  ('hom-bedding-bathroom','hom-bedding-bath','type','Bathroom Fixtures & Accessories','hom-bedding-bathroom',1),
  ('hom-pool-equipment','hom-pools-spas','type','Pools, Spas & Pool Equipment','hom-pool-equipment',0),
  ('hom-pool-outdoor','hom-pools-spas','type','Outdoor Heating & Fire Pits','hom-pool-outdoor',1),
  ('ele-tablet-ipad','ele-tablets-readers','type','Tablets & iPads','ele-tablet-ipad',0),
  ('ele-ereader','ele-tablets-readers','type','E-readers','ele-ereader',1),
  ('ele-printer-3d','ele-office-devices','type','Printers, Scanners & 3D Printers','ele-printer-3d',0),
  ('ele-pos','ele-office-devices','type','POS, Barcode & Office Equipment','ele-pos',1),
  ('ele-audio-speaker','ele-home-audio','type','Speakers, Soundbars & Home Theatre','ele-audio-speaker',0),
  ('ele-audio-hifi','ele-home-audio','type','Amplifiers, Turntables & Hi-Fi','ele-audio-hifi',1),
  ('fsh-lingerie','fsh-lingerie-sleep','type','Lingerie & Underwear','fsh-lingerie',0),
  ('fsh-sleepwear','fsh-lingerie-sleep','type','Sleepwear & Loungewear','fsh-sleepwear',1),
  ('fsh-luggage-bags','fsh-luggage','type','Handbags, Totes & Backpacks','fsh-luggage-bags',0),
  ('fsh-luggage-travel','fsh-luggage','type','Suitcases & Travel Luggage','fsh-luggage-travel',1),
  ('fam-learning-toys','fam-toys-learning','type','Educational Toys & STEM','fam-learning-toys',0),
  ('fam-outdoor-toys','fam-toys-learning','type','Outdoor, Ride-on & Sports Toys','fam-outdoor-toys',1),
  ('fam-safety','fam-gear','type','Safety Gates, Monitors & Baby Proofing','fam-safety',0),
  ('fam-car-seat','fam-gear','type','Car Seats, Carriers & Travel Gear','fam-car-seat',1)
on conflict (id) do update set
  parent_id = excluded.parent_id, level = excluded.level, name = excluded.name,
  slug = excluded.slug, sort_order = excluded.sort_order, active = true;

-- 4) Employment, hobbies, pets, services and commercial-business detail types.
insert into public.taxonomy_nodes (id, parent_id, level, name, slug, sort_order) values
  ('job-retail-manager','job-sales-retail','type','Store Management & Merchandising','job-retail-manager',3),
  ('job-office-admin','job-office-support','type','Administration & Reception','job-office-admin',0),
  ('job-office-pa','job-office-support','type','Executive Assistants & Secretaries','job-office-pa',1),
  ('job-logistics-driver','job-logistics','type','Drivers, Delivery & Couriers','job-logistics-driver',0),
  ('job-logistics-warehouse','job-logistics','type','Warehouse, Freight & Supply Chain','job-logistics-warehouse',1),
  ('job-health-nursing','job-health-care','type','Nursing, Allied Health & Care','job-health-nursing',0),
  ('job-tech-dev','job-tech-software','type','Software Development','job-tech-dev',0),
  ('job-tech-support','job-tech-software','type','IT Support & Networking','job-tech-support',1),
  ('job-tech-data','job-tech-software','type','Data, AI & Analytics','job-tech-data',2),
  ('job-finance-accounting','job-finance-legal','type','Accounting, Finance & Legal','job-finance-accounting',0),
  ('job-marketing-digital','job-pr-marketing','type','Digital Marketing, PR & Content','job-marketing-digital',0),
  ('job-teaching-school','job-teaching','type','School, Tutoring & Training','job-teaching-school',0),
  ('lei-antique-art','lei-antiques','type','Antiques, Vintage & Fine Art','lei-antique-art',0),
  ('lei-collectible-cards','lei-antiques','type','Coins, Cards & Memorabilia','lei-collectible-cards',1),
  ('lei-craft-supplies','lei-crafts','type','Art Supplies, Sewing & Craft Kits','lei-craft-supplies',0),
  ('lei-craft-models','lei-crafts','type','Models, RC & Maker Hobbies','lei-craft-models',1),
  ('agr-pet-rabbits','agr-small-pets','type','Rabbits, Guinea Pigs & Small Pets','agr-pet-rabbits',0),
  ('agr-pet-reptiles','agr-small-pets','type','Reptiles & Terrariums','agr-pet-reptiles',1),
  ('srv-building-roof','srv-building','type','Roofing, Building & Renovation','srv-building-roof',0),
  ('srv-building-garden','srv-building','type','Gardening & Landscaping','srv-building-garden',1),
  ('srv-professional-legal','srv-professional','type','Legal, Accounting & Consulting','srv-professional-legal',0),
  ('srv-professional-tech','srv-professional','type','IT, Design & Marketing','srv-professional-tech',1),
  ('srv-auto-mechanic','srv-auto','type','Mechanics, Detailing & Repairs','srv-auto-mechanic',0),
  ('srv-auto-moving','srv-auto','type','Removals, Delivery & Transport','srv-auto-moving',1),
  ('biz-sale-existing','biz-for-sale','type','Established Businesses & Franchises','biz-sale-existing',0),
  ('biz-sale-online','biz-for-sale','type','Online Businesses & E-commerce','biz-sale-online',1),
  ('biz-office-furniture','biz-office-supplies','type','Office Furniture & Supplies','biz-office-furniture',0),
  ('biz-shop-fitting','biz-office-supplies','type','Shop Fittings, POS & Display','biz-shop-fitting',1)
on conflict (id) do update set
  parent_id = excluded.parent_id, level = excluded.level, name = excluded.name,
  slug = excluded.slug, sort_order = excluded.sort_order, active = true;

-- 5) Search/filter fields. These enrich the same category picker and search;
-- they do not create another UI or a competing taxonomy.
insert into public.taxonomy_attributes (id, node_id, key, label, input_type, options, unit, required, filterable, sort_order) values
  ('vehicles__body_style','vehicles','body_style','Body style','select','["Hatchback","Sedan","SUV & 4WD","Ute & Pick-up","Coupe & Convertible","Station Wagon","Van & Minivan","Other"]'::jsonb,null,false,true,20),
  ('vehicles__fuel','vehicles','fuel','Fuel type','select','["Petrol","Diesel","Electric","Hybrid","Plug-in Hybrid","CNG","LPG","Hydrogen","Other"]'::jsonb,null,false,true,21),
  ('jobs__work_mode','jobs','work_mode','Work mode','select','["On-site","Remote","Hybrid","Flexible"]'::jsonb,null,false,true,20),
  ('jobs__experience','jobs','experience','Experience level','select','["Entry level","1-3 years","3-5 years","5-10 years","10+ years"]'::jsonb,null,false,true,21),
  ('property__lease_term','property','lease_term','Lease term','select','["Short term","6 months","12 months","Long term"]'::jsonb,null,false,true,20),
  ('electronics__connectivity','electronics','connectivity','Connectivity','multiselect','["Wi-Fi","Bluetooth","5G","USB-C","HDMI","Ethernet"]'::jsonb,null,false,true,20)
on conflict (node_id, key) do update set
  label = excluded.label,
  input_type = excluded.input_type, options = excluded.options, unit = excluded.unit,
  required = excluded.required, filterable = excluded.filterable, sort_order = excluded.sort_order;

-- Optional post-run verification (read-only):
-- select level, count(*) from public.taxonomy_nodes where active = true group by level order by level;
-- select id, name, level from public.taxonomy_nodes where id in ('veh-marine','hom-kitchenware','ele-tablets-readers','job-tech-software','biz-for-sale') order by id;
