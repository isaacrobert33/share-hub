"use client";

import * as React from "react";
import { Upload, FileIcon, Download, Trash2, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileItem } from "@/lib/types";
import { v4 as UUID } from "uuid";
import { useQuery } from "@tanstack/react-query";

const fetchFiles = async (): Promise<FileItem[]> => {
  const response = await fetch("/api/files");
  const data = await response.json();
  return data.files.map((file: FileItem) => ({
    ...file,
    date: new Date(file.date as any),
  }));
};

export default function FilePage() {
  const year = new Date().getFullYear();
  const [files, setFiles] = React.useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { data, refetch, isError } = useQuery({
    queryKey: ["files"],
    queryFn: fetchFiles,
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const newFileItems: FileItem[] = newFiles.map((file) => ({
      id: UUID(),
      name: file.name,
      size: file.size,
      fileType: file.type,
      date: new Date(),
      progress: 0,
      status: "pending",
      preview: null,
      extension: file.name.split(".")[1],
    }));

    setFiles((prevFiles) => [...prevFiles, ...newFileItems]);

    // Upload each file
    newFileItems.forEach((fileItem) => {
      uploadFile(fileItem.id, newFiles.find((f) => f.name === fileItem.name)!);
    });
  };

  const uploadFile = (fileId: string, file: File) => {
    const xhr = new XMLHttpRequest();

    // Update the file status to uploading
    setFiles((prevFiles) =>
      prevFiles.map((f) =>
        f.id === fileId ? { ...f, status: "uploading" as const } : f
      )
    );

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded * 100) / event.total);
        setFiles((prevFiles) =>
          prevFiles.map((f) => (f.id === fileId ? { ...f, progress } : f))
        );
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === fileId
              ? { ...f, status: "completed" as const, progress: 100 }
              : f
          )
        );
      } else {
        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "error" as const,
                  error: `Upload failed with status ${xhr.status}`,
                }
              : f
          )
        );
      }
    });

    xhr.addEventListener("error", () => {
      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: "error" as const,
                error: "Upload failed due to network error",
              }
            : f
        )
      );
    });

    // Create FormData and append file
    const formData = new FormData();
    formData.append("file", file);

    // Replace this URL with your actual upload endpoint
    xhr.open("POST", "/api/uploads");
    xhr.send(formData);
  };

  const deleteFile = (file: FileItem) => {
    const confirm = window.confirm("Proceed with deleting this file ?");
    if (!confirm) return;
    fetch(`/api/delete?path=uploads/${file.name}`, {
      method: "DELETE",
    }).then((res) => {
      if (res.ok) {
        refetch();
      }
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  React.useEffect(() => {
    if (data) {
      setFiles(data);
    }
  }, [data]);

  return (
    <div className="relative isolate px-6 pt-5 lg:px-8 bg-gray-900 text-white w-full h-screen">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#e2ae5a] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        />
      </div>
      {/* <div className="mx-auto max-w-2xl py-28 sm:py-48 lg:py-32"> */}
      <div className="container mx-auto py-10 space-y-8">
        <div className="flex items-center gap-3 w-full justify-center sm:justify-start">
          <LinkIcon />
          <h1 className="text-3xl font-bold">ShareHub</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-muted-foreground/25"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                className="hidden"
                multiple
              />
              <div className="flex flex-col items-center gap-4">
                <Upload className="w-12 h-12 text-muted-foreground" />
                <div className="text-xl font-medium text-white">
                  Drag & Drop files here or{" "}
                  <Button
                    variant="link"
                    className="px-1 text-white"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    browse
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Support for all file types
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {files.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2 text-white truncate max-w-48">
                          {file.preview ? (
                            <img
                              src={file.preview}
                              className="w-8 h-8 rounded-md"
                            />
                          ) : (
                            <FileIcon className="w-4 h-4" />
                          )}
                          {file.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-white min-w-24">
                        {formatFileSize(file.size)}
                      </TableCell>
                      <TableCell className="text-white">
                        {file.date?.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="w-[200px]">
                        <div className="space-y-1 text-white">
                          {file.status === "completed" ? (
                            <>Uploaded</>
                          ) : (
                            <Progress
                              value={file.progress}
                              className="w-[160px]"
                            />
                          )}
                          {file.error && (
                            <p className="text-xs text-destructive">
                              {file.error}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <a
                            href={file.link}
                            download={file.name}
                            className="text-black no-underline"
                          >
                            <Button
                              variant="outline"
                              size="icon"
                              disabled={file.status !== "completed"}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </a>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => deleteFile(file)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        <div className="text-gray-500 fixed bottom-5 right-5 text-sm">
          © {year} ShareHub
        </div>
      </div>
      {/* </div> */}
      {/* <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[calc(100%-13rem)] max-h-[60vh] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
        />
      </div> */}
    </div>
  );
}
