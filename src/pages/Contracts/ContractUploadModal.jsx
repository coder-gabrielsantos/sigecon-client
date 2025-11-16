import { useState } from "react";
import Modal from "../../components/ui/Modal";
import UploadDropzone from "../../components/ui/UploadDropzone";
import { extractContractTable } from "../../services/extractorService";
import {
  createContractFromExtract,
  createEmptyContract,
} from "../../services/contractsService";

export default function ContractUploadModal({ open, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [creatingEmpty, setCreatingEmpty] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  const resetState = () => {
    setFile(null);
    setProgress(0);
    setSubmitting(false);
    setCreatingEmpty(false);
    setErr("");
    setOk(false);
  };

  const handleClose = () => {
    if (submitting || creatingEmpty) return;
    resetState();
    onClose?.();
  };

  const handleUpload = async (e) => {
    e?.preventDefault?.();
    setErr("");
    setOk(false);

    if (!file) {
      setErr("Anexe o PDF do contrato.");
      return;
    }

    try {
      setSubmitting(true);
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

      // 3) Notifica o pai
      onUploaded?.(savedContract);

      // 4) Fecha modal
      resetState();
      onClose?.();
    } catch (error) {
      console.error(error);
      const msg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Não foi possível processar o contrato agora.";
      setErr(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Criar contrato em branco (sem PDF)
  const handleCreateEmptyContract = async () => {
    setErr("");
    setOk(false);
    setCreatingEmpty(true);

    try {
      const contract = await createEmptyContract({});
      onUploaded?.(contract);
      resetState();
      onClose?.();
    } catch (error) {
      console.error(error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Não foi possível criar o contrato em branco.";
      setErr(msg);
    } finally {
      setCreatingEmpty(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Novo contrato"
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
              disabled={submitting || creatingEmpty}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleUpload}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={submitting || creatingEmpty || !file}
            >
              {submitting ? "Processando..." : "Importar PDF"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Envie o contrato em PDF para que a tabela de itens seja lida e
          cadastrada automaticamente. Depois você poderá ajustar manualmente
          os dados no detalhamento do contrato.
        </p>

        <UploadDropzone
          file={file}
          onFileChange={setFile}
          accept=".pdf"
          disabled={submitting || creatingEmpty}
          label="Arraste o PDF aqui ou clique para selecionar"
          helperText="Apenas arquivos PDF, até 20MB."
        />

        {/* Separador visual */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px bg-gray-200"/>
          <span className="text-[11px] uppercase tracking-wide text-gray-400">
            ou
          </span>
          <div className="flex-1 h-px bg-gray-200"/>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-gray-600">
            <p className="font-medium text-gray-800">
              Criar contrato em branco
            </p>
            <p>
              Use esta opção quando quiser cadastrar o contrato primeiro e
              adicionar os itens manualmente.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateEmptyContract}
            disabled={creatingEmpty || submitting}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-xs sm:text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
          >
            {creatingEmpty ? "Criando..." : "Criar contrato em branco"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
