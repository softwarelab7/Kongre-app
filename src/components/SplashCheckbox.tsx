import React, { useId } from 'react';

export interface SplashCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  wrapperClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Checkbox interactivo oficial con efecto Splash animado
 * Basado en Uiverse.io por Shoh2008 (checkbox-wrapper-12)
 */
export const SplashCheckbox = React.forwardRef<HTMLInputElement, SplashCheckboxProps>(
  (
    {
      id: customId,
      label,
      description,
      checked,
      defaultChecked,
      onChange,
      disabled,
      className = '',
      wrapperClassName = '',
      size = 'md',
      ...rest
    },
    ref
  ) => {
    const rawId = useId();
    const inputId = customId || `cbx12_${rawId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    const sizeScale =
      size === 'sm'
        ? 'scale-[0.8] origin-center -my-0.5'
        : size === 'lg'
        ? 'scale-[1.15] origin-center'
        : '';

    return (
      <div
        className={`inline-flex items-start gap-2.5 select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${wrapperClassName}`}
      >
        <div className={`checkbox-wrapper-12 shrink-0 ${sizeScale}`}>
          <div className="cbx">
            <input
              ref={ref}
              id={inputId}
              type="checkbox"
              checked={checked}
              defaultChecked={defaultChecked}
              onChange={onChange}
              disabled={disabled}
              className={className}
              {...rest}
            />
            <label htmlFor={inputId}></label>
            <svg fill="none" viewBox="0 0 15 14" height="14" width="15" className="check-icon">
              <path d="M2 8.36364L6.23077 12L13 2"></path>
            </svg>
          </div>

          {/* Filtro Gooey SVG para el efecto splash */}
          <svg xmlns="http://www.w3.org/2000/svg" version="1.1" className="goo-filter" aria-hidden="true">
            <defs>
              <filter id="goo-12">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"></feGaussianBlur>
                <feColorMatrix
                  in="blur"
                  mode="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -7"
                  result="goo-12"
                ></feColorMatrix>
                <feBlend in="SourceGraphic" in2="goo-12"></feBlend>
              </filter>
            </defs>
          </svg>
        </div>

        {(label || description) && (
          <label htmlFor={inputId} className={`flex flex-col text-left ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            {label && (
              <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 leading-tight">
                {label}
              </span>
            )}
            {description && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                {description}
              </span>
            )}
          </label>
        )}
      </div>
    );
  }
);

SplashCheckbox.displayName = 'SplashCheckbox';

export default SplashCheckbox;
