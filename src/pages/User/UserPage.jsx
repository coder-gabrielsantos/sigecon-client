import { useEffect, useState } from "react";
import { User as UserIcon, Shield, LockKeyhole } from "lucide-react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import {
  getMe,
  adminCreateUser,
  changeMyPassword,
  updateMyName,
  getAllUsers,
} from "../../services/authService";

function formatCPF(value) {
  if (!value) return "";
  const digits = String(value).replace(/\D/g, "").slice(0, 11);

  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 6);
  const part3 = digits.slice(6, 9);
  const part4 = digits.slice(9, 11);

  let formatted = part1;
  if (part2) formatted += "." + part2;
  if (part3) formatted += "." + part3;
  if (part4) formatted += "-" + part4;

  return formatted;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function UserPage() {
  // Perfil atual
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  // Edição de nome
  const [nameValue, setNameValue] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState("");
  const [nameError, setNameError] = useState("");

  // Alterar senha
  const [passwordForm, setPasswordForm] = useState({
    senhaAtual: "",
    senhaNova: "",
    senhaNovaConfirm: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Novo usuário (admin)
  const [newUserForm, setNewUserForm] = useState({
    nome: "",
    cpf: "",
    role: "OPERADOR",
  });
  const [newUserLoading, setNewUserLoading] = useState(false);
  const [newUserError, setNewUserError] = useState("");
  const [newUserSuccess, setNewUserSuccess] = useState("");
  const [newUserInitialPassword, setNewUserInitialPassword] = useState("");

  // Listagem de usuários (admin)
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  // ------- carregar perfil ---------
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        setProfileLoading(true);
        setProfileError("");
        const data = await getMe();
        if (!active) return;
        setProfile(data);
        setNameValue(data?.nome || "");
      } catch (err) {
        if (!active) return;
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err.message ||
          "Erro ao carregar dados do usuário.";
        setProfileError(msg);
      } finally {
        if (active) setProfileLoading(false);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const isAdmin = profile?.role === "ADMIN";

  // ------- carregar lista de usuários (somente admin) ---------
  useEffect(() => {
    if (!isAdmin) return;

    let active = true;

    async function loadUsers() {
      try {
        setUsersLoading(true);
        setUsersError("");
        const data = await getAllUsers();
        if (!active) return;
        setUsers(data || []);
      } catch (err) {
        if (!active) return;
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err.message ||
          "Erro ao carregar lista de usuários.";
        setUsersError(msg);
      } finally {
        if (active) setUsersLoading(false);
      }
    }

    loadUsers();

    return () => {
      active = false;
    };
  }, [isAdmin]);

  async function refreshUsers() {
    if (!isAdmin) return;
    try {
      setUsersLoading(true);
      setUsersError("");
      const data = await getAllUsers();
      setUsers(data || []);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Erro ao carregar lista de usuários.";
      setUsersError(msg);
    } finally {
      setUsersLoading(false);
    }
  }

  // --------- Atualizar nome (chamando API) ----------
  async function handleSaveName(e) {
    e.preventDefault();
    if (!profile) return;

    const novoNome = nameValue.trim();
    if (!novoNome) {
      setNameError("O nome não pode ficar em branco.");
      return;
    }

    setNameSaving(true);
    setNameMessage("");
    setNameError("");

    try {
      const updatedProfile = await updateMyName({ nome: novoNome });

      setProfile(updatedProfile);
      setNameValue(updatedProfile?.nome || novoNome);
      setNameMessage("Nome atualizado com sucesso.");

      try {
        const raw = localStorage.getItem("sigecon_user");
        if (raw) {
          const user = JSON.parse(raw);
          user.nome = updatedProfile?.nome || novoNome;
          localStorage.setItem("sigecon_user", JSON.stringify(user));
        }
      } catch (_) {}

      setTimeout(() => setNameMessage(""), 2500);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Erro ao atualizar nome.";
      setNameError(msg);
    } finally {
      setNameSaving(false);
    }
  }

  // --------- Alterar senha ----------
  function handlePasswordChange(e) {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSavePassword(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordForm.senhaAtual || !passwordForm.senhaNova) {
      setPasswordError("Informe a senha atual e a nova senha.");
      return;
    }

    if (passwordForm.senhaNova !== passwordForm.senhaNovaConfirm) {
      setPasswordError("A confirmação da nova senha não confere.");
      return;
    }

    try {
      setPasswordLoading(true);
      await changeMyPassword({
        senhaAtual: passwordForm.senhaAtual,
        senhaNova: passwordForm.senhaNova,
      });

      setPasswordForm({
        senhaAtual: "",
        senhaNova: "",
        senhaNovaConfirm: "",
      });
      setPasswordSuccess("Senha alterada com sucesso.");
      setTimeout(() => setPasswordSuccess(""), 2500);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Erro ao alterar a senha.";
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  }

  // --------- Criar novo usuário (ADMIN) ----------
  function handleNewUserChange(e) {
    const { name, value } = e.target;

    if (name === "cpf") {
      setNewUserForm((prev) => ({
        ...prev,
        cpf: formatCPF(value),
      }));
      return;
    }

    setNewUserForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleCreateNewUser(e) {
    e.preventDefault();
    setNewUserError("");
    setNewUserSuccess("");
    setNewUserInitialPassword("");

    const payload = {
      nome: newUserForm.nome.trim(),
      cpf: newUserForm.cpf.replace(/\D/g, ""),
      role: newUserForm.role,
    };

    if (!payload.nome || !payload.cpf || !payload.role) {
      setNewUserError("Preencha todos os campos.");
      return;
    }

    try {
      setNewUserLoading(true);
      const result = await adminCreateUser(payload);

      setNewUserForm({
        nome: "",
        cpf: "",
        role: "OPERADOR",
      });
      setNewUserSuccess("Usuário criado com sucesso.");

      if (result?.senha_inicial) {
        setNewUserInitialPassword(result.senha_inicial);
      }

      // recarrega lista de usuários após criar
      await refreshUsers();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Erro ao criar usuário.";
      setNewUserError(msg);
    } finally {
      setNewUserLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Cabeçalho da página */}
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-gray-900">
          Usuários do sistema
        </h1>
        <p className="text-sm text-gray-600">
          Veja seus dados de acesso, atualize seu perfil e gerencie usuários se
          você for administrador.
        </p>
      </header>

      {/* SEÇÃO 1: Meu perfil + alterar nome/senha */}
      <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-5 sm:p-6 space-y-6">
        {/* topo: avatar + resumo */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-sm font-semibold shadow-md">
            {getInitials(profile?.nome) || <UserIcon className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Meu perfil</p>
            <p className="text-xs text-gray-500">
              Informações do usuário atualmente logado no sistema.
            </p>
          </div>
        </div>

        {/* dados básicos */}
        <div className="border-t border-gray-100 pt-4">
          {profileLoading ? (
            <p className="text-sm text-gray-500">Carregando perfil...</p>
          ) : profileError ? (
            <p className="text-sm text-red-600">{profileError}</p>
          ) : profile ? (
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Nome
                </p>
                <p className="text-gray-900 font-medium">{profile.nome}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  CPF
                </p>
                <p className="text-gray-900">{formatCPF(profile.cpf)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Perfil
                </p>
                <span className="inline-flex items-center rounded bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  {profile.role}
                </span>
              </div>

              {typeof profile.ativo !== "undefined" && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Status
                  </p>
                  <span
                    className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-medium ${
                      profile.ativo
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                        profile.ativo ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    />
                    {profile.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Não foi possível carregar os dados do usuário.
            </p>
          )}
        </div>

        {/* atualizar nome e senha */}
        <div className="border-t border-gray-100 pt-4 space-y-6">
          <p className="text-base font-semibold text-gray-900">
            Atualizar dados de acesso
          </p>

          {/* Atualizar nome */}
          <form
            onSubmit={handleSaveName}
            className="space-y-3 bg-gray-50 rounded-xl px-3 py-3 sm:px-4 sm:py-4"
          >
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-gray-500" />
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Nome exibido
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  required
                />
              </div>
              <div>
                <Button type="submit" disabled={nameSaving}>
                  {nameSaving ? "Salvando..." : "Salvar nome"}
                </Button>
              </div>
            </div>
            {nameError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {nameError}
              </p>
            )}
            {nameMessage && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {nameMessage}
              </p>
            )}
          </form>

          {/* Alterar senha */}
          <form
            onSubmit={handleSavePassword}
            className="space-y-3 bg-gray-50 rounded-xl px-3 py-3 sm:px-4 sm:py-4"
          >
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-gray-500" />
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Alterar senha
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Senha atual
                </label>
                <Input
                  type="password"
                  name="senhaAtual"
                  value={passwordForm.senhaAtual}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Nova senha
                </label>
                <Input
                  type="password"
                  name="senhaNova"
                  value={passwordForm.senhaNova}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Confirmar nova senha
                </label>
                <Input
                  type="password"
                  name="senhaNovaConfirm"
                  value={passwordForm.senhaNovaConfirm}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
            </div>

            {passwordError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {passwordSuccess}
              </p>
            )}

            <div>
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? "Atualizando senha..." : "Salvar nova senha"}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* SEÇÃO 2: Novo usuário + lista de usuários (ADMIN) */}
      <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-base font-semibold text-gray-900">
              Novo usuário do sistema
            </p>
            <p className="text-sm text-gray-500">
              Cadastre novos acessos para o sistema de contratos e ordens.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 uppercase tracking-wide">
            <Shield className="h-3 w-3" />
            {isAdmin ? "ADMIN" : ""}
          </span>
        </div>

        {!isAdmin && (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
            Seu perfil atual não possui permissão para criar usuários. Apenas
            administradores podem cadastrar novos acessos. Em caso de dúvida,
            procure a equipe responsável pelo sistema.
          </div>
        )}

        {isAdmin && (
          <>
            {/* Form de criação */}
            <form className="space-y-4" onSubmit={handleCreateNewUser}>
              {/* Linha 1: Nome + CPF */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label
                    htmlFor="novo-nome"
                    className="text-sm font-medium text-gray-700"
                  >
                    Nome completo
                  </label>
                  <Input
                    id="novo-nome"
                    name="nome"
                    type="text"
                    value={newUserForm.nome}
                    onChange={handleNewUserChange}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="novo-cpf"
                    className="text-sm font-medium text-gray-700"
                  >
                    CPF
                  </label>
                  <Input
                    id="novo-cpf"
                    name="cpf"
                    type="text"
                    inputMode="numeric"
                    maxLength={14}
                    value={newUserForm.cpf}
                    onChange={handleNewUserChange}
                    required
                  />
                </div>
              </div>

              {/* Linha 2: Perfil de acesso (seletor moderno) */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Perfil de acesso
                </p>
                <div className="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setNewUserForm((prev) => ({ ...prev, role: "ADMIN" }))
                    }
                    className={`px-3 py-1.5 rounded-md font-medium transition ${
                      newUserForm.role === "ADMIN"
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Administrador
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewUserForm((prev) => ({
                        ...prev,
                        role: "OPERADOR",
                      }))
                    }
                    className={`px-3 py-1.5 rounded-md font-medium transition ${
                      newUserForm.role === "OPERADOR"
                        ? "bg-white text-indigo-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Operador
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Administradores gerenciam usuários e configurações. Operadores
                  utilizam o sistema no dia a dia.
                </p>
              </div>

              {/* Feedback criação */}
              {newUserError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {newUserError}
                </p>
              )}
              {newUserSuccess && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  {newUserSuccess}
                </p>
              )}

              {newUserInitialPassword && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-800 space-y-1.5">
                  <p className="font-semibold">
                    Senha inicial gerada para o novo usuário:
                  </p>
                  <p className="font-mono text-sm">
                    {newUserInitialPassword}
                  </p>
                  <p>
                    Anote essa senha e entregue ao usuário. Ela não será exibida
                    novamente nesta tela.
                  </p>
                </div>
              )}

              <div className="pt-1">
                <Button type="submit" disabled={newUserLoading}>
                  {newUserLoading ? "Criando usuário..." : "Criar usuário"}
                </Button>
              </div>
            </form>

            {/* Lista de usuários cadastrados */}
            <div className="border-t border-gray-100 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-gray-900">
                  Usuários cadastrados
                </p>
              </div>

              {usersLoading ? (
                <p className="text-xs text-gray-500">
                  Carregando usuários cadastrados...
                </p>
              ) : usersError ? (
                <p className="text-xs text-red-600">{usersError}</p>
              ) : users.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Nenhum usuário cadastrado até o momento.
                </p>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 max-h-72 overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                    <tr className="bg-gray-100 text-xs text-gray-600 uppercase tracking-wide">
                      <th className="px-3 py-2 text-left font-medium">
                        Nome
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        CPF
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        Perfil
                      </th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-t border-gray-200 text-gray-700"
                      >
                        <td className="px-3 py-2 text-left">
                          <span className="font-medium">{u.nome}</span>
                        </td>
                        <td className="px-3 py-2 text-left">
                          {formatCPF(u.cpf)}
                        </td>
                        <td className="px-3 py-2 text-left">
                            <span className="text-xs font-medium text-gray-700">
                              {u.role}
                            </span>
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
