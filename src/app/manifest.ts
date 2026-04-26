import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MshaharaPro",
    short_name: "MshaharaPro",
    description: "Tanzania-first payroll and compliance platform for SMEs and accountants.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fbf8",
    theme_color: "#21745a",
    icons: [
      {
        src: "/logo-mark.svg",
        sizes: "64x64",
        type: "image/svg+xml",
      },
    ],
  };
}
