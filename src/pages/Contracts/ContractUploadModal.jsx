import { useState } from "react";
import { FileText, PlusCircle } from "lucide-react";
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

  const [mode, setMode] = useState("upload");

  const resetState = () => {
    setFile(null);
    setProgress(0);
    setSubmitting(false);
    setCreatingEmpty(false);
    setErr("");
    setOk(false);
    setMode("upload");
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

      const extractData = await extractContractTable(file, (event) => {
        if (!event.total) return;
        const percent = Math.round((event.loaded * 100) / event.total);
        if (!Number.isNaN(percent)) setProgress(percent);
      });

      const savedContract = await createContractFromExtract(
        extractData,
        file.name
      );

      setOk(true);
      onUploaded?.(savedContract);
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

  const isBusy = submitting || creatingEmpty;

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title="Novo contrato"
        footer={
          <div className="w-full space-y-2 pt-1">
            {/* barra de progresso discreta */}
            {submitting && (
              <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                <div
                  className="h-1 rounded-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* mensagens de status */}
            <div className="min-h-[16px] text-[11px]">
              {ok && !err && !submitting && !creatingEmpty && (
                <p className="text-emerald-600">
                  Contrato processado e salvo com sucesso.
                </p>
              )}
              {err && <p className="text-red-600">{err}</p>}
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {/* cabeçalho interno */}
          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-slate-500">
              Primeiro, escolha o formato de criação abaixo.
            </p>

            {/* seletor de modo (toggle) */}
            <div className="mt-2 inline-flex w-full sm:w-auto rounded-full bg-slate-100 p-1 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => setMode("upload")}
                disabled={isBusy}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-full font-medium transition-all duration-200 ${
                  mode === "upload"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                Importar PDF
              </button>
              <button
                type="button"
                onClick={() => setMode("blank")}
                disabled={isBusy}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-full font-medium transition-all duration-200 ${
                  mode === "blank"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                Criar em branco
              </button>
            </div>
          </div>

          {/* opção: importar pdf */}
          {mode === "upload" && (
            <section className="animate-fadeInUp rounded-2xl border border-slate-200 bg-slate-50/60 px-3.5 py-3.5 sm:px-4 sm:py-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-1">
                  <p className="text-sm sm:text-base font-semibold text-slate-900">
                    Importar PDF do contrato
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500">
                    O sistema tenta ler automaticamente itens, quantidades e
                    valores a partir do arquivo PDF.
                  </p>
                </div>
              </div>

              <UploadDropzone
                file={file}
                onFileChange={setFile}
                accept=".pdf"
                disabled={isBusy}
                label="Selecione ou arraste um arquivo PDF para enviar"
                helperText="Suporta arquivos de até 20 MB"
              />

              <button
                type="button"
                onClick={handleUpload}
                disabled={submitting || creatingEmpty || !file}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              >
                {submitting ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-[2px] border-white/60 border-t-transparent"/>
                    Processando PDF...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4"/>
                    Importar PDF do contrato
                  </>
                )}
              </button>
            </section>
          )}

          {/* opção: contrato em branco */}
          {mode === "blank" && (
            <section className="animate-fadeInUp rounded-2xl border border-dashed border-slate-200 bg-white px-3.5 py-3.5 sm:px-4 sm:py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="space-y-1">
                    <p className="text-sm sm:text-base font-semibold text-slate-900">
                      Criar contrato em branco
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Comece do zero e preencha manualmente todos os dados do
                      contrato direto no sistema.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateEmptyContract}
                disabled={creatingEmpty || submitting}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 shadow-sm border border-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              >
                {creatingEmpty ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-[2px] border-slate-500/60 border-t-transparent"/>
                    Criando contrato...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4"/>
                    Criar em branco
                  </>
                )}
              </button>
            </section>
          )}
        </div>
      </Modal>

      {/* animação global simples */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.22s ease-out;
        }
      `}</style>
    </>
  );
}
