import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bike, Cog, Route, Heart, Handshake, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, errMsg } from "@/lib/api";
import { useClub } from "@/context/ClubContext";

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const STYLES = [["passeios_longos", "Passeios longos"], ["trilhas", "Trilhas"], ["estrada", "Estrada"], ["encontros_urbanos", "Encontros urbanos"]];

const EMPTY = {
  name: "", email: "", whatsapp: "", age: "", height: "", blood_type: "", city: "", profession: "", instagram: "",
  has_motorcycle: null, motorcycle_model: "", riding_since: "", styles: [], frequency: "",
  other_group: null, reason: "", commit_events: null, has_cnh_a: null,
};

const Block = ({ icon: Icon, title, children, i }) => (
  <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="card-metal overflow-hidden">
    <div className="bg-brand px-5 py-2.5 flex items-center gap-3 -skew-x-6 -ml-2 w-fit pr-8 rounded-br-xl">
      <Icon size={20} className="skew-x-6" />
      <h2 className="font-display text-xl font-black uppercase tracking-wide skew-x-6">{title}</h2>
    </div>
    <div className="p-5 sm:p-6 grid sm:grid-cols-2 gap-4">{children}</div>
  </motion.section>
);

const Field = ({ label, k, f, setF, type = "text", req, full }) => (
  <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
    <Label>{label}{req && <span className="text-brand"> *</span>}</Label>
    <Input type={type} required={req} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="bg-black/30 h-11" data-testid={`join-${k}`} />
  </div>
);

const YesNo = ({ label, k, f, setF }) => (
  <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
    <Label className="text-sm">{label}</Label>
    <div className="flex gap-2">
      {[[true, "Sim"], [false, "Não"]].map(([v, l]) => (
        <button type="button" key={l} onClick={() => setF({ ...f, [k]: v })} data-testid={`join-${k}-${v ? "sim" : "nao"}`}
          className={`px-5 py-1.5 text-sm ${f[k] === v ? "btn-rev" : "btn-ghost-metal"}`}>{l}</button>
      ))}
    </div>
  </div>
);

const Success = ({ club }) => (
  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card-metal p-10 text-center max-w-lg mx-auto" data-testid="join-success">
    <CheckCircle2 size={56} className="mx-auto text-brand" />
    <h2 className="font-display text-4xl font-black uppercase mt-4">Inscrição enviada!</h2>
    <p className="text-zinc-300 mt-3">A administração do {club.club_name} vai analisar sua ficha e entrar em contato pelo WhatsApp ou e-mail informado.</p>
    <Link to="/" className="btn-rev inline-block px-8 py-3 mt-8 text-sm" data-testid="join-success-home">Voltar ao club</Link>
  </motion.div>
);

export default function Join() {
  const { club } = useClub();
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const toggleStyle = (s) => setF({ ...f, styles: f.styles.includes(s) ? f.styles.filter((x) => x !== s) : [...f.styles, s] });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if ([f.has_motorcycle, f.other_group, f.commit_events, f.has_cnh_a].some((v) => v === null)) {
      setError("Responda todas as perguntas de Sim / Não.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/applications", { ...f, age: f.age ? Number(f.age) : null });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="asphalt min-h-screen" data-testid="join-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors" data-testid="join-back-link"><ArrowLeft size={16} /> Voltar ao club</Link>
        <div className="flex items-center gap-5 mt-8">
          <img src={club.logo_url} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-[var(--club-primary)]" />
          <div>
            <span className="font-mono-x text-xs uppercase tracking-[0.3em] text-brand">// Ficha de inscrição</span>
            <h1 className="font-display italic text-4xl sm:text-5xl font-black uppercase leading-none mt-1">Junte-se às melhores!</h1>
          </div>
        </div>
        <div className="tread my-8" />
        {done ? <Success club={club} /> : (
          <form onSubmit={submit} className="space-y-6">
            <Block icon={Bike} title="Dados básicos" i={0}>
              <Field label="Nome completo" k="name" f={f} setF={setF} req full />
              <Field label="E-mail" k="email" type="email" f={f} setF={setF} req />
              <Field label="WhatsApp" k="whatsapp" f={f} setF={setF} req />
              <Field label="Idade" k="age" type="number" f={f} setF={setF} />
              <Field label="Altura" k="height" f={f} setF={setF} />
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Tipo sanguíneo</Label>
                <div className="flex flex-wrap gap-2">
                  {BLOOD_TYPES.map((t) => (
                    <button type="button" key={t} onClick={() => setF({ ...f, blood_type: f.blood_type === t ? "" : t })} data-testid={`join-blood-${t}`}
                      className={`min-w-12 px-3 py-1.5 text-sm font-semibold ${f.blood_type === t ? "btn-rev" : "btn-ghost-metal"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <Field label="Cidade onde mora" k="city" f={f} setF={setF} req />
              <Field label="Profissão" k="profession" f={f} setF={setF} />
              <Field label="Instagram" k="instagram" f={f} setF={setF} full />
            </Block>
            <Block icon={Cog} title="Sua motocicleta" i={1}>
              <YesNo label="Tem moto própria?" k="has_motorcycle" f={f} setF={setF} />
              <Field label="Qual modelo?" k="motorcycle_model" f={f} setF={setF} />
              <Field label="Há quanto tempo pilota?" k="riding_since" f={f} setF={setF} />
            </Block>
            <Block icon={Route} title="Estilo de pilotagem" i={2}>
              <div className="sm:col-span-2 space-y-2">
                <Label>Prefere:</Label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map(([v, l]) => (
                    <button type="button" key={v} onClick={() => toggleStyle(v)} data-testid={`join-style-${v}`}
                      className={`px-4 py-1.5 text-sm ${f.styles.includes(v) ? "btn-rev" : "btn-ghost-metal"}`}>{l}</button>
                  ))}
                </div>
              </div>
              <Field label="Frequência de pilotagem (dias/semana)" k="frequency" f={f} setF={setF} full />
              <YesNo label="Já participou de outro grupo?" k="other_group" f={f} setF={setF} />
            </Block>
            <Block icon={Heart} title={`Por que '${club.club_name}'?`} i={3}>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Escreva um breve parágrafo sobre por que você quer se juntar ao nosso grupo e o que pode trazer para a comunidade {club.club_name}. <span className="text-brand">*</span></Label>
                <Textarea required minLength={10} rows={5} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} className="bg-black/30" data-testid="join-reason" />
              </div>
            </Block>
            <Block icon={Handshake} title="Compromisso" i={4}>
              <YesNo label="Você está disposta a participar de eventos e reuniões regularmente?" k="commit_events" f={f} setF={setF} />
              <YesNo label="Confirma que tem CNH A válida?" k="has_cnh_a" f={f} setF={setF} />
            </Block>
            {error && <p className="text-sm text-red-400" data-testid="join-error">{error}</p>}
            <button disabled={busy} className="btn-rev w-full h-14 text-lg disabled:opacity-60" data-testid="join-submit-button">{busy ? "Enviando..." : "Enviar inscrição"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
