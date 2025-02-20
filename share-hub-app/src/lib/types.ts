export interface FileItem {
  id: string;
  name: string;
  size: number;
  extension: string;
  fileType: string;
  date: Date;
  preview: string | null;
  progress?: number;
  status?: "pending" | "uploading" | "completed" | "error";
  error?: string;
  link?: string;
}
