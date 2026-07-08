import { TX_CATEGORIES } from "@/lib/types";

export function CategorySelect({ name = "category" }: { name?: string }) {
  return (
    <select name={name} required defaultValue="" className="input">
      <option value="" disabled>
        Pilih kategori…
      </option>
      {TX_CATEGORIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
