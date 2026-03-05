const { getDb } = require('./index');
const { migrate } = require('./migrate');

const PRODUCTS = [
  { id: 'p1', name: 'Golden Premiun', category: 'cachorros', price: 239.9, promo_price: 189.9, is_promo: 1, image_url: 'images/item2.png' },
  { id: 'p2', name: 'Racao SuperMix', category: 'gatos', price: 89.9, price_per_kg: 75, image_url: 'images/item3.png' },
  { id: 'p3', name: 'Brinquedos para gatos', category: 'gatos', price: 99.9, promo_price: 79.9, is_promo: 1, image_url: 'images/item4.png' },
  { id: 'p4', name: 'Focinheira para Cachorros', category: 'cachorros', price: 89.9, image_url: 'images/item5.jpg' },
  { id: 'p5', name: 'Coleira Basica', category: 'outros', price: 35.9, image_url: 'images/item1.png' },
  { id: 'p6', name: 'Racao Filhotes', category: 'cachorros', price: 169.9, price_per_kg: 60, image_url: 'images/racaofilhote.jpg' },
  { id: 'p7', name: 'Guia e Coleira Confort', category: 'cachorros', price: 89.9, promo_price: 69.9, is_promo: 1, image_url: 'images/Guia e Coleira Confort.jpg' },
  { id: 'p8', name: 'Areia Higienica Premium', category: 'gatos', price: 42.9, image_url: 'images/Areia Higiênica Premium.jpg' },
  { id: 'p9', name: 'Arranhador Compacto', category: 'gatos', price: 119.9, image_url: 'images/Arranhador Compacto.jpg' },
  { id: 'p10', name: 'Mix de Sementes Premium', category: 'passaros', price: 44.9, promo_price: 34.9, is_promo: 1, image_url: 'images/Mix de Sementes Premium.png' },
  { id: 'p11', name: 'Racao Flakes Tropical', category: 'peixes', price: 24.9, price_per_kg: 140, image_url: 'images/flakes.jpg' },
  { id: 'p12', name: 'Kit Aquario Inicial', category: 'peixes', price: 349.9, image_url: 'images/kit-inicial.jpg' },
  { id: 'p13', name: 'Areia Silica', category: 'gatos', price: 79.9, promo_price: 58.9, is_promo: 1, image_url: 'images/areiasilica.jpg' },
  { id: 'p14', name: 'Racao Gatos Filhotes', category: 'gatos', price: 129.9, image_url: 'images/gatosfilhotes.jpg' },
  { id: 'p15', name: 'Petisco Dental', category: 'cachorros', price: 32.9, image_url: 'images/petiscodental.jpg' },
  { id: 'p16', name: 'Petisco de Atum', category: 'gatos', price: 16.9, image_url: 'images/petiscosdeatum.jpg' },
  { id: 'p17', name: 'Petisco para Treino', category: 'cachorros', price: 34.9, promo_price: 24.9, is_promo: 1, image_url: 'images/petiscotreino.jpg' },
  { id: 'p18', name: 'Mix para Calopsita', category: 'passaros', price: 27.9, image_url: 'images/psita.jpg' },
  { id: 'p19', name: 'Racao Filhote Caes', category: 'cachorros', price: 94.9, image_url: 'images/racaofilhote.jpg' },
  { id: 'p20', name: 'Racao Gatos Castrados', category: 'gatos', price: 249.9, promo_price: 189.9, is_promo: 1, image_url: 'images/raçãogatoscastrados.jpg' },
  { id: 'p21', name: 'Racao para Kinguios', category: 'peixes', price: 29.9, image_url: 'images/raçãokinguios.jpg' },
  { id: 'p22', name: 'Racao Caes Senior', category: 'cachorros', price: 219.9, image_url: 'images/raçãosenior.png' },
  { id: 'p23', name: 'Sementes para Canarios', category: 'passaros', price: 22.9, image_url: 'images/sementescanarios.png' },
  { id: 'p24', name: 'Tapete Higienico Caes', category: 'cachorros', price: 64.9, image_url: 'images/tapetehigienicocachorro.jpg' }
];

async function seed() {
  await migrate();
  const db = await getDb();

  const stmt = await db.prepare(`
    INSERT INTO products (id, name, description, category, price, promo_price, price_per_kg, image_url, is_promo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      category = excluded.category,
      price = excluded.price,
      promo_price = excluded.promo_price,
      price_per_kg = excluded.price_per_kg,
      image_url = excluded.image_url,
      is_promo = excluded.is_promo,
      is_active = 1
  `);

  for (const product of PRODUCTS) {
    await stmt.run(
      product.id,
      product.name,
      product.description || '',
      product.category,
      product.price,
      product.promo_price || null,
      product.price_per_kg || null,
      product.image_url || null,
      product.is_promo || 0
    );
  }

  await stmt.finalize();
  console.log(`Seed complete: ${PRODUCTS.length} products`);
}

if (require.main === module) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seed };
