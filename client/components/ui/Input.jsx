'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';
import Icon from './Icon';
import { applyDroppedFiles } from '@/lib/fileDrop';

export const Input = forwardRef(
  (
    {
      label,
      error,
      help,
      required = false,
      leftIcon,
      rightIcon,
      className,
      inputClassName,
      id: providedId,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = error ? `${id}-error` : undefined;
    const helpId = help ? `${id}-help` : undefined;
    const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1"
          >
            {label}
            {required && (
              <span className="text-error" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            type={type}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            aria-required={required}
            className={cn(
              'w-full rounded-xl border bg-surface text-base sm:text-sm min-h-11',
              'transition-colors duration-150',
              'placeholder:text-neutral-500',
              'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2',
              'disabled:bg-neutral-50 disabled:cursor-not-allowed',
              error
                ? 'border-error focus-visible:ring-error'
                : 'border-neutral-300 hover:border-neutral-400 focus:border-primary',
              leftIcon ? 'pl-10' : 'px-4',
              rightIcon ? 'pr-10' : 'px-4',
              'py-2.5',
              inputClassName
            )}
            {...props}
          />
          {rightIcon && (
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>
        {help && (
          <p id={helpId} className="mt-1.5 text-xs text-neutral-500" role={error ? undefined : 'note'}>
            {help}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 text-xs text-error flex items-center gap-1"
          >
            <Icon name="warning" className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Textarea = forwardRef(
  (
    {
      label,
      error,
      help,
      required = false,
      className,
      id: providedId,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = error ? `${id}-error` : undefined;
    const helpId = help ? `${id}-help` : undefined;
    const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1"
          >
            {label}
            {required && <span className="text-error" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required}
          className={cn(
            'w-full rounded-xl border bg-surface text-base sm:text-sm px-4 py-2.5 resize-y min-h-[80px]',
            'transition-colors duration-150',
            'placeholder:text-neutral-500',
            'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2',
            'disabled:bg-neutral-50 disabled:cursor-not-allowed',
            error
              ? 'border-error focus-visible:ring-error'
              : 'border-neutral-300 hover:border-neutral-400 focus:border-primary'
          )}
          {...props}
        />
        {help && <p id={helpId} className="mt-1.5 text-xs text-neutral-500" role={error ? undefined : 'note'}>{help}</p>}
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-error flex items-center gap-1">
            <Icon name="warning" className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export const Select = forwardRef(
  (
    {
      label,
      error,
      help,
      required = false,
      options = [],
      placeholder,
      className,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = error ? `${id}-error` : undefined;
    const helpId = help ? `${id}-help` : undefined;
    const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1"
          >
            {label}
            {required && <span className="text-error" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            aria-required={required}
            className={cn(
              'w-full rounded-xl border bg-surface text-base sm:text-sm pl-4 pr-10 py-2.5 appearance-none min-h-11',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2',
              'disabled:bg-neutral-50 disabled:cursor-not-allowed',
              error
                ? 'border-error focus-visible:ring-error'
                : 'border-neutral-300 hover:border-neutral-400 focus:border-primary'
            )}
            {...props}
          >
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Icon
            name="chevronDown"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500"
          />
        </div>
        {help && <p id={helpId} className="mt-1.5 text-xs text-neutral-500" role={error ? undefined : 'note'}>{help}</p>}
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-error flex items-center gap-1">
            <Icon name="warning" className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export const FileInput = forwardRef(
  (
    {
      label,
      error,
      help,
      required = false,
      accept = 'image/*',
      className,
      id: providedId,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = error ? `${id}-error` : undefined;
    const helpId = help ? `${id}-help` : undefined;
    const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-neutral-700 mb-1.5 flex items-center gap-1"
          >
            {label}
            {required && <span className="text-error" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="border-2 border-dashed rounded-xl p-4 transition-colors relative"
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-primary-light'); }}
          onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary', 'bg-primary-light'); }}
          onDrop={(e) => {
            // The drop itself is the missing half: clearing the highlight
            // while keeping the files out of the input meant the uploader
            // looked accepting and changed nothing.
            e.preventDefault();
            e.currentTarget.classList.remove('border-primary', 'bg-primary-light');
            applyDroppedFiles(
              e.currentTarget.querySelector('input[type="file"]'),
              e.dataTransfer
            );
          }}
        >
          <input
            ref={ref}
            id={id}
            type="file"
            accept={accept}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            aria-required={required}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => { onChange?.(e); }}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.parentElement.classList.add('border-primary', 'bg-primary-light'); }}
            onDragLeave={(e) => { e.currentTarget.parentElement.classList.remove('border-primary', 'bg-primary-light'); }}
            {...props}
          />
          <div className="flex flex-col items-center justify-center gap-2 text-center pointer-events-none">
            <Icon name="upload" className="w-8 h-8 text-neutral-500" />
            <span className="text-sm text-neutral-600">Drag & drop or click to upload</span>
            <span className="text-xs text-neutral-500">PNG, JPG up to 5MB</span>
          </div>
        </div>
        {help && <p id={helpId} className="mt-1.5 text-xs text-neutral-500" role={error ? undefined : 'note'}>{help}</p>}
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-error flex items-center gap-1">
            <Icon name="warning" className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

FileInput.displayName = 'FileInput';