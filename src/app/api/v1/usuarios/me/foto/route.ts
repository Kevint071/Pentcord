import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId, error } = await getUserFromToken(request);

    if (error || !userId) {
      return NextResponse.json(
        { error: error || "Usuario no autenticado" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se subió ningún archivo" },
        { status: 400 },
      );
    }

    // Convertir el archivo a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Cloudinary mediante un Upload Stream
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "pentcord_imagenes/perfiles", // Carpeta específica para fotos de perfil
          public_id: `user_${userId}`, // Identifica la imagen con el usuario
          overwrite: true, // Reemplaza la foto anterior del mismo usuario
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      uploadStream.end(buffer);
    });

    // uploadResult contiene la URL pública y datos de la imagen
    const { secure_url, public_id } = uploadResult as {
      secure_url: string;
      public_id: string;
    };

    // Aquí deberías guardar/actualizar secure_url en tu base de datos
    // asociado al userId, por ejemplo:
    await prisma.user.update({
      where: { id: userId },
      data: {
        fotoPerfilUrl: secure_url, // Nombre exacto del campo en schema.prisma
      },
      select: {
        id: true,
        email: true,
        fotoPerfilUrl: true,
      },
    });

    return NextResponse.json(
      { url: secure_url, publicId: public_id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error al subir imagen:", error);
    return NextResponse.json(
      { error: "Error al procesar la imagen" },
      { status: 500 },
    );
  }
}
