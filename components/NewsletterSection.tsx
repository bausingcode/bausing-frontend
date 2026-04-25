export default function NewsletterSection() {
  return (
    <section className="bg-white py-20 md:py-28 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl md:text-2xl font-semibold text-[#101828] mb-2">
            ¡No te pierdas nuestras ofertas!
          </h2>
          <p className="text-sm md:text-base text-black/50 mb-6 md:mb-8">
            Suscribite y recibí descuentos especiales antes que nadie.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Tu email"
              className="flex-1 px-5 py-3 rounded-full bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00C1A7]/30 focus:border-[#00C1A7] text-sm md:text-base transition-colors"
              required
            />
            <button
              type="submit"
              className="bg-[#101828] text-white font-medium px-7 py-3 rounded-full hover:bg-[#1d2939] transition-colors duration-200 text-sm md:text-base whitespace-nowrap"
            >
              Suscribirme
            </button>
          </form>
          <p className="text-xs text-black/30 mt-4">
            Al suscribirte aceptás recibir comunicaciones de marketing.
          </p>
        </div>
      </div>
    </section>
  );
}
