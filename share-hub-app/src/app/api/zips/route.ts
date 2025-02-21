import { NextRequest } from "next/server";
import { createReadStream, existsSync } from "fs";
import { join } from "path";
import archiver from "archiver";
import { PassThrough } from "stream";

export async function POST(req: NextRequest) {
  try {
    const { filePaths } = await req.json();

    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid file paths provided" }),
        { status: 400 }
      );
    }

    const zipStream = new PassThrough();
    const archive = archiver("zip", { zlib: { level: 9 } });

    // Pipe the archive data into the stream
    archive.pipe(zipStream);

    // Add files to the archive
    for (const filePath of filePaths) {
      const absolutePath = join(`${process.cwd()}/public`, filePath); // Ensure absolute path
      if (existsSync(absolutePath)) {
        archive.file(absolutePath, {
          name: filePath.split("/").pop() || "file",
        });
      } else {
        console.warn(`File not found: ${absolutePath}`);
      }
    }

    // Finalize archive
    archive.finalize();

    return new Response(zipStream as any, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=files.zip",
      },
    });
  } catch (error) {
    console.error("ZIP Generation Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
