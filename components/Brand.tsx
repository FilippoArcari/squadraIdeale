import Link from "next/link";
import Icon from "./Icon";

export default function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="brand"
      aria-label="Squadra Ideale, pagina iniziale"
    >
      <span className="brand-mark">
        <Icon name="pitch" size={25} />
      </span>
      <span>
        Squadra<span className="brand-light">Ideale</span>
        <span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
