import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Circle, LockKeyhole, Mail } from "lucide-react";
import BrandMark from "../../shared/components/BrandMark/BrandMark.jsx";
import { apiRequest, initializeCsrf } from "../../services/http/apiClient.js";
import ConsentSettings from "./ConsentSettings.jsx";
import EmailConfirmation from "./EmailConfirmation.jsx";
import styles from "./AuthGate.module.css";

const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const todayDateLimit = localDate(new Date());
const adultBirthDateLimit = (() => { const date = new Date(); date.setFullYear(date.getFullYear() - 18); return localDate(date); })();

const consentConfirmationLabels = {
  terms: "Li e concordo com os Termos de Uso.",
  privacy: "Li e estou ciente do Aviso de Privacidade.",
  health_data: "Li e forneço consentimento específico para o tratamento dos meus dados de saúde.",
  assessment_photos: "Li e autorizo, opcionalmente, o uso privado das fotos para minha avaliação.",
};

function Field({ label, type = "text", name, value, onChange, minLength, onBlur }) {
  const maxLength = type === "password" ? 128 : type === "email" ? 255 : undefined;
  const max = name === "birth_date" ? todayDateLimit : undefined;
  return <label>{label}<input required type={type} name={name} value={value} onChange={onChange} onBlur={onBlur} autoComplete={name} minLength={minLength} maxLength={maxLength} max={max} /></label>;
}

function PasswordRequirements({ password, confirmation }) {
  const requirements = [
    { label: "Ter pelo menos 10 caracteres", valid: password.length >= 10 },
    { label: "Conter uma letra maiúscula", valid: /\p{Lu}/u.test(password) },
    { label: "Conter uma letra minúscula", valid: /\p{Ll}/u.test(password) },
    { label: "Conter um número", valid: /\p{N}/u.test(password) },
    { label: "Conter um símbolo, como @, . ou !", valid: /[^\p{L}\p{N}\s]/u.test(password) },
    { label: "As duas senhas precisam ser iguais", valid: confirmation.length > 0 && password === confirmation },
  ];

  return <div className={styles.passwordRequirements} aria-live="polite"><strong>Requisitos da senha</strong><p>Você pode usar letras, números, espaços e símbolos.</p><ul>{requirements.map((requirement) => <li className={requirement.valid ? styles.requirementValid : ""} key={requirement.label}>{requirement.valid ? <Check size={15} aria-hidden="true" /> : <Circle size={13} aria-hidden="true" />}<span>{requirement.label}</span></li>)}</ul></div>;
}

