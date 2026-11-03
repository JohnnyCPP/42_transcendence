'use client';

import React from 'react';
import TaskField from './TaskField';

interface TaskDescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TaskDescriptionField({
  value,
  onChange,
}: TaskDescriptionFieldProps) {
  return (
    <TaskField label="Descripción">
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Añade una descripción detallada para esta tarea..."
        className="w-full text-[14px] text-on-surface border border-outline-variant rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
      />
    </TaskField>
  );
}
