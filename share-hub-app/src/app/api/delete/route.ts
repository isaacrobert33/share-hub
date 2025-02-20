// app/api/delete/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    return NextResponse.json(
      { error: "File path is required" },
      { status: 400 }
    );
  }

  // Validate the file path to prevent directory traversal
  if (!filePath.startsWith("uploads/") || filePath.includes("..")) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  const fullPath = path.join(process.cwd(), "public", filePath);

  try {
    // Check if the file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete the file
    fs.unlinkSync(fullPath);

    return NextResponse.json(
      { message: "File deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
