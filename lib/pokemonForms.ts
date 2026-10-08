export const pokemonForms = [
  { value: "mega", label: "Mega", color: "#e63946" },
  { value: "gmax", label: "Gigamax", color: "#c2185b" },
  { value: "primal", label: "Primigenio", color: "#b5651d" },
  { value: "alola", label: "Alola", color: "#f4a261" },
  { value: "galar", label: "Galar", color: "#6a4c93" },
  { value: "hisui", label: "Hisui", color: "#5c6b73" },
  { value: "paldea", label: "Paldea", color: "#2a9d8f" },
];

export function matchesForms(name: string, forms: string[]) {
  return forms.length === 0 || forms.some((form) => name.includes(`-${form}`));
}