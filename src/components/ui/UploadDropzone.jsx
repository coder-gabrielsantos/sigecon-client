import React, { useCallback } from "react";

export default function UploadDropzone({
                                         file,
                                         onFileChange,
                                         accept = ".pdf",
                                         disabled = false,
                                         label = "Arraste o PDF aqui ou clique para selecionar",
                                         helperText = "Apenas arquivos PDF.",
                                       }) {
  const handleFile = useCallback(
    (f) => {
      if (!f || disabled) return;
      if (onFileChange) onFileChange(f);
    },
    [onFileChange, disabled]
  );

  const handleInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="space-y-1">
      <label
        className={`flex flex-col items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-2xl cursor-pointer
        ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-gray-50"
            : "border-indigo-300 hover:border-indigo-500 bg-white"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />
        <span className="text-sm font-medium text-gray-800 text-center">
          {label}
        </span>
        <span className="mt-1 text-[11px] text-gray-500 text-center">
          {helperText}
        </span>

        {file && (
          <div className="mt-3 px-3 py-1.5 text-[11px] rounded-full bg-indigo-50 text-indigo-700">
            Selecionado: <span className="font-semibold">{file.name}</span>
          </div>
        )}
      </label>
    </div>
  );
}
