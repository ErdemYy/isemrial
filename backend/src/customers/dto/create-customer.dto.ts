import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateCustomerDto {
  @IsString({ message: "Müşteri adı metin olmalıdır." })
  @IsNotEmpty({ message: "Müşteri adı zorunludur." })
  @MinLength(2, { message: "Müşteri adı en az 2 karakter olmalıdır." })
  name: string;

  @IsString({ message: "Telefon numarası metin olmalıdır." })
  @IsNotEmpty({ message: "Telefon numarası zorunludur." })
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: "Geçerli bir e-posta adresi giriniz." })
  email?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
