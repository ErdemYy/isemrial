import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "Geçerli bir e-posta adresi giriniz." })
  email: string;

  @IsString({ message: "Parola metin olmalıdır." })
  @IsNotEmpty({ message: "Parola alanı zorunludur." })
  password: string;
}
