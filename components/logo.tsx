import Image from "next/image"

export function Logo({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const dimensions = {
    sm: { container: "h-8 w-8", text: "text-lg" },
    default: { container: "h-10 w-10", text: "text-xl" },
    lg: { container: "h-14 w-14", text: "text-3xl" },
  }

  const d = dimensions[size]

  return (
    <div className="flex items-center gap-2">
      <div className={`${d.container} relative flex items-center justify-center`}>
        <Image
          src="/logo.svg"
          alt="Kwik Konnect Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${d.text} font-bold tracking-tight`}>
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Kwik</span>
          <span className="text-foreground">Konnect</span>
        </span>
      </div>
    </div>
  )
}

export function LogoMark({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const dimensions = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-14 w-14",
  }

  return (
    <div className={`${dimensions[size]} relative flex items-center justify-center`}>
      <Image
        src="/logo.svg"
        alt="Kwik Konnect Mark"
        fill
        className="object-contain"
        priority
      />
    </div>
  )
}
