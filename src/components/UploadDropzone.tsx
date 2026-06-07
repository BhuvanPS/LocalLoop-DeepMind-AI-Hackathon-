/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Upload, X, FileImage } from "lucide-react";

interface UploadDropzoneProps {
  onImageSelected: (base64Url: string | null) => void;
  selectedImageUrl: string | null;
}

export default function UploadDropzone({ onImageSelected, selectedImageUrl }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, or WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onImageSelected(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    onImageSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div id="upload-zone-container" className="w-full">
      <input
        id="file-input-element"
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {selectedImageUrl ? (
        <div id="upload-preview-card" className="relative group border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
          <img
            src={selectedImageUrl}
            alt="Uploaded outfit"
            className="w-full h-64 object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              id="upload-change-btn"
              onClick={triggerInput}
              className="px-4 py-2 bg-white text-slate-800 text-sm font-medium rounded-lg shadow hover:bg-slate-50 transition-colors"
            >
              Change Image
            </button>
            <button
              id="upload-remove-btn"
              onClick={removeImage}
              className="p-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
              title="Remove image"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <button
            id="mobile-upload-remove-btn"
            onClick={removeImage}
            className="absolute top-3 right-3 p-1.5 bg-slate-900/60 text-white rounded-full hover:bg-slate-900 md:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          id="upload-dropzone-drag-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerInput}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragging
              ? "border-emerald-500 bg-emerald-50/40 text-emerald-600Scale"
              : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-500 hover:bg-slate-50"
          }`}
        >
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 text-emerald-600">
            <Upload className="w-8 h-8" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">
            Drag & drop outfit image here, or{" "}
            <span className="text-emerald-600 hover:underline">browse files</span>
          </p>
          <p className="text-xs text-slate-400">Supports PNG, JPG, or WEBP up to 10MB</p>
        </div>
      )}
    </div>
  );
}
