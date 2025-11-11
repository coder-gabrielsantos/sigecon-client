import { useState } from "react";
import Modal from "../../components/ui/Modal";
import UploadDropzone from "../../components/ui/UploadDropzone";
import { extractContractTable } from "../../services/extractorService";

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
    if (onClose) onClose();
  };

  const handleUpload = async (e) => {
    e?.preventDefault?.();
    setErr("");

    if (!file) {
      setErr("Anexe o PDF do contrato.");
      return;
    }

    if (file.type && file.type !== "application/pdf") {
      setErr("Apenas arquivos PDF são permitidos.");
      return;
    }

    const maxSizeBytes = 20 * 1024 * 1024; // 20MB
    if (file.size && file.size > maxSizeBytes) {
      setErr("Tamanho máximo permitido é 20MB.");
      return;
    }

    try {
      setSubmitting(true);
      setOk(false);
      setProgress(0);

      const data = await extractContractTable(file, (event) => {
        if (!event.total) return;
        const percent = Math.round((event.loaded * 100) / event.total);
        if (!Number.isNaN(percent)) setProgress(percent);
      });

      setOk(true);

      if (onUploaded) {
        onUploaded(data); // pai decide o que fazer com os dados extraídos
      }

      // se quiser fechar automático após sucesso:
      // setTimeout(handleClose, 800);
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
                Arquivo enviado e lido com sucesso.
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
              {submitting ? "Enviando..." : "Enviar PDF"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Faça o upload do contrato em PDF. Os itens da tabela serão lidos
          automaticamente pelo serviço de extração e enviados para revisão
          antes de salvar no sistema.
        </p>

        <UploadDropzone
          file={file}
          onFileChange={setFile}
          accept=".pdf"
          disabled={submitting}
          label="Arraste o PDF aqui ou clique para selecionar"
          helperText="Apenas arquivos PDF, até 20MB."
        />

        {!submitting && !ok && !err && (
          <p className="text-[11px] text-gray-500">
            O arquivo será armazenado para consulta e auditoria. Tamanho máximo:
            20MB. Apenas PDF.
          </p>
        )}

        {ok && !err && (
          <p className="text-[11px] text-emerald-600">
            Leitura concluída. Verifique os dados extraídos na lista de
            contratos.
          </p>
        )}
      </div>
    </Modal>
  );
}
