import Image from "next/image";

/**
 * The 3R Programme told in four matched frames of the same piece of skin.
 * The frames are illustrative 3D visualisations, not patient images.
 */
const FRAMES = [
  {
    src: "/protocol/problem.webp",
    label: "The problem",
    caption:
      "Overactive pigment cells and a weak layer beneath them. Pigment rises to the surface and leaks deep.",
    alt: "Illustration of skin in cross-section with dark pigment rising to the surface and sinking into the deeper skin.",
  },
  {
    src: "/protocol/reduce.webp",
    label: "1 · Reduce",
    caption: "A repair therapy on the skin lifts surface pigment away while the skin heals.",
    alt: "Illustration of a repair layer on the skin surface with pigment particles lifting away.",
  },
  {
    src: "/protocol/regulate.webp",
    label: "2 · Regulate",
    caption:
      "Microscopic spicules reach the layer where pigment is made. Pigment cells calm and the layer is rebuilt.",
    alt: "Illustration of fine crystalline spicules reaching the junction between the top two layers of skin.",
  },
  {
    src: "/protocol/aim.webp",
    label: "The aim",
    caption: "Less pigment made, none leaking deep, and an even surface.",
    alt: "Illustration of even-toned skin in cross-section with an intact junction.",
  },
] as const;

export function ProgrammeStory({ className = "" }: { className?: string }) {
  return (
    <figure className={className}>
      <ol
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0"
        aria-label="How the 3R Programme works, in four steps"
      >
        {FRAMES.map((f) => (
          <li
            key={f.src}
            className="w-[78%] shrink-0 snap-center overflow-hidden rounded-2xl border border-white/10 bg-black sm:w-auto"
          >
            <div className="relative aspect-[4/3]">
              <Image
                src={f.src}
                alt={f.alt}
                fill
                sizes="(max-width: 640px) 78vw, 280px"
                className="object-cover"
              />
            </div>
            <div className="p-3">
              <p className="font-serif text-[15px] text-peach">{f.label}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-body">{f.caption}</p>
            </div>
          </li>
        ))}
      </ol>
      <figcaption className="mt-2 text-[11px] text-body/60">
        Illustrative 3D visualisation, not to scale and not a patient image. Results vary.
      </figcaption>
    </figure>
  );
}
