import { db as prisma } from "./src/lib/db"

async function run() {
  try {
    const tables: any = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    console.log('--- ALL TABLES ---');
    console.log(tables);
    
    const temas: any = await prisma.$queryRaw`SELECT id, titulo FROM ForoTema`;
    console.log('\n--- ALL FORO TOPICS ---');
    temas.forEach((t: any) => console.log(`Topic ID: ${t.id} -> Title: ${t.titulo}`));
    
    // Check for ForoPost but safely
    const hasPostTable = tables.some((t: any) => t.name === 'ForoPost');
    if (hasPostTable) {
        const posts: any = await prisma.$queryRaw`SELECT id, contenido, temaId FROM ForoPost`;
        console.log('\n--- ALL FORO POSTS ---');
        console.log(`Total: ${posts.length}`);
        posts.forEach((p: any) => console.log(`Post ${p.id} -> Tema ${p.temaId} CONTENT: ${p.contenido.substring(0, 30)}`));
    } else {
        console.log('\nTable ForoPost NOT FOUND in tables list.');
    }
  } catch (e: any) {
    console.error('ERROR:', e.message);
  }
}

run();
