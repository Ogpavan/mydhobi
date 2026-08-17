import { Client } from "pg";

const unit = {
  piece: "piece",
  kg: "kg",
  pair: "pair",
  seat: "seat",
  sqFt: "sq_ft",
  set: "set",
  fixed: "fixed",
};

const standard = (names, itemUnit = unit.piece) =>
  names.map((name) => ({ name, variants: [{ name: "Standard", unit: itemUnit }] }));
const grouped = (name, variants, itemUnit = unit.piece) => ({
  name,
  variants: variants.map((variant) => ({ name: variant, unit: itemUnit })),
});

const catalog = [
  {
    slug: "wash-and-fold",
    name: "Wash & Fold",
    services: [
      ...standard(["Regular Clothes", "Whites", "Colored Clothes", "Kids Clothes", "Undergarments", "Towel Laundry", "Daily Wear Laundry", "Delicate Wash"], unit.kg),
      ...standard(["Bedsheet Laundry", "Pillow Cover Laundry"], unit.piece),
    ],
  },
  {
    slug: "wash-and-iron",
    name: "Wash & Iron",
    services: [
      ...standard(["Shirt", "T-Shirt", "Trousers/Pants", "Jeans", "Kurta", "Pajama", "Salwar", "Suit", "Saree", "Bedsheet", "Pillow Cover", "Towel"], unit.piece),
      ...standard(["Regular Clothes"], unit.kg),
    ],
  },
  {
    slug: "dry-cleaning",
    name: "Dry Cleaning",
    services: standard(["Shirt", "Trousers", "Jeans", "Kurta", "Pajama", "Saree", "Salwar Suit", "Blazer", "Coat", "Jacket", "Sweater", "Shawl", "Dress", "Lehenga", "Waistcoat", "Nehru Jacket"]),
  },
  {
    slug: "premium-dry-cleaning",
    name: "Premium Dry Cleaning",
    services: standard(["Designer Saree", "Silk Saree", "Heavy Lehenga", "Bridal Lehenga", "Designer Suit", "Sherwani", "Tuxedo", "Premium Blazer", "Premium Coat", "Evening Gown", "Embroidered Dress", "Designer Jacket", "Delicate Fabric Garment"]),
  },
  {
    slug: "steam-ironing",
    name: "Steam Ironing / Steam Press",
    services: standard(["Shirt", "T-Shirt", "Trousers", "Jeans", "Kurta", "Pajama", "Saree", "Salwar Suit", "Blazer", "Coat", "Bedsheet", "Dress", "School Uniform", "Office Uniform"]),
  },
  {
    slug: "starching",
    name: "Starching",
    services: standard(["Cotton Shirt", "Cotton Kurta", "Cotton Saree", "Dhoti", "Pajama", "Bedsheet", "Table Cloth", "Uniform", "Light Starch", "Medium Starch", "Heavy Starch"]),
  },
  {
    slug: "shoe-cleaning",
    name: "Shoe Cleaning",
    services: [
      grouped("Shoes", ["Sports Shoes", "Sneakers", "Canvas Shoes", "Formal Shoes", "Leather Shoes", "Suede Shoes", "Boots", "Kids Shoes", "Slippers/Sandals"], unit.pair),
      grouped("Shoe Care", ["Shoe Whitening", "Shoe Polishing", "Shoe Deodorizing"], unit.pair),
    ],
  },
  {
    slug: "bag-cleaning",
    name: "Bag Cleaning",
    services: [
      grouped("Bags", ["Handbag", "Backpack", "Laptop Bag", "Travel Bag", "Duffel Bag", "School Bag", "Leather Bag", "Suede Bag", "Fabric Bag", "Trolley Bag", "Suitcase"]),
      grouped("Bag Care", ["Bag Polishing"]),
    ],
  },
  {
    slug: "carpet-cleaning",
    name: "Carpet Cleaning",
    services: [
      grouped("Carpet", ["Small Carpet", "Medium Carpet", "Large Carpet", "Wool Carpet", "Synthetic Carpet", "Shag Carpet", "Persian/Designer Carpet", "Rug", "Door Mat"]),
      grouped("Carpet Care", ["Carpet Shampooing", "Carpet Stain Removal", "Carpet Deep Cleaning"]),
    ],
  },
  {
    slug: "sofa-cleaning",
    name: "Sofa Cleaning",
    services: [
      grouped("Sofa", ["Single-Seater Sofa", "2-Seater Sofa", "3-Seater Sofa", "5-Seater Sofa", "7-Seater Sofa", "Fabric Sofa", "Leather Sofa", "Recliner", "Sofa-Cum-Bed"], unit.seat),
      grouped("Chair", ["Dining Chair", "Office Chair"], unit.seat),
      grouped("Sofa Care", ["Sofa Shampooing", "Sofa Stain Treatment"], unit.seat),
    ],
  },
  {
    slug: "curtain-cleaning",
    name: "Curtain Cleaning",
    services: [
      grouped("Curtain", ["Window Curtain", "Door Curtain", "Long Curtain", "Sheer Curtain", "Blackout Curtain", "Cotton Curtain", "Silk Curtain", "Designer Curtain"]),
      grouped("Curtain Care", ["Curtain Dry Cleaning", "Curtain Steam Cleaning", "Curtain Removal & Reinstallation"], unit.set),
    ],
  },
  {
    slug: "blanket-cleaning",
    name: "Blanket / Quilt Cleaning",
    services: [
      grouped("Blanket", ["Single Blanket", "Double Blanket", "Heavy Blanket", "Woolen Blanket"]),
      grouped("Quilt/Razai", ["Single Quilt/Razai", "Double Quilt/Razai"]),
      ...standard(["Comforter", "Duvet", "Bed Cover", "Mattress Protector", "Sleeping Bag"]),
    ],
  },
  {
    slug: "premium-laundry",
    name: "Premium Laundry",
    services: standard(["Premium Shirt", "Premium Trousers", "Designer T-Shirt", "Premium Kurta", "Designer Dress", "Silk Garment", "Linen Garment", "Wool Garment", "Delicate Garment", "Hand Wash Garment", "Premium Wash & Iron", "Fabric Conditioning"]),
  },
  {
    slug: "eco-friendly-laundry",
    name: "Organic / Eco-Friendly Laundry",
    services: [
      ...standard(["Eco Wash", "Organic Wash & Fold", "Organic Wash & Iron", "Chemical-Free Wash", "Hypoallergenic Wash", "Baby Clothes Wash", "Delicate Eco Wash", "Eco Dry Cleaning", "Natural Fabric Care", "Fragrance-Free Wash"], unit.kg),
    ],
  },
  {
    slug: "leather-cleaning",
    name: "Leather & Suede Cleaning",
    services: [
      grouped("Leather & Suede Garments", ["Leather Jacket", "Suede Jacket", "Leather Coat", "Leather Trousers", "Leather Skirt"]),
      grouped("Leather & Suede Accessories", ["Leather Shoes", "Suede Shoes", "Leather Handbag", "Suede Bag", "Leather Gloves"], unit.pair),
      grouped("Leather Care", ["Leather Conditioning", "Leather Polishing", "Leather Stain Treatment", "Color Restoration"]),
    ],
  },
  {
    slug: "stain-removal",
    name: "Stain Removal / Spot Treatment",
    services: [
      grouped("Stain Treatment", ["Oil/Grease Stain", "Tea/Coffee Stain", "Food Stain", "Ink Stain", "Blood Stain", "Wine/Juice Stain", "Makeup Stain", "Sweat Stain", "Mud Stain", "Paint Stain", "Rust Stain"]),
      grouped("Fabric Treatment", ["Collar/Cuff Treatment", "Yellowing Treatment", "Odor Removal", "Spot Treatment"]),
    ],
  },
  {
    slug: "express-delivery",
    name: "Express / Same-Day Service",
    services: [
      ...standard(["Express Wash & Fold", "Express Wash & Iron", "Express Dry Cleaning", "Express Steam Iron", "4-Hour Laundry", "6-Hour Laundry", "Same-Day Laundry", "Same-Day Dry Cleaning", "Priority Processing", "Emergency Ironing"]),
      ...standard(["Express Pickup & Delivery"], unit.fixed),
    ],
  },
  {
    slug: "bulk-laundry",
    name: "Commercial / Bulk Laundry",
    services: [
      ...standard(["Hotel Linen Laundry", "Restaurant Linen Laundry", "Hospital/Clinic Laundry", "Salon/Spa Laundry", "Hostel Laundry", "School/College Uniforms", "Corporate Uniforms", "Factory Uniforms", "Gym Towels", "Hotel Towels", "Bedsheets", "Pillow Covers", "Table Cloths", "Napkins", "Curtains"], unit.kg),
      ...standard(["Bulk Wash & Fold", "Bulk Wash & Iron", "Bulk Dry Cleaning"], unit.kg),
    ],
  },
];

