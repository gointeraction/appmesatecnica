async function testIsolation() {
    console.log('--- CONTROLLED ISOLATION TEST ---');
    try {
        // 1. Get topics
        const temasRes = await fetch('http://localhost:3000/api/foro/temas');
        const temas = (await temasRes.json()).data || [];
        if (temas.length < 2) {
            console.error('Not enough topics for testing.');
            return;
        }

        const t1 = temas[0];
        const t2 = temas[1];

        console.log(`Targeting Topic 1: ${t1.id}`);
        console.log(`Targeting Topic 2: ${t2.id}`);

        // 2. Create post in Topic 1
        console.log('Creating post in Topic 1...');
        const uniqueContent = `Post from test ${Date.now()}`;
        await fetch(`http://localhost:3000/api/foro/temas/${t1.id}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contenido: uniqueContent })
        });

        // 3. Check Topic 1
        console.log('\nChecking Topic 1 posts:');
        const res1 = await fetch(`http://localhost:3000/api/foro/temas/${t1.id}/posts`);
        const data1 = await res1.json();
        const hasPost1 = data1.data.some((p: any) => p.contenido === uniqueContent);
        console.log(`Found unique post in Topic 1: ${hasPost1}`);

        // 4. Check Topic 2
        console.log('\nChecking Topic 2 posts:');
        const res2 = await fetch(`http://localhost:3000/api/foro/temas/${t2.id}/posts`);
        const data2 = await res2.json();
        const hasPost2 = data2.data.some((p: any) => p.contenido === uniqueContent);
        console.log(`Found unique post in Topic 2: ${hasPost2}`);

        if (hasPost1 && hasPost2) {
            console.log('BUG CONFIRMED: Comments are leaking into other topics!');
        } else if (hasPost1 && !hasPost2) {
            console.log('SUCCESS: Comments are correctly isolated.');
        } else {
            console.log('STRANGE: Post was not found in Topic 1.');
        }

    } catch (error: any) {
        console.error('ERROR:', error.message);
    }
}

testIsolation();
