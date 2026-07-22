import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() role?: string;
  @IsString() @IsOptional() facilityId?: string;
  @IsString() @IsOptional() county?: string;
  @IsString() @IsOptional() subCounty?: string;
}

export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

export class RefreshDto {
  @IsString() refreshToken: string;
}

export class LogoutDto {
  @IsString() refreshToken: string;
}
