'use client';

import React from 'react';
import TaskField from './TaskField';

interface TaskTitleFieldProps {
  value: string;
  error?: string | null;
  onChange: (value: string) => void;
}

export default function TaskTitleField({ value, error, onChange }: TaskTitleFieldProps) {
  return (
    <TaskField label="Título de la tarea">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Título de la tarea..."
        className={`w-full text-[18px] font-semibold text-on-surface border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
          error
            ? 'border-error focus:ring-error/30'
            : 'border-outline-variant focus:ring-primary'
        }`}
        required
      />
      {error && <p className="mt-2 text-sm font-medium text-error">{error}</p>}
    </TaskField>
  );
}
