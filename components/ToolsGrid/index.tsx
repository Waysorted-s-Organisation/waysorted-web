import Image from "next/image"

const icons = [
  { src: "/icons/image1.svg", alt: "CleanShot" },
  { src: "/icons/image2.svg", alt: "Mosaic" },
  { src: "/icons/image3.svg", alt: "Reeder" },
  { src: "/icons/image4.svg", alt: "DomainLore" },
]

const ToolsGrid = () => {
  return (
    <section className="max-w-screen-lg mx-auto px-4">
  <div className="flex justify-center items-center gap-2 flex-wrap">
    {icons.map((icon, index) => (
      <div
        key={index}
        className="rounded-3xl p-1 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
      >
        <Image
          src={icon.src}
          alt={icon.alt}
          width={192}
          height={192}
          className="object-contain"
        />
      </div>
    ))}
  </div>
</section>

  )
}

export default ToolsGrid