export default function AuthGate({ children }) {
  const invitationToken = useMemo(() => window.location.pathname.match(/^\/convite\/(.+)$/)?.[1], []);
  const resetParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(() => invitationToken ? "invitation" : window.location.pathname === "/redefinir-senha" ? "reset" : "login");
  const [documents, setDocuments] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [guardianAwareness, setGuardianAwareness] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(false);
  const [form, setForm] = useState({ email: resetParams.get("email") ?? "", password: "", password_confirmation: "" });
  const [profile, setProfile] = useState({ name: "", birth_date: "", sex: "", phone: "", postal_code: "", address: "", address_number: "", address_complement: "", district: "", city: "", state: "" });
  const lookupVersion = useRef(0);
  const [postalCodeMessage, setPostalCodeMessage] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiRequest("/v1/auth/me").then((response) => setUser(response.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.requires_consents) {
      apiRequest("/v1/consents").then((response) => setDocuments(response.data)).catch((error) => {
        if (error.status === 401) {
          setForm((current) => ({ ...current, email: user.email, password: "", password_confirmation: "" }));
          setUser(null); setMode("login"); setMessage("Sua sessão precisa ser renovada. Entre novamente para continuar o cadastro.");
          window.history.replaceState({}, "", "/login");
        } else setMessage(error.message);
      });
    }
  }, [user]);

  const update = ({ target }) => setForm({ ...form, [target.name]: target.value });
  const isCreatingPassword = mode === "invitation" || mode === "reset";
  const passwordIsValid = form.password.length >= 10
    && form.password.length <= 128
    && /\p{Lu}/u.test(form.password)
    && /\p{Ll}/u.test(form.password)
    && /\p{N}/u.test(form.password)
    && /[^\p{L}\p{N}\s]/u.test(form.password)
    && form.password === form.password_confirmation;
  const submit = async (event) => {
    event.preventDefault(); setMessage("");
    if (isCreatingPassword && !passwordIsValid) {
      setMessage("Confira os requisitos da senha antes de continuar.");
      return;
    }
    try {
      await initializeCsrf();
      if (mode === "login") {
        const response = await apiRequest("/v1/auth/login", { method: "POST", body: JSON.stringify({ email: form.email, password: form.password, remember: rememberLogin }) });
        setUser(response.data);
        if (response.data.must_change_password) setForm({ email: "", password: "", password_confirmation: "" });
      } else if (mode === "forgot") {
        const response = await apiRequest("/v1/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: form.email }) });
        setMessage(response.message);
      } else if (mode === "invitation") {
        await apiRequest(`/v1/invitations/${invitationToken}/accept`, { method: "POST", body: JSON.stringify(form) });
        window.history.replaceState({}, "", "/login"); setMode("login"); setMessage("Conta criada. Entre com sua nova senha.");
      } else if (mode === "reset") {
        await apiRequest("/v1/auth/reset-password", { method: "POST", body: JSON.stringify({ ...form, token: resetParams.get("token") }) });
        window.history.replaceState({}, "", "/login"); setMode("login"); setMessage("Senha alterada com sucesso.");
      }
    } catch (error) { setMessage(error.message); }
  };

  const submitProfessorPassword = async (event) => {
    event.preventDefault(); setMessage("");
    if (!passwordIsValid) {
      setMessage("Confira os requisitos da senha antes de continuar.");
      return;
    }
    try {
      await initializeCsrf();
      const response = await apiRequest("/v1/professor/profile/password", { method: "PUT", body: JSON.stringify({ password: form.password, password_confirmation: form.password_confirmation }) });
      const professorEmail = user.email;
      setForm({ email: professorEmail, password: "", password_confirmation: "" });
      setUser(null); setMode("login"); setMessage(response.message);
      window.history.replaceState({}, "", "/login");
    } catch (error) { setMessage(error.message); }
  };

  const logout = async () => {
    await initializeCsrf();
    await apiRequest("/v1/auth/logout", { method: "POST" });
    setUser(null); setMode("login"); setMessage("");
  };

  const updateProfile = ({ target }) => {
    lookupVersion.current++;
    setPostalCodeMessage("");
    if (target.name === "birth_date") setGuardianAwareness(false);
    if (target.name === "postal_code") {
      const postalCode = target.value.replace(/\D/g, "").slice(0, 8);
      setProfile((current) => ({ ...current, postal_code: postalCode }));
      if (postalCode.length === 8) lookupPostalCode(postalCode);
      return;
    }
    setProfile((current) => ({ ...current, [target.name]: target.value }));
  };
  async function lookupPostalCode(value = profile.postal_code) {
    const version = ++lookupVersion.current;
    const postalCode = String(value).replace(/\D/g, "");
    if (postalCode.length !== 8) {
      setPostalCodeMessage("Digite os 8 números do CEP.");
      return;
    }

    setPostalCodeMessage("Consultando CEP…");
    try {
      const response = await apiRequest(`/v1/address/cep/${postalCode}`);
      if (version !== lookupVersion.current) return;
      setProfile((current) => ({
        ...current,
        postal_code: response.data.postal_code,
        address: response.data.address || current.address,
        district: response.data.district || current.district,
        city: response.data.city || current.city,
        state: response.data.state || current.state,
      }));
      setPostalCodeMessage("Endereço preenchido. Confira os dados e informe o número.");
    } catch (error) {
      if (version === lookupVersion.current) setPostalCodeMessage(error.message);
    }
  }

  const submitConsents = async (event) => {
    event.preventDefault(); setMessage("");
    try {
      await initializeCsrf();
      await apiRequest("/v1/consents", { method: "POST", body: JSON.stringify({
        ...profile,
        name: profile.name || user.name,
        state: profile.state.toUpperCase(),
        goals: [],
        document_ids: accepted,
        ...(profile.birth_date > adultBirthDateLimit ? { guardian_awareness: guardianAwareness } : {}),
      }) });
      const response = await apiRequest("/v1/auth/me"); setUser(response.data);
    } catch (error) {
      if (error.status === 401) {
        setForm((current) => ({ ...current, email: user.email, password: "", password_confirmation: "" }));
        setUser(null); setMode("login"); setMessage("Sua sessão expirou. Entre novamente para salvar o cadastro.");
        window.history.replaceState({}, "", "/login");
      } else setMessage(error.message);
    }
  };

  if (window.location.pathname === "/confirmar-email") return <EmailConfirmation />;
  if (loading) return <main className={styles.center}><span>Carregando…</span></main>;
  if (user?.role === "professor" && user.must_change_password) return <main className={styles.center}><section className={styles.card}><BrandMark /><p className="eyebrow">Primeiro acesso do professor</p><h1>Crie sua senha pessoal</h1><p className={styles.muted}>A senha usada para entrar era temporária. Defina uma senha exclusiva antes de acessar o painel.</p><form onSubmit={submitProfessorPassword}><Field label="Nova senha" type="password" name="password" value={form.password} onChange={update} minLength={10} /><Field label="Confirmar nova senha" type="password" name="password_confirmation" value={form.password_confirmation} onChange={update} minLength={10} /><PasswordRequirements password={form.password} confirmation={form.password_confirmation} />{message && <p className={styles.message}>{message}</p>}<button className="primary-button" type="submit" disabled={!passwordIsValid}><LockKeyhole size={16} /> Salvar minha senha</button></form><button className={styles.link} type="button" onClick={() => logout().catch((error) => setMessage(error.message))}>Sair e fazer isso depois</button></section></main>;
  if (user && !user.requires_consents) return typeof children === "function" ? children(user) : children;
  if (user?.requires_consents && user.registration_complete) return <main className={styles.center}><section className={`${styles.card} ${styles.onboarding}`}><BrandMark /><ConsentSettings onContinue={() => window.location.reload()} /></section></main>;
  if (user?.requires_consents) return <main className={styles.center}><section className={`${styles.card} ${styles.onboarding}`}>
    <BrandMark /><p className="eyebrow">Primeiro acesso</p><h1>Complete seu cadastro</h1>
    <p className={styles.muted}>Preencha seus dados e leia cada documento. Para menores de 18 anos, confirme a ciência do responsável legal.</p>
    <form onSubmit={submitConsents}>
      <div className={styles.profileGrid}><Field label="Nome completo" name="name" value={profile.name} onChange={updateProfile} /><Field label="Data de nascimento" type="date" name="birth_date" value={profile.birth_date} onChange={updateProfile} /><label>Sexo<select required name="sex" value={profile.sex} onChange={updateProfile}><option value="">Selecione</option><option value="feminino">Feminino</option><option value="masculino">Masculino</option><option value="outro">Outro</option><option value="prefiro_nao_informar">Prefiro não informar</option></select></label><label>Celular<input required type="tel" name="phone" autoComplete="tel" placeholder="+55 (11) 99999-9999" value={profile.phone} onChange={updateProfile} /></label><div><Field label="CEP" name="postal_code" value={profile.postal_code} onChange={updateProfile} onBlur={() => lookupPostalCode()} /><small className={styles.fieldHelp}>{postalCodeMessage || "Ao informar os 8 números, preencheremos rua, bairro, cidade e UF."}</small></div><Field label="Endereço" name="address" value={profile.address} onChange={updateProfile} /><Field label="Número" name="address_number" value={profile.address_number} onChange={updateProfile} /><label>Complemento (opcional)<input name="address_complement" value={profile.address_complement} onChange={updateProfile} /></label><Field label="Bairro" name="district" value={profile.district} onChange={updateProfile} /><Field label="Cidade" name="city" value={profile.city} onChange={updateProfile} /><Field label="UF" name="state" value={profile.state} onChange={updateProfile} /></div>
      {profile.birth_date > adultBirthDateLimit && <label className={styles.check}><input required type="checkbox" checked={guardianAwareness} onChange={(event) => setGuardianAwareness(event.target.checked)} /> Confirmo que meus pais ou responsáveis legais estão cientes do cadastro e do acompanhamento no IS Coach.</label>}
      <div className={styles.documents}><h2>Privacidade e consentimentos</h2>{documents.map((document) => <article className={styles.document} key={document.id}><h2>{document.title}</h2><small>Versão {document.version} · {document.is_required ? "Necessário para acessar os módulos relacionados" : "Opcional — não impede o uso dos demais módulos"}</small><p style={{ whiteSpace: "pre-wrap" }}>{document.content}</p><label className={styles.check}><input type="checkbox" checked={accepted.includes(document.id)} onChange={() => setAccepted((ids) => ids.includes(document.id) ? ids.filter((id) => id !== document.id) : [...ids, document.id])} /> {consentConfirmationLabels[document.type] ?? `Li e aceito a versão ${document.version}.`}</label></article>)}</div>
      {message && <p className={styles.message}>{message}</p>}<button className="primary-button" type="submit">Salvar cadastro e consentimentos</button>
    </form>
  </section></main>;

  return <main className={styles.center}><section className={styles.card}><BrandMark /><p className="eyebrow">IS Coach Treinamento</p><h1>{mode === "forgot" ? "Recuperar senha" : mode === "invitation" ? "Criar sua conta" : mode === "reset" ? "Nova senha" : "Bem-vindo"}</h1><p className={styles.muted}>{mode === "login" ? "Entre para acessar seu acompanhamento." : "Preencha os dados para continuar."}</p><form onSubmit={submit}>{mode !== "invitation" && <Field label="E-mail" type="email" name="email" value={form.email} onChange={update} />}{mode !== "forgot" && <Field label="Senha" type="password" name="password" value={form.password} onChange={update} minLength={isCreatingPassword ? 10 : undefined} />}{mode === "login" && <label className={styles.check}><input type="checkbox" checked={rememberLogin} onChange={(event) => setRememberLogin(event.target.checked)} /> Manter conectado por 30 dias neste aparelho</label>}{isCreatingPassword && <Field label="Confirmar senha" type="password" name="password_confirmation" value={form.password_confirmation} onChange={update} minLength={10} />}{isCreatingPassword && <PasswordRequirements password={form.password} confirmation={form.password_confirmation} />}{message && <p className={styles.message}>{message}</p>}<button className="primary-button" type="submit" disabled={isCreatingPassword && !passwordIsValid}>{mode === "login" ? <><LockKeyhole size={16} /> Entrar</> : <><Mail size={16} /> Continuar</>}</button></form>{mode === "login" && <button className={styles.link} onClick={() => setMode("forgot")}>Esqueci minha senha</button>}{mode === "forgot" && <button className={styles.link} onClick={() => setMode("login")}>Voltar para o login</button>}</section></main>;
}
