// app/api/list/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as UUID } from "uuid";

export async function GET() {
  const directoryPath = path.join(process.cwd(), "public/uploads");

  try {
    const files = fs.readdirSync(directoryPath);

    const fileDetails = files.map((file) => {
      const filePath = path.join(directoryPath, file);
      const stats = fs.statSync(filePath);
      const fileType = path.extname(file).toLowerCase();
      const isImage = /\.(jpg|jpeg|png|gif|webp|heic|crm)$/.test(fileType);

      return {
        id: UUID(),
        name: file,
        size: stats.size,
        extension: fileType,
        fileType: isImage ? "image" : "other",
        date: stats.mtime,
        preview: isImage ? `/uploads/${file}` : null,
        status: "completed",
        link: `/uploads/${file}`,
      };
    });

    return NextResponse.json({ files: fileDetails }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to scan files" },
      { status: 500 }
    );
  }
}
