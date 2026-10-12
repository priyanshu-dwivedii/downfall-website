import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { verifyAdminRequest } from '@/lib/auth';
import { getSupabaseAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Megabytes

interface DetectedImage {
  mime: string;
  ext: string;
}

/**
 * Validates actual binary content (magic bytes) to ensure the uploaded file
 * is a genuine, safe image and not an executable or spoofed file.
 */
function detectImageType(buffer: Buffer): DetectedImage | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: '.jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: '.png' };
  }

  // GIF: GIF87a or GIF89a
  const gifHeader = buffer.subarray(0, 6).toString('ascii');
  if (gifHeader === 'GIF87a' || gifHeader === 'GIF89a') {
    return { mime: 'image/gif', ext: '.gif' };
  }

  // WEBP: RIFF .... WEBP
  const riff = buffer.subarray(0, 4).toString('ascii');
  const webp = buffer.subarray(8, 12).toString('ascii');
  if (riff === 'RIFF' && webp === 'WEBP') {
    return { mime: 'image/webp', ext: '.webp' };
  }

  // AVIF: .... ftyp avif / avis
  const ftyp = buffer.subarray(4, 8).toString('ascii');
  const brand = buffer.subarray(8, 12).toString('ascii');
  if (ftyp === 'ftyp' && (brand === 'avif' || brand === 'avis')) {
    return { mime: 'image/avif', ext: '.avif' };
  }

  return null;
}

export async function POST(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file received in upload payload.' }, { status: 400 });
    }

    // 1. File size enforcement
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File exceeds maximum allowed size limit of 5MB (received ${(file.size / (1024 * 1024)).toFixed(1)}MB).` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Magic bytes validation (content-based detection)
    const detected = detectImageType(buffer);
    if (!detected) {
      return NextResponse.json(
        {
          error: 'Security validation failed: File content does not match allowed image signatures (JPEG, PNG, WEBP, AVIF, or GIF).',
        },
        { status: 400 }
      );
    }

    // 3. Cryptographically random safe filename (user filename ignored)
    const safeId = crypto.randomUUID();
    const safeFileName = `${safeId}${detected.ext}`;

    let publicUrl = `/uploads/${safeFileName}`;

    const isProduction = process.env.NODE_ENV === 'production';

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        const { error: uploadErr } = await supabase.storage
          .from('catalog-images')
          .upload(safeFileName, buffer, {
            contentType: detected.mime,
            upsert: true,
          });

        if (uploadErr) {
          console.error('Supabase storage upload error:', uploadErr);
          throw new Error(`Cloud storage upload failed: ${uploadErr.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('catalog-images')
          .getPublicUrl(safeFileName);

        publicUrl = urlData.publicUrl;
      } else if (isProduction) {
        return NextResponse.json(
          { error: 'Production configuration error: Failed to initialize Supabase storage client.' },
          { status: 500 }
        );
      }
    } else {
      // Local-file storage is strictly disabled in production
      if (isProduction) {
        return NextResponse.json(
          {
            error:
              'Production configuration error: Supabase cloud storage is required in production. Local-file storage is disabled. Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
          },
          { status: 500 }
        );
      }

      // Local fallback (development / local testing only)
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const targetFilePath = path.join(uploadsDir, safeFileName);
      fs.writeFileSync(targetFilePath, buffer);
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: safeFileName,
      mimeType: detected.mime,
      sizeBytes: buffer.length,
    });
  } catch (error: any) {
    console.error('Image upload validation error:', error);
    return NextResponse.json({ error: error.message || 'Image upload processing failed.' }, { status: 500 });
  }
}
