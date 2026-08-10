import Image from "next/image";

type WordmarkProps = {
  className?: string;
  size?: "sm" | "lg";
};

export function Wordmark({ className = "", size = "sm" }: WordmarkProps) {
  if (size === "lg") {
    return (
      <span className={`inline-flex flex-col items-center gap-4 ${className}`}>
        <Image
          src="/logo-mark.png"
          alt="L²"
          width={659}
          height={247}
          priority
          className="h-auto w-[min(72vw,280px)] object-contain sm:w-[320px]"
        />
        <span className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
          Soluções
        </span>
        <span className="flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-muted">
          Tecnologia
          <span className="text-accent" aria-hidden>
            ·
          </span>
          Processos
          <span className="text-accent" aria-hidden>
            ·
          </span>
          Resultados
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/logo-mark.png"
        alt=""
        width={40}
        height={40}
        className="h-9 w-auto object-contain"
        aria-hidden
      />
      <span className="font-display text-[1.05rem] font-medium leading-none tracking-tight text-ink">
        Soluções
      </span>
    </span>
  );
}
