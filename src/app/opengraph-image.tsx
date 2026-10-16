import { ogSize, renderOg } from "@/lib/og";

export const alt = "Termini – online zakazivanje termina za salone i ordinacije";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOg({
    eyebrow: "Termini",
    title: "Klijenti zakazuju sami. Podsjetnik stiže na WhatsApp.",
    subtitle: "Online termini za frizere, brijačnice, kozmetičare i stomatologe.",
  });
}
