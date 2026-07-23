/**
 * /screen zemin derinliği — hafif ışık huzmeleri + perspektif arena zemini.
 * Tamamen CSS, resim/paket yok. Zeminin arkasında, içeriğin altında (z-0),
 * pointer-events yok. Parlak maviyi bozmaz, okunurluğu etkilemez.
 */
export function ScreenDepth() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* ışık huzmeleri (sahne spotları) — üstten silik, aşağı doğru sönümlenir */}
      <span
        className="absolute"
        style={{
          left: "-15%",
          right: "-15%",
          top: "-25%",
          height: "95%",
          background:
            "repeating-linear-gradient(104deg, transparent 0 3%, rgba(255,255,255,0.045) 3% 4.4%, transparent 4.4% 9.5%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 72%)",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 72%)",
          filter: "blur(7px)",
        }}
      />
      {/* perspektif zemin (arena) — altta ortaya daralan soluk çizgiler */}
      <span
        className="absolute bottom-0 left-1/2"
        style={{
          width: "190%",
          height: "46%",
          transform: "translateX(-50%) perspective(520px) rotateX(62deg)",
          transformOrigin: "bottom center",
          background:
            "repeating-linear-gradient(90deg, transparent 0 3.4%, rgba(255,255,255,0.09) 3.4% 3.75%, transparent 3.75% 6.8%), repeating-linear-gradient(0deg, transparent 0 9%, rgba(255,255,255,0.065) 9% 9.4%, transparent 9.4% 18%)",
          WebkitMaskImage: "linear-gradient(to top, #000 8%, transparent 82%)",
          maskImage: "linear-gradient(to top, #000 8%, transparent 82%)",
        }}
      />
    </div>
  );
}
