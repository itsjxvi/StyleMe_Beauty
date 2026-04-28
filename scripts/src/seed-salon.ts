import {
  db,
  usersTable,
  servicesTable,
  productsTable,
  categoriesTable,
  brandsTable,
  providersTable,
  appointmentsTable,
} from "@workspace/db";

async function main() {
  console.log("Seeding Salon de Belleza...");

  const existingAdmin = await db.select().from(usersTable);
  if (existingAdmin.length > 0) {
    console.log(`Already has ${existingAdmin.length} users — skipping users/services/products seed.`);
  } else {
    // Users
    await db.insert(usersTable).values([
      { full_name: "Administrador", email: "admin@salonbelleza.com", password_hash: "Admin1234", role: "admin", phone: "0999999999", is_active: true },
      { full_name: "María Vásquez", email: "maria@salonbelleza.com", password_hash: "empleado123", role: "employee", phone: "0987654321", is_active: true },
      { full_name: "Lucía Pérez", email: "lucia@salonbelleza.com", password_hash: "empleado123", role: "employee", phone: "0987111222", is_active: true },
    ]);

    // Categories
    const cats = await db.insert(categoriesTable).values([
      { name: "Cuidado del cabello", description: "Shampoo, acondicionador, mascarillas" },
      { name: "Tintes y coloración", description: "Tintes, decolorantes, oxidantes" },
      { name: "Tratamientos capilares", description: "Keratina, botox, alisado" },
      { name: "Uñas", description: "Esmaltes, gel, acrílico" },
      { name: "Maquillaje", description: "Bases, labiales, sombras" },
      { name: "Cuidado facial", description: "Cremas, mascarillas faciales" },
    ]).returning();

    // Brands
    const brands = await db.insert(brandsTable).values([
      { name: "L'Oréal Professionnel", description: "Marca profesional francesa" },
      { name: "Kerastase", description: "Cuidado capilar premium" },
      { name: "Wella Professionals", description: "Color y tratamientos" },
      { name: "Schwarzkopf", description: "Coloración profesional" },
      { name: "OPI", description: "Esmaltes para uñas" },
      { name: "MAC", description: "Maquillaje profesional" },
    ]).returning();

    // Providers
    await db.insert(providersTable).values([
      { name: "Distribuidora Belleza Total", contact_name: "Carlos Mendoza", phone: "022345678", email: "ventas@bellezatotal.ec", address: "Av. Amazonas N24-03, Quito" },
      { name: "Cosmética Profesional Ecuador", contact_name: "Andrea Salazar", phone: "042987654", email: "info@cosmeticaprof.ec", address: "Av. 9 de Octubre 123, Guayaquil" },
      { name: "Importadora Glamour", contact_name: "Roberto Núñez", phone: "072345678", email: "compras@glamour.ec", address: "Calle Bolívar 456, Cuenca" },
    ]);

    // Products (Ecuadorian USD prices)
    await db.insert(productsTable).values([
      // Cuidado del cabello
      { name: "Shampoo L'Oréal Profesional 300ml", description: "Shampoo nutritivo profesional", price: "18.50", cost: "11.00", stock: 24, category_id: cats[0].id, brand_id: brands[0].id },
      { name: "Acondicionador Kerastase Nutritive 250ml", description: "Acondicionador hidratante", price: "32.00", cost: "20.00", stock: 18, category_id: cats[0].id, brand_id: brands[1].id },
      { name: "Mascarilla Capilar Wella 500ml", description: "Mascarilla reparadora intensiva", price: "28.75", cost: "17.50", stock: 12, category_id: cats[0].id, brand_id: brands[2].id },
      { name: "Sérum Kerastase Elixir 100ml", description: "Aceite reparador para puntas", price: "45.00", cost: "28.00", stock: 9, category_id: cats[0].id, brand_id: brands[1].id },

      // Tintes
      { name: "Tinte L'Oréal Majirel 50ml", description: "Tinte profesional larga duración", price: "12.50", cost: "7.00", stock: 40, category_id: cats[1].id, brand_id: brands[0].id },
      { name: "Decolorante Schwarzkopf Blondme 450g", description: "Polvo decolorante", price: "29.90", cost: "18.00", stock: 15, category_id: cats[1].id, brand_id: brands[3].id },
      { name: "Oxidante Wella Welloxon 1L", description: "Crema oxidante 30 vol", price: "9.75", cost: "5.50", stock: 28, category_id: cats[1].id, brand_id: brands[2].id },

      // Tratamientos
      { name: "Keratina Brasileña 1L", description: "Tratamiento alisador profesional", price: "65.00", cost: "40.00", stock: 8, category_id: cats[2].id, brand_id: brands[2].id },
      { name: "Botox Capilar Schwarzkopf 500ml", description: "Tratamiento reconstructor", price: "48.00", cost: "30.00", stock: 10, category_id: cats[2].id, brand_id: brands[3].id },

      // Uñas
      { name: "Esmalte OPI Clásico 15ml", description: "Esmalte de uñas profesional", price: "8.50", cost: "4.50", stock: 60, category_id: cats[3].id, brand_id: brands[4].id },
      { name: "Esmalte Gel OPI GelColor 15ml", description: "Esmalte gel UV/LED", price: "14.00", cost: "8.00", stock: 35, category_id: cats[3].id, brand_id: brands[4].id },
      { name: "Acrílico Polvo Blanco 56g", description: "Polímero acrílico para uñas", price: "16.25", cost: "9.00", stock: 20, category_id: cats[3].id },
      { name: "Top Coat OPI 15ml", description: "Brillo selladora", price: "9.00", cost: "5.00", stock: 30, category_id: cats[3].id, brand_id: brands[4].id },

      // Maquillaje
      { name: "Base de Maquillaje MAC Studio Fix 30ml", description: "Base líquida cobertura media", price: "38.00", cost: "24.00", stock: 14, category_id: cats[4].id, brand_id: brands[5].id },
      { name: "Labial MAC Matte", description: "Labial mate larga duración", price: "22.50", cost: "13.00", stock: 22, category_id: cats[4].id, brand_id: brands[5].id },
      { name: "Paleta de Sombras MAC 9 colores", description: "Paleta neutra profesional", price: "55.00", cost: "34.00", stock: 7, category_id: cats[4].id, brand_id: brands[5].id },

      // Cuidado facial
      { name: "Crema Hidratante Facial 50ml", description: "Hidratación profunda 24h", price: "19.99", cost: "11.00", stock: 18, category_id: cats[5].id },
      { name: "Mascarilla Facial Arcilla 200g", description: "Limpieza profunda", price: "13.50", cost: "7.50", stock: 25, category_id: cats[5].id },
    ]);

    // Services
    await db.insert(servicesTable).values([
      { name: "Corte de cabello dama", description: "Corte personalizado con lavado", price: "12.00", duration_minutes: 45 },
      { name: "Corte de cabello caballero", description: "Corte clásico o moderno", price: "8.00", duration_minutes: 30 },
      { name: "Tinte completo", description: "Aplicación de tinte uniforme", price: "45.00", duration_minutes: 90 },
      { name: "Mechas / Babylights", description: "Iluminaciones a medida", price: "65.00", duration_minutes: 120 },
      { name: "Keratina alisadora", description: "Tratamiento alisador semipermanente", price: "85.00", duration_minutes: 150 },
      { name: "Manicure clásico", description: "Limado, cutícula y esmalte", price: "10.00", duration_minutes: 45 },
      { name: "Manicure semipermanente", description: "Esmalte gel UV", price: "18.00", duration_minutes: 60 },
      { name: "Pedicure spa", description: "Pedicure con exfoliación", price: "20.00", duration_minutes: 60 },
      { name: "Maquillaje social", description: "Maquillaje para eventos", price: "30.00", duration_minutes: 60 },
      { name: "Maquillaje de novia", description: "Maquillaje para boda con prueba", price: "85.00", duration_minutes: 120 },
      { name: "Limpieza facial profunda", description: "Limpieza, exfoliación y máscara", price: "35.00", duration_minutes: 75 },
      { name: "Peinado para evento", description: "Peinado elegante con accesorios", price: "25.00", duration_minutes: 60 },
    ]);

    // Sample appointments — today and tomorrow so calendar isn't empty
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 3600 * 1000);
    const dayAfter = new Date(today.getTime() + 48 * 3600 * 1000);
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    await db.insert(appointmentsTable).values([
      { client_name: "Ana Torres", client_phone: "0991111222", service_id: 1, employee_id: 2, appointment_date: fmt(today), appointment_time: "10:00", status: "confirmed", notes: "Cliente frecuente" },
      { client_name: "Pedro Salazar", client_phone: "0992222333", service_id: 2, employee_id: 3, appointment_date: fmt(today), appointment_time: "11:30", status: "confirmed" },
      { client_name: "Carla Vega", client_phone: "0993333444", service_id: 6, employee_id: 2, appointment_date: fmt(today), appointment_time: "14:00", status: "pending" },
      { client_name: "Lucía Mora", client_phone: "0994444555", service_id: 3, employee_id: 2, appointment_date: fmt(today), appointment_time: "16:00", status: "confirmed", notes: "Tinte color cobrizo" },
      { client_name: "Daniela Ruiz", client_phone: "0995555666", service_id: 9, employee_id: 3, appointment_date: fmt(tomorrow), appointment_time: "09:00", status: "confirmed", notes: "Maquillaje para boda amiga" },
      { client_name: "Sofía Mejía", client_phone: "0996666777", service_id: 7, employee_id: 3, appointment_date: fmt(tomorrow), appointment_time: "11:00", status: "pending" },
      { client_name: "Andrés Pacheco", client_phone: "0997777888", service_id: 2, employee_id: 2, appointment_date: fmt(tomorrow), appointment_time: "15:00", status: "confirmed" },
      { client_name: "María Castro", client_phone: "0998888999", service_id: 10, employee_id: 2, appointment_date: fmt(dayAfter), appointment_time: "10:00", status: "pending", notes: "Boda 15 mayo - confirmar prueba" },
      { client_name: "Patricia León", client_phone: "0999991111", service_id: 11, employee_id: 3, appointment_date: fmt(dayAfter), appointment_time: "13:00", status: "confirmed" },
    ]);
  }

  const { promotionsTable } = await import("@workspace/db");
  const promoCount = (await db.select().from(promotionsTable)).length;
  if (promoCount === 0) {
    await db.insert(promotionsTable).values([
      { name: "Bienvenida 10%", description: "10% en tu primera compra", code: "BIENVENIDA10", type: "percent", value: "10", applies_to: "all", min_amount: "0", is_active: true },
      { name: "Envío gratis +$50", description: "Sobre productos al comprar más de $50", code: "ENVIOGRATIS", type: "amount", value: "3.50", applies_to: "products", min_amount: "50", is_active: true },
      { name: "Combo Belleza 15%", description: "15% en compras de productos sobre $30", code: "BELLEZA15", type: "percent", value: "15", applies_to: "products", min_amount: "30", is_active: true },
    ]);
  }

  console.log("Done.");
  console.log("Admin login: admin@salonbelleza.com / Admin1234");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
