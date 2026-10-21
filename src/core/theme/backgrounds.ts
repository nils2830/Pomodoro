/**
 * Landscape backgrounds for the timer. Generated for Steen and stored in
 * /public/images. `blur` is a tiny inline preview shown while the full
 * image loads; `color` paints instantly before either arrives.
 */
export interface BackgroundDef {
  id: string;
  name: string;
  description: string;
  src: string;
  color: string;
  blur: string;
  pro: boolean;
}

export const BACKGROUNDS: BackgroundDef[] = [
  {
    id: "dawn",
    name: "Dawn ridge",
    description: "A cairn above the morning mist.",
    src: "/images/hero-cairn.webp",
    color: "#9b9a96",
    blur: "data:image/webp;base64,UklGRnIAAABXRUJQVlA4IGYAAADwAwCdASoYAA0APrVMoUqnJCMhsAgA4BaJZQCdMoADTbFmlH5C5IwAAP73Bluv2mvR+qN4Gtdgt4jd1CQn7nEwWlvG96V3uIGM+SHP1+PVU9pVeMzVTFfkfuF3w8IAwCOzzwdAAAA=",
    pro: false,
  },
  {
    id: "fjord",
    name: "Fjord",
    description: "Still water at blue hour.",
    src: "/images/bg-fjord.webp",
    color: "#2a3744",
    blur: "data:image/webp;base64,UklGRmoAAABXRUJQVlA4IF4AAADQAwCdASoYAA0APrVMn0onJCKhsAgA4BaJZQCdACHNGMI0BdUkTFAA/vDTYwfvuPX54bYkn57H0sxnllXHhbxksCC422k1sm5pYYhYuBlTam/cYJJuQhQpjgwt6GAA",
    pro: false,
  },
  {
    id: "pebbles",
    name: "Pebbles",
    description: "Smooth river stones, up close.",
    src: "/images/bg-pebbles.webp",
    color: "#3c3f40",
    blur: "data:image/webp;base64,UklGRnYAAABXRUJQVlA4IGoAAABwAwCdASoYAA0APrVInkmnJCKhMAgA4BaJaQDDNBiXOReM6GgA/u7o+ZsiyM/kx79ikZROOeQmsSALUICs7hT0kCfFazWvrVSosMsbLlLuUDzfukR5VfLbtD5BoPgltOAQF2Vmau2MwLgA",
    pro: true,
  },
  {
    id: "moss",
    name: "Moss forest",
    description: "Fog between pines and mossy boulders.",
    src: "/images/bg-moss.webp",
    color: "#556250",
    blur: "data:image/webp;base64,UklGRogAAABXRUJQVlA4IHwAAAAwBACdASoYAA0APrVInkmnJCKhMAgA4BaJYwCw7ywBQtyCaTetA1O7YrAA/k9n4A96tT79RJ0nP5BQvO4GGhGUYRgY/awiog75+UCd7veH08U0I1+fYuF/e7ALrVJpncMUDFHGwZm6b7ad9o1tQUuaLkvegUmPHhsJxwAA",
    pro: true,
  },
  {
    id: "sandstone",
    name: "Sandstone",
    description: "Warm canyon curves at golden hour.",
    src: "/images/bg-sandstone.webp",
    color: "#81604e",
    blur: "data:image/webp;base64,UklGRogAAABXRUJQVlA4IHwAAABwBACdASoYAA0APrVWoUsnJSMhsAgA4BaJZgCdMoMYAEmjofZmqSidC8msAADiB6HUh+Ok5BB9hwFdJ4I+0aytb62ofuIlwi4TzMgl9eryeJlWMROzwEJzr04xTduDwKlBGqbU7lceyAvaYnbTyY+wwpMb300DTQDgOAAA",
    pro: true,
  },
  {
    id: "night",
    name: "Night ridge",
    description: "A ridge under the Milky Way.",
    src: "/images/bg-night.webp",
    color: "#151a20",
    blur: "data:image/webp;base64,UklGRk4AAABXRUJQVlA4IEIAAADQAwCdASoYAA0APrVKn0onJCKhsAgA4BaJZwC/OCHh+rOK58doSyAA/ve5utNpdwFymWr20CpQ/6+qePHXn0ew8AA=",
    pro: true,
  },
];

export function getBackground(id: string | null | undefined): BackgroundDef | null {
  return BACKGROUNDS.find((b) => b.id === id) ?? null;
}
