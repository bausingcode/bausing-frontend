interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">{title}</h1>
      {description && <p className="text-gray-600">{description}</p>}
    </div>
  );
}

