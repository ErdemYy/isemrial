import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class AddNoteDto {
  @IsString({ message: "Not içeriği metin olmalıdır." })
  @IsNotEmpty({ message: "Not içeriği boş olamaz." })
  @MinLength(2, { message: "Not en az 2 karakter olmalıdır." })
  content: string;
}
