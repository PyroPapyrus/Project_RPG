import { InputHTMLAttributes, TextareaHTMLAttributes, useEffect, useRef, useState } from 'react'

type BaseFormInputProps = {
  id: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  showPasswordToggle?: boolean;
}

type InputProps = BaseFormInputProps & Omit<InputHTMLAttributes<HTMLInputElement>, keyof BaseFormInputProps> & {
  type: Exclude<string, 'textarea'>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

type TextareaProps = BaseFormInputProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, keyof BaseFormInputProps> & {
  type: 'textarea';
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

type FormInputProps = InputProps | TextareaProps;

export function FormInput(props: FormInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPassword, setShowPassword] = useState(false);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (props.type === 'textarea') {
      adjustTextareaHeight();
    }
  }, [props.value, props.type]);

  const baseClasses = "w-full rounded-r-md px-3 py-2 text-sm";
  const textareaClasses = `${baseClasses} break-words pre-wrap min-h-[100px] resize-none overflow-hidden ${props.className || ''}`;
  const inputClasses = `${baseClasses} ${props.className || ''}`;

  if (props.type === 'textarea') {
    const { onChange, ...textareaProps } = props as TextareaProps;
    return (
      <div>
        <label htmlFor={textareaProps.id} className="sr-only">
          {textareaProps.placeholder}
        </label>
        <textarea
          ref={textareaRef}
          className={textareaClasses}
          
          onChange={(e) => {
            onChange(e);
            adjustTextareaHeight();
          }}
          {...textareaProps}
        />
      </div>
    );
  }

  const { onChange, showPasswordToggle, ...inputProps } = props as InputProps;
  return (
    <div className="relative flex items-center">
      <label htmlFor={inputProps.id} className="sr-only">
        {inputProps.placeholder}
      </label>
      <input
        {...inputProps}
        className={inputClasses}
        type={showPassword ? 'text' : inputProps.type}
        onChange={onChange}
      />
      {showPasswordToggle && inputProps.type === 'password' && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute flex right-2 text-gray-500 hover:text-gray-700"
        >
          <span className="material-symbols-rounded text-base">
            {showPassword ? 'visibility' : 'visibility_off'}
          </span>
        </button>
      )}
    </div>
  );
}