function slugify(value) {
  return value.trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 110);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query("SELECT COUNT(*)::int AS count FROM catalog_services");
    if (existing.rows[0].count > 0) {
      throw new Error("catalog_services is not empty; refusing to seed over existing services.");
    }

    await client.query("ALTER TABLE catalog_services DROP CONSTRAINT IF EXISTS catalog_services_unit");
    await client.query("ALTER TABLE catalog_services ADD CONSTRAINT catalog_services_unit CHECK (unit IN ('piece','kg','pair','seat','sq_ft','set','fixed','item'))");
    await client.query(`
      CREATE TABLE IF NOT EXISTS catalog_service_variants (
        id BIGSERIAL PRIMARY KEY,
        service_id BIGINT NOT NULL REFERENCES catalog_services(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        unit VARCHAR(20) NOT NULL CHECK (unit IN ('piece','kg','pair','seat','sq_ft','set','fixed')),
        regular_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (regular_price >= 0),
        express_price NUMERIC(12,2),
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (service_id, name)
      )
    `);

    let serviceOrder = 1;
    for (const [categoryIndex, category] of catalog.entries()) {
      await client.query(
        "UPDATE service_categories SET name=$1,display_order=$2,updated_at=NOW() WHERE slug=$3",
        [category.name, categoryIndex + 1, category.slug],
      );
      const categoryResult = await client.query(
        "SELECT id FROM service_categories WHERE slug=$1 AND is_active=TRUE",
        [category.slug],
      );
      if (!categoryResult.rows[0]) throw new Error(`Missing active category: ${category.name} (${category.slug})`);
      const categoryId = categoryResult.rows[0].id;

      for (const service of category.services) {
        const firstVariant = service.variants[0];
        const serviceResult = await client.query(
          `INSERT INTO catalog_services
           (category_id,name,slug,image_path,unit,regular_price,express_price,turnaround,display_order)
           VALUES ($1,$2,$3,'',$4,0,NULL,'2-3 Days',$5) RETURNING id`,
          [categoryId, service.name, `${category.slug}-${slugify(service.name)}`, firstVariant.unit, serviceOrder++],
        );
        const serviceId = serviceResult.rows[0].id;
        for (const [variantOrder, variant] of service.variants.entries()) {
          await client.query(
            `INSERT INTO catalog_service_variants
             (service_id,name,unit,regular_price,express_price,display_order)
             VALUES ($1,$2,$3,0,NULL,$4)`,
            [serviceId, variant.name, variant.unit, variantOrder + 1],
          );
        }
      }
    }

    await client.query("COMMIT");
    console.log(`Seeded ${catalog.length} categories with ${serviceOrder - 1} services and variants.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
