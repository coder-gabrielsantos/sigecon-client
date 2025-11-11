import { useState } from "react";
import Modal from "../../components/ui/Modal";
import UploadDropzone from "../../components/ui/UploadDropzone";
import { extractContractTable } from "../../services/extractorService";
import { createContractFromExtract } from "../../services/contractsService";

export default function ContractUploadModal({ open, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  const resetState = () => {
    setFile(null);
    setProgress(0);
    setSubmitting(false);
    setErr("");
    setOk(false);
  };

  const handleClose = () => {
    resetState();
    onClose?.();
  };

  const handleUpload = async (e) => {
    e?.preventDefault?.();
    setErr("");

    if (!file) {
      setErr("Anexe o PDF do contrato.");
      return;
    }

    try {
      setSubmitting(true);
      setOk(false);
      setProgress(0);

      // 1) Extrai do microserviço FastAPI
      const extractData = await extractContractTable(file, (event) => {
        if (!event.total) return;
        const percent = Math.round((event.loaded * 100) / event.total);
        if (!Number.isNaN(percent)) setProgress(percent);
      });

      // 2) Envia para o server principal salvar no banco
      const savedContract = await createContractFromExtract(
        extractData,
        file.name
      );

      setOk(true);

      // 3) Notifica o pai (ContractsListPage) para atualizar a lista
      onUploaded?.(savedContract);

      // 4) Fecha modal
      handleClose();
    } catch (error) {
      console.error(error);
      const msg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Não foi possível processar o contrato agora.";
      setErr(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Upload de contrato (PDF)"
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex-1">
            {submitting && (
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-1.5 rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {ok && !err && !submitting && (
              <p className="mt-1 text-xs text-emerald-600">
                Contrato processado e salvo com sucesso.
              </p>
            )}

            {err && (
              <p className="mt-1 text-xs text-red-600">
                {err}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-xl px-3 py-2 text-sm font-medium text-gray-700 bg-white ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleUpload}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={submitting || !file}
            >
              {submitting ? "Processando..." : "Enviar PDF"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Envie o contrato em PDF. A tabela será lida automaticamente e os dados
          serão enviados para o sistema.
        </p>

        <UploadDropzone
          file={file}
          onFileChange={setFile}
          accept=".pdf"
          disabled={submitting}
          label="Arraste o PDF aqui ou clique para selecionar"
          helperText="Apenas arquivos PDF, até 20MB."
        />
      </div>
    </Modal>
  );
}
