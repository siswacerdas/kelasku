import { DEFS, SOURCE_LABEL, resolveProfile, type Choice, type Profile, type ProfileKey } from "./profile";

/** Pertanyaan profil berpilihan A/B/Tidak tahu, lengkap dengan dampaknya pada perencanaan. */
export default function ProfileQuestions({
  keys, value, onChange,
}: {
  keys: ProfileKey[];
  value: Profile | undefined;
  onChange: (key: ProfileKey, choice: Choice) => void;
}) {
  const resolved = resolveProfile(keys, value);
  return (
    <div className="divide-y divide-mist">
      {resolved.map((r) => {
        const d = DEFS.find((x) => x.key === r.key)!;
        const current: Choice = value?.[r.key] ?? "?";
        const options: [Choice, string][] = [["A", d.a], ["B", d.b], ["?", "Tidak tahu"]];
        return (
          <fieldset key={r.key} className="grid gap-3 py-5 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] xl:gap-8">
            <legend className="sr-only">{r.question}</legend>
            <div aria-hidden="true">
              <p className="font-display text-lg font-semibold">{r.question}</p>
              <p className="mt-1 text-sm text-moss">Memengaruhi: {r.affects}.</p>
            </div>
            <div>
              <div className="grid gap-2 sm:grid-cols-3">
                {options.map(([c, text]) => (
                  <label key={c} className="cursor-pointer">
                    <input type="radio" name={r.key} className="peer sr-only" checked={current === c} onChange={() => onChange(r.key, c)} />
                    <span className="block h-full rounded-md border-2 border-mist px-3 py-2.5 peer-checked:border-ink peer-checked:bg-mist peer-checked:font-semibold peer-focus-visible:outline-3 peer-focus-visible:outline-chalk">
                      {text}
                    </span>
                  </label>
                ))}
              </div>
              <p className={`mt-3 border-l-4 bg-white px-3 py-2 ${r.source === "guru" ? "border-ink" : "border-chalk"}`}>
                <span className="font-medium">{r.decision}</span>
                <span className="block text-sm text-moss">({SOURCE_LABEL[r.source]})</span>
              </p>
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
