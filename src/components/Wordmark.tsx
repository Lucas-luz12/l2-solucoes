import Image from "next/image";

type WordmarkProps = {
  className?: string;
  size?: "sm" | "lg";
};

export function Wordmark({ className = "", size = "sm" }: WordmarkProps) {
  if (size === "lg") {
    return (
      <Image
        src="/logo.png"
        alt="L² Soluções — Tecnologia, Processos, Resultados"
        width={659}
        height={425}
        priority
        className={`h-auto w-[min(88vw,420px)] object-contain ${className}`}
      />
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="L² Soluções"
      width={160}
      height={103}
      className={`h-11 w-auto object-contain ${className}`}
    />
  );
}
