import React, { useCallback, useEffect, useState } from "react";
import AutoScroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";
// African divider removed

interface Logo {
  id: string;
  description: string;
  image: string;
  className?: string;
}

interface Logos3Props {
  heading?: string;
  logos?: Logo[];
}

const Logos3 = ({
  heading = "Trusted by these companies",
  logos = [],
}: Logos3Props) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center" },
    [AutoScroll({ playOnInit: true, speed: 1 })]
  );
  const [slidesInView, setSlidesInView] = useState<number[]>([]);

  const updateSlidesInView = useCallback(() => {
    if (!emblaApi) return;
    setSlidesInView(emblaApi.slidesInView());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    updateSlidesInView();
    emblaApi.on("scroll", updateSlidesInView);
    emblaApi.on("reInit", updateSlidesInView);
    return () => {
      emblaApi.off("scroll", updateSlidesInView);
      emblaApi.off("reInit", updateSlidesInView);
    };
  }, [emblaApi, updateSlidesInView]);

  return (
    <section className="relative py-16 md:py-24 bg-black overflow-hidden">
      {/* Subtle top border glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

      <div className="container flex flex-col items-center text-center relative z-10">
        <h2
          className="my-6 text-2xl font-semibold tracking-tighter lg:text-4xl
          bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40
          bg-clip-text text-transparent"
        >
          {heading}
        </h2>
      </div>

      <div className="pt-10 md:pt-16 lg:pt-20">
        <div className="relative mx-auto flex items-center justify-center lg:max-w-5xl">
          <div className="overflow-hidden w-full" ref={emblaRef}>
            <div className="flex">
              {logos.map((logo, index) => {
                const inView = slidesInView.includes(index);
                return (
                  <div
                    key={logo.id}
                    className="flex-[0_0_50%] sm:flex-[0_0_33.33%] md:flex-[0_0_25%] lg:flex-[0_0_20%] min-w-0 flex items-center justify-center px-8 md:px-12"
                  >
                    <img
                      src={logo.image}
                      alt={logo.description}
                      className={`${logo.className} max-w-[120px] object-contain transition-all duration-700 ease-in-out`}
                      style={{
                        filter: inView
                          ? "grayscale(0%) brightness(1)"
                          : "grayscale(100%) brightness(0) invert(1)",
                        opacity: inView ? 1 : 0.3,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edge fades */}
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
        </div>
      </div>
    </section>
  );
};

export { Logos3 };
