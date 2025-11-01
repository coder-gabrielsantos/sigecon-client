import { Upload, FileText, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

export default function UploadDropzone({
                                         value,
                                         setValue,
                                         maxMB = 20,
                                         acceptMimes = ["application/pdf"],
                                       }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  function validate(file) {
    if (!file) return "Selecione um arquivo.";
    if (!acceptMimes.includes(file.type)) return "Apenas PDF é permitido.";
    if (file.size > maxMB * 1024 * 1024) return `Arquivo maior que ${maxMB}MB.`;
    return "";
  }

  function handleFiles(files) {
    const file = files?.[0];
    const err = validate(file);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setValue?.(file);
  }

  return (
    <div className="space-y-3">
      <div
        className="rounded-2xl border-2 border-dashed border-gray-300 bg-white hover:border-gray-400 transition-colors p-6 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptMimes.join(",")}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-xl bg-gray-100 p-3">
            <Upload className="h-6 w-6 text-gray-600"/>
          </div>
          <div className="text-sm text-gray-700">
            Arraste o PDF aqui ou{" "}
            <button
              type="button"
              className="text-indigo-600 font-semibold hover:text-indigo-500"
              onClick={() => inputRef.current?.click()}
            >
              escolha um arquivo
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Formato: PDF · até {maxMB}MB
          </p>
        </div>
      </div>

      {value && (
        <div className="flex items-center justify-between rounded-xl ring-1 ring-gray-200 bg-white px-3 py-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-md bg-indigo-50 p-2">
              <FileText className="h-4 w-4 text-indigo-600"/>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {value.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatBytes(value.size)}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            onClick={() => setValue?.(null)}
            aria-label="Remover arquivo"
          >
            <Trash2 className="h-4 w-4"/>
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 ring-1 ring-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
