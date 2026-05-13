import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export const PHONE_REGEX = /^\+[1-9]\d{11}$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const PINCODE_REGEX = /^\d{6}$/;

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

export function isValidIfsc(ifsc: string): boolean {
  return IFSC_REGEX.test(ifsc);
}

export function isValidPincode(pincode: string): boolean {
  return PINCODE_REGEX.test(pincode);
}

export function validateAge(dob: Date): { valid: boolean; message?: string } {
  const now = new Date();
  if (dob > now) {
    return { valid: false, message: 'Date of birth cannot be in the future.' };
  }
  const age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  const adjustedAge =
    monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate()) ? age - 1 : age;
  if (adjustedAge < 18) return { valid: false, message: 'User must be at least 18 years old.' };
  if (adjustedAge > 99) return { valid: false, message: 'User must be at most 99 years old.' };
  return { valid: true };
}

export function validateFileSize(size: number, maxBytes: number): boolean {
  return size <= maxBytes;
}

// class-validator custom decorator: @IsPhone()
export function IsPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPhone',
      target: (object as { constructor: Function }).constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && PHONE_REGEX.test(value);
        },
        defaultMessage() {
          return 'Phone must match format: +[country code][10 digits]';
        },
      },
    });
  };
}

// class-validator custom decorator: @IsIfsc()
export function IsIfsc(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isIfsc',
      target: (object as { constructor: Function }).constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && IFSC_REGEX.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid 11-character IFSC code.`;
        },
      },
    });
  };
}
