import Spinner from "./Spinner";

interface LoaderProps {
  message?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Loader({ 
  message = "Cargando...", 
  fullScreen = false,
  size = "md"
}: LoaderProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-5">
          <Spinner size="lg" />
          {message && (
            <p className="text-base text-gray-600 font-normal">{message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-5">
        <Spinner size="lg" />
        {message && (
          <p className="text-base text-gray-600 font-normal">{message}</p>
        )}
      </div>
    </div>
  );
}

