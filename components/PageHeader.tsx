import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function PageHeader({ title, description, icon }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        {icon && <div className="text-gray-700">{icon}</div>}
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>
      {description && <p className="text-gray-600">{description}</p>}
    </div>
  );
}

