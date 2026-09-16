import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 py-6 md:py-14">
        {/* Main Product Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 lg:gap-12 mb-8 md:mb-12 animate-pulse">
          {/* Left: Image Skeleton */}
          <div className="relative flex lg:col-span-4">
            <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[520px] rounded-[10px] overflow-hidden bg-gray-200"></div>
          </div>

          {/* Right: Product Info Skeleton */}
          <div className="flex flex-col lg:h-[520px] lg:col-span-3">
            <div className="flex-1">
              {/* Title Skeleton */}
              <div className="h-6 md:h-8 bg-gray-200 rounded w-3/4 mb-4 md:mb-6"></div>

              {/* Pricing Skeleton */}
              <div className="mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <div className="h-4 md:h-5 bg-gray-200 rounded w-20 md:w-24"></div>
                  <div className="h-5 md:h-6 bg-gray-200 rounded w-14 md:w-16"></div>
                </div>
                <div className="h-6 md:h-8 bg-gray-200 rounded w-28 md:w-32 mb-2"></div>
                <div className="h-3 md:h-4 bg-gray-200 rounded w-36 md:w-40 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-40 md:w-48"></div>
              </div>

              {/* Variant Selection Skeleton */}
              <div className="mb-6 md:mb-8">
                <div className="h-3 md:h-4 bg-gray-200 rounded w-36 md:w-40 mb-2 md:mb-3"></div>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-8 md:h-9 bg-gray-200 rounded-[4px] w-20 md:w-24"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="w-full h-10 md:h-12 bg-gray-200 rounded-[4px]"></div>
              <div className="w-full h-10 md:h-12 bg-gray-200 rounded-[4px]"></div>
            </div>
          </div>
        </div>

        {/* Bottom Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-8 lg:gap-12 mb-8 md:mb-12">
          {/* Left: Technical Info Skeleton */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <div className="h-5 md:h-6 bg-gray-200 rounded w-40 md:w-48 mb-4 md:mb-6"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-b border-gray-200">
                  <div className="w-full flex items-center justify-between py-3 md:py-4">
                    <div className="h-4 md:h-5 bg-gray-200 rounded w-28 md:w-32"></div>
                    <div className="h-4 md:h-5 w-4 md:w-5 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Combos Skeleton */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="h-5 md:h-6 bg-gray-200 rounded w-36 md:w-40 mb-4 md:mb-6"></div>
            <div className="space-y-3 md:space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg p-3 md:p-4">
                  <div className="h-4 md:h-5 bg-gray-200 rounded w-3/4 mb-2 md:mb-3"></div>
                  <div className="h-3 md:h-4 bg-gray-200 rounded w-1/2 mb-1 md:mb-2"></div>
                  <div className="h-5 md:h-6 bg-gray-200 rounded w-20 md:w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
