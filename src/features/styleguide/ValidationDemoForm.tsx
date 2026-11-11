import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { TextField } from '@/components/ui/TextField';
import { toast } from '@/components/ui/toast-store';
import { dateMask, digitsMask, integerMask, noSpacesMask } from '@/lib/input-masks';
import { useFieldError } from '@/lib/use-field-error';
import {
  dateField,
  emailField,
  otpField,
  requiredText,
  TASK_OFFSET_MAX,
  TASK_OFFSET_MIN,
  taskOffsetField,
} from '@/lib/validation';

const schema = z.object({
  email: emailField,
  startDate: dateField,
  offset: taskOffsetField,
  code: otpField,
  password: requiredText,
});

type DemoValues = z.infer<typeof schema>;

const offsetMask = integerMask({ allowNegative: true, maxDigits: 2 });
const codeMask = digitsMask(6);

/**
 * Working example of the form pattern used across Rumbo (CLAUDE.md 2.10), dev-only:
 * - masks block characters that do not belong in a field (letters in dates or numbers)
 * - first validation on blur or submit, never while typing for the first time
 * - after an error, the field revalidates on every change and the message disappears when fixed
 * - values are never cleared on error; focus moves to the first field with an error
 */
export function ValidationDemoForm() {
  const [showPassword, setShowPassword] = useState(false);
  const fieldError = useFieldError();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DemoValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { email: '', startDate: '', offset: '', code: '', password: '' },
  });

  const onSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success('Datos validados');
  };

  return (
    <form className="flex flex-col gap-5" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <TextField
          label="Correo de trabajo"
          type="email"
          autoComplete="email"
          required
          mask={noSpacesMask}
          helperText="Tu correo de trabajo, por ejemplo: nombre.apellido@nortia.demo"
          error={fieldError(errors.email)}
          {...register('email')}
        />
        <TextField
          label="Fecha de ingreso"
          required
          inputMode="numeric"
          mask={dateMask}
          placeholder="DD/MM/AAAA"
          helperText="Formato DD/MM/AAAA, por ejemplo: 13/10/2026. Las barras se agregan solas"
          error={fieldError(errors.startDate)}
          {...register('startDate')}
        />
        <TextField
          label="Plazo de la tarea"
          required
          mask={offsetMask}
          helperText={`Días respecto del ingreso, entre ${TASK_OFFSET_MIN} y ${TASK_OFFSET_MAX}. Usa números negativos para antes del ingreso, por ejemplo: -3`}
          error={fieldError(errors.offset)}
          {...register('offset')}
        />
        <TextField
          label="Código de verificación"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          mask={codeMask}
          helperText="Los 6 dígitos de tu app autenticadora. Puedes pegarlo"
          error={fieldError(errors.code)}
          {...register('code')}
        />
        <TextField
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          required
          helperText="La contraseña de tu cuenta de trabajo"
          error={fieldError(errors.password)}
          trailing={
            <IconButton
              icon={showPassword ? 'visibility_off' : 'visibility'}
              label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              size="xs"
              onClick={() => setShowPassword((v) => !v)}
            />
          }
          {...register('password')}
        />
        <TextField label="Área" disabled defaultValue="Datos" helperText="Se completa según el puesto elegido" />
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="submit" loading={isSubmitting} loadingText="Validando…">
          Validar datos
        </Button>
      </div>
    </form>
  );
}
