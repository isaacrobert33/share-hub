import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function DELETE(req: Request) {
  try {
    const { filePaths } = await req.json();

    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return NextResponse.json(
        { error: "Invalid file paths provided" },
        { status: 400 }
      );
    }

    let deletedFiles: string[] = [];
    let failedFiles: { file: string; error: string }[] = [];

    filePaths.forEach((filePath) => {
      try {
        const absolutePath = path.resolve(filePath); // Ensure absolute path
        if (fs.existsSync(absolutePath)) {
          fs.unlinkSync(absolutePath);
          deletedFiles.push(absolutePath);
        } else {
          failedFiles.push({ file: filePath, error: "File not found" });
        }
      } catch (error) {
        failedFiles.push({ file: filePath, error: (error as Error).message });
      }
    });

    return NextResponse.json({
      message: "Batch delete completed",
      deletedFiles,
      failedFiles,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
