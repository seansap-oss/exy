-- ============================================================================
-- EXY — Expanded vehicle taxonomy (additive only)
-- Run after 005_taxonomy.sql and 010_taxonomy_seed_v2.sql.
-- Adds the full Vehicles → subcategory → type hierarchy used by the app.
-- It does not delete or modify existing listings, UI, users, or permissions.
-- ============================================================================

insert into public.taxonomy_nodes (id, parent_id, level, name, slug, sort_order) values
  ('veh-ebikes','vehicles','subcategory','E-bikes & Personal Electric Mobility','veh-ebikes',4),
  ('veh-cycle-parts','vehicles','subcategory','Bicycle & E-bike Accessories','veh-cycle-parts',13),

  ('veh-car-hatchback','veh-cars','type','Hatchbacks','veh-car-hatchback',0),
  ('veh-car-sedan','veh-cars','type','Sedans','veh-car-sedan',1),
  ('veh-car-suv','veh-cars','type','SUVs & Crossovers','veh-car-suv',2),
  ('veh-car-mpv','veh-cars','type','MPVs & Minivans','veh-car-mpv',3),
  ('veh-car-coupe','veh-cars','type','Coupes & Convertibles','veh-car-coupe',4),
  ('veh-car-luxury','veh-cars','type','Luxury Cars','veh-car-luxury',5),
  ('veh-car-classic','veh-cars','type','Classic & Collector Cars','veh-car-classic',6),
  ('veh-car-electric','veh-cars','type','Electric Cars','veh-car-electric',7),
  ('veh-car-hybrid','veh-cars','type','Hybrid Cars','veh-car-hybrid',8),
  ('veh-car-other','veh-cars','type','Other Cars','veh-car-other',9),

  ('veh-bike-standard','veh-motorcycles','type','Standard & Commuter Bikes','veh-bike-standard',0),
  ('veh-bike-sport','veh-motorcycles','type','Sport Bikes','veh-bike-sport',1),
  ('veh-bike-cruiser','veh-motorcycles','type','Cruiser Bikes','veh-bike-cruiser',2),
  ('veh-bike-adventure','veh-motorcycles','type','Adventure & Touring Bikes','veh-bike-adventure',3),
  ('veh-bike-dirt','veh-motorcycles','type','Off-road & Dirt Bikes','veh-bike-dirt',4),
  ('veh-bike-classic','veh-motorcycles','type','Classic & Vintage Bikes','veh-bike-classic',5),
  ('veh-bike-electric','veh-motorcycles','type','Electric Motorcycles','veh-bike-electric',6),
  ('veh-bike-other','veh-motorcycles','type','Other Motorcycles','veh-bike-other',7),

  ('veh-scooter-petrol','veh-scooters','type','Petrol Scooters','veh-scooter-petrol',0),
  ('veh-scooter-electric','veh-scooters','type','Electric Scooters','veh-scooter-electric',1),
  ('veh-scooter-moped','veh-scooters','type','Mopeds','veh-scooter-moped',2),
  ('veh-scooter-other','veh-scooters','type','Other Scooters','veh-scooter-other',3),

  ('veh-ebike-pedal','veh-ebikes','type','Pedal-assist E-bikes','veh-ebike-pedal',0),
  ('veh-ebike-moped','veh-ebikes','type','Electric Mopeds','veh-ebike-moped',1),
  ('veh-ebike-scooter','veh-ebikes','type','Electric Kick Scooters','veh-ebike-scooter',2),
  ('veh-ebike-mobility','veh-ebikes','type','Mobility Scooters','veh-ebike-mobility',3),
  ('veh-ebike-parts','veh-ebikes','type','E-bike Batteries, Chargers & Parts','veh-ebike-parts',4),

  ('veh-cycle-mountain','veh-bicycles','type','Mountain Bikes','veh-cycle-mountain',0),
  ('veh-cycle-road','veh-bicycles','type','Road Bikes','veh-cycle-road',1),
  ('veh-cycle-hybrid','veh-bicycles','type','Hybrid & City Bikes','veh-cycle-hybrid',2),
  ('veh-cycle-kids','veh-bicycles','type','Kids Bikes & Tricycles','veh-cycle-kids',3),
  ('veh-cycle-bmx','veh-bicycles','type','BMX & Freestyle Bikes','veh-cycle-bmx',4),
  ('veh-cycle-folding','veh-bicycles','type','Folding Bikes','veh-cycle-folding',5),
  ('veh-cycle-other','veh-bicycles','type','Other Bicycles','veh-cycle-other',6),

  ('veh-truck-light','veh-trucks','type','Light Trucks & Pickups','veh-truck-light',0),
  ('veh-truck-heavy','veh-trucks','type','Heavy Trucks','veh-truck-heavy',1),
  ('veh-truck-tipper','veh-trucks','type','Tippers & Dump Trucks','veh-truck-tipper',2),
  ('veh-truck-trailer','veh-trucks','type','Trailers & Tankers','veh-truck-trailer',3),
  ('veh-van-passenger','veh-vans','type','Passenger Vans','veh-van-passenger',0),
  ('veh-van-cargo','veh-vans','type','Cargo Vans','veh-van-cargo',1),
  ('veh-bus-minibus','veh-vans','type','Minibuses & Buses','veh-bus-minibus',2),
  ('veh-rv','veh-vans','type','Campers & Motorhomes','veh-rv',3),
  ('veh-commercial-auto','veh-commercial','type','Auto Rickshaws & Taxis','veh-commercial-auto',0),
  ('veh-commercial-tractor','veh-commercial','type','Tractors & Farm Vehicles','veh-commercial-tractor',1),
  ('veh-commercial-construction','veh-commercial','type','Construction & Earthmoving Equipment','veh-commercial-construction',2),
  ('veh-commercial-other','veh-commercial','type','Other Commercial Vehicles','veh-commercial-other',3),

  ('veh-car-engine','veh-auto-parts','type','Engines & Drivetrain','veh-car-engine',0),
  ('veh-car-body','veh-auto-parts','type','Body Parts & Panels','veh-car-body',1),
  ('veh-car-interior','veh-auto-parts','type','Interior Parts','veh-car-interior',2),
  ('veh-car-electrical','veh-auto-parts','type','Electrical & Lighting','veh-car-electrical',3),
  ('veh-car-performance','veh-auto-parts','type','Performance Parts','veh-car-performance',4),
  ('veh-bike-engine-parts','veh-bike-parts','type','Engine & Exhaust Parts','veh-bike-engine-parts',0),
  ('veh-bike-body-parts','veh-bike-parts','type','Body & Fairing Parts','veh-bike-body-parts',1),
  ('veh-bike-electrical','veh-bike-parts','type','Electrical & Lighting','veh-bike-electrical',2),
  ('veh-bike-riding-gear','veh-bike-parts','type','Helmets & Riding Gear','veh-bike-riding-gear',3),
  ('veh-cycle-safety','veh-cycle-parts','type','Helmets & Safety Gear','veh-cycle-safety',0),
  ('veh-cycle-components','veh-cycle-parts','type','Frames, Wheels & Components','veh-cycle-components',1),
  ('veh-cycle-carriers','veh-cycle-parts','type','Carriers, Racks & Bags','veh-cycle-carriers',2),
  ('veh-cycle-training','veh-cycle-parts','type','Trainers & Accessories','veh-cycle-training',3),
  ('veh-tyres-car','veh-tyres','type','Car Tyres & Wheels','veh-tyres-car',0),
  ('veh-tyres-bike','veh-tyres','type','Motorcycle & Scooter Tyres','veh-tyres-bike',1),
  ('veh-tyres-cycle','veh-tyres','type','Bicycle Tyres & Tubes','veh-tyres-cycle',2),
  ('veh-batteries','veh-tyres','type','Vehicle Batteries','veh-batteries',3),
  ('veh-acc-audio','veh-acc','type','Audio, Cameras & Navigation','veh-acc-audio',0),
  ('veh-acc-care','veh-acc','type','Car Care & Cleaning','veh-acc-care',1),
  ('veh-acc-security','veh-acc','type','Security & Tracking','veh-acc-security',2),
  ('veh-acc-covers','veh-acc','type','Covers & Protection','veh-acc-covers',3),
  ('veh-service-repair','veh-services','type','Repair & Maintenance','veh-service-repair',0),
  ('veh-service-detailing','veh-services','type','Detailing & Cleaning','veh-service-detailing',1),
  ('veh-service-inspection','veh-services','type','Inspection & Registration','veh-service-inspection',2),
  ('veh-service-towing','veh-services','type','Towing & Transport','veh-service-towing',3),
  ('veh-rental-car','veh-rentals','type','Car Rentals','veh-rental-car',0),
  ('veh-rental-bike','veh-rentals','type','Motorcycle & Scooter Rentals','veh-rental-bike',1),
  ('veh-rental-commercial','veh-rentals','type','Commercial Vehicle Rentals','veh-rental-commercial',2)
on conflict (id) do update set
  parent_id = excluded.parent_id,
  level = excluded.level,
  name = excluded.name,
  slug = excluded.slug,
  sort_order = excluded.sort_order,
  active = true;

insert into public.taxonomy_attributes (id, node_id, key, label, input_type, options, unit, required, filterable, sort_order) values
  ('vehicles__body_style','vehicles','body_style','Body style','select','["Hatchback","Sedan","SUV","Crossover","MPV","Coupe","Convertible","Pickup","Van","Other"]'::jsonb,null,false,true,9),
  ('vehicles__engine_cc','vehicles','engine_cc','Engine capacity','number','[]'::jsonb,'cc',false,true,10),
  ('vehicles__battery_range','vehicles','battery_range','Electric range','number','[]'::jsonb,'km',false,true,11),
  ('vehicles__battery_health','vehicles','battery_health','Battery health','select','["Excellent","Good","Fair","Needs replacement"]'::jsonb,null,false,true,12)
on conflict (id) do update set
  label = excluded.label,
  input_type = excluded.input_type,
  options = excluded.options,
  unit = excluded.unit,
  required = excluded.required,
  filterable = excluded.filterable,
  sort_order = excluded.sort_order;
