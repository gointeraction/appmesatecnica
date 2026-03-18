import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to extract a YouTube video ID from a URL or return as-is if already an ID
function extractYoutubeId(url: string): string {
  // Already a bare ID (11 chars, alphanumeric + _ -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return url.trim(); // Fallback – return as given
}

// GET /api/videos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const comiteId = searchParams.get('comiteId');
    const search = searchParams.get('search');

    const where: any = {};
    if (comiteId) where.comiteId = comiteId;
    if (search) where.OR = [
      { titulo: { contains: search } },
      { descripcion: { contains: search } },
    ];

    const videos = await db.videoComite.findMany({
      where,
      include: {
        autor: { select: { id: true, nombre: true, apellido: true, imagenUrl: true } },
        comite: { select: { id: true, nombre: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const comites = await db.comite.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, color: true },
    });

    return NextResponse.json({ data: videos, comites });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ error: 'Error al obtener vídeos' }, { status: 500 });
  }
}

// POST /api/videos – Creates a video and notifies ALL active users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titulo, descripcion, urlYoutube, comiteId, autorId } = body;

    if (!titulo || !urlYoutube || !comiteId || !autorId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: titulo, urlYoutube, comiteId, autorId' },
        { status: 400 }
      );
    }

    // Validate comite and author exist
    const [comite, autor] = await Promise.all([
      db.comite.findUnique({ where: { id: comiteId } }),
      db.user.findUnique({ where: { id: autorId } }),
    ]);

    if (!comite) return NextResponse.json({ error: 'Comité no encontrado' }, { status: 404 });
    if (!autor) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const videoId = extractYoutubeId(urlYoutube);

    // Create the video
    const video = await db.videoComite.create({
      data: {
        titulo,
        descripcion,
        urlYoutube: videoId,
        comiteId,
        autorId,
      },
      include: {
        autor: { select: { id: true, nombre: true, apellido: true } },
        comite: { select: { id: true, nombre: true, color: true } },
      },
    });

    // Broadcast notification to ALL active users (except the author)
    const todosLosUsuarios = await db.user.findMany({
      where: { activo: true, NOT: { id: autorId } },
      select: { id: true },
    });

    if (todosLosUsuarios.length > 0) {
      await db.notificacion.createMany({
        data: todosLosUsuarios.map(u => ({
          userId: u.id,
          titulo: `📹 Nuevo video compartido: ${titulo}`,
          mensaje: `El comité "${comite.nombre}" compartió un nuevo recurso de video. Ingresa a la sección "Videos" para verlo.`,
          tipo: 'INFO',
          enlace: `/videos?id=${video.id}`,
        })),
      });
    }

    return NextResponse.json({ data: video, message: 'Video publicado y notificaciones enviadas' }, { status: 201 });
  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json({ error: 'Error al publicar el video' }, { status: 500 });
  }
}
