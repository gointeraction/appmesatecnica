async function debugIsolation() {
    console.log('--- DEBUG FORUM ISOLATION ---');
    try {
        // 1. Get topics
        const temasRes = await fetch('http://localhost:3000/api/foro/temas');
        const temas = (await temasRes.json()).data || [];
        console.log(`Found ${temas.length} topics.`);

        // New check: All posts
        const allPostsRes = await fetch('http://localhost:3000/api/foro/temas/SOME_ID/posts'); // Wait, I need a way to get all posts...
        // Actually, I can just check each topic and see if they have the SAME posts.
        
        const topicPostsMap: Record<string, string[]> = {};

        for (const tema of temas) {
            const postsRes = await fetch(`http://localhost:3000/api/foro/temas/${tema.id}/posts`);
            const posts = (await postsRes.json()).data || [];
            topicPostsMap[tema.id] = posts.map((p: any) => p.id);
            console.log(`Topic ${tema.id}: ${posts.length} posts`);
        }

        // Compare post IDs
        const ids = Object.values(topicPostsMap);
        if (ids.length > 1) {
            const first = JSON.stringify(ids[0]);
            const allSame = ids.every(idList => JSON.stringify(idList) === first && idList.length > 0);
            if (allSame) {
                console.log('BUG CONFIRMED: All topics returning the same posts!');
            }
        }
    } catch (error: any) {
        console.error('ERROR:', error.message);
    }
}

debugIsolation();
