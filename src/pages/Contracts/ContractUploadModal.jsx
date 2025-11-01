import { useState } from "react";
import Modal from "../../components/ui/Modal";
import UploadDropzone from "../../components/ui/UploadDropzone";
import http from "../../services/http";

export default function ContractUploadModal({ open, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  function resetState() {
    setFile(null);
    setProgress(0);
    setSubmitting(false);
    setErr("");
    setOk(false);
  }

  async function handleUpload(e) {
    e?.preventDefault?.();
    setErr("");

    if (!file) {
      setErr("Anexe o PDF do contrato.");
      return;
    }

    try {
      setSubmitting(true);
      setOk(false);

      const fd = new FormData();
      fd.append("arquivo", file); // campo único: PDF

      // endpoint sugerido no backend: POST /contratos/upload
      const { data } = await http.post("/contratos/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (evt.total) {
            const p = Math.round((evt.loaded * 100) / evt.total);
            setProgress(p);
          }
        },
      });

      setOk(true);
      onUploaded?.(data); // opcional: atualizar lista, se quiser
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        "Não foi possível enviar o contrato agora.";
      setErr(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        resetState();
        onClose?.();
      }}
      title="Upload de contrato (PDF)"
      footer={
        <>
          <button
            type="button"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-300 bg-white hover:bg-gray-50"
            onClick={() => {
              resetState();
              onClose?.();
            }}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleUpload}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/30 disabled:opacity-60"
            disabled={submitting || !file}
          >
            {submitting ? "Enviando..." : "Enviar"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <UploadDropzone value={file} setValue={setFile}/>

        {/* progresso */}
        {submitting && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Enviando...</span>
              <span className="text-xs text-gray-500">{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 bg-indigo-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* sucesso */}
        {ok && (
          <p className="text-sm text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 rounded-xl px-3 py-2">
            Contrato enviado com sucesso.
          </p>
        )}

        {/* erro */}
        {err && (
          <p className="text-sm text-red-600 bg-red-50 ring-1 ring-red-200 rounded-xl px-3 py-2">
            {err}
          </p>
        )}

        <p className="text-[11px] text-gray-500">
          O arquivo será armazenado para consulta e auditoria. Tamanho máximo: 20MB. Apenas PDF.
        </p>
      </div>
    </Modal>
  );
}
