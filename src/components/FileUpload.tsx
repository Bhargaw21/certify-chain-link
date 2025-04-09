
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, File, X } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  label?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelected,
  accept = ".pdf",
  maxSize = 5 * 1024 * 1024, // 5MB
  label = "Upload Certificate"
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Check file type
    const fileType = file.type;
    if (!fileType.includes('pdf')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `Please upload a file smaller than ${Math.round(maxSize / 1024 / 1024)}MB.`,
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFile(file);
    onFileSelected(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive 
              ? 'border-certify-blue bg-certify-blue/5' 
              : 'border-gray-300 hover:border-certify-blue'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
          }}
          onDrop={handleFileDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-certify-blue/10 flex items-center justify-center">
              <UploadCloud className="w-6 h-6 text-certify-blue" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-gray-500 mt-1">Drag and drop or click to browse</p>
            </div>
            <Button
              variant="outline"
              className="relative"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              Browse Files
              <input
                id="file-input"
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept={accept}
                onChange={handleFileChange}
              />
            </Button>
            <p className="text-xs text-gray-500">
              Max file size: {formatFileSize(maxSize)}
            </p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-certify-blue/10 flex items-center justify-center">
                <File className="w-5 h-5 text-certify-blue" />
              </div>
              <div>
                <p className="text-sm font-medium truncate max-w-xs">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={removeFile}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
